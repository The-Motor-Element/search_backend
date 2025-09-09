// Application initialization module
import { CONFIG } from './config.js';
import { checkSystemHealth } from './network.js';
import { loadFilterOptions } from './filters.js';
import { setupEventListeners } from './events.js';
import { updateSearchInterface, showAlert } from './ui.js';

export async function initializeApp() {
    try {
        console.log('🚀 Multi-Brand Tire Search UI initializing...');
        console.log('🔗 API Base URL:', CONFIG.API_BASE_URL);
        
        // Check system health
        await checkSystemHealth();
        
        // Load filter options
        await loadFilterOptions();
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default interface to faceted search
        updateSearchInterface();
        
        console.log('🚀 Multi-Brand Tire Search UI initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        showAlert('Failed to initialize application. Please check if the API server is running.', 'danger');
    }
}

// Utility functions
export function loadSampleSearch(query) {
    console.log('🎯 Loading sample search:', query);
    document.getElementById('searchQuery').value = query;
    document.getElementById('searchType').value = 'faceted';
    updateSearchInterface();
    window.performSearch();
}

export async function browseMode() {
    console.log('🔍 Entering browse mode');
    
    // Clear search query to show all results
    document.getElementById('searchQuery').value = '';
    
    // Set to browse mode
    document.getElementById('searchType').value = 'browse';
    
    // Set to show all results for browsing
    document.getElementById('limitSelect').value = '1000';
    
    // Clear all filters for a full browse experience
    const { clearAllFilters } = await import('./ui.js');
    clearAllFilters();
    
    // Update the interface to show facets panel
    updateSearchInterface();
    
    // Perform the search to show all categories
    window.performSearch();
}
