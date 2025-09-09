// Multi-Brand Tire Search UI JavaScript - Main Module
// This is the new modular entry point that replaces the monolithic script.js

// Import all modules
import { initializeApp, loadSampleSearch, browseMode } from './modules/app.js';
import { performSearch, triggerSearch } from './modules/search.js';
import { showAnalytics } from './modules/analytics.js';
import { selectSuggestion } from './modules/suggestions.js';
import { showProductDetails, findSimilarProducts, searchForProduct } from './modules/products.js';
import { copyProductInfo } from './modules/display.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Multi-Brand Tire Search UI initializing...');
    initializeApp();
});

// Export functions for global access (for backward compatibility with HTML onclick handlers)
window.performSearch = performSearch;
window.loadSampleSearch = loadSampleSearch;
window.browseMode = browseMode;
window.showAnalytics = showAnalytics;
window.selectSuggestion = selectSuggestion;
window.triggerSearch = triggerSearch;
window.showProductDetails = showProductDetails;
window.findSimilarProducts = findSimilarProducts;
window.searchForProduct = searchForProduct;
window.copyProductInfo = copyProductInfo;

console.log('🚀 All global functions exported successfully');
