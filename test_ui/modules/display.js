// Display and UI rendering module
import { state } from './config.js';

export function displaySearchResults(results) {
    console.log('📊 Displaying search results:', results);
    
    const container = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');
    const processingTime = document.getElementById('processingTime');
    
    if (!container || !resultsCount || !processingTime) {
        console.error('❌ Required DOM elements not found');
        return;
    }
    
    resultsCount.textContent = results.estimated_total_hits || results.hits.length;
    processingTime.textContent = `${results.processing_time_ms}ms`;
    
    if (results.hits.length === 0) {
        container.innerHTML = `
            <div class="card text-center">
                <div class="card-body py-5">
                    <i class="fas fa-search fa-2x text-muted mb-3"></i>
                    <h4>No results found</h4>
                    <p class="text-muted">Try adjusting your search terms or filters</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.hits.map(hit => createProductCard(hit)).join('');
}

export function createProductCard(product) {
    const tags = product.tags ? product.tags.map(tag => 
        `<span class="product-tag">${tag}</span>`
    ).join('') : '';
    
    const highlighted = product._formatted || product;
    
    // Extract clean product name from material or title
    const productName = extractProductName(highlighted.material || highlighted.title || product.mpn || 'Unknown Product');
    const productSize = highlighted.size || 'Size not specified';
    const productPattern = highlighted.pattern_model || 'Pattern not available';
    
    // Determine tire type icon
    const tireIcon = getTireIcon(product.record_type, product.group);
    
    return `
        <div class="product-card" onclick="showProductDetails('${product.id}')">
            <div class="product-card-header">
                <div class="product-icon">
                    <i class="${tireIcon}"></i>
                </div>
                <div class="product-header-info">
                    <h5 class="product-name">${productName}</h5>
                    <p class="product-subtitle">${productSize} • ${productPattern}</p>
                </div>
                <div class="product-price-badge">
                    <span class="badge bg-primary">${product.group || 'N/A'}</span>
                </div>
            </div>
            
            <div class="product-card-body">
                <div class="product-specs">
                    <div class="spec-item">
                        <span class="spec-label">MPN:</span>
                        <span class="spec-value">${highlighted.mpn || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Type:</span>
                        <span class="spec-value">${product.record_type || 'N/A'}</span>
                    </div>
                    ${product.ply_rating ? `
                    <div class="spec-item">
                        <span class="spec-label">Ply Rating:</span>
                        <span class="spec-value">${product.ply_rating}</span>
                    </div>` : ''}
                    ${product.load_index ? `
                    <div class="spec-item">
                        <span class="spec-label">Load Index:</span>
                        <span class="spec-value">${product.load_index}</span>
                    </div>` : ''}
                    ${product.speed_rating ? `
                    <div class="spec-item">
                        <span class="spec-label">Speed Rating:</span>
                        <span class="spec-value">${product.speed_rating}</span>
                    </div>` : ''}
                </div>
                
                ${tags ? `<div class="product-tags mt-3">${tags}</div>` : ''}
                
                <div class="product-description mt-2">
                    <small class="text-muted">${highlighted.material || 'No description available'}</small>
                </div>
            </div>
            
            <div class="product-card-footer">
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); findSimilarProducts('${product.id}')">
                    <i class="fas fa-search-plus"></i> Find Similar
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); copyProductInfo('${product.id}')">
                    <i class="fas fa-copy"></i> Copy Info
                </button>
                <div class="product-brand">
                    <small><i class="fas fa-trademark"></i> ${product.brand || 'Apollo'}</small>
                </div>
            </div>
        </div>
    `;
}

export function extractProductName(material) {
    // Extract a clean product name from the material description
    if (!material) return 'Unknown Product';
    
    // Remove size information (numbers with / or R or D)
    let name = material.replace(/\d+[\/.]\d+[\s\w]*[RD]\d+/g, '');
    
    // Remove ply rating (like 8PR, 6PR)
    name = name.replace(/\d+PR/g, '');
    
    // Remove load index and speed rating patterns
    name = name.replace(/\d+\/\d+[A-Z]/g, '');
    name = name.replace(/\d+[A-Z]/g, '');
    
    // Remove special codes in parentheses or with dashes
    name = name.replace(/\([^)]*\)/g, '');
    name = name.replace(/-[A-Z\d]+$/g, '');
    
    // Clean up extra spaces and dashes
    name = name.replace(/\s+/g, ' ').replace(/^\s*-?\s*/, '').replace(/\s*-?\s*$/, '');
    
    // If name is too short or empty, use the pattern model or return a default
    if (name.length < 3) {
        // Try to extract pattern from the original material
        const patternMatch = material.match(/([A-Z][A-Z\s]+[A-Z])/);
        if (patternMatch) {
            name = patternMatch[1];
        } else {
            name = 'Tire Product';
        }
    }
    
    return name.trim();
}

export function getTireIcon(recordType, group) {
    // Return appropriate icon based on tire type and group
    if (recordType === 'Tube') return 'fas fa-circle tire-tube-icon';
    if (recordType === 'Flaps') return 'fas fa-layer-group tire-flap-icon';
    
    // Different tire icons based on group
    switch (group) {
        case 'Passenger Car':
        case 'PCR':
            return 'fas fa-car tire-car-icon';
        case 'Truck and Bus':
        case 'TBR':
            return 'fas fa-truck tire-truck-icon';
        case '2 Wheeler':
            return 'fas fa-motorcycle tire-bike-icon';
        case '3 Wheeler':
            return 'fas fa-taxi tire-auto-icon';
        case 'Farm':
            return 'fas fa-tractor tire-farm-icon';
        case 'Industrial':
            return 'fas fa-industry tire-industrial-icon';
        case 'Earthmover':
            return 'fas fa-hard-hat tire-construction-icon';
        case 'LCV':
        case 'SCV':
            return 'fas fa-shipping-fast tire-commercial-icon';
        default:
            return 'fas fa-tire tire-default-icon';
    }
}

export function updatePagination(results, limit) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(results.estimated_total_hits / limit);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    const paginationList = pagination.querySelector('.pagination');
    paginationList.innerHTML = '';
    
    // Previous button
    const prevDisabled = state.currentPage === 0 ? 'disabled' : '';
    paginationList.innerHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" onclick="window.performSearch(${state.currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(0, state.currentPage - 2);
    const endPage = Math.min(totalPages - 1, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const active = i === state.currentPage ? 'active' : '';
        paginationList.innerHTML += `
            <li class="page-item ${active}">
                <a class="page-link" href="#" onclick="window.performSearch(${i})">${i + 1}</a>
            </li>
        `;
    }
    
    // Next button
    const nextDisabled = state.currentPage >= totalPages - 1 ? 'disabled' : '';
    paginationList.innerHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" onclick="window.performSearch(${state.currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.style.display = 'block';
}

export function copyProductInfo(productId) {
    // Find the product in current results and copy its information
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        if (card.onclick.toString().includes(productId)) {
            const productName = card.querySelector('.product-name').textContent;
            const productSubtitle = card.querySelector('.product-subtitle').textContent;
            const specs = Array.from(card.querySelectorAll('.spec-item')).map(item => {
                const label = item.querySelector('.spec-label').textContent;
                const value = item.querySelector('.spec-value').textContent;
                return `${label} ${value}`;
            }).join(', ');
            
            const productInfo = `${productName}\n${productSubtitle}\n${specs}`;
            
            navigator.clipboard.writeText(productInfo).then(() => {
                const { showAlert } = window.modules?.ui || { showAlert: window.showAlert };
                showAlert('Product information copied to clipboard!', 'success');
            }).catch(() => {
                const { showAlert } = window.modules?.ui || { showAlert: window.showAlert };
                showAlert('Failed to copy product information', 'warning');
            });
        }
    });
}
