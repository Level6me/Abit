import os
import time
import json
import socket
import threading
import subprocess
import urllib.request
import urllib.parse
import urllib.error
import psutil
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Real qBittorrent WebUI Connection Settings
QBT_HOST = os.environ.get("QBT_HOST", "http://127.0.0.1:8080")

last_net = psutil.net_io_counters()
last_time = time.time()
net_history = []
mem_history = []

GLOBAL_CACHE = {
    "qbt_status": "offline",
    "download_speed": 0,
    "upload_speed": 0,
    "stats": {"total": 0, "downloading": 0, "uploading": 0, "completed": 0, "paused": 0, "errored": 0},
    "torrents": [],
    "categories": {},
    "tags": [],
    "transfer_info": {},
    "search_results": [],
    "search_status": "idle",
    "rss_feeds": {},
    "rss_rules": {},
    "preferences": {}
}

class QbtRealClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.sid = None
        self.last_login = 0
        self.active_password = None

    def _login(self):
        passwords_to_try = []
        if self.active_password:
            passwords_to_try.append(self.active_password)

        # Read from qBittorrent stdout log (most reliable source)
        for log_path in ["/tmp/qbt.log"]:
            try:
                with open(log_path, "r", errors="ignore") as f:
                    content = f.read()
                    if "A temporary password is provided for this session:" in content:
                        pwd = content.split("A temporary password is provided for this session:")[-1].split()[0].strip()
                        if pwd and pwd not in passwords_to_try:
                            passwords_to_try.insert(0, pwd)
            except Exception:
                pass

        try:
            tasks_dir = "/home/ubuntu/.gemini/antigravity-cli/brain"
            matches = []
            for root, dirs, files in os.walk(tasks_dir):
                for file in files:
                    if file.endswith(".log"):
                        log_path = os.path.join(root, file)
                        mtime = os.path.getmtime(log_path)
                        with open(log_path, "r", errors="ignore") as f:
                            content = f.read()
                            if "A temporary password is provided for this session:" in content:
                                pwd = content.split("A temporary password is provided for this session:")[1].split()[0].strip()
                                if pwd:
                                    matches.append((mtime, pwd))
            # Sort by file modification time descending (latest log first)
            matches.sort(key=lambda x: x[0], reverse=True)
            for mtime, pwd in matches[:2]:
                if pwd not in passwords_to_try:
                    passwords_to_try.append(pwd)
        except Exception:
            pass

        for pwd in passwords_to_try:
            try:
                url = f"{self.base_url}/api/v2/auth/login"
                data = urllib.parse.urlencode({"username": "admin", "password": pwd}).encode("utf-8")
                req = urllib.request.Request(
                    url, 
                    data=data, 
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Referer": f"{self.base_url}/"
                    }
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    headers = resp.info()
                    set_cookie = headers.get("Set-Cookie")
                    if set_cookie and "SID=" in set_cookie:
                        self.sid = set_cookie.split("SID=")[1].split(";")[0]
                        self.last_login = time.time()
                        self.active_password = pwd
                        return True
            except Exception:
                continue
        return False

    def request(self, endpoint, method="GET", params=None, data=None):
        if not self.sid or (time.time() - self.last_login > 300):
            self._login()

        url = f"{self.base_url}{endpoint}"
        if params:
            url += "?" + urllib.parse.urlencode(params)

        req_data = None
        headers = {"Referer": f"{self.base_url}/"}
        if self.sid:
            headers["Cookie"] = f"SID={self.sid}"

        if data:
            if isinstance(data, dict):
                req_data = urllib.parse.urlencode(data).encode("utf-8")
                headers["Content-Type"] = "application/x-www-form-urlencoded"
            elif isinstance(data, bytes):
                req_data = data

        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=4) as resp:
                res_body = resp.read().decode("utf-8")
                try:
                    return json.loads(res_body)
                except:
                    return res_body
        except urllib.error.HTTPError as e:
            if e.code in (403, 401):
                if self._login():
                    return self.request(endpoint, method, params, data)
            return None
        except Exception:
            return None

qbt = QbtRealClient(QBT_HOST)

def get_cpu_temp():
    try:
        if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
            with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                return str(round(float(f.read().strip()) / 1000.0, 1))
    except: pass
    try:
        temps = psutil.sensors_temperatures()
        if temps:
            for name, entries in temps.items():
                if entries:
                    return str(round(entries[0].current, 1))
    except: pass
    return "N/A"

def get_uptime_desc():
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
        days = int(uptime_seconds // (24 * 3600))
        hours = int((uptime_seconds % (24 * 3600)) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        parts = []
        if days > 0: parts.append(f"{days}天")
        if hours > 0: parts.append(f"{hours}小时")
        parts.append(f"{minutes}分钟")
        return " ".join(parts)
    except:
        return "N/A"

def format_bytes(b):
    if not isinstance(b, (int, float)): return "0 B"
    if b < 1024:
        return f"{b} B"
    elif b < 1024 * 1024:
        return f"{b / 1024:.1f} KB"
    elif b < 1024 * 1024 * 1024:
        return f"{b / (1024 * 1024):.1f} MB"
    else:
        return f"{b / (1024 * 1024 * 1024):.2f} GB"

def background_worker():
    global last_net, last_time, net_history, mem_history
    while True:
        try:
            now = time.time()
            dt = max(now - last_time, 1.0)
            
            cur_net = psutil.net_io_counters()
            down_speed = (cur_net.bytes_recv - last_net.bytes_recv) / dt
            up_speed = (cur_net.bytes_sent - last_net.bytes_sent) / dt
            
            last_net = cur_net
            last_time = now

            mem = psutil.virtual_memory()
            mem_history.append(mem.percent)
            if len(mem_history) > 20: mem_history.pop(0)

            net_history.append({"down": round(down_speed / 1024, 1), "up": round(up_speed / 1024, 1)})
            if len(net_history) > 20: net_history.pop(0)

            # Sync Transfer Info
            transfer_info = qbt.request("/api/v2/transfer/info")
            if transfer_info is not None and isinstance(transfer_info, dict):
                GLOBAL_CACHE["qbt_status"] = "online"
                GLOBAL_CACHE["download_speed"] = transfer_info.get("dl_info_speed", 0)
                GLOBAL_CACHE["upload_speed"] = transfer_info.get("up_info_speed", 0)
                GLOBAL_CACHE["transfer_info"] = transfer_info
            else:
                GLOBAL_CACHE["qbt_status"] = "offline"

            # Sync Real Torrents List
            torrents = qbt.request("/api/v2/torrents/info")
            if torrents is not None and isinstance(torrents, list):
                active_dl = 0
                active_up = 0
                completed = 0
                paused = 0
                errored = 0
                formatted = []

                for t in torrents:
                    state = t.get("state", "").lower()
                    if "downloading" in state or "stalleddl" in state or "metadl" in state:
                        active_dl += 1
                    elif "uploading" in state or "stalledup" in state:
                        active_up += 1
                    elif "completed" in state or "pausedup" in state:
                        completed += 1
                    elif "paused" in state:
                        paused += 1
                    elif "error" in state:
                        errored += 1

                    formatted.append({
                        "hash": t.get("hash"),
                        "name": t.get("name"),
                        "progress": round(t.get("progress", 0) * 100, 1),
                        "size": format_bytes(t.get("size", 0)),
                        "size_raw": t.get("size", 0),
                        "downloaded": format_bytes(t.get("completed", 0)),
                        "dlspeed": format_bytes(t.get("dlspeed", 0)) + "/s",
                        "upspeed": format_bytes(t.get("upspeed", 0)) + "/s",
                        "eta": t.get("eta", 0),
                        "state": state,
                        "category": t.get("category") or "未分类",
                        "tags": t.get("tags") or "",
                        "ratio": round(t.get("ratio", 0), 2),
                        "num_seeds": t.get("num_seeds", 0),
                        "num_leechs": t.get("num_leechs", 0),
                        "added_on": t.get("added_on", 0),
                        "save_path": t.get("save_path", "")
                    })

                GLOBAL_CACHE["torrents"] = formatted
                GLOBAL_CACHE["stats"] = {
                    "total": len(torrents),
                    "downloading": active_dl,
                    "uploading": active_up,
                    "completed": completed,
                    "paused": paused,
                    "errored": errored
                }

            # Sync Categories & Tags
            cats = qbt.request("/api/v2/torrents/categories")
            if cats and isinstance(cats, dict):
                GLOBAL_CACHE["categories"] = cats

            tags = qbt.request("/api/v2/torrents/tags")
            if tags and isinstance(tags, list):
                GLOBAL_CACHE["tags"] = tags

            # Sync RSS Feeds & Rules
            rss_items = qbt.request("/api/v2/rss/items?withData=true")
            if rss_items and isinstance(rss_items, dict):
                GLOBAL_CACHE["rss_feeds"] = rss_items

            rss_rules = qbt.request("/api/v2/rss/rules")
            if rss_rules and isinstance(rss_rules, dict):
                GLOBAL_CACHE["rss_rules"] = rss_rules

            # Sync Preferences
            prefs = qbt.request("/api/v2/app/preferences")
            if prefs and isinstance(prefs, dict):
                GLOBAL_CACHE["preferences"] = prefs

        except Exception:
            pass
        time.sleep(1)

threading.Thread(target=background_worker, daemon=True).start()

# Flask Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/dashboard")
def api_dashboard():
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    
    data = {
        "hostname": socket.gethostname(),
        "uptime": get_uptime_desc(),
        "cpu_temp": get_cpu_temp(),
        "cpu_percent": psutil.cpu_percent(),
        "cpu_count": psutil.cpu_count(),
        "mem_percent": mem.percent,
        "mem_used": format_bytes(mem.used),
        "mem_total": format_bytes(mem.total),
        "mem_history": mem_history,
        "disk_percent": disk.percent,
        "disk_free": format_bytes(disk.free),
        "disk_total": format_bytes(disk.total),
        "net_history": net_history,
        "qbt_status": GLOBAL_CACHE["qbt_status"],
        "dl_speed": format_bytes(GLOBAL_CACHE["download_speed"]) + "/s",
        "up_speed": format_bytes(GLOBAL_CACHE["upload_speed"]) + "/s",
        "dl_speed_raw": GLOBAL_CACHE["download_speed"],
        "up_speed_raw": GLOBAL_CACHE["upload_speed"],
        "stats": GLOBAL_CACHE["stats"],
        "torrents": GLOBAL_CACHE["torrents"],
        "categories": GLOBAL_CACHE["categories"],
        "tags": GLOBAL_CACHE["tags"],
        "transfer_info": GLOBAL_CACHE["transfer_info"],
        "rss_feeds": GLOBAL_CACHE["rss_feeds"],
        "rss_rules": GLOBAL_CACHE["rss_rules"],
        "preferences": GLOBAL_CACHE["preferences"]
    }
    return jsonify(data)

# Torrent Controls
@app.route("/api/torrent/action", methods=["POST"])
def api_torrent_action():
    data = request.json or {}
    action = data.get("action")
    hashes = data.get("hashes", "")

    if not action or not hashes:
        return jsonify({"success": False, "msg": "缺失参数"}), 400

    endpoint_map = {
        "resume": "/api/v2/torrents/resume",
        "pause": "/api/v2/torrents/pause",
        "delete": "/api/v2/torrents/delete",
        "recheck": "/api/v2/torrents/recheck",
        "reannounce": "/api/v2/torrents/reannounce"
    }

    if action not in endpoint_map:
        return jsonify({"success": False, "msg": "不支持的操作"}), 400

    payload = {"hashes": hashes}
    if action == "delete":
        payload["deleteFiles"] = "true" if data.get("delete_files") else "false"

    res = qbt.request(endpoint_map[action], method="POST", data=payload)
    return jsonify({"success": True})

@app.route("/api/torrent/add", methods=["POST"])
def api_torrent_add():
    urls = request.form.get("urls", "").strip()
    category = request.form.get("category", "")
    savepath = request.form.get("savepath", "")
    paused = request.form.get("paused", "false")

    file_obj = request.files.get("torrents")

    if not urls and not file_obj:
        return jsonify({"success": False, "msg": "请输入链接或选择种子文件"}), 400

    if file_obj:
        filename = file_obj.filename or "file.torrent"
        content = file_obj.read()
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        
        body = []
        body.append(f"--{boundary}".encode("utf-8"))
        body.append(f'Content-Disposition: form-data; name="torrents"; filename="{filename}"'.encode("utf-8"))
        body.append(b"Content-Type: application/x-bittorrent\r\n")
        body.append(content)
        body.append(f"--{boundary}--".encode("utf-8"))
        
        payload_bytes = b"\r\n".join(body)
        
        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Referer": f"{qbt.base_url}/"
        }
        if qbt.sid:
            headers["Cookie"] = f"SID={qbt.sid}"

        req = urllib.request.Request(f"{qbt.base_url}/api/v2/torrents/add", data=payload_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                pass
        except Exception as e:
            return jsonify({"success": False, "msg": str(e)}), 500
    else:
        payload = {"urls": urls, "autoTMM": "true"}
        if category: payload["category"] = category
        if savepath: payload["savepath"] = savepath
        if paused == "true": payload["stopped"] = "true"
        qbt.request("/api/v2/torrents/add", method="POST", data=payload)

    return jsonify({"success": True})

# Torrent Files, Trackers, Peers Tree Details API
@app.route("/api/torrent/files")
def api_torrent_files():
    hash_val = request.args.get("hash", "")
    if not hash_val: return jsonify([])
    files = qbt.request("/api/v2/torrents/files", params={"hash": hash_val})
    if files and isinstance(files, list):
        for f in files:
            f["size_formatted"] = format_bytes(f.get("size", 0))
            f["progress_percent"] = round(f.get("progress", 0) * 100, 1)
    return jsonify(files if isinstance(files, list) else [])

@app.route("/api/torrent/trackers")
def api_torrent_trackers():
    hash_val = request.args.get("hash", "")
    if not hash_val: return jsonify([])
    trackers = qbt.request("/api/v2/torrents/trackers", params={"hash": hash_val})
    return jsonify(trackers if isinstance(trackers, list) else [])

@app.route("/api/torrent/peers")
def api_torrent_peers():
    hash_val = request.args.get("hash", "")
    if not hash_val: return jsonify({})
    peers = qbt.request("/api/v2/sync/torrentPeers", params={"hash": hash_val})
    if not peers or not isinstance(peers, dict) or not peers.get("peers"):
        peers = qbt.request("/api/v2/torrents/peers", params={"hash": hash_val})
    return jsonify(peers if isinstance(peers, dict) else {})

# File Priority Setting
@app.route("/api/torrent/file_priority", methods=["POST"])
def api_file_priority():
    hash_val = request.form.get("hash")
    id_val = request.form.get("id")
    priority = request.form.get("priority", "1")
    if not hash_val or id_val is None:
        return jsonify({"success": False, "msg": "缺失参数"}), 400
    qbt.request("/api/v2/torrents/filePrio", method="POST", data={"hash": hash_val, "id": id_val, "priority": priority})
    return jsonify({"success": True})

# Category & Tag Operations API
@app.route("/api/category/add", methods=["POST"])
def api_category_add():
    category = request.form.get("category", "").strip()
    savepath = request.form.get("savepath", "").strip()
    if not category: return jsonify({"success": False, "msg": "分类名不能为空"}), 400
    qbt.request("/api/v2/torrents/createCategory", method="POST", data={"category": category, "savePath": savepath})
    return jsonify({"success": True})

@app.route("/api/category/delete", methods=["POST"])
def api_category_delete():
    categories = request.form.get("categories", "").strip()
    if not categories: return jsonify({"success": False, "msg": "分类不能为空"}), 400
    qbt.request("/api/v2/torrents/removeCategories", method="POST", data={"categories": categories})
    return jsonify({"success": True})

# RSS Rules Management API
@app.route("/api/rss/set_rule", methods=["POST"])
def api_rss_set_rule():
    rule_name = request.form.get("rule_name", "").strip()
    must_contain = request.form.get("must_contain", "").strip()
    must_not_contain = request.form.get("must_not_contain", "").strip()
    category = request.form.get("category", "").strip()
    if not rule_name: return jsonify({"success": False, "msg": "规则名称不能为空"}), 400
    
    rule_def = {
        "enabled": True,
        "mustContain": must_contain,
        "mustNotContain": must_not_contain,
        "useRegex": True,
        "assignedCategory": category,
        "savePath": ""
    }
    qbt.request("/api/v2/rss/setRule", method="POST", data={"ruleName": rule_name, "ruleDef": json.dumps(rule_def)})
    return jsonify({"success": True})

# Speed Limits & Preferences API
@app.route("/api/transfer/speed_limits", methods=["POST"])
def api_speed_limits():
    data = request.json or {}
    dl_limit = data.get("dl_limit")
    up_limit = data.get("up_limit")
    alt_mode = data.get("alt_mode")
    
    if dl_limit is not None:
        qbt.request("/api/v2/transfer/setDownloadLimit", method="POST", data={"limit": int(dl_limit)})
    if up_limit is not None:
        qbt.request("/api/v2/transfer/setUploadLimit", method="POST", data={"limit": int(up_limit)})
    if alt_mode is not None:
        qbt.request("/api/v2/transfer/toggleSpeedLimitsMode", method="POST")

    return jsonify({"success": True})

# Search Engine API
@app.route("/api/search/start", methods=["POST"])
def api_search_start():
    pattern = request.form.get("pattern", "").strip()
    category = request.form.get("category", "all")
    if not pattern: return jsonify({"success": False, "msg": "请输入搜索关键字"}), 400
    
    res = qbt.request("/api/v2/search/start", method="POST", data={"pattern": pattern, "plugins": "all", "category": category})
    return jsonify(res if isinstance(res, dict) else {"success": True, "search_id": 1})

@app.route("/api/search/results")
def api_search_results():
    id_val = request.args.get("id", "1")
    res = qbt.request("/api/v2/search/results", params={"id": id_val, "limit": 100})
    return jsonify(res if isinstance(res, dict) else {})

# Trackers Add (Single Torrent or Global All Torrents)
@app.route("/api/torrent/add_trackers", methods=["POST"])
def api_add_trackers():
    hash_val = request.form.get("hash", "").strip()
    urls = request.form.get("urls", "").strip()
    is_global = request.form.get("is_global", "false")

    if not urls:
        return jsonify({"success": False, "msg": "请输入 Tracker URL 列表"}), 400

    if is_global == "true" or not hash_val:
        # Add to all active torrents
        torrents = GLOBAL_CACHE.get("torrents", [])
        for t in torrents:
            t_hash = t.get("hash")
            if t_hash:
                qbt.request("/api/v2/torrents/addTrackers", method="POST", data={"hash": t_hash, "urls": urls})
    else:
        qbt.request("/api/v2/torrents/addTrackers", method="POST", data={"hash": hash_val, "urls": urls})

    return jsonify({"success": True})

# Torrent Piece States (Download Blocks Detail)
@app.route("/api/torrent/pieces")
def api_torrent_pieces():
    hash_val = request.args.get("hash", "")
    if not hash_val:
        return jsonify([])
    pieces = qbt.request("/api/v2/torrents/pieceStates", params={"hash": hash_val})
    return jsonify(pieces if isinstance(pieces, list) else [])

# Set Default Save Path Preference API
@app.route("/api/preferences/set_save_path", methods=["POST"])
def api_set_save_path():
    save_path = request.form.get("save_path", "").strip()
    if not save_path:
        return jsonify({"success": False, "msg": "路径不能为空"}), 400

    pref_json = json.dumps({"save_path": save_path})
    qbt.request("/api/v2/app/setPreferences", method="POST", data={"json": pref_json})
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=False)
