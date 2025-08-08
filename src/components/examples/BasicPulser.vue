<template>
  <div class="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-indigo-800 mb-4">🎯 Basic Pulser Operations</h1>
      <p class="text-lg text-indigo-600 mb-6">
        Learn the fundamentals of creating and using Pulsor instances for simple function execution.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Interactive Demo -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Interactive Demo</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Enter two numbers:</label>
            <div class="flex space-x-2">
              <input 
                v-model.number="num1" 
                type="number" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="First number"
              >
              <input 
                v-model.number="num2" 
                type="number" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Second number"
              >
            </div>
          </div>

          <div class="flex space-x-2">
            <button 
              @click="performOperation('add')"
              class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
            <button 
              @click="performOperation('multiply')"
              class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Multiply
            </button>
            <button 
              @click="performOperation('power')"
              class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Power
            </button>
          </div>

          <div v-if="result !== null" class="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <p class="text-indigo-800 font-semibold">Result: {{ result }}</p>
            <p class="text-indigo-600 text-sm mt-1">Operation: {{ lastOperation }}</p>
          </div>
        </div>
      </div>

      <!-- Code Example -->
      <div class="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-white mb-4">Code Implementation</h2>
        <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create basic pulsers
CreatePulser('add', (a, b) => a + b);
CreatePulser('multiply', (a, b) => a * b);
CreatePulser('power', (a, b) => Math.pow(a, b));

// Use pulsers
const addPulsor = Pulsor('add');
const result = addPulsor.pulse(5, 3); // 8

// Alternative syntax
const result2 = Pulsor('multiply').pulse(4, 6); // 24</code></pre>
      </div>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Simple Creation</h3>
        <p class="text-gray-600 text-sm">Create pulsers with just an alias and function. Pulsor handles the rest automatically.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Reusable</h3>
        <p class="text-gray-600 text-sm">Once created, pulsers can be accessed from anywhere in your application using their alias.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">🎯</div>
        <h3 class="font-semibold text-gray-800 mb-2">Type Safe</h3>
        <p class="text-gray-600 text-sm">Built-in validation ensures your functions are properly registered and executed.</p>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Activity Log</h2>
      <div class="max-h-32 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" class="text-sm text-gray-600 font-mono">
          {{ log }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No operations performed yet. Try the demo above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const num1 = ref(5)
const num2 = ref(3)
const result = ref(null)
const lastOperation = ref('')
const activityLog = ref([])

// Create pulsers for mathematical operations
const setupPulsers = () => {
  // Basic arithmetic operations
  CreatePulser('add', (a, b) => {
    const result = a + b
    logActivity(`ADD: ${a} + ${b} = ${result}`)
    return result
  })
  
  CreatePulser('multiply', (a, b) => {
    const result = a * b
    logActivity(`MULTIPLY: ${a} × ${b} = ${result}`)
    return result
  })
  
  CreatePulser('power', (a, b) => {
    const result = Math.pow(a, b)
    logActivity(`POWER: ${a}^${b} = ${result}`)
    return result
  })
}

// Perform operation using Pulsor
const performOperation = (operation) => {
  try {
    const pulsor = Pulsor(operation)
    result.value = pulsor.pulse(num1.value, num2.value)
    lastOperation.value = operation.toUpperCase()
  } catch (error) {
    logActivity(`ERROR: ${error.message}`)
  }
}

// Log activity with timestamp
const logActivity = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  activityLog.value.unshift(`[${timestamp}] ${message}`)
  
  // Keep only last 10 entries
  if (activityLog.value.length > 10) {
    activityLog.value = activityLog.value.slice(0, 10)
  }
}

// Lifecycle hooks
onMounted(() => {
  setupPulsers()
  logActivity('Basic Pulser demo initialized')
})

onUnmounted(() => {
  // Clean up if needed
  logActivity('Demo component unmounted')
})
</script>