// Apollo Tire Search UI JavaScript

// Get API URL from window configuration or default to localhost
const API_BASE_URL = window.APOLLO_API_URL || 'http://localhost:8001';
let currentPage = 0;
let currentQuery = '';
let currentFilters = '';
let similarProductsCache = {};
let selectedFacets = {}; // Track selected facets

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Check system health
        await checkSystemHealth();
        
        // Load filter options
        await loadFilterOptions();
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default interface to faceted search
        updateSearchInterface();
        
        console.log('🚀 Apollo Tire Search UI initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        showAlert('Failed to initialize application. Please check if the API server is running.', 'danger');
    }
}

async function checkSystemHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const health = await response.json();
        
        const statusElement = document.getElementById('health-status');
        if (health.status === 'healthy') {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> System Healthy';
            statusElement.className = 'badge bg-success';
        } else {
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System Issues';
            statusElement.className = 'badge bg-warning';
        }
    } catch (error) {
        const statusElement = document.getElementById('health-status');
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> System Offline';
        statusElement.className = 'badge bg-danger';
        throw error;
    }
}

async function loadFilterOptions() {
    try {
        // Load groups
        const groupsResponse = await fetch(`${API_BASE_URL}/search/filters/groups`);
        const groupsData = await groupsResponse.json();
        populateFilterSelect('groupFilter', groupsData.groups);
        
        // Load record types
        const recordTypesResponse = await fetch(`${API_BASE_URL}/search/filters/record-types`);
        const recordTypesData = await recordTypesResponse.json();
        populateFilterSelect('recordTypeFilter', recordTypesData.record_types);
        
        // Load ply ratings
        const plyRatingsResponse = await fetch(`${API_BASE_URL}/search/filters/ply-ratings`);
        const plyRatingsData = await plyRatingsResponse.json();
        populateFilterSelect('plyRatingFilter', plyRatingsData.ply_ratings);
        
    } catch (error) {
        console.error('Failed to load filter options:', error);
    }
}

function populateFilterSelect(selectId, options) {
    const select = document.getElementById(selectId);
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

function setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchQuery');
    let searchTimeout;
    let selectedSuggestionIndex = -1;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        selectedSuggestionIndex = -1; // Reset selection when typing
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                getSuggestions(query);
            }, 300);
        } else {
            hideSuggestions();
        }
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const suggestionsContainer = document.getElementById('suggestions');
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (suggestions.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
                updateSuggestionSelection(suggestions, selectedSuggestionIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                updateSuggestionSelection(suggestions, selectedSuggestionIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                    const selectedText = suggestions[selectedSuggestionIndex].textContent.trim();
                    selectSuggestion(selectedText);
                } else {
                    console.log('🔍 Enter key pressed, triggering search');
                    hideSuggestions();
                    performSearch();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                hideSuggestions();
                selectedSuggestionIndex = -1;
                break;
        }
    });
    
    // Click outside to hide suggestions
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input-wrapper')) {
            hideSuggestions();
            selectedSuggestionIndex = -1;
        }
    });
    
    // Filter change listeners
    ['groupFilter', 'recordTypeFilter', 'plyRatingFilter', 'customFilter', 'sortField'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                // Sync selected facets when dropdowns change
                if (id === 'groupFilter') {
                    if (element.value) {
                        selectedFacets['group'] = element.value;
                    } else {
                        delete selectedFacets['group'];
                    }
                } else if (id === 'recordTypeFilter') {
                    if (element.value) {
                        selectedFacets['record_type'] = element.value;
                    } else {
                        delete selectedFacets['record_type'];
                    }
                } else if (id === 'plyRatingFilter') {
                    if (element.value) {
                        selectedFacets['ply_rating'] = element.value;
                    } else {
                        delete selectedFacets['ply_rating'];
                    }
                }
                
                // Update selected facets display
                updateSelectedFacetsDisplay();
                
                if (currentQuery || getCurrentFilters()) {
                    performSearch();
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

function updateSuggestionSelection(suggestions, selectedIndex) {
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

async function getSuggestions(query) {
    try {
        console.log('🔍 Getting suggestions for:', query);
        const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=5`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('💡 Received suggestions:', data.suggestions);
        
        showSuggestions(data.suggestions || []);
    } catch (error) {
        console.error('❌ Failed to get suggestions:', error);
        hideSuggestions();
    }
}

function showSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');
    
    if (suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    
    // Create suggestion items with enhanced styling
    suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => 
        `<div class="suggestion-item" onclick="selectSuggestion('${suggestion.replace(/'/g, "\\'")}')">
            ${suggestion}
        </div>`
    ).join('');
    
    // Ensure proper positioning by forcing a reflow
    suggestionsContainer.style.display = 'block';
    
    // Position debug logging
    console.log('💡 Showing suggestions:', suggestions);
    console.log('📍 Suggestions container position:', {
        display: suggestionsContainer.style.display,
        position: window.getComputedStyle(suggestionsContainer).position,
        top: window.getComputedStyle(suggestionsContainer).top,
        left: window.getComputedStyle(suggestionsContainer).left
    });
}

function hideSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
        console.log('💭 Hiding suggestions');
    }
}

function selectSuggestion(suggestion) {
    console.log('✅ Selected suggestion:', suggestion);
    document.getElementById('searchQuery').value = suggestion;
    hideSuggestions();
    performSearch();
}

function updateSearchInterface() {
    const searchType = document.getElementById('searchType').value;
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

function getCurrentFilters() {
    const group = document.getElementById('groupFilter').value;
    const recordType = document.getElementById('recordTypeFilter').value;
    const plyRating = document.getElementById('plyRatingFilter').value;
    const custom = document.getElementById('customFilter').value.trim();
    
    let filters = [];
    
    if (group) filters.push(`group = '${group}'`);
    if (recordType) filters.push(`record_type = '${recordType}'`);
    if (plyRating) filters.push(`ply_rating = '${plyRating}'`);
    
    let filterString = filters.join(' AND ');
    
    if (custom) {
        filterString = custom; // Custom filter overrides others
    }
    
    return filterString;
}

async function performSearch(page = 0) {
    console.log('🔍 performSearch called with page:', page);
    
    const query = document.getElementById('searchQuery').value.trim();
    const searchType = document.getElementById('searchType').value;
    const limit = parseInt(document.getElementById('limitSelect').value);
    const offset = page * limit;
    const filters = getCurrentFilters();
    const sort = document.getElementById('sortField').value;
    const highlight = document.getElementById('highlightResults').checked;
    const showMatches = document.getElementById('showMatchPositions').checked;
    
    console.log('Search parameters:', { query, searchType, limit, offset, filters, sort });
    
    currentQuery = query;
    currentFilters = filters;
    currentPage = page;
    
    // Hide welcome card if it exists
    const welcomeCard = document.getElementById('welcomeCard');
    if (welcomeCard) {
        welcomeCard.style.display = 'none';
    }
    
    // Show loading
    showLoading();
    
    try {
        let searchResults;
        
        switch (searchType) {
            case 'faceted':
            case 'browse':
                searchResults = await performFacetedSearch(query, filters, limit, offset, sort);
                break;
            case 'highlighted':
                searchResults = await performHighlightedSearch(query, filters, limit, offset, sort, true);
                break;
            case 'cropped':
                searchResults = await performCroppedSearch(query, filters, limit, offset, sort);
                break;
            default:
                searchResults = await performBasicSearch(query, filters, limit, offset, sort, highlight, showMatches);
        }
        
        displaySearchResults(searchResults);
        updatePagination(searchResults, limit);
        
        // Load similar products for first result
        if (searchResults.hits && searchResults.hits.length > 0) {
            loadSimilarProducts(searchResults.hits[0].id);
        }
        
        console.log('✅ Search completed successfully');
        
    } catch (error) {
        console.error('❌ Search failed:', error);
        showAlert('Search request failed. Please try again.', 'danger');
        hideLoading();
    }
}

async function performBasicSearch(query, filters, limit, offset, sort, highlight, showMatches) {
    const params = new URLSearchParams({
        q: query,
        limit: limit,
        offset: offset
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    if (highlight) {
        params.append('highlight', 'true');
        params.append('attributes_to_highlight', 'material,pattern_model,title');
    }
    if (showMatches) params.append('show_matches_position', 'true');
    
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    return await response.json();
}

async function performFacetedSearch(query, filters, limit, offset, sort) {
    const facetLimit = limit === 0 ? 0 : limit;
    const params = new URLSearchParams({
        q: query,
        facets: 'group,record_type,ply_rating',
        limit: facetLimit,
        offset: offset
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    
    const response = await fetch(`${API_BASE_URL}/search/facets?${params}`);
    const data = await response.json();
    
    // Display facets
    displayFacets(data.facet_distribution);
    
    return data;
}

async function performHighlightedSearch(query, filters, limit, offset, sort, forceHighlight = false) {
    const params = new URLSearchParams({
        q: query,
        limit: limit,
        offset: offset,
        highlight: 'true',
        attributes_to_highlight: 'material,pattern_model,title,size'
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    return await response.json();
}

async function performCroppedSearch(query, filters, limit, offset, sort) {
    const params = new URLSearchParams({
        q: query,
        limit: limit,
        offset: offset,
        attributes_to_retrieve: 'id,material,mpn,size,group,record_type,ply_rating,pattern_model',
        attributes_to_crop: 'material',
        crop_length: '50'
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    return await response.json();
}

function displaySearchResults(results) {
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

function createProductCard(product) {
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

function extractProductName(material) {
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
            name = 'Apollo Tire Product';
        }
    }
    
    return name.trim();
}

function getTireIcon(recordType, group) {
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

function copyProductInfo(productId) {
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
                showAlert('Product information copied to clipboard!', 'success');
            }).catch(() => {
                showAlert('Failed to copy product information', 'warning');
            });
        }
    });
}

function displayFacets(facetDistribution) {
    const container = document.getElementById('facetsContent');
    
    if (!facetDistribution || Object.keys(facetDistribution).length === 0) {
        container.innerHTML = '<p class="text-muted">No facets available</p>';
        return;
    }
    
    container.innerHTML = Object.entries(facetDistribution).map(([facetName, values]) => {
        const items = Object.entries(values).map(([value, count]) => 
            `<div class="facet-item" onclick="applyFacetFilter('${facetName}', '${value}')">
                <span>${value}</span>
                <span class="facet-count">${count}</span>
            </div>`
        ).join('');
        
        return `
            <div class="facet-group">
                <div class="facet-title">${facetName.replace('_', ' ').toUpperCase()}</div>
                ${items}
            </div>
        `;
    }).join('');
}

function applyFacetFilter(facetName, value) {
    // Add to selected facets
    selectedFacets[facetName] = value;
    
    // Update the appropriate filter select
    const filterMap = {
        'group': 'groupFilter',
        'record_type': 'recordTypeFilter', 
        'ply_rating': 'plyRatingFilter'
    };
    
    const selectId = filterMap[facetName];
    if (selectId) {
        document.getElementById(selectId).value = value;
    }
    
    // Update selected facets display
    updateSelectedFacetsDisplay();
    
    // Perform search
    performSearch();
}

// Add selected facets management functions
function updateSelectedFacetsDisplay() {
    const container = document.getElementById('selectedFacetsContainer');
    const tagsContainer = document.getElementById('selectedFacetsTags');
    
    if (Object.keys(selectedFacets).length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const tags = Object.entries(selectedFacets).map(([facetName, value]) => {
        const displayName = facetName.replace('_', ' ').toUpperCase();
        return `
            <div class="selected-facet-tag">
                <span class="selected-facet-label">${displayName}:</span>
                <span class="selected-facet-value">${value}</span>
                <button class="remove-facet" onclick="removeFacetFilter('${facetName}')" title="Remove filter">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    tagsContainer.innerHTML = tags;
}

function removeFacetFilter(facetName) {
    console.log('Removing facet:', facetName);
    console.log('Before removal:', selectedFacets);
    
    // Remove from selected facets
    delete selectedFacets[facetName];
    
    console.log('After removal:', selectedFacets);
    
    // Clear the corresponding filter select
    const filterMap = {
        'group': 'groupFilter',
        'record_type': 'recordTypeFilter', 
        'ply_rating': 'plyRatingFilter'
    };
    
    const selectId = filterMap[facetName];
    if (selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            selectElement.value = '';
            console.log('Cleared dropdown:', selectId);
        }
    }
    
    // Update display
    updateSelectedFacetsDisplay();
    
    // Perform search
    performSearch();
}

function clearAllFilters() {
    console.log('Clearing all filters');
    console.log('Before clear:', selectedFacets);
    
    // Clear selected facets
    selectedFacets = {};
    
    // Clear all filter selects
    document.getElementById('groupFilter').value = '';
    document.getElementById('recordTypeFilter').value = '';
    document.getElementById('plyRatingFilter').value = '';
    document.getElementById('customFilter').value = '';
    
    console.log('After clear:', selectedFacets);
    console.log('Cleared all dropdowns');
    
    // Update display
    updateSelectedFacetsDisplay();
    
    // Perform search
    performSearch();
}

async function loadSimilarProducts(productId) {
    if (similarProductsCache[productId]) {
        displaySimilarProducts(similarProductsCache[productId]);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search/similar/${productId}?limit=3`);
        const data = await response.json();
        
        similarProductsCache[productId] = data;
        displaySimilarProducts(data);
    } catch (error) {
        console.error('Failed to load similar products:', error);
    }
}

function displaySimilarProducts(data) {
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

function updatePagination(results, limit) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(results.estimated_total_hits / limit);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    const paginationList = pagination.querySelector('.pagination');
    paginationList.innerHTML = '';
    
    // Previous button
    const prevDisabled = currentPage === 0 ? 'disabled' : '';
    paginationList.innerHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" onclick="performSearch(${currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const active = i === currentPage ? 'active' : '';
        paginationList.innerHTML += `
            <li class="page-item ${active}">
                <a class="page-link" href="#" onclick="performSearch(${i})">${i + 1}</a>
            </li>
        `;
    }
    
    // Next button
    const nextDisabled = currentPage >= totalPages - 1 ? 'disabled' : '';
    paginationList.innerHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" onclick="performSearch(${currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.style.display = 'block';
}

// Utility functions
function loadSampleSearch(query) {
    console.log('🎯 Loading sample search:', query);
    document.getElementById('searchQuery').value = query;
    document.getElementById('searchType').value = 'faceted';
    updateSearchInterface();
    performSearch();
}

function browseMode() {
    console.log('🔍 Entering browse mode');
    
    // Clear search query to show all results
    document.getElementById('searchQuery').value = '';
    
    // Set to browse mode
    document.getElementById('searchType').value = 'browse';
    
    // Set to show all results for browsing
    document.getElementById('limitSelect').value = '1000';
    
    // Clear all filters for a full browse experience
    clearAllFilters();
    
    // Update the interface to show facets panel
    updateSearchInterface();
    
    // Perform the search to show all categories
    performSearch();
}

async function showAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/analytics/stats`);
        const data = await response.json();
        
        displayAnalyticsModal(data);
    } catch (error) {
        console.error('Failed to load analytics:', error);
        showAlert('Failed to load analytics data', 'danger');
    }
}

function displayAnalyticsModal(data) {
    const content = document.getElementById('analyticsContent');
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="analytics-metric">
                    <h4>${data.index_stats.number_of_documents}</h4>
                    <p>Total Products</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="analytics-metric">
                    <h4>${Object.keys(data.facet_analytics.groups).length}</h4>
                    <p>Product Groups</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="analytics-metric">
                    <h4>${Object.keys(data.facet_analytics.record_types).length}</h4>
                    <p>Record Types</p>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <h6>Top Product Groups</h6>
                <div class="list-group">
                    ${data.top_groups.slice(0, 5).map(([group, count]) => `
                        <div class="list-group-item d-flex justify-content-between">
                            <span>${group}</span>
                            <span class="badge bg-primary">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="col-md-6">
                <h6>Record Type Distribution</h6>
                <div class="list-group">
                    ${data.top_record_types.map(([type, count]) => `
                        <div class="list-group-item d-flex justify-content-between">
                            <span>${type}</span>
                            <span class="badge bg-secondary">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
    modal.show();
}

function showProductDetails(productId) {
    // In a real application, this would show a detailed product view
    console.log('Show product details for:', productId);
    loadSimilarProducts(productId);
}

function findSimilarProducts(productId) {
    loadSimilarProducts(productId);
    document.getElementById('similarProductsSection').scrollIntoView({ behavior: 'smooth' });
}

function searchForProduct(productId) {
    document.getElementById('searchQuery').value = productId;
    performSearch();
}

function showLoading() {
    console.log('⏳ Showing loading state');
    const container = document.getElementById('searchResults');
    if (!container) {
        console.error('❌ Search results container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Searching...</span>
        </div>
    `;
}function hideLoading() {
    // Loading will be hidden when results are displayed
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
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

// Export functions for global access
window.performSearch = performSearch;
window.loadSampleSearch = loadSampleSearch;
window.browseMode = browseMode;
window.showAnalytics = showAnalytics;
window.selectSuggestion = selectSuggestion;
window.applyFacetFilter = applyFacetFilter;
window.showProductDetails = showProductDetails;
window.findSimilarProducts = findSimilarProducts;
window.searchForProduct = searchForProduct;

console.log('🚀 All global functions exported successfully');