// Search functionality module
import { CONFIG, state, updateState } from './config.js';
import { safeFetch } from './network.js';
import { showLoading, hideLoading, showAlert } from './ui.js';
import { getCurrentFilters, displayFacets } from './filters.js';

export async function performBasicSearch(query, filters, limit, offset, sort, highlight, showMatches) {
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
    
    const result = await safeFetch(`${CONFIG.API_BASE_URL}/search?${params}`);
    if (!result.success) {
        throw new Error(result.error || 'Search failed');
    }
    return result.data;
}

export async function performFacetedSearch(query, filters, limit, offset, sort) {
    const facetLimit = limit === 0 ? 0 : limit;
    const params = new URLSearchParams({
        q: query,
        facets: 'group,record_type,ply_rating',
        limit: facetLimit,
        offset: offset
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    
    const result = await safeFetch(`${CONFIG.API_BASE_URL}/search/facets?${params}`);
    if (!result.success) {
        throw new Error(result.error || 'Faceted search failed');
    }
    
    return result.data;
}

export async function performHighlightedSearch(query, filters, limit, offset, sort, forceHighlight = false) {
    const params = new URLSearchParams({
        q: query,
        limit: limit,
        offset: offset,
        highlight: 'true',
        attributes_to_highlight: 'material,pattern_model,title,size'
    });
    
    if (filters) params.append('filters', filters);
    if (sort) params.append('sort', sort);
    
    const result = await safeFetch(`${CONFIG.API_BASE_URL}/search?${params}`);
    if (!result.success) {
        throw new Error(result.error || 'Highlighted search failed');
    }
    return result.data;
}

export async function performCroppedSearch(query, filters, limit, offset, sort) {
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
    
    const result = await safeFetch(`${CONFIG.API_BASE_URL}/search?${params}`);
    if (!result.success) {
        throw new Error(result.error || 'Cropped search failed');
    }
    return result.data;
}

export async function performSearch(page = 0) {
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
    
    updateState({
        currentQuery: query,
        currentFilters: filters,
        currentPage: page
    });
    
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
        
        // Import display functions dynamically to avoid circular dependencies
        const { displaySearchResults, updatePagination } = await import('./display.js');
        const { loadSimilarProducts } = await import('./products.js');
        
        displaySearchResults(searchResults);
        
        // Display facets for faceted searches
        if (searchType === 'faceted' || searchType === 'browse') {
            if (searchResults.facet_distribution) {
                displayFacets(searchResults.facet_distribution);
            }
        }
        
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

// triggerSearch function for facetTags.js integration
export function triggerSearch(facets) {
    console.log('🔍 triggerSearch called with facets:', facets);
    
    // Update the filter dropdowns to match selected facets
    if (facets.group && Array.isArray(facets.group)) {
        document.getElementById('groupFilter').value = facets.group[0] || '';
    } else if (facets.group) {
        document.getElementById('groupFilter').value = facets.group;
    } else {
        document.getElementById('groupFilter').value = '';
    }
    
    if (facets.record_type && Array.isArray(facets.record_type)) {
        document.getElementById('recordTypeFilter').value = facets.record_type[0] || '';
    } else if (facets.record_type) {
        document.getElementById('recordTypeFilter').value = facets.record_type;
    } else {
        document.getElementById('recordTypeFilter').value = '';
    }
    
    if (facets.ply_rating && Array.isArray(facets.ply_rating)) {
        document.getElementById('plyRatingFilter').value = facets.ply_rating[0] || '';
    } else if (facets.ply_rating) {
        document.getElementById('plyRatingFilter').value = facets.ply_rating;
    } else {
        document.getElementById('plyRatingFilter').value = '';
    }
    
    // Trigger the search
    performSearch();
}
