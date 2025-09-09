// UI utilities module
import { CONFIG } from './config.js';

export function showLoading() {
    console.log('⏳ Showing loading state');
    const container = document.getElementById('searchResults');
    if (!container) {
        console.error('❌ Search results container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Searching...</span>
        </div>
    `;
}

export function hideLoading() {
    // Loading will be hidden when results are displayed
}

export function showAlert(message, type = 'info') {
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
    }, CONFIG.AUTO_DISMISS_DELAY);
}

export function populateFilterSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`❌ Select element not found: ${selectId}`);
        return;
    }
    
    const currentValue = select.value;
    
    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    if (!options || !Array.isArray(options)) {
        console.warn(`⚠️ Invalid options for ${selectId}:`, options);
        return;
    }
    
    options.forEach((option, index) => {
        try {
            if (!option || typeof option !== 'object' || !option.value) {
                console.warn(`⚠️ Invalid option at index ${index} for ${selectId}:`, option);
                return;
            }
            
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = `${option.value} (${option.count || 0})`;
            select.appendChild(optionElement);
        } catch (error) {
            console.error(`❌ Error adding option at index ${index} for ${selectId}:`, error, option);
        }
    });
    
    // Restore previous value if it still exists
    if (currentValue) {
        select.value = currentValue;
    }
}

export function updateSearchInterface() {
    const searchType = document.getElementById('searchType').value;
    const facetsPanel = document.getElementById('facetsPanel');
    
    switch (searchType) {
        case 'faceted':
        case 'browse':
            if (facetsPanel) facetsPanel.style.display = 'block';
            break;
        default:
            if (facetsPanel) facetsPanel.style.display = 'none';
    }
}

export function clearAllFilters() {
    console.log('Clearing all filters');
    
    // Clear all filter selects
    document.getElementById('groupFilter').value = '';
    document.getElementById('recordTypeFilter').value = '';
    document.getElementById('plyRatingFilter').value = '';
    document.getElementById('customFilter').value = '';
    
    // Clear facet tags using the FacetTags module
    if (window.FacetTags) {
        window.FacetTags.clearAllFacetTags();
    }
    
    console.log('Cleared all dropdowns and facet tags');
}
