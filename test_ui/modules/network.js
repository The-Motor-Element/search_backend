// Network utilities module
import { CONFIG } from './config.js';

// Enhanced fetch with better error handling for cloudflared
export async function safeFetch(url, options = {}) {
    try {
        console.log(`🌐 Making request to: ${url}`);
        
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            cache: 'no-cache',
            ...options
        };
        
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Request successful: ${url}`);
        return { success: true, data };
        
    } catch (error) {
        console.error(`❌ Request failed: ${url}`, error);
        return { 
            success: false, 
            error: error.message,
            details: {
                url,
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
    }
}

// Check system health
export async function checkSystemHealth() {
    try {
        console.log('🏥 Checking system health...');
        const result = await safeFetch(`${CONFIG.API_BASE_URL}/health`);
        
        const statusElement = document.getElementById('health-status');
        
        if (result.success && result.data.status === 'healthy') {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> System Healthy';
            statusElement.className = 'badge bg-success';
            console.log('✅ System health check passed');
        } else {
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> System Issues';
            statusElement.className = 'badge bg-warning';
            console.warn('⚠️ System health check failed:', result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Health check error:', error);
        const statusElement = document.getElementById('health-status');
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Connection Failed';
        statusElement.className = 'badge bg-danger';
        
        throw error;
    }
}
