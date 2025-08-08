<template>
  <div class="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-2xl shadow-2xl border border-white/20">
    <div class="mb-10">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Basic Pulser Operations</h1>
          <p class="text-lg text-gray-600">
            Learn the fundamentals of creating and using Pulsor instances for simple function execution.
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Interactive Demo -->
      <div class="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span class="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M5 12h14l-1 7H6l-1-7z"></path>
            </svg>
          </span>
          Interactive Demo
        </h2>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Enter two numbers:</label>
            <div class="flex space-x-3">
              <input 
                v-model.number="num1" 
                type="number" 
                class="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                placeholder="First number"
              >
              <input 
                v-model.number="num2" 
                type="number" 
                class="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                placeholder="Second number"
              >
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <button 
              @click="performOperation('add')"
              class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-2"
            >
              <span>+</span>
              <span>Add</span>
            </button>
            <button 
              @click="performOperation('multiply')"
              class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-2"
            >
              <span>×</span>
              <span>Multiply</span>
            </button>
            <button 
              @click="performOperation('power')"
              class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-2"
            >
              <span>^</span>
              <span>Power</span>
            </button>
          </div>

          <div v-if="result !== null" class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p class="text-blue-800 font-bold text-lg">Result: {{ result }}</p>
                <p class="text-blue-600 text-sm">Operation: {{ lastOperation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Code Example -->
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
          <span class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
          </span>
          Code Implementation
        </h2>
        <div class="bg-black/30 p-6 rounded-xl border border-gray-600">
          <pre class="text-green-400 text-sm overflow-x-auto leading-relaxed"><code>// Create basic pulsers
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
    </div>

    <!-- Features Overview -->
    <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-3">Simple Creation</h3>
        <p class="text-gray-600 leading-relaxed">Create pulsers with just an alias and function. Pulsor handles the rest automatically.</p>
      </div>
      
      <div class="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-3">Reusable</h3>
        <p class="text-gray-600 leading-relaxed">Once created, pulsers can be accessed from anywhere in your application using their alias.</p>
      </div>
      
      <div class="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-3">Type Safe</h3>
        <p class="text-gray-600 leading-relaxed">Built-in validation ensures your functions are properly registered and executed.</p>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-10 bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </span>
        Activity Log
      </h2>
      <div class="bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 max-h-40 overflow-y-auto">
        <div class="space-y-2">
          <div v-for="(log, index) in activityLog" :key="index" class="text-sm text-gray-700 font-mono bg-white/60 px-3 py-2 rounded-lg">
            {{ log }}
          </div>
          <div v-if="activityLog.length === 0" class="text-gray-500 text-sm italic text-center py-4">
            No operations performed yet. Try the demo above!
          </div>
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