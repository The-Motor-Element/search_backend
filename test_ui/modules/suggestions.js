// Search suggestions module
import { CONFIG, state, updateState } from './config.js';
import { safeFetch } from './network.js';

export async function getSuggestions(query) {
    try {
        console.log('🔍 Getting suggestions for:', query);
        const result = await safeFetch(`${CONFIG.API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=${CONFIG.SUGGESTION_LIMIT}`);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to get suggestions');
        }
        
        console.log('💡 Received suggestions:', result.data.suggestions);
        
        showSuggestions(result.data.suggestions || []);
    } catch (error) {
        console.error('❌ Failed to get suggestions:', error);
        hideSuggestions();
    }
}

export function showSuggestions(suggestions) {
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
}

export function hideSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
        console.log('💭 Hiding suggestions');
    }
}

export function selectSuggestion(suggestion) {
    console.log('✅ Selected suggestion:', suggestion);
    document.getElementById('searchQuery').value = suggestion;
    hideSuggestions();
    
    // Import and call performSearch - this creates a circular dependency issue
    // We'll handle this by making it a callback or event
    if (window.performSearch) {
        window.performSearch();
    }
}

export function updateSuggestionSelection(suggestions, selectedIndex) {
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

export function handleSuggestionKeyboard(e) {
    const suggestionsContainer = document.getElementById('suggestions');
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (suggestions.length === 0) return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            updateState({ selectedSuggestionIndex: Math.min(state.selectedSuggestionIndex + 1, suggestions.length - 1) });
            updateSuggestionSelection(suggestions, state.selectedSuggestionIndex);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            updateState({ selectedSuggestionIndex: Math.max(state.selectedSuggestionIndex - 1, -1) });
            updateSuggestionSelection(suggestions, state.selectedSuggestionIndex);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (state.selectedSuggestionIndex >= 0 && suggestions[state.selectedSuggestionIndex]) {
                const selectedText = suggestions[state.selectedSuggestionIndex].textContent.trim();
                selectSuggestion(selectedText);
            } else {
                console.log('🔍 Enter key pressed, triggering search');
                hideSuggestions();
                if (window.performSearch) {
                    window.performSearch();
                }
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            hideSuggestions();
            updateState({ selectedSuggestionIndex: -1 });
            break;
    }
}
