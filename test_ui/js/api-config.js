// API Configuration and URL Detection Module
// Handles API URL detection and endpoint construction

class ApiConfig {
    constructor() {
        this.baseUrl = this.detectApiUrl();
        console.log('🔗 API Configuration initialized with base URL:', this.baseUrl);
    }

    detectApiUrl() {
        console.log('🔍 Starting API URL detection...');
        
        // 1. Check if injected by server
        if (window.APOLLO_API_URL) {
            console.log('🎯 Using server-injected API URL:', window.APOLLO_API_URL);
            return window.APOLLO_API_URL;
        }
        
        // 2. Check environment variable (if available)
        if (typeof process !== 'undefined' && process.env && process.env.API_URL) {
            console.log('🌍 Using environment API URL:', process.env.API_URL);
            return process.env.API_URL;
        }
        
        // 3. Auto-detect based on current location
        const currentLocation = window.location;
        const hostname = currentLocation.hostname;
        const protocol = currentLocation.protocol;
        
        console.log('📍 Current location analysis:');
        console.log('   - hostname:', hostname);
        console.log('   - protocol:', protocol);
        console.log('   - port:', currentLocation.port);
        console.log('   - host:', currentLocation.host);
        
        // Check for various cloud/tunnel services
        const cloudDomains = ['trycloudflare.com', 'cloudflare.com', 'ngrok.io', 'amazonaws.com'];
        const isCloud = cloudDomains.some(domain => hostname.includes(domain));
        
        console.log('☁️ Cloud domain check:', isCloud);
        
        if (isCloud) {
            // For cloudflare tunnels, use the same domain with /api proxy path
            if (hostname.includes('cloudflare')) {
                const baseUrl = `${protocol}//${currentLocation.host}`;
                const apiUrl = `${baseUrl}/api`;
                console.log('☁️ Detected Cloudflare tunnel, using proxy path:', apiUrl);
                return apiUrl;
            }
            
            // For AWS and other cloud services, try same domain with :8001
            const apiUrl = `${protocol}//${hostname}:8001`;
            console.log('☁️ Detected cloud environment, using:', apiUrl);
            return apiUrl;
        }
        
        // 4. Local development fallback
        const localUrl = 'http://localhost:8001';
        console.log('🏠 Using local development API URL:', localUrl);
        return localUrl;
    }

    getApiUrl() {
        return window.API_BASE_URL || this.baseUrl;
    }

    updateApiUrl(newUrl) {
        console.log(`🔄 Updating API URL from ${this.baseUrl} to ${newUrl}`);
        this.baseUrl = newUrl;
        window.API_BASE_URL = newUrl;
    }

    getEndpoint(path) {
        const baseUrl = this.getApiUrl();
        if (baseUrl.includes('/api')) {
            // Remove leading slash from path since baseUrl already ends with /api
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            return `${baseUrl}/${cleanPath}`;
        } else {
            // For direct URLs, add path as-is
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${baseUrl}${cleanPath}`;
        }
    }

    async testConnection(url = null) {
        const testUrl = url || this.getApiUrl();
        try {
            const response = await fetch(testUrl);
            return {
                success: response.ok,
                status: response.status,
                url: testUrl
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: testUrl
            };
        }
    }
}

// Create global API configuration instance
window.apiConfig = new ApiConfig();
