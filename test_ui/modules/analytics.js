// Analytics module
import { CONFIG } from './config.js';
import { safeFetch } from './network.js';
import { showAlert } from './ui.js';

export async function showAnalytics() {
    try {
        const result = await safeFetch(`${CONFIG.API_BASE_URL}/analytics/stats`);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load analytics');
        }
        
        displayAnalyticsModal(result.data);
    } catch (error) {
        console.error('❌ Failed to load analytics:', error);
        showAlert(`Failed to load analytics data: ${error.message}`, 'danger');
    }
}

export function displayAnalyticsModal(data) {
    const content = document.getElementById('analyticsContent');
    
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
