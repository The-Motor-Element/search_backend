// Environment configuration for Apollo Search UI
window.APOLLO_CONFIG = {
    // API configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8001' 
        : '/api',
    
    // Feature flags
    FEATURES: {
        ANALYTICS: true,
        SUGGESTIONS: true,
        SIMILAR_PRODUCTS: true,
        FACETED_SEARCH: true
    },
    
    // UI settings
    UI: {
        RESULTS_PER_PAGE: 20,
        MAX_SUGGESTIONS: 5,
        DEBOUNCE_DELAY: 300,
        AUTO_SEARCH_THRESHOLD: 2
    },
    
    // Environment detection
    ENVIRONMENT: window.location.hostname === 'localhost' ? 'development' : 'production'
};

// Set global API URL for backward compatibility
window.APOLLO_API_URL = window.APOLLO_CONFIG.API_BASE_URL;
