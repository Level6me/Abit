/**
 * @file chart.js
 * @description Network transfer rate live trend chart initialization and update
 */

// --- Chart Initialization ---
    function initChart() {
        const ctx = document.getElementById('netChart').getContext('2d');
        netChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [
                    {
                        label: t('下载 (KB/s)'),
                        data: Array(20).fill(0),
                        borderColor: '#34c759',
                        backgroundColor: 'rgba(52,199,89,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    },
                    {
                        label: t('上传 (KB/s)'),
                        data: Array(20).fill(0),
                        borderColor: '#007aff',
                        backgroundColor: 'rgba(0,122,255,0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, beginAtZero: true }
                }
            }
        });
    }
