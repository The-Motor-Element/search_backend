// Filter Manager Module
// Handles filter loading and management

class FilterManager {
    constructor(apiConfig) {
        this.apiConfig = apiConfig;
    }

    async loadFilterOptions() {
        try {
            // Load groups
            const groupsResponse = await fetch(this.apiConfig.getEndpoint('search/filters/groups'));
            const groupsData = await groupsResponse.json();
            this.populateFilterSelect('groupFilter', groupsData.groups);
            
            // Load record types
            const recordTypesResponse = await fetch(this.apiConfig.getEndpoint('search/filters/record-types'));
            const recordTypesData = await recordTypesResponse.json();
            this.populateFilterSelect('recordTypeFilter', recordTypesData.record_types);
            
            // Load ply ratings
            const plyRatingsResponse = await fetch(this.apiConfig.getEndpoint('search/filters/ply-ratings'));
            const plyRatingsData = await plyRatingsResponse.json();
            this.populateFilterSelect('plyRatingFilter', plyRatingsData.ply_ratings);
            
        } catch (error) {
            console.error('Failed to load filter options:', error);
        }
    }

    populateFilterSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = `${option.value} (${option.count})`;
            select.appendChild(optionElement);
        });
        
        // Restore previous value if it still exists
        if (currentValue) {
            select.value = currentValue;
        }
    }

    toggleFilter(field, value, isChecked) {
        console.log('Toggling filter:', field, value, isChecked);
        
        // Map facet field names to filter select IDs
        const filterMap = {
            'group': 'groupFilter',
            'record_type': 'recordTypeFilter', 
            'ply_rating': 'plyRatingFilter'
        };
        
        const selectId = filterMap[field];
        if (selectId) {
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                if (isChecked) {
                    selectElement.value = value;
                } else {
                    selectElement.value = '';
                }
                
                // Trigger search with the updated filters
                if (window.apolloApp && window.apolloApp.searchManager) {
                    window.apolloApp.searchManager.performSearch(0);
                }
            }
        }
    }
}

// Export for global use
window.FilterManager = FilterManager;
