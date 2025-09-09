// Paste this into the browser console to test search functionality

console.log('=== Apollo Search UI Debug Script ===');

// 1. Check if all required elements exist
console.log('\n1. Checking UI Elements:');
const elements = {
    searchQuery: document.getElementById('searchQuery'),
    searchResults: document.getElementById('searchResults'),
    searchType: document.getElementById('searchType'),
    limitSelect: document.getElementById('limitSelect'),
    sortField: document.getElementById('sortField'),
    highlightResults: document.getElementById('highlightResults'),
    showMatchPositions: document.getElementById('showMatchPositions')
};

Object.entries(elements).forEach(([name, element]) => {
    console.log(`  ${name}: ${element ? '✅ Found' : '❌ Missing'}`);
});

// 2. Check if app components are initialized
console.log('\n2. Checking App Components:');
console.log(`  window.apolloApp: ${window.apolloApp ? '✅ Found' : '❌ Missing'}`);
console.log(`  searchManager: ${window.apolloApp?.searchManager ? '✅ Found' : '❌ Missing'}`);
console.log(`  apiConfig: ${window.apolloApp?.apiConfig ? '✅ Found' : '❌ Missing'}`);
console.log(`  API URL: ${window.apolloApp?.apiConfig?.getApiUrl() || 'N/A'}`);

// 3. Test API connectivity
console.log('\n3. Testing API Connectivity:');
fetch('http://localhost:8001/health')
    .then(response => response.json())
    .then(data => {
        console.log('  ✅ API Health Check:', data);
        return fetch('http://localhost:8001/search?q=LOADSTAR&limit=1');
    })
    .then(response => response.json())
    .then(data => {
        console.log('  ✅ API Search Test:', {
            hits: data.hits?.length || 0,
            query: data.query,
            processingTime: data.processing_time_ms
        });
    })
    .catch(error => {
        console.error('  ❌ API Test Failed:', error);
    });

// 4. Manual search test
console.log('\n4. Manual Search Test:');
if (elements.searchQuery && window.apolloApp?.searchManager) {
    console.log('  Setting up test search...');
    elements.searchQuery.value = 'LOADSTAR';
    
    // Wait a moment then trigger search
    setTimeout(() => {
        console.log('  Triggering search...');
        try {
            window.apolloApp.searchManager.performSearch(0);
            console.log('  ✅ Search triggered successfully');
        } catch (error) {
            console.error('  ❌ Search trigger failed:', error);
        }
    }, 1000);
} else {
    console.log('  ❌ Cannot perform manual test - missing elements or search manager');
}

// 5. Check for JavaScript errors
console.log('\n5. Monitoring for errors...');
console.log('  Check the console for any error messages that appear after this script runs');

console.log('\n=== Debug Script Complete ===');
console.log('Instructions:');
console.log('1. Check all the ✅/❌ indicators above');
console.log('2. Watch for any error messages in the console');
console.log('3. Try manually clicking the search button in the UI');
console.log('4. If search still fails, copy any error messages and share them');
