# Apollo Tire Search - Test UI

**Interactive demonstration of advanced Meilisearch features**

This test UI showcases all the powerful search capabilities implemented in the Apollo tire search backend, providing an intuitive interface to explore and test advanced features.

## 🌟 Features Demonstrated

### 🔍 **Search Types**
- **Basic Search** - Standard text search with optional highlighting
- **Faceted Search** - Real-time facet distributions for analytics
- **Highlighted Search** - Search term highlighting in results
- **Text Cropping** - Custom text truncation for mobile UIs
- **Browse Mode** - Category exploration with facets only

### 🎯 **Advanced Filtering**
- **Boolean Logic** - Complex AND/OR/NOT filter expressions
- **Tire-Specific Filters** - Group, record type, ply rating selection
- **Custom Filters** - Free-form filter expression input
- **Interactive Facets** - Click facet values to apply filters

### 📊 **Analytics & Intelligence**
- **Real-time Facets** - Live facet counts and distributions
- **Search Suggestions** - Intelligent autocomplete with context
- **Similar Products** - AI-powered product recommendations
- **Performance Metrics** - Sub-millisecond search timing display
- **Index Statistics** - Comprehensive analytics dashboard

### 🎨 **User Experience**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Live search results and suggestions
- **Interactive Elements** - Hover effects and smooth transitions
- **Comprehensive UI** - Filter controls, pagination, sorting

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)
```bash
# Navigate to the test_ui directory
cd test_ui

# Start a simple HTTP server (Python 3)
python -m http.server 8080

# Or using Node.js
npx http-server -p 8080

# Visit http://localhost:8080 in your browser
```

### Option 2: Using the Provided Server Script
```bash
# From the test_ui directory
python server.py

# Visit http://localhost:8080 in your browser
```

### Option 3: Open Directly (Limited Functionality)
```bash
# Open index.html directly in your browser
open index.html  # macOS
# or
start index.html  # Windows
```
*Note: CORS restrictions may limit API functionality when opening directly*

## 📋 Prerequisites

1. **API Server Running**: Ensure the Apollo tire search backend is running on `http://localhost:8001`
2. **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
3. **Network Access**: Browser must be able to reach the API server

## 🎮 How to Use

### Basic Search
1. Enter a search term (e.g., "LOADSTAR", "155/80", "Apollo")
2. Choose search type from dropdown
3. Apply filters using the sidebar controls
4. View results with performance metrics

### Faceted Search
1. Select "Faceted Search" from search type dropdown
2. Enter query or leave empty for browse mode
3. View real-time facet distributions in the sidebar
4. Click facet values to apply filters

### Similar Products
1. Perform any search to get results
2. Click "Find Similar" on any product
3. View similar products based on tire specifications
4. Click similar products to search for them

### Analytics Dashboard
1. Click "Show Analytics" button
2. View comprehensive index statistics
3. Explore top product categories and distributions

## 🔧 Advanced Features Demo

### Sample Searches to Try
- **"LOADSTAR"** - Search for LOADSTAR tire patterns
- **"155/80"** - Search by tire size
- **"Apollo"** - Brand-based search
- **Empty query + Browse Mode** - Explore all categories

### Filter Examples
- **Group = "SCV"** - Small Commercial Vehicles
- **Record Type = "Tyre"** - Only tire products
- **Ply Rating = "8PR"** - 8-ply rating tires
- **Custom**: `group = 'Passenger Car' AND ply_rating = '6PR'`

### Advanced Combinations
1. **Faceted Browse**: Empty query + Faceted search + Group filter
2. **Highlighted Results**: Search "SUPER" + Highlighted search type
3. **Similar Exploration**: Search "LOADSTAR" + Find similar products
4. **Performance Testing**: Various queries with timing metrics

## 🛠️ Technical Implementation

### Frontend Stack
- **HTML5** - Semantic structure with accessibility features
- **Bootstrap 5.3** - Responsive UI framework with components
- **Vanilla JavaScript** - No dependencies, modern ES6+ features
- **Font Awesome 6** - Professional icons and indicators
- **CSS3** - Custom styling with animations and transitions

### API Integration
- **Fetch API** - Modern HTTP client with async/await
- **Error Handling** - Comprehensive error states and user feedback
- **Caching** - Intelligent caching for similar products and filters
- **Real-time** - Live search suggestions and instant results

### Features Implemented
- ✅ **Debounced Search** - Optimized API calls with input debouncing
- ✅ **Autocomplete** - Context-aware search suggestions
- ✅ **Pagination** - Full pagination with page navigation
- ✅ **Responsive Design** - Mobile-first responsive layout
- ✅ **Loading States** - Visual feedback during API calls
- ✅ **Error Handling** - Graceful error states and recovery
- ✅ **Performance Metrics** - Real-time timing display
- ✅ **Health Monitoring** - API health status indicator

## 📱 Mobile Experience

The UI is fully responsive and optimized for mobile devices:
- **Touch-friendly** - Large tap targets and swipe gestures
- **Compact Layout** - Optimized for smaller screens
- **Fast Loading** - Minimal resource usage
- **Offline Awareness** - Graceful handling of network issues

## 🔍 API Endpoints Used

The test UI demonstrates all available API endpoints:

- `GET /health` - System health check
- `GET /search` - Basic and advanced search
- `GET /search/facets` - Faceted search with analytics
- `GET /search/suggestions` - Autocomplete suggestions
- `GET /search/similar/{id}` - Similar product recommendations
- `GET /search/filters/*` - Available filter options
- `GET /analytics/stats` - Index statistics and analytics

## 💡 Tips for Best Experience

1. **Start with Sample Searches** - Use the provided sample buttons
2. **Explore Facets** - Try faceted search to understand tire categories
3. **Test Performance** - Notice sub-millisecond search times
4. **Try Combinations** - Combine filters and search types
5. **Mobile Testing** - Test on mobile devices for responsive experience

## 🐛 Troubleshooting

### Common Issues

**"System Offline" Status**
- Ensure API server is running on `http://localhost:8001`
- Check browser console for CORS or network errors

**No Search Results**
- Verify API server has data loaded (1,557 products expected)
- Try broader search terms or remove filters

**Suggestions Not Working**
- Type at least 2 characters for suggestions to appear
- Check network connectivity to API server

**UI Not Loading Properly**
- Use HTTP server instead of opening HTML directly
- Clear browser cache and reload

### Browser Console
Enable browser developer tools to see:
- API request/response details
- JavaScript errors or warnings
- Network timing and performance metrics

---

🎉 **Enjoy exploring the advanced search capabilities!** This UI demonstrates the full power of modern search technology applied to the Apollo tire catalog.
