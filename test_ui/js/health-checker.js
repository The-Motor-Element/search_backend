// Health Check Module
// Handles system health monitoring and API connectivity testing

class HealthChecker {
    constructor(apiConfig) {
        this.apiConfig = apiConfig;
        this.statusElement = null;
    }

    async checkSystemHealth() {
        console.log('🔍 Starting system health check...');
        console.log('🌐 Current window.APOLLO_API_URL:', window.APOLLO_API_URL);
        console.log('🌐 Current API_BASE_URL:', this.apiConfig.getApiUrl());
        console.log('🌐 Current location:', window.location.href);
        console.log('🌐 User agent:', navigator.userAgent);
        
        // Try multiple API URLs if the primary one fails
        const apiUrls = [this.apiConfig.getApiUrl()];
        
        // Add fallback URLs based on environment detection
        const currentLocation = window.location;
        const hostname = currentLocation.hostname;
        const protocol = currentLocation.protocol;
        
        console.log('🔧 Building fallback API URLs...');
        console.log('   - hostname:', hostname);
        console.log('   - protocol:', protocol);
        console.log('   - port:', currentLocation.port);
        console.log('   - host:', currentLocation.host);
        
        // Add additional URLs to try only for localhost
        if (hostname === 'localhost' && !apiUrls.includes('http://localhost:8001')) {
            apiUrls.push('http://localhost:8001');
            console.log('   + Added localhost fallback');
        }
        
        console.log('🔧 Final API URLs to test:', apiUrls);
        
        // Get the status element
        this.statusElement = document.getElementById('health-status');
        
        if (!this.statusElement) {
            console.error('❌ health-status element not found in DOM!');
            return;
        }
        
        console.log('✅ Found health-status element:', this.statusElement);
        
        let lastError = null;
        
        // Try each API URL until one works
        for (let i = 0; i < apiUrls.length; i++) {
            const apiUrl = apiUrls[i];
            try {
                console.log(`🔍 Attempt ${i + 1}/${apiUrls.length}: Checking health at: ${apiUrl}`);
                
                // Temporarily update API config to test this URL
                const originalUrl = this.apiConfig.getApiUrl();
                if (apiUrl !== originalUrl) {
                    this.apiConfig.updateApiUrl(apiUrl);
                }
                
                const healthUrl = `${this.apiConfig.getApiUrl()}/health`;
                console.log(`🩺 Health check URL: ${healthUrl}`);
                console.log(`🔧 Fetch options: {method: 'GET', headers: {}, mode: 'cors'}`);
                
                const response = await fetch(healthUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                });
                
                console.log(`📡 Response status: ${response.status}`);
                console.log(`📡 Response ok: ${response.ok}`);
                console.log(`📡 Response headers:`, Object.fromEntries(response.headers));
                
                if (!response.ok) {
                    const responseText = await response.text();
                    console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`);
                    console.error(`❌ Response body: ${responseText}`);
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
                }
                
                const health = await response.json();
                console.log(`💊 Health response:`, health);
                
                if (health.status === 'healthy') {
                    console.log(`✅ API is healthy at: ${apiUrl}`);
                    this.setHealthStatus('healthy', health);
                    console.log('🎉 Health check completed successfully!');
                    return { success: true, health };
                } else {
                    console.warn(`⚠️ Health check returned unhealthy status:`, health);
                    throw new Error(`API returned unhealthy status: ${health.status}`);
                }
                
            } catch (error) {
                console.warn(`❌ API health check failed for ${apiUrl}:`, error.message);
                console.warn(`❌ Error details:`, error);
                lastError = error;
                
                // Restore original URL if we changed it
                if (apiUrl !== this.apiConfig.getApiUrl()) {
                    this.apiConfig.updateApiUrl(this.apiConfig.getApiUrl());
                }
            }
        }
        
        // If we get here, all API endpoints failed
        console.error('💀 All API endpoints failed health check');
        console.error('💀 Last error:', lastError);
        console.error('💀 Setting status to offline');
        
        this.setHealthStatus('offline', { error: lastError?.message });
        return { success: false, error: lastError?.message };
    }

    setHealthStatus(status, data = {}) {
        console.log(`🏥 Setting health status to: ${status}`);
        console.log(`🏥 Status data:`, data);
        
        if (!this.statusElement) {
            console.warn('⚠️ No health status element found');
            return;
        }
        
        // Clear existing classes and content
        this.statusElement.className = 'badge';
        
        if (status === 'healthy') {
            this.statusElement.classList.add('bg-success');
            this.statusElement.innerHTML = '<i class="fas fa-check-circle"></i> System Healthy';
        } else if (status === 'offline') {
            this.statusElement.classList.add('bg-danger');
            this.statusElement.innerHTML = '<i class="fas fa-times-circle"></i> System Offline';
        } else {
            this.statusElement.classList.add('bg-warning');
            this.statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System Issues';
        }
    }

    async performPeriodicCheck(intervalMs = 30000) {
        console.log(`🔄 Starting periodic health checks every ${intervalMs}ms`);
        
        // Perform initial check
        await this.checkSystemHealth();
        
        // Set up periodic checks
        setInterval(async () => {
            console.log('🔄 Performing periodic health check...');
            await this.checkSystemHealth();
        }, intervalMs);
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthChecker;
}
