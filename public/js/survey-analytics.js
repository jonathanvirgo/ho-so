/**
 * Survey Analytics Dashboard
 */
class SurveyAnalytics {
    constructor(options = {}) {
        this.surveyConfigId = options.surveyConfigId;
        this.projectId = options.projectId;
        this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
        this.charts = {};
        this.filters = {
            dateRange: '7d',
            surveyId: null
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadInitialData();
        this.startRealTimeUpdates();
    }
    
    bindEvents() {
        // Filter changes
        $(document).on('change', '.analytics-filter', this.handleFilterChange.bind(this));
        
        // Chart controls
        $(document).on('click', '.chart-control-btn', this.handleChartControl.bind(this));
        
        // Export buttons
        $(document).on('click', '.export-btn', this.handleExport.bind(this));
        
        // Refresh button
        $(document).on('click', '.refresh-analytics', this.refreshData.bind(this));
    }
    
    async loadInitialData() {
        try {
            this.showLoading();
            
            // Load overview stats
            await this.loadOverviewStats();
            
            // Load charts
            await this.loadResponseTrendChart();
            await this.loadFieldAnalysisChart();
            await this.loadResponseTimeChart();
            await this.loadGeographicChart();
            
            // Load recent responses
            await this.loadRecentResponses();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }
    
    async loadOverviewStats() {
        const response = await $.get(`/projects/${this.projectId}/analytics/overview`, {
            surveyConfigId: this.surveyConfigId,
            ...this.filters
        });
        
        if (response.success) {
            this.updateStatsCards(response.data);
        }
    }
    
    updateStatsCards(stats) {
        // Total Responses
        $('#totalResponses').text(this.formatNumber(stats.totalResponses || 0));
        
        // Today's Responses
        $('#todayResponses').text(this.formatNumber(stats.todayResponses || 0));
        
        // Completion Rate
        $('#completionRate').text(this.formatPercentage(stats.completionRate || 0));
        
        // Average Time
        $('#averageTime').text(this.formatDuration(stats.averageTime || 0));
        
        // Response Rate Trend
        const trend = stats.responseTrend || 0;
        const trendElement = $('#responseTrend');
        trendElement.text(this.formatPercentage(Math.abs(trend)));
        trendElement.removeClass('text-success text-danger');
        trendElement.addClass(trend >= 0 ? 'text-success' : 'text-danger');
        
        // Update trend icon
        const trendIcon = trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        $('#responseTrendIcon').removeClass('fa-arrow-up fa-arrow-down').addClass(trendIcon);
    }
    
    async loadResponseTrendChart() {
        const response = await $.get(`/projects/${this.projectId}/analytics/response-trend`, {
            surveyConfigId: this.surveyConfigId,
            ...this.filters
        });
        
        if (response.success) {
            this.createResponseTrendChart(response.data);
        }
    }
    
    createResponseTrendChart(data) {
        const ctx = document.getElementById('responseTrendChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.responseTrend) {
            this.charts.responseTrend.destroy();
        }
        
        this.charts.responseTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Responses',
                    data: data.values,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007bff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#007bff',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            color: '#6c757d',
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    async loadFieldAnalysisChart() {
        const response = await $.get(`/projects/${this.projectId}/analytics/field-analysis`, {
            surveyConfigId: this.surveyConfigId,
            ...this.filters
        });
        
        if (response.success) {
            this.createFieldAnalysisChart(response.data);
        }
    }
    
    createFieldAnalysisChart(data) {
        const ctx = document.getElementById('fieldAnalysisChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.fieldAnalysis) {
            this.charts.fieldAnalysis.destroy();
        }
        
        this.charts.fieldAnalysis = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107', '#dc3545', 
                        '#6f42c1', '#fd7e14', '#20c997', '#6c757d'
                    ],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#007bff',
                        borderWidth: 1,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    async loadResponseTimeChart() {
        const response = await $.get(`/projects/${this.projectId}/analytics/response-time`, {
            surveyConfigId: this.surveyConfigId,
            ...this.filters
        });
        
        if (response.success) {
            this.createResponseTimeChart(response.data);
        }
    }
    
    createResponseTimeChart(data) {
        const ctx = document.getElementById('responseTimeChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.responseTime) {
            this.charts.responseTime.destroy();
        }
        
        this.charts.responseTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Response Time (minutes)',
                    data: data.values,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#28a745',
                        borderWidth: 1,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} minutes`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            color: '#6c757d',
                            callback: function(value) {
                                return value + 'm';
                            }
                        }
                    }
                }
            }
        });
    }

    async loadGeographicChart() {
        try {
            const response = await $.get(`/projects/${this.projectId}/analytics/geographic`, {
                surveyConfigId: this.surveyConfigId,
                ...this.filters
            });

            if (response.success) {
                this.createGeographicChart(response.data);
            }
        } catch (error) {
            console.error('Error loading geographic chart:', error);
            // Không hiển thị lỗi cho user vì đây là tính năng tùy chọn
        }
    }

    createGeographicChart(data) {
        const ctx = document.getElementById('geographicChart');
        if (!ctx) {
            console.log('Geographic chart container not found');
            return;
        }

        // Destroy existing chart
        if (this.charts.geographic) {
            this.charts.geographic.destroy();
        }

        // Nếu không có dữ liệu địa lý, hiển thị thông báo
        if (!data || !data.labels || data.labels.length === 0) {
            ctx.parentElement.innerHTML = '<p class="text-muted text-center py-4">Không có dữ liệu địa lý</p>';
            return;
        }

        this.charts.geographic = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107', '#dc3545',
                        '#6f42c1', '#fd7e14', '#20c997', '#6c757d',
                        '#17a2b8', '#e83e8c'
                    ],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    async loadRecentResponses() {
        const response = await $.get(`/projects/${this.projectId}/analytics/recent-responses`, {
            surveyConfigId: this.surveyConfigId,
            limit: 10
        });
        
        if (response.success) {
            this.updateRecentResponses(response.data);
        }
    }
    
    updateRecentResponses(responses) {
        const container = $('#recentResponsesList');
        
        if (!responses || responses.length === 0) {
            container.html('<p class="text-muted text-center py-4">No recent responses</p>');
            return;
        }
        
        const html = responses.map(response => `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">
                        ${response.respondent_email || 'Anonymous'}
                    </div>
                    <div class="timeline-meta">
                        Survey: ${response.survey_name}
                    </div>
                </div>
                <div class="timeline-time">
                    ${moment(response.submitted_at).fromNow()}
                </div>
            </div>
        `).join('');
        
        container.html(html);
    }
    
    handleFilterChange(e) {
        const $target = $(e.target);
        const filterName = $target.data('filter');
        const filterValue = $target.val();
        
        this.filters[filterName] = filterValue;
        this.refreshData();
    }
    
    handleChartControl(e) {
        const $btn = $(e.target).closest('.chart-control-btn');
        const chartType = $btn.data('chart');
        const period = $btn.data('period');
        
        // Update active state
        $btn.siblings().removeClass('active');
        $btn.addClass('active');
        
        // Update chart based on period
        this.updateChartPeriod(chartType, period);
    }
    
    async updateChartPeriod(chartType, period) {
        this.filters.dateRange = period;
        
        switch(chartType) {
            case 'trend':
                await this.loadResponseTrendChart();
                break;
            case 'time':
                await this.loadResponseTimeChart();
                break;
        }
    }
    
    handleExport(e) {
        const $btn = $(e.target).closest('.export-btn');
        const format = $btn.data('format');
        
        this.exportData(format);
    }
    
    async exportData(format) {
        try {
            const params = new URLSearchParams({
                format: format,
                surveyConfigId: this.surveyConfigId,
                ...this.filters
            });
            
            window.location.href = `/projects/${this.projectId}/analytics/export?${params.toString()}`;
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export data');
        }
    }
    
    async refreshData() {
        await this.loadInitialData();
    }
    
    startRealTimeUpdates() {
        setInterval(() => {
            this.loadOverviewStats();
            this.loadRecentResponses();
        }, this.refreshInterval);
    }
    
    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    
    formatPercentage(num) {
        return `${num.toFixed(1)}%`;
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    showLoading() {
        $('.chart-container').each(function() {
            $(this).html('<div class="chart-loading"><div class="loading-spinner"></div>Loading...</div>');
        });
    }
    
    hideLoading() {
        // Loading will be hidden when charts are rendered
    }
    
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
}
