// Test script to debug search functionality
console.log('Starting search functionality test...');

// Check if all required elements exist
const elements = {
    searchQuery: document.getElementById('searchQuery'),
    searchResults: document.getElementById('searchResults'),
    searchType: document.getElementById('searchType'),
    limitSelect: document.getElementById('limitSelect'),
    sortField: document.getElementById('sortField'),
    highlightResults: document.getElementById('highlightResults'),
    showMatchPositions: document.getElementById('showMatchPositions')
};

console.log('Element check:');
Object.entries(elements).forEach(([name, element]) => {
    console.log(`  ${name}: ${element ? '✅ Found' : '❌ Missing'}`);
});

// Check if app is initialized
console.log('\nApp initialization check:');
console.log('  window.apolloApp:', window.apolloApp ? '✅ Found' : '❌ Missing');
console.log('  window.apolloApp.searchManager:', window.apolloApp?.searchManager ? '✅ Found' : '❌ Missing');
console.log('  window.performSearch:', typeof window.performSearch);

// Test search manually
if (elements.searchQuery && elements.searchResults) {
    console.log('\n🔍 Testing manual search...');
    
    // Set search query
    elements.searchQuery.value = 'LOADSTAR';
    
    // Try to trigger search if app is available
    if (window.apolloApp && window.apolloApp.searchManager) {
        console.log('Triggering search via apolloApp...');
        try {
            window.apolloApp.searchManager.performSearch(0);
            console.log('✅ Search triggered successfully');
        } catch (error) {
            console.error('❌ Search failed:', error);
        }
    } else if (window.performSearch) {
        console.log('Triggering search via global function...');
        try {
            window.performSearch(0);
            console.log('✅ Search triggered successfully');
        } catch (error) {
            console.error('❌ Search failed:', error);
        }
    } else {
        console.log('❌ No search function available');
    }
} else {
    console.log('❌ Required elements missing for manual test');
}

// Test API directly
console.log('\n🌐 Testing API directly...');
fetch('http://localhost:8001/search?q=LOADSTAR&limit=3')
    .then(response => response.json())
    .then(data => {
        console.log('✅ API test successful:', data);
        console.log(`Found ${data.hits?.length || 0} results`);
    })
    .catch(error => {
        console.error('❌ API test failed:', error);
    });
