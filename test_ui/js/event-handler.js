// UI Event Handler Module
// Manages all user interface events and interactions

class EventHandler {
    constructor(searchManager) {
        this.searchManager = searchManager;
        this.selectedSuggestionIndex = -1;
        this.searchTimeout = null;
    }

    setupEventListeners() {
        this.setupSearchInput();
        this.setupFilterEvents();
        this.setupSearchTypeEvents();
        this.setupGlobalEvents();
    }

    setupSearchInput() {
        const searchInput = document.getElementById('searchQuery');
        if (!searchInput) return;

        // Search input with debouncing
        searchInput.addEventListener('input', (event) => {
            clearTimeout(this.searchTimeout);
            const query = event.target.value.trim();
            this.selectedSuggestionIndex = -1; // Reset selection when typing
            
            if (query.length >= 2) {
                this.searchTimeout = setTimeout(() => {
                    this.handleSuggestionRequest(query);
                }, 300);
            } else {
                this.hideSuggestions();
            }
        });

        // Keyboard navigation for suggestions
        searchInput.addEventListener('keydown', (event) => {
            this.handleSearchKeydown(event);
        });
    }

    setupFilterEvents() {
        const filterIds = ['groupFilter', 'recordTypeFilter', 'plyRatingFilter', 'customFilter', 'sortField'];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.handleFilterChange(id, element.value);
                });
            }
        });
    }

    setupSearchTypeEvents() {
        const searchTypeElement = document.getElementById('searchType');
        if (searchTypeElement) {
            searchTypeElement.addEventListener('change', () => {
                this.updateSearchInterface();
            });
        }
    }

    setupGlobalEvents() {
        // Click outside to hide suggestions
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.search-input-wrapper')) {
                this.hideSuggestions();
                this.selectedSuggestionIndex = -1;
            }
        });

        // Global error handlers for debugging
        window.addEventListener('error', (event) => {
            console.error('🚨 Global JavaScript Error:', event.error);
            console.error('🚨 Error message:', event.message);
            console.error('🚨 Error filename:', event.filename);
            console.error('🚨 Error line:', event.lineno);
            console.error('🚨 Error column:', event.colno);
            console.error('🚨 Error stack:', event.error?.stack);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);
            console.error('🚨 Promise:', event.promise);
        });
    }

    handleFilterChange(filterId, value) {
        // Sync selected facets when dropdowns change
        if (filterId === 'groupFilter') {
            if (value) {
                this.searchManager.selectedFacets['group'] = value;
            } else {
                delete this.searchManager.selectedFacets['group'];
            }
        } else if (filterId === 'recordTypeFilter') {
            if (value) {
                this.searchManager.selectedFacets['record_type'] = value;
            } else {
                delete this.searchManager.selectedFacets['record_type'];
            }
        } else if (filterId === 'plyRatingFilter') {
            if (value) {
                this.searchManager.selectedFacets['ply_rating'] = value;
            } else {
                delete this.searchManager.selectedFacets['ply_rating'];
            }
        }
        
        // Update selected facets display
        this.searchManager.updateSelectedFacetsDisplay();
        
        if (this.searchManager.currentQuery || this.searchManager.getCurrentFilters()) {
            this.searchManager.performSearch();
        }
    }

    async handleSuggestionRequest(query) {
        try {
            const suggestions = await this.searchManager.getSuggestions(query);
            this.showSuggestions(suggestions);
        } catch (error) {
            console.error('❌ Failed to get suggestions:', error);
            this.hideSuggestions();
        }
    }

    handleSearchKeydown(event) {
        const suggestionsContainer = document.getElementById('suggestions');
        const suggestions = suggestionsContainer?.querySelectorAll('.suggestion-item') || [];
        
        if (suggestions.length === 0) return;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                this.updateSuggestionSelection(suggestions, this.selectedSuggestionIndex);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                this.updateSuggestionSelection(suggestions, this.selectedSuggestionIndex);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
                    const selectedText = suggestions[this.selectedSuggestionIndex].textContent.trim();
                    this.selectSuggestion(selectedText);
                } else {
                    console.log('🔍 Enter key pressed, triggering search');
                    this.hideSuggestions();
                    this.searchManager.performSearch();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideSuggestions();
                this.selectedSuggestionIndex = -1;
                break;
        }
    }

    updateSuggestionSelection(suggestions, selectedIndex) {
        suggestions.forEach((item, index) => {
            if (index === selectedIndex) {
                item.style.backgroundColor = 'var(--primary-color)';
                item.style.color = 'white';
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.style.backgroundColor = '';
                item.style.color = '';
            }
        });
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('suggestions');
        if (!suggestionsContainer) return;
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        // Create suggestion items with enhanced styling
        suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => 
            `<div class="suggestion-item" onclick="window.eventHandler.selectSuggestion('${suggestion.replace(/'/g, "\\'")}')">
                ${suggestion}
            </div>`
        ).join('');
        
        // Ensure proper positioning by forcing a reflow
        suggestionsContainer.style.display = 'block';
        
        console.log('💡 Showing suggestions:', suggestions);
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            console.log('💭 Hiding suggestions');
        }
    }

    selectSuggestion(suggestion) {
        console.log('✅ Selected suggestion:', suggestion);
        document.getElementById('searchQuery').value = suggestion;
        this.hideSuggestions();
        this.searchManager.performSearch();
    }

    updateSearchInterface() {
        const searchType = document.getElementById('searchType')?.value;
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

    // Sample search functions
    loadSampleSearch(query) {
        console.log('🎯 Loading sample search:', query);
        document.getElementById('searchQuery').value = query;
        document.getElementById('searchType').value = 'faceted';
        this.updateSearchInterface();
        this.searchManager.performSearch();
    }

    browseMode() {
        console.log('🔍 Entering browse mode');
        
        // Clear search query to show all results
        document.getElementById('searchQuery').value = '';
        
        // Set to browse mode
        document.getElementById('searchType').value = 'browse';
        
        // Set to show all results for browsing
        document.getElementById('limitSelect').value = '1000';
        
        // Clear all filters for a full browse experience
        this.searchManager.clearAllFilters();
        
        // Update the interface to show facets panel
        this.updateSearchInterface();
        
        // Perform the search to show all categories
        this.searchManager.performSearch();
    }
}

// Export for global use
window.EventHandler = EventHandler;
