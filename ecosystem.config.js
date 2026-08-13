module.exports = {
  apps: [
    {
      name: "apple-torrent-dashboard",
      script: "./venv/bin/gunicorn",
      args: "-w 1 -b 0.0.0.0:5005 app:app --preload",
      cwd: "./",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        QBT_HOST: "http://127.0.0.1:8080",
        DASHBOARD_PASSWORD: "", // 在此设置访问密码以保护您的面板 (留空为免密访问)
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
