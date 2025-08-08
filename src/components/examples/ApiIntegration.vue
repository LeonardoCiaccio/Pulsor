<template>
  <div class="p-8 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-purple-800 mb-4">🌐 API Integration</h1>
      <p class="text-lg text-purple-600 mb-6">
        Explore Pulsor's powerful API integration capabilities with REST endpoints, GraphQL queries, real-time data fetching, and comprehensive error handling.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- API Controls -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🎮 API Operations</h2>
        
        <div class="space-y-6">
          <!-- REST API Section -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">REST API Endpoints</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="fetchUsers" 
                :disabled="isLoading.users"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.users ? 'Loading...' : 'Fetch Users' }}
              </button>
              
              <button 
                @click="fetchPosts" 
                :disabled="isLoading.posts"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.posts ? 'Loading...' : 'Fetch Posts' }}
              </button>
              
              <button 
                @click="createPost" 
                :disabled="isLoading.create"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.create ? 'Creating...' : 'Create Post' }}
              </button>
              
              <button 
                @click="updatePost" 
                :disabled="isLoading.update"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.update ? 'Updating...' : 'Update Post' }}
              </button>
            </div>
          </div>

          <!-- GraphQL Section -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">GraphQL Operations</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="executeGraphQLQuery" 
                :disabled="isLoading.graphql"
                class="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.graphql ? 'Querying...' : 'GraphQL Query' }}
              </button>
              
              <button 
                @click="executeGraphQLMutation" 
                :disabled="isLoading.mutation"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.mutation ? 'Mutating...' : 'GraphQL Mutation' }}
              </button>
            </div>
          </div>

          <!-- Real-time Data -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Real-time Data</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="toggleRealTimeData" 
                class="px-4 py-2 rounded-md transition-colors"
                :class="isRealTimeActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'"
              >
                {{ isRealTimeActive ? 'Stop Real-time' : 'Start Real-time' }}
              </button>
              
              <button 
                @click="fetchWeatherData" 
                :disabled="isLoading.weather"
                class="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.weather ? 'Loading...' : 'Weather Data' }}
              </button>
            </div>
          </div>

          <!-- Batch Operations -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Batch Operations</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="executeBatchRequests" 
                :disabled="isLoading.batch"
                class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.batch ? 'Processing...' : 'Batch Requests' }}
              </button>
              
              <button 
                @click="executeParallelRequests" 
                :disabled="isLoading.parallel"
                class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition-colors"
              >
                {{ isLoading.parallel ? 'Processing...' : 'Parallel Requests' }}
              </button>
            </div>
          </div>
        </div>

        <!-- API Configuration -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-700 mb-3">API Configuration</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Base URL:</span>
              <span class="font-mono text-xs">{{ apiConfig.baseUrl }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Timeout:</span>
              <span class="font-mono text-xs">{{ apiConfig.timeout }}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Retry Attempts:</span>
              <span class="font-mono text-xs">{{ apiConfig.retryAttempts }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Cache TTL:</span>
              <span class="font-mono text-xs">{{ apiConfig.cacheTTL }}s</span>
            </div>
          </div>
        </div>
      </div>

      <!-- API Response Display -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 API Responses</h2>
        
        <div class="space-y-4">
          <!-- Response Tabs -->
          <div class="flex space-x-2 border-b">
            <button 
              v-for="tab in responseTabs" 
              :key="tab.id"
              @click="activeResponseTab = tab.id"
              class="px-3 py-2 text-sm font-medium transition-colors"
              :class="activeResponseTab === tab.id ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600 hover:text-gray-800'"
            >
              {{ tab.label }}
              <span v-if="tab.count > 0" class="ml-1 px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Response Content -->
          <div class="max-h-96 overflow-y-auto">
            <!-- Latest Response -->
            <div v-if="activeResponseTab === 'latest' && latestResponse" class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-gray-700">{{ latestResponse.endpoint }}</span>
                <span class="text-xs text-gray-500">{{ formatTimestamp(latestResponse.timestamp) }}</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">Status:</span>
                <span class="px-2 py-1 rounded-full text-xs font-medium" 
                      :class="getStatusClass(latestResponse.status)">
                  {{ latestResponse.status }}
                </span>
                <span class="text-sm text-gray-600">{{ latestResponse.duration }}ms</span>
              </div>
              
              <div class="bg-gray-50 p-3 rounded-lg">
                <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(latestResponse.data, null, 2) }}</pre>
              </div>
            </div>

            <!-- All Responses -->
            <div v-else-if="activeResponseTab === 'all'" class="space-y-3">
              <div v-for="response in apiResponses.slice(0, 10)" :key="response.id" 
                   class="border border-gray-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm">{{ response.endpoint }}</span>
                  <span class="text-xs text-gray-500">{{ formatTimestamp(response.timestamp) }}</span>
                </div>
                
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2 py-1 rounded-full text-xs font-medium" 
                        :class="getStatusClass(response.status)">
                    {{ response.status }}
                  </span>
                  <span class="text-xs text-gray-600">{{ response.duration }}ms</span>
                </div>
                
                <div class="bg-gray-50 p-2 rounded text-xs">
                  <pre class="text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(response.data, null, 2).substring(0, 200) }}{{ JSON.stringify(response.data, null, 2).length > 200 ? '...' : '' }}</pre>
                </div>
              </div>
            </div>

            <!-- Errors -->
            <div v-else-if="activeResponseTab === 'errors'" class="space-y-3">
              <div v-for="error in apiErrors.slice(0, 10)" :key="error.id" 
                   class="border border-red-200 bg-red-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm text-red-800">{{ error.endpoint }}</span>
                  <span class="text-xs text-red-600">{{ formatTimestamp(error.timestamp) }}</span>
                </div>
                
                <div class="text-sm text-red-700 mb-2">{{ error.message }}</div>
                
                <div v-if="error.details" class="bg-red-100 p-2 rounded text-xs">
                  <pre class="text-red-700 whitespace-pre-wrap">{{ JSON.stringify(error.details, null, 2) }}</pre>
                </div>
              </div>
            </div>

            <!-- Real-time Data -->
            <div v-else-if="activeResponseTab === 'realtime'" class="space-y-3">
              <div v-for="data in realTimeData.slice(0, 15)" :key="data.id" 
                   class="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm text-blue-800">{{ data.source }}</span>
                  <span class="text-xs text-blue-600">{{ formatTimestamp(data.timestamp) }}</span>
                </div>
                
                <div class="text-sm text-blue-700">{{ data.message }}</div>
                
                <div v-if="data.value !== undefined" class="mt-2">
                  <span class="text-lg font-bold text-blue-800">{{ data.value }}</span>
                  <span class="text-sm text-blue-600 ml-2">{{ data.unit }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="getTabData(activeResponseTab).length === 0" class="text-center py-8">
              <div class="text-gray-400 text-lg mb-2">📭</div>
              <div class="text-gray-500 text-sm">No {{ activeResponseTab }} data yet</div>
              <div class="text-gray-400 text-xs mt-1">Start making API calls to see results here</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">API Integration Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create API client with Pulsor
const createApiClient = CreatePulser('api:client', (config) => {
  const baseURL = config.baseURL || 'https://jsonplaceholder.typicode.com'
  const timeout = config.timeout || 5000
  const retryAttempts = config.retryAttempts || 3
  
  return {
    baseURL,
    timeout,
    retryAttempts,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    }
  }
})

// HTTP request handler with retry logic
const makeRequest = CreatePulser('api:request', async (options) => {
  const { method, url, data, headers, timeout, retryAttempts } = options
  let lastError
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const startTime = Date.now()
      
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(timeout)
      })
      
      const duration = Date.now() - startTime
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        duration,
        attempt,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      lastError = error
      
      if (attempt < retryAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
})

// REST API operations
const fetchUsers = CreatePulser('api:users:fetch', async () => {
  const client = createApiClient.pulse({ baseURL: 'https://jsonplaceholder.typicode.com' })
  
  return await makeRequest.pulse({
    method: 'GET',
    url: `${client.baseURL}/users`,
    headers: client.headers,
    timeout: client.timeout,
    retryAttempts: client.retryAttempts
  })
})

const createPost = CreatePulser('api:posts:create', async (postData) => {
  const client = createApiClient.pulse({ baseURL: 'https://jsonplaceholder.typicode.com' })
  
  return await makeRequest.pulse({
    method: 'POST',
    url: `${client.baseURL}/posts`,
    data: postData,
    headers: client.headers,
    timeout: client.timeout,
    retryAttempts: client.retryAttempts
  })
})

// GraphQL operations
const executeGraphQL = CreatePulser('api:graphql', async (query, variables = {}) => {
  const client = createApiClient.pulse({ 
    baseURL: 'https://api.github.com/graphql',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  })
  
  return await makeRequest.pulse({
    method: 'POST',
    url: client.baseURL,
    data: { query, variables },
    headers: client.headers,
    timeout: client.timeout,
    retryAttempts: client.retryAttempts
  })
})

// Real-time data streaming
const startRealTimeStream = CreatePulser('api:realtime:start', (endpoint) => {
  const eventSource = new EventSource(endpoint)
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    Pulsor('api:realtime:data').pulse(data)
  }
  
  eventSource.onerror = (error) => {
    Pulsor('api:realtime:error').pulse(error)
  }
  
  return eventSource
})

// Batch request processing
const processBatchRequests = CreatePulser('api:batch', async (requests) => {
  const results = []
  
  for (const request of requests) {
    try {
      const result = await makeRequest.pulse(request)
      results.push({ success: true, data: result })
    } catch (error) {
      results.push({ success: false, error: error.message })
    }
  }
  
  return results
})

// Parallel request processing
const processParallelRequests = CreatePulser('api:parallel', async (requests) => {
  const promises = requests.map(request => 
    makeRequest.pulse(request).catch(error => ({ error: error.message }))
  )
  
  return await Promise.all(promises)
})

// API response caching
const cacheResponse = CreatePulser('api:cache:set', (key, data, ttl = 300) => {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
    ttl: ttl * 1000 // Convert to milliseconds
  }
  
  localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheEntry))
})

const getCachedResponse = CreatePulser('api:cache:get', (key) => {
  const cached = localStorage.getItem(`api_cache_${key}`)
  
  if (!cached) return null
  
  const cacheEntry = JSON.parse(cached)
  const isExpired = Date.now() - cacheEntry.timestamp > cacheEntry.ttl
  
  if (isExpired) {
    localStorage.removeItem(`api_cache_${key}`)
    return null
  }
  
  return cacheEntry.data
})</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Auto Retry</h3>
        <p class="text-gray-600 text-sm">Automatic retry logic with exponential backoff for failed requests and network errors.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Response Caching</h3>
        <p class="text-gray-600 text-sm">Intelligent caching system with TTL support to reduce API calls and improve performance.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">🔗</div>
        <h3 class="font-semibold text-gray-800 mb-2">Request Chaining</h3>
        <p class="text-gray-600 text-sm">Chain multiple API calls with dependency management and error propagation.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">📊</div>
        <h3 class="font-semibold text-gray-800 mb-2">Real-time Monitoring</h3>
        <p class="text-gray-600 text-sm">Monitor API performance, track response times, and analyze error patterns in real-time.</p>
      </div>
    </div>

    <!-- API Statistics -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">📈 API Statistics</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ apiStats.totalRequests }}</div>
          <div class="text-sm text-gray-600">Total Requests</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ apiStats.successfulRequests }}</div>
          <div class="text-sm text-gray-600">Successful</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ apiStats.failedRequests }}</div>
          <div class="text-sm text-gray-600">Failed</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ apiStats.averageResponseTime }}ms</div>
          <div class="text-sm text-gray-600">Avg Response Time</div>
        </div>
      </div>
      
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Success Rate</h3>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-green-600 h-3 rounded-full transition-all duration-300" 
                 :style="{ width: apiStats.successRate + '%' }"></div>
          </div>
          <div class="text-sm text-gray-600 mt-1">{{ apiStats.successRate.toFixed(1) }}% success rate</div>
        </div>
        
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Cache Hit Rate</h3>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                 :style="{ width: apiStats.cacheHitRate + '%' }"></div>
          </div>
          <div class="text-sm text-gray-600 mt-1">{{ apiStats.cacheHitRate.toFixed(1) }}% cache hits</div>
        </div>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">API Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No API activity yet. Start making requests to see the activity log!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Loading states
const isLoading = reactive({
  users: false,
  posts: false,
  create: false,
  update: false,
  graphql: false,
  mutation: false,
  weather: false,
  batch: false,
  parallel: false
})

// API data
const apiResponses = ref([])
const apiErrors = ref([])
const realTimeData = ref([])
const latestResponse = ref(null)
const activityLog = ref([])
const isRealTimeActive = ref(false)
const realTimeInterval = ref(null)

// UI state
const activeResponseTab = ref('latest')

// API configuration
const apiConfig = reactive({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  retryAttempts: 3,
  cacheTTL: 300
})

// Response tabs
const responseTabs = computed(() => [
  { id: 'latest', label: 'Latest', count: latestResponse.value ? 1 : 0 },
  { id: 'all', label: 'All Responses', count: apiResponses.value.length },
  { id: 'errors', label: 'Errors', count: apiErrors.value.length },
  { id: 'realtime', label: 'Real-time', count: realTimeData.value.length }
])

// API statistics
const apiStats = computed(() => {
  const total = apiResponses.value.length
  const successful = apiResponses.value.filter(r => r.status >= 200 && r.status < 300).length
  const failed = total - successful
  const avgResponseTime = total > 0 
    ? Math.round(apiResponses.value.reduce((sum, r) => sum + r.duration, 0) / total)
    : 0
  const successRate = total > 0 ? (successful / total) * 100 : 0
  const cacheHitRate = Math.random() * 100 // Simulated cache hit rate
  
  return {
    totalRequests: total,
    successfulRequests: successful,
    failedRequests: failed,
    averageResponseTime: avgResponseTime,
    successRate,
    cacheHitRate
  }
})

// Setup API system
const setupApiSystem = () => {
  // Create API client
  CreatePulser('api:client', (config = {}) => {
    return {
      baseURL: config.baseURL || apiConfig.baseUrl,
      timeout: config.timeout || apiConfig.timeout,
      retryAttempts: config.retryAttempts || apiConfig.retryAttempts,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    }
  })
  
  // HTTP request handler
  CreatePulser('api:request', async (options) => {
    const { method, url, data, headers, timeout, retryAttempts = 1 } = options
    let lastError
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const startTime = Date.now()
        
        // Simulate network request
        const response = await simulateApiRequest(method, url, data, timeout)
        const duration = Date.now() - startTime
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          duration,
          attempt,
          headers: response.headers || {}
        }
      } catch (error) {
        lastError = error
        
        if (attempt < retryAttempts) {
          const delay = Math.pow(2, attempt) * 500 // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
          logActivity(`Retry attempt ${attempt + 1} for ${url}`, 'warning')
        }
      }
    }
    
    throw lastError
  })
  
  // GraphQL handler
  CreatePulser('api:graphql', async (query, variables = {}) => {
    const client = Pulsor('api:client').pulse({
      baseURL: 'https://api.github.com/graphql'
    })
    
    return await Pulsor('api:request').pulse({
      method: 'POST',
      url: client.baseURL,
      data: { query, variables },
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
  })
  
  // Batch request processor
  CreatePulser('api:batch', async (requests) => {
    const results = []
    
    for (const request of requests) {
      try {
        const result = await Pulsor('api:request').pulse(request)
        results.push({ success: true, data: result })
      } catch (error) {
        results.push({ success: false, error: error.message })
      }
    }
    
    return results
  })
  
  // Parallel request processor
  CreatePulser('api:parallel', async (requests) => {
    const promises = requests.map(request => 
      Pulsor('api:request').pulse(request).catch(error => ({ error: error.message }))
    )
    
    return await Promise.all(promises)
  })
}

// Simulate API requests (since we can't make real external requests in demo)
const simulateApiRequest = async (method, url, data, timeout) => {
  // Simulate network delay
  const delay = Math.random() * 1000 + 200
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Network error: Connection timeout')
  }
  
  // Generate mock response based on URL
  let mockData
  let status = 200
  
  if (url.includes('/users')) {
    mockData = generateMockUsers()
  } else if (url.includes('/posts')) {
    if (method === 'POST') {
      mockData = { id: Math.floor(Math.random() * 1000), ...data }
      status = 201
    } else if (method === 'PUT') {
      mockData = { id: 1, ...data }
    } else {
      mockData = generateMockPosts()
    }
  } else if (url.includes('weather')) {
    mockData = generateMockWeather()
  } else if (url.includes('graphql')) {
    mockData = generateMockGraphQLResponse()
  } else {
    mockData = { message: 'Mock API response', timestamp: Date.now() }
  }
  
  return {
    status,
    statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Success',
    data: mockData,
    headers: {
      'content-type': 'application/json',
      'x-response-time': delay.toFixed(0) + 'ms'
    }
  }
}

// Mock data generators
const generateMockUsers = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    username: `user${i + 1}`,
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    website: `user${i + 1}.example.com`
  }))
}

const generateMockPosts = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Post Title ${i + 1}`,
    body: `This is the body content for post ${i + 1}. It contains some sample text to demonstrate the API response structure.`,
    userId: Math.floor(Math.random() * 5) + 1
  }))
}

const generateMockWeather = () => {
  return {
    location: 'New York, NY',
    temperature: Math.floor(Math.random() * 30) + 10,
    humidity: Math.floor(Math.random() * 50) + 30,
    windSpeed: Math.floor(Math.random() * 20) + 5,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
    timestamp: Date.now()
  }
}

const generateMockGraphQLResponse = () => {
  return {
    data: {
      viewer: {
        login: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        repositories: {
          totalCount: 42,
          nodes: [
            { name: 'awesome-project', stargazerCount: 123 },
            { name: 'cool-library', stargazerCount: 456 }
          ]
        }
      }
    }
  }
}

// API operation functions
const fetchUsers = async () => {
  isLoading.users = true
  logActivity('Fetching users...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const response = await Pulsor('api:request').pulse({
      method: 'GET',
      url: `${client.baseURL}/users`,
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
    
    addApiResponse('GET /users', response)
    logActivity(`Successfully fetched ${response.data.length} users`, 'success')
  } catch (error) {
    addApiError('GET /users', error)
    logActivity(`Failed to fetch users: ${error.message}`, 'error')
  } finally {
    isLoading.users = false
  }
}

const fetchPosts = async () => {
  isLoading.posts = true
  logActivity('Fetching posts...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const response = await Pulsor('api:request').pulse({
      method: 'GET',
      url: `${client.baseURL}/posts`,
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
    
    addApiResponse('GET /posts', response)
    logActivity(`Successfully fetched ${response.data.length} posts`, 'success')
  } catch (error) {
    addApiError('GET /posts', error)
    logActivity(`Failed to fetch posts: ${error.message}`, 'error')
  } finally {
    isLoading.posts = false
  }
}

const createPost = async () => {
  isLoading.create = true
  logActivity('Creating new post...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const postData = {
      title: 'New Post from Pulsor Demo',
      body: 'This post was created using Pulsor\'s API integration system.',
      userId: Math.floor(Math.random() * 5) + 1
    }
    
    const response = await Pulsor('api:request').pulse({
      method: 'POST',
      url: `${client.baseURL}/posts`,
      data: postData,
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
    
    addApiResponse('POST /posts', response)
    logActivity(`Successfully created post with ID ${response.data.id}`, 'success')
  } catch (error) {
    addApiError('POST /posts', error)
    logActivity(`Failed to create post: ${error.message}`, 'error')
  } finally {
    isLoading.create = false
  }
}

const updatePost = async () => {
  isLoading.update = true
  logActivity('Updating post...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const updateData = {
      id: 1,
      title: 'Updated Post Title',
      body: 'This post has been updated using Pulsor\'s API system.',
      userId: 1
    }
    
    const response = await Pulsor('api:request').pulse({
      method: 'PUT',
      url: `${client.baseURL}/posts/1`,
      data: updateData,
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
    
    addApiResponse('PUT /posts/1', response)
    logActivity('Successfully updated post', 'success')
  } catch (error) {
    addApiError('PUT /posts/1', error)
    logActivity(`Failed to update post: ${error.message}`, 'error')
  } finally {
    isLoading.update = false
  }
}

const executeGraphQLQuery = async () => {
  isLoading.graphql = true
  logActivity('Executing GraphQL query...', 'info')
  
  try {
    const query = `
      query {
        viewer {
          login
          name
          email
          repositories(first: 5) {
            totalCount
            nodes {
              name
              stargazerCount
            }
          }
        }
      }
    `
    
    const response = await Pulsor('api:graphql').pulse(query)
    
    addApiResponse('GraphQL Query', response)
    logActivity('Successfully executed GraphQL query', 'success')
  } catch (error) {
    addApiError('GraphQL Query', error)
    logActivity(`GraphQL query failed: ${error.message}`, 'error')
  } finally {
    isLoading.graphql = false
  }
}

const executeGraphQLMutation = async () => {
  isLoading.mutation = true
  logActivity('Executing GraphQL mutation...', 'info')
  
  try {
    const mutation = `
      mutation CreateRepository($name: String!, $description: String) {
        createRepository(input: {
          name: $name
          description: $description
          visibility: PUBLIC
        }) {
          repository {
            id
            name
            url
          }
        }
      }
    `
    
    const variables = {
      name: 'pulsor-demo-repo',
      description: 'Repository created via Pulsor GraphQL demo'
    }
    
    const response = await Pulsor('api:graphql').pulse(mutation, variables)
    
    addApiResponse('GraphQL Mutation', response)
    logActivity('Successfully executed GraphQL mutation', 'success')
  } catch (error) {
    addApiError('GraphQL Mutation', error)
    logActivity(`GraphQL mutation failed: ${error.message}`, 'error')
  } finally {
    isLoading.mutation = false
  }
}

const fetchWeatherData = async () => {
  isLoading.weather = true
  logActivity('Fetching weather data...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse({
      baseURL: 'https://api.weather.com'
    })
    
    const response = await Pulsor('api:request').pulse({
      method: 'GET',
      url: `${client.baseURL}/current`,
      headers: client.headers,
      timeout: client.timeout,
      retryAttempts: client.retryAttempts
    })
    
    addApiResponse('GET /weather/current', response)
    logActivity('Successfully fetched weather data', 'success')
  } catch (error) {
    addApiError('GET /weather/current', error)
    logActivity(`Failed to fetch weather data: ${error.message}`, 'error')
  } finally {
    isLoading.weather = false
  }
}

const executeBatchRequests = async () => {
  isLoading.batch = true
  logActivity('Executing batch requests...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const requests = [
      {
        method: 'GET',
        url: `${client.baseURL}/users/1`,
        headers: client.headers,
        timeout: client.timeout
      },
      {
        method: 'GET',
        url: `${client.baseURL}/posts/1`,
        headers: client.headers,
        timeout: client.timeout
      },
      {
        method: 'GET',
        url: `${client.baseURL}/albums/1`,
        headers: client.headers,
        timeout: client.timeout
      }
    ]
    
    const results = await Pulsor('api:batch').pulse(requests)
    
    addApiResponse('Batch Requests', {
      status: 200,
      statusText: 'OK',
      data: results,
      duration: Math.random() * 1000 + 500
    })
    
    const successCount = results.filter(r => r.success).length
    logActivity(`Batch completed: ${successCount}/${results.length} successful`, 'success')
  } catch (error) {
    addApiError('Batch Requests', error)
    logActivity(`Batch requests failed: ${error.message}`, 'error')
  } finally {
    isLoading.batch = false
  }
}

const executeParallelRequests = async () => {
  isLoading.parallel = true
  logActivity('Executing parallel requests...', 'info')
  
  try {
    const client = Pulsor('api:client').pulse()
    const requests = [
      {
        method: 'GET',
        url: `${client.baseURL}/users`,
        headers: client.headers,
        timeout: client.timeout
      },
      {
        method: 'GET',
        url: `${client.baseURL}/posts`,
        headers: client.headers,
        timeout: client.timeout
      },
      {
        method: 'GET',
        url: `${client.baseURL}/comments`,
        headers: client.headers,
        timeout: client.timeout
      }
    ]
    
    const results = await Pulsor('api:parallel').pulse(requests)
    
    addApiResponse('Parallel Requests', {
      status: 200,
      statusText: 'OK',
      data: results,
      duration: Math.random() * 800 + 300
    })
    
    const successCount = results.filter(r => !r.error).length
    logActivity(`Parallel execution completed: ${successCount}/${results.length} successful`, 'success')
  } catch (error) {
    addApiError('Parallel Requests', error)
    logActivity(`Parallel requests failed: ${error.message}`, 'error')
  } finally {
    isLoading.parallel = false
  }
}

const toggleRealTimeData = () => {
  if (isRealTimeActive.value) {
    stopRealTimeData()
  } else {
    startRealTimeData()
  }
}

const startRealTimeData = () => {
  isRealTimeActive.value = true
  logActivity('Started real-time data stream', 'info')
  
  realTimeInterval.value = setInterval(() => {
    const sources = ['Temperature Sensor', 'Stock Price', 'User Activity', 'System Load', 'Network Traffic']
    const source = sources[Math.floor(Math.random() * sources.length)]
    
    let data
    switch (source) {
      case 'Temperature Sensor':
        data = {
          id: Date.now(),
          source,
          message: 'Temperature reading updated',
          value: (Math.random() * 30 + 10).toFixed(1),
          unit: '°C',
          timestamp: Date.now()
        }
        break
      case 'Stock Price':
        data = {
          id: Date.now(),
          source,
          message: 'Stock price updated',
          value: (Math.random() * 100 + 50).toFixed(2),
          unit: 'USD',
          timestamp: Date.now()
        }
        break
      case 'User Activity':
        data = {
          id: Date.now(),
          source,
          message: 'Active users count updated',
          value: Math.floor(Math.random() * 1000 + 100),
          unit: 'users',
          timestamp: Date.now()
        }
        break
      case 'System Load':
        data = {
          id: Date.now(),
          source,
          message: 'System load updated',
          value: (Math.random() * 100).toFixed(1),
          unit: '%',
          timestamp: Date.now()
        }
        break
      case 'Network Traffic':
        data = {
          id: Date.now(),
          source,
          message: 'Network traffic updated',
          value: (Math.random() * 1000).toFixed(0),
          unit: 'Mbps',
          timestamp: Date.now()
        }
        break
    }
    
    realTimeData.value.unshift(data)
    
    // Keep only last 50 entries
    if (realTimeData.value.length > 50) {
      realTimeData.value = realTimeData.value.slice(0, 50)
    }
  }, 2000)
}

const stopRealTimeData = () => {
  isRealTimeActive.value = false
  if (realTimeInterval.value) {
    clearInterval(realTimeInterval.value)
    realTimeInterval.value = null
  }
  logActivity('Stopped real-time data stream', 'info')
}

// Utility functions
const addApiResponse = (endpoint, response) => {
  const responseData = {
    id: Date.now(),
    endpoint,
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    duration: response.duration,
    timestamp: Date.now()
  }
  
  apiResponses.value.unshift(responseData)
  latestResponse.value = responseData
  
  // Keep only last 50 responses
  if (apiResponses.value.length > 50) {
    apiResponses.value = apiResponses.value.slice(0, 50)
  }
}

const addApiError = (endpoint, error) => {
  const errorData = {
    id: Date.now(),
    endpoint,
    message: error.message,
    details: error.stack || error,
    timestamp: Date.now()
  }
  
  apiErrors.value.unshift(errorData)
  
  // Keep only last 20 errors
  if (apiErrors.value.length > 20) {
    apiErrors.value = apiErrors.value.slice(0, 20)
  }
}

const getTabData = (tabId) => {
  switch (tabId) {
    case 'latest': return latestResponse.value ? [latestResponse.value] : []
    case 'all': return apiResponses.value
    case 'errors': return apiErrors.value
    case 'realtime': return realTimeData.value
    default: return []
  }
}

const getStatusClass = (status) => {
  if (status >= 200 && status < 300) {
    return 'bg-green-100 text-green-800'
  } else if (status >= 400 && status < 500) {
    return 'bg-orange-100 text-orange-800'
  } else if (status >= 500) {
    return 'bg-red-100 text-red-800'
  } else {
    return 'bg-gray-100 text-gray-800'
  }
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const logActivity = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  activityLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 30 entries
  if (activityLog.value.length > 30) {
    activityLog.value = activityLog.value.slice(0, 30)
  }
}

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    case 'warning': return 'text-orange-600'
    case 'info': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupApiSystem()
  logActivity('API Integration demo initialized', 'info')
})

onUnmounted(() => {
  stopRealTimeData()
  logActivity('API Integration demo unmounted', 'info')
})
</script>