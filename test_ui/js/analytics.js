// Analytics Module
// Handles analytics and statistics functionality

class Analytics {
    constructor(apiConfig) {
        this.apiConfig = apiConfig;
    }

    async showAnalytics() {
        try {
            const response = await fetch(this.apiConfig.getEndpoint('analytics/stats'));
            const data = await response.json();
            
            this.displayAnalyticsModal(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showAlert('Failed to load analytics data', 'danger');
        }
    }

    displayAnalyticsModal(data) {
        const content = document.getElementById('analyticsContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="analytics-metric">
                        <h4>${data.index_stats.number_of_documents}</h4>
                        <p>Total Products</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="analytics-metric">
                        <h4>${Object.keys(data.facet_analytics.groups).length}</h4>
                        <p>Product Groups</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="analytics-metric">
                        <h4>${Object.keys(data.facet_analytics.record_types).length}</h4>
                        <p>Record Types</p>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h6>Top Product Groups</h6>
                    <div class="list-group">
                        ${data.top_groups.slice(0, 5).map(([group, count]) => `
                            <div class="list-group-item d-flex justify-content-between">
                                <span>${group}</span>
                                <span class="badge bg-primary">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-md-6">
                    <h6>Record Type Distribution</h6>
                    <div class="list-group">
                        ${data.top_record_types.map(([type, count]) => `
                            <div class="list-group-item d-flex justify-content-between">
                                <span>${type}</span>
                                <span class="badge bg-secondary">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
        modal.show();
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        alertContainer.innerHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Export for global use
window.Analytics = Analytics;
