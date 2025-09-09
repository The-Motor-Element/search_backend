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

            const endpoint = `${this.apiConfig.getEndpoint('search')}?${searchParams}`;
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
        
        const endpoint = this.apiConfig.getEndpoint(`search/facets?${params}`);
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
        
        const response = await fetch(this.apiConfig.getEndpoint(`search?${params}`));
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
        
        const response = await fetch(this.apiConfig.getEndpoint(`search?${params}`));
        return await response.json();
    }

    // Main search orchestrator
    async performSearch(page = 0) {
        console.log('🔍 performSearch called with page:', page);
        console.log('🔍 Window location:', window.location.href);
        console.log('🔍 API config:', this.apiConfig.getApiUrl());
        
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
        }
        
        // Show loading
        this.showLoading();
        console.log('🔧 Loading state shown');
        
        try {
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
                query: query,
                searchType: searchType,
                filters: filters,
                apiUrl: this.apiConfig.getApiUrl()
            });
            
            // Show error message to user
            const resultsContainer = document.getElementById('searchResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-triangle"></i> Search Error</h5>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <p><strong>Query:</strong> "${query}"</p>
                        <p><strong>Search Type:</strong> ${searchType}</p>
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
            const response = await fetch(this.apiConfig.getEndpoint(`search/suggestions?q=${encodeURIComponent(query)}&limit=5`));
            
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
            const response = await fetch(this.apiConfig.getEndpoint(`search/similar/${productId}?limit=3`));
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
        console.log('📊 Displaying search results:', results);
        console.log('📊 Results structure check:', {
            hasResults: !!results,
            hasHits: !!(results && results.hits),
            hitsLength: results && results.hits ? results.hits.length : 'N/A',
            query: results ? results.query : 'N/A'
        });
        
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) {
            console.error('❌ Search results container not found');
            return;
        }
        
        console.log('📊 Found results container:', resultsContainer);
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (!results.hits || results.hits.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No results found for "${results.query}". Try adjusting your search terms or filters.
                </div>
            `;
            return;
        }
        
        // Create results HTML
        let html = `
            <div class="search-summary mb-3">
                <h5>Search Results</h5>
                <p class="text-muted">
                    Found ${results.estimated_total_hits || results.hits.length} results for 
                    <strong>"${results.query}"</strong>
                    ${results.processing_time_ms ? `(${results.processing_time_ms}ms)` : ''}
                </p>
            </div>
            <div class="row">
        `;
        
        // Add each result
        results.hits.forEach((hit, index) => {
            html += this.createProductCard(hit, index);
        });
        
        html += '</div>';
        
        // Set the HTML
        resultsContainer.innerHTML = html;
        
        // Hide loading
        this.hideLoading();
        
        console.log(`✅ Displayed ${results.hits.length} search results`);
    }

    createProductCard(product, index) {
        // Clean up product data
        const title = product.title || product.pattern_model || 'Unknown Product';
        const category = product.category || 'Unknown Category';
        const brand = product.brand || 'Unknown Brand';
        const size = product.size || 'N/A';
        const group = product.group || 'Unknown';
        const material = product.material || '';
        const plyRating = product.ply_rating || 'N/A';
        const speedRating = product.speed_rating || 'N/A';
        const loadIndex = product.load_index || 'N/A';
        const recordType = product.record_type || 'Unknown';
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 product-card" data-product-id="${product.id}">
                    <div class="card-header bg-primary text-white">
                        <h6 class="card-title mb-0">
                            <i class="fas fa-tire"></i> ${title}
                        </h6>
                        <small class="text-light">${category}</small>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <strong>Brand:</strong><br>
                                <span class="text-primary">${brand}</span>
                            </div>
                            <div class="col-6">
                                <strong>Size:</strong><br>
                                <span class="badge bg-secondary">${size}</span>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-6">
                                <strong>Group:</strong><br>
                                <small>${group}</small>
                            </div>
                            <div class="col-6">
                                <strong>Type:</strong><br>
                                <small>${recordType}</small>
                            </div>
                        </div>
                        ${material ? `
                        <hr>
                        <div>
                            <strong>Material:</strong><br>
                            <small class="text-muted">${material}</small>
                        </div>
                        ` : ''}
                        <hr>
                        <div class="row">
                            <div class="col-4">
                                <strong>Ply:</strong><br>
                                <small>${plyRating}</small>
                            </div>
                            <div class="col-4">
                                <strong>Speed:</strong><br>
                                <small>${speedRating}</small>
                            </div>
                            <div class="col-4">
                                <strong>Load:</strong><br>
                                <small>${loadIndex}</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.searchManager.showProductDetails('${product.id}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="app.copyProductInfo('${product.id}')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayFacets(facetDistribution) {
        // This will be moved to ui-renderer.js
        console.log('📊 Displaying facets:', facetDistribution);
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
                            onclick="window.apolloApp.searchManager.removeFacetFilter('${field}')"
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
                <a class="page-link" href="#" onclick="window.apolloApp.searchManager.performSearch(${currentPage - 1}); return false;">
                    Previous
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = startPage; i < endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.apolloApp.searchManager.performSearch(${i}); return false;">
                        ${i + 1}
                    </a>
                </li>
            `;
        }
        
        // Next button
        html += `
            <li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.apolloApp.searchManager.performSearch(${currentPage + 1}); return false;">
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
