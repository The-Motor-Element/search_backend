/**
 * Faceted Search Tags Manager
 * 
 * This module manages the display and interaction of facet tags/pills
 * for a faceted search interface. It handles adding, removing, and 
 * syncing tags with sidebar facet selections.
 */

// Global state object to store selected facets
let selectedFacets = {};

// Configuration for tag styling and behavior
const FACET_CONFIG = {
    containerSelector: '#facet-tags-container',
    tagClassName: 'facet-tag',
    closeButtonClassName: 'facet-tag-close',
    maxTagLength: 30 // Maximum characters to display in a tag
};

/**
 * Initialize the facet tags system
 * Creates the container if it doesn't exist and sets up event listeners
 */
function initializeFacetTags() {
    // Create tags container if it doesn't exist
    let container = document.querySelector(FACET_CONFIG.containerSelector);
    if (!container) {
        container = document.createElement('div');
        container.id = 'facet-tags-container';
        container.className = 'facet-tags-container';
        
        // Insert at the top of search results area
        const searchResults = document.querySelector('#search-results') || document.querySelector('.search-results');
        if (searchResults) {
            searchResults.parentNode.insertBefore(container, searchResults);
        } else {
            document.body.appendChild(container);
        }
    }
    
    // Set up event delegation for tag removal
    setupTagEventListeners();
    
    // Set up event listeners for facet selections in sidebar
    setupFacetEventListeners();
    
    // Add CSS styles if not already present
    injectTagStyles();
}

/**
 * Add a facet tag to the display
 * @param {string} facetKey - The facet category (e.g., 'brand', 'size')
 * @param {string} facetValue - The selected value (e.g., 'Nike', 'M')
 */
function addFacetTag(facetKey, facetValue) {
    // Initialize facet category if it doesn't exist
    if (!selectedFacets[facetKey]) {
        selectedFacets[facetKey] = [];
    }
    
    // Check for duplicates
    if (selectedFacets[facetKey].includes(facetValue)) {
        return; // Tag already exists
    }
    
    // Add to selected facets
    selectedFacets[facetKey].push(facetValue);
    
    // Create and display the tag
    createTagElement(facetKey, facetValue);
    
    // Sync UI state
    syncFacetUI();
    
    // Trigger search with updated filters
    if (typeof triggerSearch === 'function') {
        triggerSearch(selectedFacets);
    }
}

/**
 * Remove a facet tag from the display and update selections
 * @param {string} facetKey - The facet category
 * @param {string} facetValue - The value to remove
 */
function removeFacetTag(facetKey, facetValue) {
    // Remove from selected facets
    if (selectedFacets[facetKey]) {
        const index = selectedFacets[facetKey].indexOf(facetValue);
        if (index > -1) {
            selectedFacets[facetKey].splice(index, 1);
            
            // Remove the category entirely if no values left
            if (selectedFacets[facetKey].length === 0) {
                delete selectedFacets[facetKey];
            }
        }
    }
    
    // Remove the tag element
    removeTagElement(facetKey, facetValue);
    
    // Sync UI state
    syncFacetUI();
    
    // Trigger search with updated filters
    if (typeof triggerSearch === 'function') {
        triggerSearch(selectedFacets);
    }
}

/**
 * Create and insert a tag element into the DOM
 * @param {string} facetKey - The facet category
 * @param {string} facetValue - The facet value
 */
function createTagElement(facetKey, facetValue) {
    const container = document.querySelector(FACET_CONFIG.containerSelector);
    if (!container) return;
    
    // Create tag element
    const tag = document.createElement('span');
    tag.className = FACET_CONFIG.tagClassName;
    tag.dataset.facetKey = facetKey;
    tag.dataset.facetValue = facetValue;
    
    // Truncate long values
    const displayValue = facetValue.length > FACET_CONFIG.maxTagLength 
        ? facetValue.substring(0, FACET_CONFIG.maxTagLength) + '...'
        : facetValue;
    
    // Create tag content
    tag.innerHTML = `
        <span class="facet-tag-label">
            <strong>${formatFacetKey(facetKey)}:</strong> ${escapeHtml(displayValue)}
        </span>
        <button class="${FACET_CONFIG.closeButtonClassName}" 
                type="button" 
                aria-label="Remove ${facetKey}: ${facetValue} filter"
                title="Remove this filter">
            ×
        </button>
    `;
    
    // Find the clear all button if it exists
    const clearAllBtn = container.querySelector('.clear-all-facets-btn');
    
    if (clearAllBtn) {
        // Insert the tag before the clear all button
        container.insertBefore(tag, clearAllBtn);
    } else {
        // Add the tag to the container
        container.appendChild(tag);
        
        // Create and add the clear all button at the end
        createClearAllButton(container);
    }
}

/**
 * Create and add the clear all button to the container
 * @param {Element} container - The facet tags container
 */
function createClearAllButton(container) {
    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'clear-all-facets-btn btn btn-outline-secondary btn-sm ms-2';
    clearAllBtn.innerHTML = '<i class="fas fa-times"></i> Clear All';
    clearAllBtn.title = 'Clear all filters';
    clearAllBtn.onclick = () => {
        if (window.clearAllFilters) {
            window.clearAllFilters();
        } else {
            clearAllFacetTags();
        }
    };
    container.appendChild(clearAllBtn);
}

/**
 * Remove a specific tag element from the DOM
 * @param {string} facetKey - The facet category
 * @param {string} facetValue - The facet value
 */
function removeTagElement(facetKey, facetValue) {
    const container = document.querySelector(FACET_CONFIG.containerSelector);
    if (!container) return;
    
    const tag = container.querySelector(
        `.${FACET_CONFIG.tagClassName}[data-facet-key="${facetKey}"][data-facet-value="${facetValue}"]`
    );
    
    if (tag) {
        tag.remove();
    }
    
    // Remove clear all button if no more tags exist
    const remainingTags = container.querySelectorAll(`.${FACET_CONFIG.tagClassName}`);
    const clearAllBtn = container.querySelector('.clear-all-facets-btn');
    if (remainingTags.length === 0 && clearAllBtn) {
        clearAllBtn.remove();
    }
}

/**
 * Synchronize the sidebar facet UI with current selections
 * Updates checkboxes, radio buttons, and select options
 */
function syncFacetUI() {
    // Update checkboxes
    document.querySelectorAll('input[type="checkbox"][data-facet-key]').forEach(checkbox => {
        const facetKey = checkbox.dataset.facetKey;
        const facetValue = checkbox.dataset.facetValue || checkbox.value;
        
        checkbox.checked = selectedFacets[facetKey] && 
                          selectedFacets[facetKey].includes(facetValue);
    });
    
    // Update radio buttons
    document.querySelectorAll('input[type="radio"][data-facet-key]').forEach(radio => {
        const facetKey = radio.dataset.facetKey;
        const facetValue = radio.dataset.facetValue || radio.value;
        
        radio.checked = selectedFacets[facetKey] && 
                       selectedFacets[facetKey].includes(facetValue);
    });
    
    // Update select dropdowns
    document.querySelectorAll('select[data-facet-key]').forEach(select => {
        const facetKey = select.dataset.facetKey;
        const selectedValues = selectedFacets[facetKey] || [];
        
        Array.from(select.options).forEach(option => {
            option.selected = selectedValues.includes(option.value);
        });
    });
}

/**
 * Set up event listeners for tag interactions (removal)
 */
function setupTagEventListeners() {
    const container = document.querySelector(FACET_CONFIG.containerSelector);
    if (!container) return;
    
    // Use event delegation for dynamically created tags
    container.addEventListener('click', function(event) {
        if (event.target.classList.contains(FACET_CONFIG.closeButtonClassName)) {
            event.preventDefault();
            event.stopPropagation();
            
            const tag = event.target.closest(`.${FACET_CONFIG.tagClassName}`);
            if (tag) {
                const facetKey = tag.dataset.facetKey;
                const facetValue = tag.dataset.facetValue;
                removeFacetTag(facetKey, facetValue);
            }
        }
    });
}

/**
 * Set up event listeners for facet selections in sidebar
 */
function setupFacetEventListeners() {
    // Handle checkbox changes
    document.addEventListener('change', function(event) {
        const target = event.target;
        
        if (target.type === 'checkbox' && target.dataset.facetKey) {
            const facetKey = target.dataset.facetKey;
            const facetValue = target.dataset.facetValue || target.value;
            
            if (target.checked) {
                addFacetTag(facetKey, facetValue);
            } else {
                removeFacetTag(facetKey, facetValue);
            }
        }
        
        // Handle radio button changes
        else if (target.type === 'radio' && target.dataset.facetKey) {
            const facetKey = target.dataset.facetKey;
            const facetValue = target.dataset.facetValue || target.value;
            
            // Remove all other values for this facet key (radio is single-select)
            if (selectedFacets[facetKey]) {
                selectedFacets[facetKey].forEach(value => {
                    if (value !== facetValue) {
                        removeTagElement(facetKey, value);
                    }
                });
                selectedFacets[facetKey] = [];
            }
            
            if (target.checked) {
                addFacetTag(facetKey, facetValue);
            }
        }
        
        // Handle select dropdown changes
        else if (target.tagName === 'SELECT' && target.dataset.facetKey) {
            const facetKey = target.dataset.facetKey;
            
            // Clear existing selections for this facet
            if (selectedFacets[facetKey]) {
                selectedFacets[facetKey].forEach(value => {
                    removeTagElement(facetKey, value);
                });
                delete selectedFacets[facetKey];
            }
            
            // Add selected options
            Array.from(target.selectedOptions).forEach(option => {
                if (option.value) {
                    addFacetTag(facetKey, option.value);
                }
            });
        }
    });
}

/**
 * Clear all facet tags and reset selections
 */
function clearAllFacetTags() {
    selectedFacets = {};
    const container = document.querySelector(FACET_CONFIG.containerSelector);
    if (container) {
        container.innerHTML = '';
    }
    syncFacetUI();
    
    if (typeof triggerSearch === 'function') {
        triggerSearch(selectedFacets);
    }
}

/**
 * Get current selected facets
 * @returns {Object} Current selected facets object
 */
function getSelectedFacets() {
    return { ...selectedFacets };
}

/**
 * Set selected facets (useful for initial state or external updates)
 * @param {Object} facets - Facets object to set
 */
function setSelectedFacets(facets) {
    selectedFacets = { ...facets };
    
    // Clear existing tags
    const container = document.querySelector(FACET_CONFIG.containerSelector);
    if (container) {
        container.innerHTML = '';
    }
    
    // Add tags for all selected facets
    Object.keys(selectedFacets).forEach(facetKey => {
        selectedFacets[facetKey].forEach(facetValue => {
            createTagElement(facetKey, facetValue);
        });
    });
    
    syncFacetUI();
}

/**
 * Utility function to format facet keys for display
 * @param {string} key - The facet key
 * @returns {string} Formatted display name
 */
function formatFacetKey(key) {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

/**
 * Utility function to escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Inject CSS styles for facet tags if not already present
 */
function injectTagStyles() {
    // Check if styles already exist
    if (document.querySelector('#facet-tags-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'facet-tags-styles';
    style.textContent = `
        .facet-tags-container {
            margin: 1rem 0;
            padding: 1rem;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 0.375rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;
            min-height: 2rem;
        }
        
        .facet-tags-container:empty {
            display: none;
        }
        
        .facet-tags-container::before {
            content: "Active Filters:";
            color: #6c757d;
            font-size: 0.875rem;
            font-weight: 500;
            margin-right: 0.5rem;
        }
        
        .clear-all-facets-btn {
            margin-left: auto !important;
            white-space: nowrap;
            flex-shrink: 0;
            order: 999;
        }
        
        .facet-tag {
            display: inline-flex;
            align-items: center;
            background-color: #0d6efd;
            color: white;
            border: none;
            border-radius: 1rem;
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
            max-width: 300px;
            transition: all 0.2s ease;
        }
        
        .facet-tag:hover {
            background-color: #0b5ed7;
            transform: translateY(-1px);
        }
        
        .facet-tag-label {
            margin-right: 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .facet-tag-close {
            background: rgba(255, 255, 255, 0.3);
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.1rem;
            line-height: 1;
            padding: 0;
            margin-left: 0.25rem;
            width: 1.2rem;
            height: 1.2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .facet-tag-close:hover {
            background-color: rgba(255, 255, 255, 0.5);
            transform: scale(1.1);
        }
        
        .facet-tag-close:focus {
            outline: 2px solid #fff;
            outline-offset: 1px;
        }
        
        .clear-all-facets-btn {
            margin-left: auto !important;
        }
        
        @media (max-width: 768px) {
            .facet-tags-container {
                gap: 0.25rem;
                padding: 0.75rem;
            }
            
            .facet-tag {
                font-size: 0.75rem;
                padding: 0.2rem 0.5rem;
                max-width: 250px;
            }
            
            .clear-all-facets-btn {
                margin-left: 0 !important;
                margin-top: 0.5rem;
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFacetTags);
} else {
    initializeFacetTags();
}

// Export functions for external use
window.FacetTags = {
    addFacetTag,
    removeFacetTag,
    clearAllFacetTags,
    getSelectedFacets,
    setSelectedFacets,
    syncFacetUI,
    initialize: initializeFacetTags
};
