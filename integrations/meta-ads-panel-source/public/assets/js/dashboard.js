const ctx = document.getElementById('performanceChart');

if (ctx) {
    const labels = window.metaChartData?.labels || [];
    const spendData = window.metaChartData?.spendData || [];

    const chartContext = ctx.getContext('2d');
    const gradient = chartContext.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(124, 108, 255, 0.95)');
    gradient.addColorStop(1, 'rgba(42, 209, 255, 0.42)');

    new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Veri Yok'],
            datasets: [{
                label: 'Harcama',
                data: spendData.length ? spendData : [0],
                backgroundColor: gradient,
                borderRadius: 12,
                borderSkipped: false,
                maxBarThickness: 42
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.4,
            animation: false,
            resizeDelay: 150,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#dfe7ff',
                        boxWidth: 14,
                        boxHeight: 14,
                        useBorderRadius: true,
                        borderRadius: 6,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 44, 0.96)',
                    titleColor: '#ffffff',
                    bodyColor: '#dfe7ff',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#98a6c7',
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255,255,255,0.06)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#98a6c7',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}