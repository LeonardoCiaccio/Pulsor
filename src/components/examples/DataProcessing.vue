<template>
  <div class="p-8 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-emerald-800 mb-4">🔄 Data Processing</h1>
      <p class="text-lg text-emerald-600 mb-6">
        Discover Pulsor's powerful data processing capabilities with transformations, filtering, aggregations, and pipeline operations.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Data Input & Controls -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 Data Input & Processing</h2>
        
        <div class="space-y-4">
          <!-- Sample Data Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sample Dataset:</label>
            <select 
              v-model="selectedDataset" 
              @change="loadDataset"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="users">User Records (100 items)</option>
              <option value="sales">Sales Data (50 items)</option>
              <option value="products">Product Catalog (75 items)</option>
              <option value="logs">System Logs (200 items)</option>
            </select>
          </div>

          <!-- Custom Data Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Custom JSON Data:</label>
            <textarea 
              v-model="customData" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="4"
              placeholder="Enter JSON array data..."
            ></textarea>
            <button 
              @click="loadCustomData"
              class="mt-2 w-full bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Load Custom Data
            </button>
          </div>

          <!-- Processing Operations -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Processing Operations</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="processFilter"
                class="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Filter Data
              </button>
              <button 
                @click="processTransform"
                class="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
              >
                Transform
              </button>
              <button 
                @click="processAggregate"
                class="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Aggregate
              </button>
              <button 
                @click="processPipeline"
                class="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Full Pipeline
              </button>
            </div>
          </div>

          <!-- Processing Options -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Processing Options</h3>
            <div class="space-y-2">
              <label class="flex items-center">
                <input 
                  v-model="processingOptions.enableValidation" 
                  type="checkbox" 
                  class="mr-2 text-emerald-600 focus:ring-emerald-500"
                >
                <span class="text-sm text-gray-700">Enable Data Validation</span>
              </label>
              <label class="flex items-center">
                <input 
                  v-model="processingOptions.enableCaching" 
                  type="checkbox" 
                  class="mr-2 text-emerald-600 focus:ring-emerald-500"
                >
                <span class="text-sm text-gray-700">Enable Result Caching</span>
              </label>
              <label class="flex items-center">
                <input 
                  v-model="processingOptions.enableLogging" 
                  type="checkbox" 
                  class="mr-2 text-emerald-600 focus:ring-emerald-500"
                >
                <span class="text-sm text-gray-700">Enable Processing Logs</span>
              </label>
            </div>
          </div>

          <!-- Data Statistics -->
          <div class="p-4 bg-emerald-50 rounded-lg">
            <h4 class="font-semibold text-emerald-800 mb-2">Data Statistics</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-emerald-700">Original Items:</span>
                <span class="font-semibold ml-1">{{ originalData.length }}</span>
              </div>
              <div>
                <span class="text-emerald-700">Processed Items:</span>
                <span class="font-semibold ml-1">{{ processedData.length }}</span>
              </div>
              <div>
                <span class="text-emerald-700">Processing Time:</span>
                <span class="font-semibold ml-1">{{ lastProcessingTime }}ms</span>
              </div>
              <div>
                <span class="text-emerald-700">Operations:</span>
                <span class="font-semibold ml-1">{{ totalOperations }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Display -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📈 Processing Results</h2>
        
        <div class="space-y-4">
          <!-- Result Summary -->
          <div v-if="lastProcessingResult" class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">{{ lastProcessingResult.operation }} Results</h3>
            <p class="text-sm text-gray-600 mb-2">{{ lastProcessingResult.description }}</p>
            <div class="text-xs text-gray-500">
              Processed {{ lastProcessingResult.itemsProcessed }} items in {{ lastProcessingResult.duration }}ms
            </div>
          </div>

          <!-- Data Preview -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Data Preview (First 5 items)</h3>
            <div class="max-h-60 overflow-y-auto">
              <div v-for="(item, index) in previewData" :key="index" 
                   class="p-3 mb-2 bg-gray-50 rounded border-l-4 border-emerald-400">
                <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ formatDataItem(item) }}</pre>
              </div>
              <div v-if="processedData.length === 0" class="text-gray-400 text-sm italic text-center py-8">
                No processed data yet. Try one of the processing operations above.
              </div>
            </div>
          </div>

          <!-- Processing Pipeline Visualization -->
          <div v-if="pipelineSteps.length > 0" class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Processing Pipeline</h3>
            <div class="space-y-2">
              <div v-for="(step, index) in pipelineSteps" :key="index" 
                   class="flex items-center p-2 bg-gray-50 rounded">
                <div class="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  {{ index + 1 }}
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ step.name }}</div>
                  <div class="text-xs text-gray-600">{{ step.description }}</div>
                </div>
                <div class="text-xs text-gray-500">{{ step.duration }}ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">Data Processing Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create data processing pulsers
const dataFilter = CreatePulser('data:filter', (data, criteria) => {
  return data.filter(item => {
    return Object.keys(criteria).every(key => {
      if (typeof criteria[key] === 'function') {
        return criteria[key](item[key])
      }
      return item[key] === criteria[key]
    })
  })
})

const dataTransform = CreatePulser('data:transform', (data, transformFn) => {
  return data.map(transformFn)
})

const dataAggregate = CreatePulser('data:aggregate', (data, groupBy, aggregateFn) => {
  const groups = data.reduce((acc, item) => {
    const key = item[groupBy]
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  
  return Object.keys(groups).map(key => ({
    [groupBy]: key,
    ...aggregateFn(groups[key])
  }))
})

// Create processing pipeline
const processingPipeline = CreatePulser('data:pipeline', (data, steps) => {
  return steps.reduce((currentData, step) => {
    const startTime = performance.now()
    const result = step.processor.pulse(currentData, ...step.args)
    const duration = performance.now() - startTime
    
    console.log(`Step ${step.name} completed in ${duration.toFixed(2)}ms`)
    return result
  }, data)
})

// Add validation and caching
dataFilter.bind((data, criteria) => {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array')
  }
  console.log(`Filtering ${data.length} items with criteria:`, criteria)
})

// Usage examples
const users = [/* user data */]
const activeUsers = dataFilter.pulse(users, { active: true })
const userSummaries = dataTransform.pulse(activeUsers, user => ({
  id: user.id,
  name: user.name,
  lastLogin: user.lastLogin
}))

const usersByRole = dataAggregate.pulse(users, 'role', (group) => ({
  count: group.length,
  avgAge: group.reduce((sum, u) => sum + u.age, 0) / group.length
}))</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">🔍</div>
        <h3 class="font-semibold text-gray-800 mb-2">Advanced Filtering</h3>
        <p class="text-gray-600 text-sm">Complex filtering with multiple criteria, custom predicates, and nested object support.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Data Transformation</h3>
        <p class="text-gray-600 text-sm">Transform data structures with mapping, reshaping, and custom transformation functions.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">📊</div>
        <h3 class="font-semibold text-gray-800 mb-2">Aggregation Operations</h3>
        <p class="text-gray-600 text-sm">Group, sum, average, and perform complex aggregations on your data sets.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Processing Pipelines</h3>
        <p class="text-gray-600 text-sm">Chain multiple operations together for complex data processing workflows.</p>
      </div>
    </div>

    <!-- Processing Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Processing Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in processingLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="processingLog.length === 0" class="text-gray-400 text-sm italic">
          No processing activity yet. Try the operations above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const selectedDataset = ref('users')
const customData = ref('')
const originalData = ref([])
const processedData = ref([])
const lastProcessingTime = ref(0)
const totalOperations = ref(0)
const lastProcessingResult = ref(null)
const pipelineSteps = ref([])
const processingLog = ref([])

// Processing options
const processingOptions = reactive({
  enableValidation: true,
  enableCaching: true,
  enableLogging: true
})

// Computed properties
const previewData = computed(() => {
  return processedData.value.slice(0, 5)
})

// Sample datasets
const sampleDatasets = {
  users: () => Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    age: Math.floor(Math.random() * 50) + 18,
    role: ['admin', 'user', 'moderator'][Math.floor(Math.random() * 3)],
    active: Math.random() > 0.3,
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    score: Math.floor(Math.random() * 1000)
  })),
  
  sales: () => Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    product: `Product ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    amount: Math.floor(Math.random() * 1000) + 10,
    quantity: Math.floor(Math.random() * 10) + 1,
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    customer: `Customer ${i + 1}`,
    region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
    status: ['completed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)]
  })),
  
  products: () => Array.from({ length: 75 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
    price: Math.floor(Math.random() * 500) + 10,
    stock: Math.floor(Math.random() * 100),
    rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
    featured: Math.random() > 0.7,
    tags: ['new', 'sale', 'popular', 'limited'].filter(() => Math.random() > 0.6)
  })),
  
  logs: () => Array.from({ length: 200 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)],
    message: `Log message ${i + 1}`,
    source: ['api', 'database', 'auth', 'cache'][Math.floor(Math.random() * 4)],
    userId: Math.floor(Math.random() * 100) + 1,
    duration: Math.floor(Math.random() * 1000)
  }))
}

// Setup data processing system
const setupDataProcessing = () => {
  // Create data filter pulser
  CreatePulser('data:filter', (data, criteria) => {
    const startTime = performance.now()
    
    if (processingOptions.enableValidation && !Array.isArray(data)) {
      throw new Error('Data must be an array')
    }
    
    const result = data.filter(item => {
      return Object.keys(criteria).every(key => {
        const value = criteria[key]
        if (typeof value === 'function') {
          return value(item[key])
        }
        return item[key] === value
      })
    })
    
    const duration = performance.now() - startTime
    if (processingOptions.enableLogging) {
      logProcessing(`Filtered ${data.length} items to ${result.length} items`, 'filter')
    }
    
    return result
  })
  
  // Create data transform pulser
  CreatePulser('data:transform', (data, transformFn) => {
    const startTime = performance.now()
    
    if (processingOptions.enableValidation) {
      if (!Array.isArray(data)) throw new Error('Data must be an array')
      if (typeof transformFn !== 'function') throw new Error('Transform function required')
    }
    
    const result = data.map(transformFn)
    
    const duration = performance.now() - startTime
    if (processingOptions.enableLogging) {
      logProcessing(`Transformed ${data.length} items`, 'transform')
    }
    
    return result
  })
  
  // Create data aggregate pulser
  CreatePulser('data:aggregate', (data, groupBy, aggregateFn) => {
    const startTime = performance.now()
    
    if (processingOptions.enableValidation) {
      if (!Array.isArray(data)) throw new Error('Data must be an array')
      if (!groupBy) throw new Error('GroupBy field required')
      if (typeof aggregateFn !== 'function') throw new Error('Aggregate function required')
    }
    
    const groups = data.reduce((acc, item) => {
      const key = item[groupBy] || 'undefined'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
    
    const result = Object.keys(groups).map(key => ({
      [groupBy]: key,
      ...aggregateFn(groups[key])
    }))
    
    const duration = performance.now() - startTime
    if (processingOptions.enableLogging) {
      logProcessing(`Aggregated ${data.length} items into ${result.length} groups`, 'aggregate')
    }
    
    return result
  })
  
  // Create pipeline processor
  CreatePulser('data:pipeline', (data, steps) => {
    const startTime = performance.now()
    pipelineSteps.value = []
    
    const result = steps.reduce((currentData, step, index) => {
      const stepStartTime = performance.now()
      const stepResult = step.processor.pulse(currentData, ...step.args)
      const stepDuration = performance.now() - stepStartTime
      
      pipelineSteps.value.push({
        name: step.name,
        description: step.description,
        duration: Math.round(stepDuration * 100) / 100
      })
      
      return stepResult
    }, data)
    
    const totalDuration = performance.now() - startTime
    if (processingOptions.enableLogging) {
      logProcessing(`Pipeline completed with ${steps.length} steps`, 'pipeline')
    }
    
    return result
  })
  
  // Load initial dataset
  loadDataset()
}

// Data loading functions
const loadDataset = () => {
  originalData.value = sampleDatasets[selectedDataset.value]()
  processedData.value = [...originalData.value]
  logProcessing(`Loaded ${selectedDataset.value} dataset with ${originalData.value.length} items`, 'load')
}

const loadCustomData = () => {
  try {
    const parsed = JSON.parse(customData.value)
    if (Array.isArray(parsed)) {
      originalData.value = parsed
      processedData.value = [...originalData.value]
      logProcessing(`Loaded custom dataset with ${originalData.value.length} items`, 'load')
    } else {
      throw new Error('Data must be an array')
    }
  } catch (error) {
    logProcessing(`Failed to load custom data: ${error.message}`, 'error')
  }
}

// Processing operations
const processFilter = () => {
  const startTime = performance.now()
  
  // Define filter criteria based on dataset type
  let criteria = {}
  switch (selectedDataset.value) {
    case 'users':
      criteria = { active: true, role: 'user' }
      break
    case 'sales':
      criteria = { status: 'completed' }
      break
    case 'products':
      criteria = { featured: true }
      break
    case 'logs':
      criteria = { level: 'error' }
      break
  }
  
  try {
    processedData.value = Pulsor('data:filter').pulse(originalData.value, criteria)
    const duration = performance.now() - startTime
    lastProcessingTime.value = Math.round(duration * 100) / 100
    totalOperations.value++
    
    lastProcessingResult.value = {
      operation: 'Filter',
      description: `Applied filter criteria: ${JSON.stringify(criteria)}`,
      itemsProcessed: processedData.value.length,
      duration: lastProcessingTime.value
    }
  } catch (error) {
    logProcessing(`Filter operation failed: ${error.message}`, 'error')
  }
}

const processTransform = () => {
  const startTime = performance.now()
  
  // Define transform function based on dataset type
  let transformFn
  switch (selectedDataset.value) {
    case 'users':
      transformFn = user => ({
        id: user.id,
        displayName: user.name.toUpperCase(),
        contact: user.email,
        ageGroup: user.age < 30 ? 'young' : user.age < 50 ? 'middle' : 'senior',
        isActive: user.active
      })
      break
    case 'sales':
      transformFn = sale => ({
        id: sale.id,
        productName: sale.product,
        revenue: sale.amount * sale.quantity,
        month: new Date(sale.date).toLocaleString('default', { month: 'long' }),
        customerInfo: sale.customer
      })
      break
    case 'products':
      transformFn = product => ({
        id: product.id,
        title: product.name,
        priceRange: product.price < 50 ? 'budget' : product.price < 200 ? 'mid' : 'premium',
        availability: product.stock > 0 ? 'in-stock' : 'out-of-stock',
        popularity: product.rating > 4 ? 'high' : product.rating > 3 ? 'medium' : 'low'
      })
      break
    case 'logs':
      transformFn = log => ({
        id: log.id,
        time: new Date(log.timestamp).toLocaleTimeString(),
        severity: log.level.toUpperCase(),
        component: log.source,
        performance: log.duration < 100 ? 'fast' : log.duration < 500 ? 'normal' : 'slow'
      })
      break
  }
  
  try {
    processedData.value = Pulsor('data:transform').pulse(originalData.value, transformFn)
    const duration = performance.now() - startTime
    lastProcessingTime.value = Math.round(duration * 100) / 100
    totalOperations.value++
    
    lastProcessingResult.value = {
      operation: 'Transform',
      description: 'Applied data transformation with field mapping and calculations',
      itemsProcessed: processedData.value.length,
      duration: lastProcessingTime.value
    }
  } catch (error) {
    logProcessing(`Transform operation failed: ${error.message}`, 'error')
  }
}

const processAggregate = () => {
  const startTime = performance.now()
  
  // Define aggregation based on dataset type
  let groupBy, aggregateFn
  switch (selectedDataset.value) {
    case 'users':
      groupBy = 'role'
      aggregateFn = group => ({
        count: group.length,
        avgAge: Math.round(group.reduce((sum, u) => sum + u.age, 0) / group.length),
        activeCount: group.filter(u => u.active).length,
        avgScore: Math.round(group.reduce((sum, u) => sum + u.score, 0) / group.length)
      })
      break
    case 'sales':
      groupBy = 'region'
      aggregateFn = group => ({
        count: group.length,
        totalRevenue: group.reduce((sum, s) => sum + (s.amount * s.quantity), 0),
        avgAmount: Math.round(group.reduce((sum, s) => sum + s.amount, 0) / group.length),
        completedSales: group.filter(s => s.status === 'completed').length
      })
      break
    case 'products':
      groupBy = 'category'
      aggregateFn = group => ({
        count: group.length,
        avgPrice: Math.round(group.reduce((sum, p) => sum + p.price, 0) / group.length),
        avgRating: Math.round(group.reduce((sum, p) => sum + p.rating, 0) / group.length * 10) / 10,
        totalStock: group.reduce((sum, p) => sum + p.stock, 0)
      })
      break
    case 'logs':
      groupBy = 'level'
      aggregateFn = group => ({
        count: group.length,
        avgDuration: Math.round(group.reduce((sum, l) => sum + l.duration, 0) / group.length),
        sources: [...new Set(group.map(l => l.source))].length,
        recentCount: group.filter(l => Date.now() - new Date(l.timestamp).getTime() < 24 * 60 * 60 * 1000).length
      })
      break
  }
  
  try {
    processedData.value = Pulsor('data:aggregate').pulse(originalData.value, groupBy, aggregateFn)
    const duration = performance.now() - startTime
    lastProcessingTime.value = Math.round(duration * 100) / 100
    totalOperations.value++
    
    lastProcessingResult.value = {
      operation: 'Aggregate',
      description: `Grouped by ${groupBy} with statistical calculations`,
      itemsProcessed: processedData.value.length,
      duration: lastProcessingTime.value
    }
  } catch (error) {
    logProcessing(`Aggregate operation failed: ${error.message}`, 'error')
  }
}

const processPipeline = () => {
  const startTime = performance.now()
  
  // Define pipeline steps based on dataset type
  let steps = []
  switch (selectedDataset.value) {
    case 'users':
      steps = [
        {
          name: 'Filter Active Users',
          description: 'Remove inactive users from dataset',
          processor: Pulsor('data:filter'),
          args: [{ active: true }]
        },
        {
          name: 'Transform User Data',
          description: 'Reshape user objects with computed fields',
          processor: Pulsor('data:transform'),
          args: [user => ({
            ...user,
            ageGroup: user.age < 30 ? 'young' : user.age < 50 ? 'middle' : 'senior',
            scoreLevel: user.score > 750 ? 'high' : user.score > 500 ? 'medium' : 'low'
          })]
        },
        {
          name: 'Aggregate by Role',
          description: 'Group users by role with statistics',
          processor: Pulsor('data:aggregate'),
          args: ['role', group => ({
            count: group.length,
            avgAge: Math.round(group.reduce((sum, u) => sum + u.age, 0) / group.length),
            avgScore: Math.round(group.reduce((sum, u) => sum + u.score, 0) / group.length)
          })]
        }
      ]
      break
    default:
      steps = [
        {
          name: 'Data Validation',
          description: 'Validate data structure and types',
          processor: Pulsor('data:transform'),
          args: [item => ({ ...item, validated: true })]
        },
        {
          name: 'Data Enhancement',
          description: 'Add computed fields and metadata',
          processor: Pulsor('data:transform'),
          args: [item => ({ ...item, processedAt: new Date().toISOString() })]
        }
      ]
  }
  
  try {
    processedData.value = Pulsor('data:pipeline').pulse(originalData.value, steps)
    const duration = performance.now() - startTime
    lastProcessingTime.value = Math.round(duration * 100) / 100
    totalOperations.value++
    
    lastProcessingResult.value = {
      operation: 'Pipeline',
      description: `Executed ${steps.length}-step processing pipeline`,
      itemsProcessed: processedData.value.length,
      duration: lastProcessingTime.value
    }
  } catch (error) {
    logProcessing(`Pipeline operation failed: ${error.message}`, 'error')
  }
}

// Utility functions
const formatDataItem = (item) => {
  return JSON.stringify(item, null, 2)
}

const logProcessing = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  processingLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 20 entries
  if (processingLog.value.length > 20) {
    processingLog.value = processingLog.value.slice(0, 20)
  }
}

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'filter': return 'text-blue-600'
    case 'transform': return 'text-purple-600'
    case 'aggregate': return 'text-orange-600'
    case 'pipeline': return 'text-red-600'
    case 'load': return 'text-green-600'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupDataProcessing()
  logProcessing('Data Processing demo initialized', 'info')
})

onUnmounted(() => {
  logProcessing('Data Processing demo unmounted', 'info')
})
</script>