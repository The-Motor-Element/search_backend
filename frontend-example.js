/**
 * Frontend Integration Examples
 * Simple JavaScript snippets for integrating with the search backend
 */

// Basic search function
const searchProducts = async (query, options = {}) => {
  const params = new URLSearchParams({
    q: query,
    limit: options.limit || 20,
    offset: options.offset || 0,
    ...(options.filters && { filters: options.filters }),
    ...(options.sort && { sort: options.sort })
  });

  const response = await fetch(`/search?${params}`);
  const data = await response.json();
  return data;
};

// Instant search with debouncing
class InstantSearch {
  constructor(inputElement, resultsElement, options = {}) {
    this.input = inputElement;
    this.results = resultsElement;
    this.debounceTime = options.debounceTime || 300;
    this.minQueryLength = options.minQueryLength || 2;
    this.debounceTimer = null;
    
    this.init();
  }
  
  init() {
    this.input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.search(e.target.value);
      }, this.debounceTime);
    });
  }
  
  async search(query) {
    if (query.length < this.minQueryLength) {
      this.results.innerHTML = '';
      return;
    }
    
    try {
      const data = await searchProducts(query, { limit: 5 });
      this.renderResults(data.hits);
    } catch (error) {
      console.error('Search error:', error);
      this.results.innerHTML = '<div class="error">Search failed</div>';
    }
  }
  
  renderResults(hits) {
    if (hits.length === 0) {
      this.results.innerHTML = '<div class="no-results">No products found</div>';
      return;
    }
    
    const html = hits.map(product => `
      <div class="search-result">
        <h4>${product.title}</h4>
        <p class="price">$${product.price}</p>
        <p class="category">${product.category}</p>
      </div>
    `).join('');
    
    this.results.innerHTML = html;
  }
}

// Usage example
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (searchInput && searchResults) {
    new InstantSearch(searchInput, searchResults);
  }
});

// Advanced search with filters
const advancedSearch = async (query, filters = {}) => {
  const filterParts = [];
  
  if (filters.category) {
    filterParts.push(`category = "${filters.category}"`);
  }
  
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      filterParts.push(`price >= ${filters.priceMin} AND price <= ${filters.priceMax}`);
    } else if (filters.priceMin !== undefined) {
      filterParts.push(`price >= ${filters.priceMin}`);
    } else {
      filterParts.push(`price <= ${filters.priceMax}`);
    }
  }
  
  if (filters.inStock) {
    filterParts.push('in_stock = true');
  }
  
  if (filters.brand) {
    filterParts.push(`brand = "${filters.brand}"`);
  }
  
  const filterString = filterParts.join(' AND ');
  
  return await searchProducts(query, {
    filters: filterString,
    sort: filters.sort || 'desc(rating),asc(price)',
    limit: filters.limit || 20,
    offset: filters.offset || 0
  });
};

// Example usage of advanced search
const exampleUsage = async () => {
  // Basic search
  const basicResults = await searchProducts('headphones');
  console.log('Basic search results:', basicResults);
  
  // Advanced search with filters
  const advancedResults = await advancedSearch('headphones', {
    category: 'electronics',
    priceMin: 50,
    priceMax: 200,
    inStock: true,
    sort: 'asc(price)'
  });
  console.log('Advanced search results:', advancedResults);
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    searchProducts,
    InstantSearch,
    advancedSearch
  };
}
