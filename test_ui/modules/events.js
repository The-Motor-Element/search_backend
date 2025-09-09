// Event handlers module
import { CONFIG, state, updateState } from './config.js';
import { getSuggestions, hideSuggestions, handleSuggestionKeyboard } from './suggestions.js';
import { updateSearchInterface, clearAllFilters } from './ui.js';

export function setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchQuery');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        updateState({ selectedSuggestionIndex: -1 }); // Reset selection when typing
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                getSuggestions(query);
            }, CONFIG.DEBOUNCE_DELAY);
        } else {
            hideSuggestions();
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        handleSuggestionKeyboard(e);
    });
    
    // Click outside to hide suggestions
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input-wrapper')) {
            hideSuggestions();
            updateState({ selectedSuggestionIndex: -1 });
        }
    });
    
    // Filter change listeners
    ['groupFilter', 'recordTypeFilter', 'plyRatingFilter', 'customFilter', 'sortField'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', async () => {
                const filters = await getCurrentFilters();
                if (state.currentQuery || filters) {
                    window.performSearch();
                }
            });
        }
    });
    
    // Search type change
    const searchTypeElement = document.getElementById('searchType');
    if (searchTypeElement) {
        searchTypeElement.addEventListener('change', updateSearchInterface);
    }
}

async function getCurrentFilters() {
    // Import getCurrentFilters to avoid circular dependency
    const { getCurrentFilters } = await import('./filters.js');
    return getCurrentFilters();
}
