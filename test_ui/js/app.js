// Main Application Module
// Orchestrates all components and initializes the application

class ApolloSearchApp {
    constructor() {
        console.log('🚀 Apollo Search App initializing...');
        
        // Initialize core components
        this.apiConfig = window.apiConfig;
        this.healthChecker = new HealthChecker(this.apiConfig);
        this.searchManager = new SearchManager(this.apiConfig);
        this.filterManager = new FilterManager(this.apiConfig);
        this.eventHandler = new EventHandler(this.searchManager);
        this.analytics = new Analytics(this.apiConfig);
        
        // Make components globally available for backward compatibility
        window.searchManager = this.searchManager;
        window.eventHandler = this.eventHandler;
        window.analytics = this.analytics;
        
        console.log('✅ All components initialized');
    }

    async initialize() {
        console.log('🚀 Starting app initialization...');
        console.log('🌐 Initial state check:');
        console.log('   - window.APOLLO_API_URL:', window.APOLLO_API_URL);
        console.log('   - API_BASE_URL:', this.apiConfig.getApiUrl());
        console.log('   - document.readyState:', document.readyState);
        console.log('   - window.location:', window.location.href);
        
        try {
            console.log('📡 Step 1: Starting health check...');
            try {
                await this.healthChecker.checkSystemHealth();
                console.log('✅ Step 1 completed: Health check passed');
            } catch (healthError) {
                console.warn('⚠️ Step 1 warning: Health check failed, but continuing:', healthError.message);
            }
            
            console.log('📡 Step 2: Loading filter options...');
            try {
                await this.filterManager.loadFilterOptions();
                console.log('✅ Step 2 completed: Filter options loaded');
            } catch (filterError) {
                console.warn('⚠️ Step 2 warning: Filter loading failed, but continuing:', filterError.message);
            }
            
            console.log('📡 Step 3: Setting up event listeners...');
            try {
                this.eventHandler.setupEventListeners();
                console.log('✅ Step 3 completed: Event listeners set up');
            } catch (eventError) {
                console.warn('⚠️ Step 3 warning: Event setup failed, but continuing:', eventError.message);
            }
            
            console.log('📡 Step 4: Updating search interface...');
            try {
                this.eventHandler.updateSearchInterface();
                console.log('✅ Step 4 completed: Search interface updated');
            } catch (interfaceError) {
                console.warn('⚠️ Step 4 warning: Interface update failed, but continuing:', interfaceError.message);
            }
            
            console.log('🚀 Apollo Tire Search UI initialized successfully (with possible warnings)');
            
            // Set up periodic health checks
            // this.healthChecker.performPeriodicCheck(30000); // Every 30 seconds
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            console.error('❌ Error stack:', error.stack);
            this.showAlert('Failed to initialize application completely. Basic search may still work.', 'warning');
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
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

    // Global function exports for backward compatibility
    exportGlobalFunctions() {
        // Export main functions to window for HTML onclick handlers
        window.performSearch = (page = 0) => this.searchManager.performSearch(page);
        window.loadSampleSearch = (query) => this.eventHandler.loadSampleSearch(query);
        window.browseMode = () => this.eventHandler.browseMode();
        window.showAnalytics = () => this.analytics.showAnalytics();
        window.selectSuggestion = (suggestion) => this.eventHandler.selectSuggestion(suggestion);
        window.applyFacetFilter = (facetName, value) => this.searchManager.applyFacetFilter(facetName, value);
        window.removeFacetFilter = (facetName) => this.searchManager.removeFacetFilter(facetName);
        window.clearAllFilters = () => this.searchManager.clearAllFilters();
        window.updateSearchInterface = () => this.eventHandler.updateSearchInterface();
        
        // Export utility functions
        window.showProductDetails = (productId) => this.searchManager.showProductDetails(productId);
        window.findSimilarProducts = (productId) => {
            this.searchManager.loadSimilarProducts(productId);
            document.getElementById('similarProductsSection')?.scrollIntoView({ behavior: 'smooth' });
        };
        window.searchForProduct = (productId) => {
            document.getElementById('searchQuery').value = productId;
            this.searchManager.performSearch();
        };
        window.copyProductInfo = (productId) => {
            // Find the product in current results and copy its information
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                if (card.onclick?.toString().includes(productId)) {
                    const productName = card.querySelector('.product-name')?.textContent || '';
                    const productSubtitle = card.querySelector('.product-subtitle')?.textContent || '';
                    const specs = Array.from(card.querySelectorAll('.spec-item')).map(item => {
                        const label = item.querySelector('.spec-label')?.textContent || '';
                        const value = item.querySelector('.spec-value')?.textContent || '';
                        return `${label} ${value}`;
                    }).join(', ');
                    
                    const productInfo = `${productName}\n${productSubtitle}\n${specs}`;
                    
                    navigator.clipboard.writeText(productInfo).then(() => {
                        this.showAlert('Product information copied to clipboard!', 'success');
                    }).catch(() => {
                        this.showAlert('Failed to copy product information', 'warning');
                    });
                }
            });
        };
        
        console.log('🔗 Global functions exported successfully');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Content Loaded event fired');
    console.log('🎯 Starting Apollo Search App...');
    console.log('🎯 Document ready state:', document.readyState);
    console.log('🎯 Available elements:', {
        searchQuery: !!document.getElementById('searchQuery'),
        searchResults: !!document.getElementById('searchResults'),
        searchType: !!document.getElementById('searchType'),
        limitSelect: !!document.getElementById('limitSelect')
    });
    
    // Add a test for manual debugging
    window.testSearch = function() {
        console.log('🧪 Manual test search triggered');
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            searchInput.value = 'LOADSTAR';
            window.performSearch();
        }
    };
    
    try {
        // Create and initialize the main application
        const app = new ApolloSearchApp();
        console.log('✅ App instance created');
        
        app.exportGlobalFunctions();
        console.log('✅ Global functions exported');
        console.log('✅ window.performSearch type:', typeof window.performSearch);
        console.log('✅ window.loadSampleSearch type:', typeof window.loadSampleSearch);
        
        app.initialize();
        console.log('✅ App initialization started');
        
        // Make app globally available for debugging
        window.apolloApp = app;
        console.log('✅ App made globally available');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.error('❌ Error stack:', error.stack);
    }
});

// Log when script loads
console.log('📜 Main app script loaded successfully');
console.log('📜 Browser info:', {
    userAgent: navigator.userAgent,
    cookieEnabled: navigator.cookieEnabled,
    language: navigator.language,
    onLine: navigator.onLine,
    platform: navigator.platform
});
