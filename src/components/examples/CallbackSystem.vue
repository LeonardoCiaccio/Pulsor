<template>
  <div class="p-8 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-purple-800 mb-4">🔗 Callback System</h1>
      <p class="text-lg text-purple-600 mb-6">
        Discover Pulsor's advanced callback system with binding, unbinding, and chaining capabilities for complex event handling.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Interactive Demo -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Callback Demo</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Message to process:</label>
            <input 
              v-model="inputMessage" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter a message to process"
            >
          </div>

          <div class="flex space-x-2">
            <button 
              @click="processMessage"
              class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Process Message
            </button>
            <button 
              @click="processWithChain"
              class="flex-1 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
            >
              Chain Process
            </button>
          </div>

          <!-- Callback Management -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-800 mb-3">Callback Management</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="addLogger"
                :disabled="hasLogger"
                class="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ hasLogger ? 'Logger Active' : 'Add Logger' }}
              </button>
              <button 
                @click="removeLogger"
                :disabled="!hasLogger"
                class="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Logger
              </button>
              <button 
                @click="addValidator"
                :disabled="hasValidator"
                class="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ hasValidator ? 'Validator Active' : 'Add Validator' }}
              </button>
              <button 
                @click="removeValidator"
                :disabled="!hasValidator"
                class="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Validator
              </button>
            </div>
          </div>

          <!-- Active Callbacks Display -->
          <div class="p-4 bg-purple-50 rounded-lg">
            <h4 class="font-semibold text-purple-800 mb-2">Active Callbacks: {{ callbackCount }}</h4>
            <div class="space-y-1">
              <div v-if="hasLogger" class="text-sm text-green-700">✅ Logger Callback</div>
              <div v-if="hasValidator" class="text-sm text-blue-700">✅ Validator Callback</div>
              <div v-if="hasTransformer" class="text-sm text-purple-700">✅ Transformer Callback</div>
              <div v-if="callbackCount === 0" class="text-sm text-gray-500 italic">No callbacks active</div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="lastResult" class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <p class="text-purple-800 font-semibold">Processing Result:</p>
            <p class="text-purple-700 text-sm mt-1">{{ lastResult }}</p>
          </div>
        </div>
      </div>

      <!-- Code Example -->
      <div class="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-white mb-4">Callback Implementation</h2>
        <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create pulser with callbacks
const processor = CreatePulser('messageProcessor', 
  (msg) => msg.toUpperCase()
)

// Add callbacks
processor.bind((msg) => {
  console.log('Processing:', msg)
})

processor.bind((msg) => {
  if (msg.length < 3) {
    throw new Error('Message too short')
  }
})

// Chain multiple callbacks
processor
  .bind(logCallback)
  .bind(validateCallback)
  .bind(transformCallback)

// Use binds() for multiple callbacks
processor.binds([
  callback1,
  callback2,
  callback3
])

// Remove specific callback
processor.unbind(logCallback)

// Remove all callbacks
processor.unbindAll()</code></pre>
      </div>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">🔗</div>
        <h3 class="font-semibold text-gray-800 mb-2">Flexible Binding</h3>
        <p class="text-gray-600 text-sm">Bind and unbind callbacks dynamically. Each callback receives the same arguments as the main function.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">⛓️</div>
        <h3 class="font-semibold text-gray-800 mb-2">Method Chaining</h3>
        <p class="text-gray-600 text-sm">Chain multiple bind operations for clean, readable code and complex callback setups.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-purple-600 text-2xl mb-3">🛡️</div>
        <h3 class="font-semibold text-gray-800 mb-2">Error Isolation</h3>
        <p class="text-gray-600 text-sm">Callback errors are isolated and logged without affecting the main function or other callbacks.</p>
      </div>
    </div>

    <!-- Callback Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Callback Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in callbackLog" :key="index" class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="callbackLog.length === 0" class="text-gray-400 text-sm italic">
          No callback activity yet. Try the demo above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const inputMessage = ref('Hello Pulsor!')
const lastResult = ref('')
const callbackLog = ref([])
const hasLogger = ref(false)
const hasValidator = ref(false)
const hasTransformer = ref(true) // Default transformer

// Callback references for management
let loggerCallback = null
let validatorCallback = null
let transformerCallback = null

// Computed properties
const callbackCount = computed(() => {
  try {
    const pulsor = Pulsor('messageProcessor')
    return pulsor.callbackCount
  } catch {
    return 0
  }
})

// Setup callback system
const setupCallbackSystem = () => {
  // Create main message processor
  CreatePulser('messageProcessor', (message) => {
    logCallback('Main processor executed', 'main')
    return `Processed: ${message}`
  })
  
  // Create chained processor for demonstration
  CreatePulser('chainProcessor', (message) => {
    logCallback('Chain processor started', 'main')
    const steps = [
      `Step 1: Received "${message}"`,
      `Step 2: Validated (${message.length} chars)`,
      `Step 3: Transformed to uppercase`,
      `Step 4: Added timestamp`
    ]
    
    const result = {
      original: message,
      processed: message.toUpperCase(),
      timestamp: new Date().toISOString(),
      steps
    }
    
    logCallback('Chain processing completed', 'main')
    return result
  })
  
  // Setup default transformer callback
  setupTransformerCallback()
}

// Callback functions
const setupLoggerCallback = () => {
  loggerCallback = (message) => {
    logCallback(`Logger: Processing "${message}"`, 'logger')
  }
}

const setupValidatorCallback = () => {
  validatorCallback = (message) => {
    if (typeof message !== 'string') {
      logCallback('Validator: Invalid type - not a string', 'error')
      throw new Error('Message must be a string')
    }
    if (message.length < 2) {
      logCallback('Validator: Message too short', 'error')
      throw new Error('Message must be at least 2 characters')
    }
    if (message.length > 100) {
      logCallback('Validator: Message too long', 'error')
      throw new Error('Message must be less than 100 characters')
    }
    logCallback(`Validator: Message "${message}" is valid`, 'validator')
  }
}

const setupTransformerCallback = () => {
  transformerCallback = (message) => {
    const wordCount = message.split(' ').length
    const charCount = message.length
    logCallback(`Transformer: Analyzed "${message}" - ${wordCount} words, ${charCount} chars`, 'transformer')
  }
}

// Callback management functions
const addLogger = () => {
  if (!hasLogger.value) {
    setupLoggerCallback()
    Pulsor('messageProcessor').bind(loggerCallback)
    hasLogger.value = true
    logCallback('Logger callback added', 'system')
  }
}

const removeLogger = () => {
  if (hasLogger.value && loggerCallback) {
    Pulsor('messageProcessor').unbind(loggerCallback)
    hasLogger.value = false
    loggerCallback = null
    logCallback('Logger callback removed', 'system')
  }
}

const addValidator = () => {
  if (!hasValidator.value) {
    setupValidatorCallback()
    Pulsor('messageProcessor').bind(validatorCallback)
    hasValidator.value = true
    logCallback('Validator callback added', 'system')
  }
}

const removeValidator = () => {
  if (hasValidator.value && validatorCallback) {
    Pulsor('messageProcessor').unbind(validatorCallback)
    hasValidator.value = false
    validatorCallback = null
    logCallback('Validator callback removed', 'system')
  }
}

// Demo functions
const processMessage = () => {
  try {
    const result = Pulsor('messageProcessor').pulse(inputMessage.value)
    lastResult.value = result
    logCallback(`Processing completed: "${result}"`, 'success')
  } catch (error) {
    lastResult.value = `Error: ${error.message}`
    logCallback(`Processing failed: ${error.message}`, 'error')
  }
}

const processWithChain = () => {
  try {
    const result = Pulsor('chainProcessor').pulse(inputMessage.value)
    lastResult.value = JSON.stringify(result, null, 2)
    logCallback('Chain processing completed successfully', 'success')
  } catch (error) {
    lastResult.value = `Chain Error: ${error.message}`
    logCallback(`Chain processing failed: ${error.message}`, 'error')
  }
}

// Logging function
const logCallback = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  callbackLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 20 entries
  if (callbackLog.value.length > 20) {
    callbackLog.value = callbackLog.value.slice(0, 20)
  }
}

// Get CSS class for log type
const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    case 'logger': return 'text-blue-600'
    case 'validator': return 'text-orange-600'
    case 'transformer': return 'text-purple-600'
    case 'system': return 'text-indigo-600'
    case 'main': return 'text-gray-800 font-semibold'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupCallbackSystem()
  logCallback('Callback System demo initialized', 'system')
})

onUnmounted(() => {
  logCallback('Callback demo component unmounted', 'system')
})
</script>