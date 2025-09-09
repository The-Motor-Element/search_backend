// Filters management module
import { CONFIG } from './config.js';
import { safeFetch } from './network.js';
import { populateFilterSelect, showAlert } from './ui.js';

export async function loadFilterOptions() {
    try {
        console.log('🔍 Loading filter options...');
        
        // Load groups
        const groupsResult = await safeFetch(`${CONFIG.API_BASE_URL}/search/filters/groups`);
        if (groupsResult.success) {
            populateFilterSelect('groupFilter', groupsResult.data.groups);
            console.log(`✅ Loaded ${groupsResult.data.groups.length} groups`);
        } else {
            console.warn('⚠️ Failed to load groups:', groupsResult.error);
        }
        
        // Load record types
        const recordTypesResult = await safeFetch(`${CONFIG.API_BASE_URL}/search/filters/record-types`);
        if (recordTypesResult.success) {
            populateFilterSelect('recordTypeFilter', recordTypesResult.data.record_types);
            console.log(`✅ Loaded ${recordTypesResult.data.record_types.length} record types`);
        } else {
            console.warn('⚠️ Failed to load record types:', recordTypesResult.error);
        }
        
        // Load ply ratings
        const plyRatingsResult = await safeFetch(`${CONFIG.API_BASE_URL}/search/filters/ply-ratings`);
        if (plyRatingsResult.success) {
            populateFilterSelect('plyRatingFilter', plyRatingsResult.data.ply_ratings);
            console.log(`✅ Loaded ${plyRatingsResult.data.ply_ratings.length} ply ratings`);
        } else {
            console.warn('⚠️ Failed to load ply ratings:', plyRatingsResult.error);
        }
        
    } catch (error) {
        console.error('❌ Failed to load filter options:', error);
        showAlert(`Failed to load filter options: ${error.message}`, 'warning');
    }
}

export function getCurrentFilters() {
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

export function displayFacets(facetDistribution) {
    const container = document.getElementById('facetsContent');
    
    if (!facetDistribution || Object.keys(facetDistribution).length === 0) {
        container.innerHTML = '<p class="text-muted">No facets available</p>';
        return;
    }
    
    container.innerHTML = Object.entries(facetDistribution).map(([facetName, values]) => {
        const items = Object.entries(values).map(([value, count]) => 
            `<div class="facet-item">
                <input type="checkbox" 
                       data-facet-key="${facetName}" 
                       data-facet-value="${value}" 
                       id="facet-${facetName}-${value.replace(/\s+/g, '-')}"
                       class="form-check-input me-2">
                <label for="facet-${facetName}-${value.replace(/\s+/g, '-')}" class="form-check-label">
                    ${value}
                    <span class="facet-count">${count}</span>
                </label>
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
