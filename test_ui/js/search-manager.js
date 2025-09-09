// Search Manager Module
// Handles all search functionality including faceted search, suggestions, and results

class SearchManager {
    constructor(apiConfig) {
        console.log('🔧 SearchManager constructor called with apiConfig:', apiConfig);
        this.apiConfig = apiConfig;
        this.currentPage = 0;
        this.currentQuery = '';
        this.currentFilters = '';
        this.selectedFacets = {};
        this.similarProductsCache = {};
        console.log('✅ SearchManager initialized successfully');
    }

    // Basic search functionality
    async performBasicSearch(query, filters, limit, offset, sort, highlightEnabled = false, showMatches) {
        console.log('🔧 performBasicSearch called with:', { query, filters, limit, offset, sort, highlightEnabled, showMatches });
        
        try {
            const searchParams = new URLSearchParams({
                q: query,
                limit: limit || 20,
                offset: offset || 0
            });
            
            console.log('🔧 Initial search params:', searchParams.toString());

            if (sort) {
                searchParams.append('sort', sort);
                console.log('🔧 Added sort:', sort);
            }

            if (filters) {
                console.log('🔧 Processing filters:', filters, typeof filters);
                // Handle both string and object filters
                if (typeof filters === 'string' && filters.trim()) {
                    searchParams.append('filters', filters);
                    console.log('🔧 Added string filters:', filters);
                } else if (typeof filters === 'object') {
                    Object.entries(filters).forEach(([key, value]) => {
                        if (Array.isArray(value) && value.length > 0) {
                            searchParams.append(`filter`, `${key} IN [${value.map(v => `"${v}"`).join(', ')}]`);
                        }
                    });
                    console.log('🔧 Added object filters');
                }
            }

            // Add highlighting if enabled
            if (highlightEnabled) {
                searchParams.append('attributesToHighlight', 'title,pattern_model,brand,category');
                if (showMatches) {
                    searchParams.append('showMatchesPosition', 'true');
                }
                console.log('🔧 Added highlighting');
            }

            const endpoint = `${this.apiConfig.getApiUrl()}/search?${searchParams}`;
            console.log('🔍 Making basic search request to:', endpoint);
            console.log('🔍 API config check:', this.apiConfig.getApiUrl());

            console.log('🔧 About to call fetch...');
            const response = await fetch(endpoint);
            console.log('🔧 Fetch completed, response:', response);
            console.log('🔧 Response status:', response.status, response.statusText);
            console.log('🔧 Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            }

            console.log('🔧 About to parse JSON...');
            const result = await response.json();
            console.log('🔧 JSON parsed successfully:', result);
            console.log('✅ Basic search completed:', {
                hits: result.hits?.length || 0,
                query: result.query,
                processingTime: result.processing_time_ms
            });

            return result;
        } catch (error) {
            console.error('❌ Basic search failed:', error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            throw error;
        }
    }

    // Display methods for UI rendering
    displayFacets(facets) {
        console.log('🎛️ Displaying facets:', facets);
        
        const facetsContainer = document.getElementById('facetsContent');
        if (!facetsContainer) {
            console.log('ℹ️ Facets container not found, skipping facet display');
            return;
        }
        
        if (!facets || Object.keys(facets).length === 0) {
            facetsContainer.innerHTML = '<p class="text-muted">No filters available</p>';
            return;
        }
        
        let html = '<h6>Filter Results</h6>';
        
        Object.entries(facets).forEach(([field, values]) => {
            if (values && Object.keys(values).length > 0) {
                html += `
                    <div class="facet-group mb-3">
                        <h6 class="facet-title">${this.formatFieldName(field)}</h6>
                        <div class="facet-options">
                `;
                
                Object.entries(values).forEach(([value, count]) => {
                    const isSelected = this.isFilterSelected(field, value);
                    html += `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" 
                                   id="facet-${field}-${value}" 
                                   ${isSelected ? 'checked' : ''}
                                   onchange="window.apolloApp.filterManager.toggleFilter('${field}', '${value}', this.checked)">
                            <label class="form-check-label" for="facet-${field}-${value}">
                                ${value} <span class="badge bg-light text-dark">${count}</span>
                            </label>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        facetsContainer.innerHTML = html;
    }

    formatFieldName(field) {
        return field
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    isFilterSelected(field, value) {
        // Check if this filter is currently selected
        if (this.selectedFacets && this.selectedFacets[field]) {
            return this.selectedFacets[field] === value;
        }
        
        // Also check current filter dropdowns
        const filterMap = {
            'group': 'groupFilter',
            'record_type': 'recordTypeFilter', 
            'ply_rating': 'plyRatingFilter'
        };
        
        const selectId = filterMap[field];
        if (selectId) {
            const selectElement = document.getElementById(selectId);
            return selectElement && selectElement.value === value;
        }
        
        return false;
    }

    // Faceted search functionality
    async performFacetedSearch(query, filters, limit, offset, sort) {
        console.log('🔧 performFacetedSearch called with:', { query, filters, limit, offset, sort });
        
        const facetLimit = limit === 0 ? 0 : limit;
        const params = new URLSearchParams({
            q: query,
            facets: 'group,record_type,ply_rating',
            limit: facetLimit,
            offset: offset
        });
        
        if (filters) {
            params.append('filters', filters);
            console.log('🔧 Added filters to faceted search:', filters);
        }
        if (sort) {
            params.append('sort', sort);
            console.log('🔧 Added sort to faceted search:', sort);
        }
        
        const endpoint = `${this.apiConfig.getApiUrl()}/search/facets?${params}`;
        console.log('🔧 Faceted search endpoint:', endpoint);
        
        try {
            console.log('🔧 Making faceted search request...');
            const response = await fetch(endpoint);
            console.log('🔧 Faceted search response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('🔧 Parsing faceted search JSON...');
            const data = await response.json();
            console.log('🔧 Faceted search data received:', data);
            
            // Display facets
            console.log('🔧 Displaying facets...');
            this.displayFacets(data.facet_distribution);
            console.log('🔧 Facets displayed');
            
            return data;
        } catch (error) {
            console.error('❌ Faceted search failed:', error);
            throw error;
        }
    }

    // Highlighted search functionality
    async performHighlightedSearch(query, filters, limit, offset, sort, forceHighlight = false) {
        const params = new URLSearchParams({
            q: query,
            limit: limit,
            offset: offset,
            highlight: 'true',
            attributes_to_highlight: 'material,pattern_model,title,size'
        });
        
        if (filters) params.append('filters', filters);
        if (sort) params.append('sort', sort);
        
        const response = await fetch(`${this.apiConfig.getApiUrl()}/search?${params}`);
        return await response.json();
    }

    // Cropped search functionality
    async performCroppedSearch(query, filters, limit, offset, sort) {
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
        
        const response = await fetch(`${this.apiConfig.getApiUrl()}/search?${params}`);
        return await response.json();
    }

    // Main search orchestrator
    async performSearch(page = 0) {
        console.log('🔍 performSearch called with page:', page);
        console.log('🔍 Window location:', window.location.href);
        console.log('🔍 API config:', this.apiConfig.getApiUrl());
        
        try {
            const query = document.getElementById('searchQuery')?.value?.trim() || '';
            const searchType = document.getElementById('searchType')?.value || 'faceted';
            const limit = parseInt(document.getElementById('limitSelect')?.value || '20');
            const offset = page * limit;
            const filters = this.getCurrentFilters();
            const sort = document.getElementById('sortField')?.value || '';
            const highlight = document.getElementById('highlightResults')?.checked || false;
            const showMatches = document.getElementById('showMatchPositions')?.checked || false;
            
            console.log('🔍 Search parameters:', { query, searchType, limit, offset, filters, sort, highlight, showMatches });
            
            // Check if required elements exist
            const requiredElements = {
                searchQuery: document.getElementById('searchQuery'),
                searchResults: document.getElementById('searchResults'),
                searchType: document.getElementById('searchType')
            };
            
            console.log('🔍 Element availability:', Object.entries(requiredElements).map(([name, element]) => 
                `${name}: ${element ? '✅' : '❌'}`
            ).join(', '));
            
            this.currentQuery = query;
            this.currentFilters = filters;
            this.currentPage = page;
            
            // Hide welcome card if it exists
            const welcomeCard = document.getElementById('welcomeCard');
            if (welcomeCard) {
                welcomeCard.style.display = 'none';
                console.log('🔍 Welcome card hidden');
            }
            
            // Show loading
            this.showLoading();
            console.log('🔧 Loading state shown');
            
            let searchResults;
            console.log('🔧 About to determine search type and call appropriate method...');
            
            switch (searchType) {
                case 'faceted':
                case 'browse':
                    console.log('🔧 Calling performFacetedSearch...');
                    searchResults = await this.performFacetedSearch(query, filters, limit, offset, sort);
                    console.log('🔧 performFacetedSearch completed:', searchResults);
                    break;
                case 'highlighted':
                    console.log('🔧 Calling performHighlightedSearch...');
                    searchResults = await this.performHighlightedSearch(query, filters, limit, offset, sort, true);
                    console.log('🔧 performHighlightedSearch completed:', searchResults);
                    break;
                case 'cropped':
                    console.log('🔧 Calling performCroppedSearch...');
                    searchResults = await this.performCroppedSearch(query, filters, limit, offset, sort);
                    console.log('🔧 performCroppedSearch completed:', searchResults);
                    break;
                default:
                    console.log('🔧 Calling performBasicSearch...');
                    searchResults = await this.performBasicSearch(query, filters, limit, offset, sort, highlight, showMatches);
                    console.log('🔧 performBasicSearch completed:', searchResults);
            }
            
            console.log('🔧 Search method completed, about to display results...');
            console.log('🔧 Search results structure:', {
                hasResults: !!searchResults,
                hasHits: !!(searchResults && searchResults.hits),
                hitsCount: searchResults && searchResults.hits ? searchResults.hits.length : 'N/A',
                totalHits: searchResults ? searchResults.estimated_total_hits : 'N/A'
            });
            
            this.displaySearchResults(searchResults);
            console.log('🔧 displaySearchResults completed');
            
            this.updatePagination(searchResults, limit);
            console.log('🔧 updatePagination completed');
            
            this.updateSelectedFacetsDisplay();
            console.log('🔧 updateSelectedFacetsDisplay completed');
            
            // Load similar products for first result
            if (searchResults.hits && searchResults.hits.length > 0) {
                console.log('🔧 Loading similar products...');
                this.loadSimilarProducts(searchResults.hits[0].id);
            }

            console.log('✅ Search completed successfully');
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                apiUrl: this.apiConfig.getApiUrl()
            });
            
            // Show error message to user
            const resultsContainer = document.getElementById('searchResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-triangle"></i> Search Error</h5>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <p><strong>API URL:</strong> ${this.apiConfig.getApiUrl()}</p>
                        <details>
                            <summary>Technical Details</summary>
                            <pre>${error.stack}</pre>
                        </details>
                    </div>
                `;
            }
            
            this.showAlert(`Search request failed: ${error.message}. Please check the console for details.`, 'danger');
            this.hideLoading();
        }
    }

    // Get suggestions for autocomplete
    async getSuggestions(query) {
        try {
            console.log('🔍 Getting suggestions for:', query);
            const response = await fetch(`${this.apiConfig.getApiUrl()}/search/suggestions?q=${encodeURIComponent(query)}&limit=5`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('💡 Received suggestions:', data.suggestions);
            
            return data.suggestions || [];
        } catch (error) {
            console.error('❌ Failed to get suggestions:', error);
            return [];
        }
    }

    // Load similar products
    async loadSimilarProducts(productId) {
        if (this.similarProductsCache[productId]) {
            this.displaySimilarProducts(this.similarProductsCache[productId]);
            return;
        }
        
        try {
            const response = await fetch(`${this.apiConfig.getApiUrl()}/search/similar/${productId}?limit=3`);
            const data = await response.json();
            
            this.similarProductsCache[productId] = data;
            this.displaySimilarProducts(data);
        } catch (error) {
            console.error('Failed to load similar products:', error);
        }
    }

    // Filter management
    getCurrentFilters() {
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

    // Facet management
    applyFacetFilter(facetName, value) {
        // Add to selected facets
        this.selectedFacets[facetName] = value;
        
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
        this.updateSelectedFacetsDisplay();
        
        // Perform search
        this.performSearch();
    }

    removeFacetFilter(facetName) {
        console.log('Removing facet:', facetName);
        console.log('Before removal:', this.selectedFacets);
        
        // Remove from selected facets
        delete this.selectedFacets[facetName];
        
        console.log('After removal:', this.selectedFacets);
        
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
        this.updateSelectedFacetsDisplay();
        
        // Perform search
        this.performSearch();
    }

    clearAllFilters() {
        console.log('Clearing all filters');
        console.log('Before clear:', this.selectedFacets);
        
        // Clear selected facets
        this.selectedFacets = {};
        
        // Clear all filter selects
        document.getElementById('groupFilter').value = '';
        document.getElementById('recordTypeFilter').value = '';
        document.getElementById('plyRatingFilter').value = '';
        document.getElementById('customFilter').value = '';
        
        console.log('After clear:', this.selectedFacets);
        console.log('Cleared all dropdowns');
        
        // Update display
        this.updateSelectedFacetsDisplay();
        
        // Perform search
        this.performSearch();
    }

    // Display methods (to be continued in ui-renderer.js)
    showLoading() {
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
    }

    hideLoading() {
        // Loading will be hidden when results are displayed
    }

    showAlert(message, type = 'info') {
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

    // Display methods for UI rendering
    displaySearchResults(results) {
        console.log('📊 displaySearchResults called with:', results);
        console.log('📊 Results type:', typeof results);
        console.log('📊 Results keys:', Object.keys(results || {}));
        console.log('📊 Hits array:', results?.hits);
        console.log('📊 Hits length:', results?.hits?.length);
        
        const container = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        const processingTime = document.getElementById('processingTime');
        
        console.log('📊 DOM elements found:', {
            container: !!container,
            resultsCount: !!resultsCount,
            processingTime: !!processingTime
        });
        
        if (!container || !resultsCount || !processingTime) {
            console.error('❌ Required DOM elements not found');
            console.error('❌ Missing elements:', {
                container: !container ? 'searchResults' : null,
                resultsCount: !resultsCount ? 'resultsCount' : null,
                processingTime: !processingTime ? 'processingTime' : null
            });
            return;
        }
        
        console.log('📊 Setting results count and processing time...');
        resultsCount.textContent = results.estimated_total_hits || results.hits.length;
        processingTime.textContent = `${results.processing_time_ms}ms`;
        
        if (results.hits.length === 0) {
            console.log('📊 No results found, showing empty state');
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
        
        console.log('📊 About to create product cards for', results.hits.length, 'results');
        console.log('📊 First result sample:', results.hits[0]);
        
        try {
            const cards = results.hits.map((hit, index) => {
                console.log(`📊 Creating card ${index + 1} for product:`, hit.id);
                return this.createProductCard(hit);
            });
            console.log('📊 All cards created successfully, count:', cards.length);
            
            container.innerHTML = cards.join('');
            console.log('📊 Results HTML set successfully');
            
        } catch (error) {
            console.error('❌ Error creating product cards:', error);
            console.error('❌ Error stack:', error.stack);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Error Displaying Results</h5>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }

    createProductCard(product) {
        console.log('🎨 createProductCard called with:', product);
        console.log('🎨 Product ID:', product.id);
        console.log('🎨 Product title:', product.title);
        console.log('🎨 Product material:', product.material);
        
        try {
            const tags = product.tags ? product.tags.map(tag => 
                `<span class="product-tag">${tag}</span>`
            ).join('') : '';
            
            const highlighted = product._formatted || product;
            
            // Extract clean product name from material or title
            const productName = this.extractProductName(highlighted.material || highlighted.title || product.mpn || 'Unknown Product');
            const productSize = highlighted.size || 'Size not specified';
            const productPattern = highlighted.pattern_model || 'Pattern not available';
            
            console.log('🎨 Extracted data:', { productName, productSize, productPattern });
            
            // Determine tire type icon
            const tireIcon = this.getTireIcon(product.record_type, product.group);
            
            console.log('🎨 About to generate HTML for product:', product.id);
            
            const cardHtml = `
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
            
            console.log('🎨 HTML generated successfully for:', product.id);
            return cardHtml;
            
        } catch (error) {
            console.error('❌ Error in createProductCard for product:', product.id, error);
            console.error('❌ Error stack:', error.stack);
            return `<div class="alert alert-danger">Error creating card for product ${product.id}: ${error.message}</div>`;
        }
    }

    extractProductName(material) {
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

    getTireIcon(recordType, group) {
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

    displaySimilarProducts(data) {
        console.log('📊 Displaying similar products:', data);
        const container = document.getElementById('similarProductsContent');
        if (!container) return;
        
        if (!data.hits || data.hits.length === 0) {
            container.innerHTML = '<p class="text-muted">No similar products found.</p>';
            return;
        }
        
        let html = '<div class="row">';
        data.hits.forEach(product => {
            html += `
                <div class="col-md-6 mb-2">
                    <div class="card card-body p-2">
                        <h6 class="mb-1">${product.title || product.pattern_model || 'Unknown'}</h6>
                        <small class="text-muted">${product.size || 'N/A'} - ${product.brand || 'Unknown'}</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
        document.getElementById('similarProductsSection').style.display = 'block';
    }

    updateSelectedFacetsDisplay() {
        console.log('📊 Updating selected facets display');
        const container = document.getElementById('selectedFacetsContainer');
        const tagsContainer = document.getElementById('selectedFacetsTags');
        
        if (!container || !tagsContainer) return;
        
        // Get current filter values
        const filters = {
            group: document.getElementById('groupFilter')?.value,
            record_type: document.getElementById('recordTypeFilter')?.value,
            ply_rating: document.getElementById('plyRatingFilter')?.value
        };
        
        const activeFacets = Object.entries(filters).filter(([key, value]) => value);
        
        if (activeFacets.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        let html = '';
        activeFacets.forEach(([field, value]) => {
            html += `
                <span class="badge bg-primary me-1">
                    ${this.formatFieldName(field)}: ${value}
                    <button type="button" class="btn-close btn-close-white ms-1" 
                            onclick="removeFacetFilter('${field}')"
                            style="font-size: 0.65em;"></button>
                </span>
            `;
        });
        
        tagsContainer.innerHTML = html;
        container.style.display = 'block';
    }

    updatePagination(results, limit) {
        console.log('📊 Updating pagination');
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        
        const totalHits = results.estimated_total_hits || results.hits.length;
        const currentPage = this.currentPage || 0;
        const totalPages = Math.ceil(totalHits / limit);
        
        // Update results count display
        const resultsCountElement = document.getElementById('resultsCount');
        if (resultsCountElement) {
            resultsCountElement.textContent = totalHits;
        }
        
        // Update processing time display
        const processingTimeElement = document.getElementById('processingTime');
        if (processingTimeElement && results.processing_time_ms) {
            processingTimeElement.textContent = `(${results.processing_time_ms}ms)`;
        }
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        let html = '';
        const maxVisiblePages = 5;
        const startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages);
        
        // Previous button
        html += `
            <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="performSearch(${currentPage - 1}); return false;">
                    Previous
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = startPage; i < endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="performSearch(${i}); return false;">
                        ${i + 1}
                    </a>
                </li>
            `;
        }
        
        // Next button
        html += `
            <li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="performSearch(${currentPage + 1}); return false;">
                    Next
                </a>
            </li>
        `;
        
        paginationContainer.querySelector('.pagination').innerHTML = html;
        paginationContainer.style.display = 'block';
    }

    showProductDetails(productId) {
        console.log('Showing product details for:', productId);
        
        // Find the product in current search results
        const searchResults = document.getElementById('searchResults');
        const productCard = searchResults.querySelector(`[data-product-id="${productId}"]`);
        
        if (productCard) {
            // Simple implementation - just scroll to the product and highlight it
            productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productCard.style.border = '2px solid #007bff';
            productCard.style.boxShadow = '0 0 10px rgba(0,123,255,0.3)';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                productCard.style.border = '';
                productCard.style.boxShadow = '';
            }, 3000);
        }
    }
}

// Export for global use
window.SearchManager = SearchManager;
