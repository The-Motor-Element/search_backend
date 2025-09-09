// Products and similar products module
import { CONFIG, state, updateState } from './config.js';
import { safeFetch } from './network.js';
import { showAlert } from './ui.js';

export async function loadSimilarProducts(productId) {
    if (state.similarProductsCache[productId]) {
        displaySimilarProducts(state.similarProductsCache[productId]);
        return;
    }
    
    try {
        const result = await safeFetch(`${CONFIG.API_BASE_URL}/search/similar/${productId}?limit=3`);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load similar products');
        }
        
        const newCache = { ...state.similarProductsCache };
        newCache[productId] = result.data;
        updateState({ similarProductsCache: newCache });
        
        displaySimilarProducts(result.data);
        
    } catch (error) {
        console.error('❌ Error loading similar products:', error);
        showAlert(`Failed to load similar products: ${error.message}`, 'warning');
    }
}

export function displaySimilarProducts(data) {
    const section = document.getElementById('similarProductsSection');
    const container = document.getElementById('similarProductsContent');
    
    // Handle different response formats
    let similarProducts = [];
    let referenceProduct = null;
    
    if (Array.isArray(data)) {
        // If data is directly an array (from cache or simple response)
        similarProducts = data;
    } else if (data && data.similar_products) {
        // If data has similar_products property
        similarProducts = data.similar_products;
        referenceProduct = data.reference_product;
    } else if (data && Array.isArray(data.hits)) {
        // If data has hits array (like search results)
        similarProducts = data.hits;
    }
    
    if (!similarProducts || similarProducts.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    const referenceHtml = referenceProduct ? 
        `<div class="mb-2">
            <strong>Reference Product:</strong> ${referenceProduct.material}
        </div>` : '';
    
    container.innerHTML = `
        ${referenceHtml}
        <div class="row">
            ${similarProducts.slice(0, 3).map(product => `
                <div class="col-md-4">
                    <div class="similar-product" onclick="searchForProduct('${product.id}')">
                        <div class="similar-product-title">${product.material || product.title || 'Unknown Product'}</div>
                        <div class="similar-product-details">
                            MPN: ${product.mpn || 'N/A'}<br>
                            Size: ${product.size || 'N/A'}<br>
                            Group: ${product.group || 'N/A'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    section.style.display = 'block';
}

export function showProductDetails(productId) {
    // In a real application, this would show a detailed product view
    console.log('Show product details for:', productId);
    loadSimilarProducts(productId);
}

export function findSimilarProducts(productId) {
    loadSimilarProducts(productId);
    document.getElementById('similarProductsSection').scrollIntoView({ behavior: 'smooth' });
}

export function searchForProduct(productId) {
    document.getElementById('searchQuery').value = productId;
    if (window.performSearch) {
        window.performSearch();
    }
}
