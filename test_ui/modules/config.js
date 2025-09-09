// Configuration and constants module
export const CONFIG = {
    API_BASE_URL: window.APOLLO_API_URL || 'http://localhost:8001',
    DEBOUNCE_DELAY: 300,
    SUGGESTION_LIMIT: 5,
    AUTO_DISMISS_DELAY: 5000
};

export let state = {
    currentPage: 0,
    currentQuery: '',
    currentFilters: '',
    similarProductsCache: {},
    selectedSuggestionIndex: -1
};

export function updateState(updates) {
    Object.assign(state, updates);
}
