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
        newCache[productId] = result.data.hits || [];
        updateState({ similarProductsCache: newCache });
        
        displaySimilarProducts(result.data.hits || []);
        
    } catch (error) {
        console.error('❌ Error loading similar products:', error);
        showAlert(`Failed to load similar products: ${error.message}`, 'warning');
    }
}

export function displaySimilarProducts(data) {
    const section = document.getElementById('similarProductsSection');
    const container = document.getElementById('similarProductsContent');
    
    if (!data.similar_products || data.similar_products.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <div class="mb-2">
            <strong>Reference Product:</strong> ${data.reference_product.material}
        </div>
        <div class="row">
            ${data.similar_products.map(product => `
                <div class="col-md-4">
                    <div class="similar-product" onclick="searchForProduct('${product.id}')">
                        <div class="similar-product-title">${product.material}</div>
                        <div class="similar-product-details">
                            MPN: ${product.mpn}<br>
                            Size: ${product.size || 'N/A'}<br>
                            Group: ${product.group}
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
