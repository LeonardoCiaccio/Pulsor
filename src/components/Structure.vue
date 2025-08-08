<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <!-- Sidebar -->
    <div class="w-72 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20">
      <div class="p-6 border-b border-gradient-to-r from-blue-100 to-indigo-100">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Pulsor</h2>
            <p class="text-xs text-gray-500 font-medium">Dashboard</p>
          </div>
        </div>
      </div>
      <div id="sidebar-buttons" class="p-6 flex flex-col space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
        <slot name="sidebar">
          <!-- Default sidebar content -->
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <p class="text-gray-500 text-sm font-medium">Loading navigation...</p>
          </div>
        </slot>
      </div>
    </div>

    <!-- Main Work Area -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="bg-white/60 backdrop-blur-xl shadow-lg border-b border-white/20 px-8 py-6">
        <slot name="header">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Interactive Examples</h1>
              <p class="text-gray-600 text-sm mt-1">Explore Pulsor's capabilities through hands-on demonstrations</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-green-700 text-xs font-medium">Live</span>
              </div>
            </div>
          </div>
        </slot>
      </div>

      <!-- Content -->
      <div id="work-area" class="flex-1 p-8 overflow-auto">
        <slot name="content">
          <!-- Dynamic component area -->
          <component v-if="currentComponent" :is="currentComponent" />
          <!-- Default content when no component is loaded -->
          <div v-else class="text-center py-16">
            <div class="max-w-4xl mx-auto">
              <!-- Hero Section -->
              <div class="mb-12">
                <div class="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h2 class="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">Welcome to Pulsor Dashboard</h2>
                <p class="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Discover the power of event-driven architecture through interactive examples and real-time demonstrations
                </p>
              </div>

              <!-- Feature Cards -->
              <div class="grid md:grid-cols-3 gap-8 mb-12">
                <div class="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800 mb-3">Event-Driven</h3>
                  <p class="text-gray-600 leading-relaxed">Powerful event system for real-time communication and reactive programming patterns</p>
                </div>

                <div class="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800 mb-3">Async Support</h3>
                  <p class="text-gray-600 leading-relaxed">Native asynchronous operations with promise-based callbacks and error handling</p>
                </div>

                <div class="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-800 mb-3">High Performance</h3>
                  <p class="text-gray-600 leading-relaxed">Optimized execution engine with monitoring, profiling, and analytics capabilities</p>
                </div>
              </div>

              <!-- CTA Section -->
              <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 rounded-2xl shadow-2xl text-white">
                <h3 class="text-2xl font-bold mb-4">🚀 Start Exploring</h3>
                <p class="text-blue-100 mb-6 leading-relaxed">
                  Choose an example from the sidebar to see Pulsor in action. Each demo showcases different aspects of the framework with interactive controls and real-time feedback.
                </p>
                <div class="flex items-center justify-center space-x-2 text-blue-200">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                  <span class="font-medium">Select a demo to begin</span>
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
// Quando montato richiamo il pulsor loaded
import { Pulsor } from '@/plugins/pulsor/pulsor.js'
import { onMounted, onUnmounted, shallowRef, defineAsyncComponent } from 'vue'

// Dynamic component loading
const currentComponent = shallowRef(null)

// Lazy load components
const BasicPulser = defineAsyncComponent(() => import('./examples/BasicPulser.vue'))
const AsyncOperations = defineAsyncComponent(() => import('./examples/AsyncOperations.vue'))
const CallbackSystem = defineAsyncComponent(() => import('./examples/CallbackSystem.vue'))
const EventCommunication = defineAsyncComponent(() => import('./examples/EventCommunication.vue'))
const DataProcessing = defineAsyncComponent(() => import('./examples/DataProcessing.vue'))
const RealTimeUpdates = defineAsyncComponent(() => import('./examples/RealTimeUpdates.vue'))
const FormValidation = defineAsyncComponent(() => import('./examples/FormValidation.vue'))
const ApiIntegration = defineAsyncComponent(() => import('./examples/ApiIntegration.vue'))
const StateManagement = defineAsyncComponent(() => import('./examples/StateManagement.vue'))
const PerformanceMonitoring = defineAsyncComponent(() => import('./examples/PerformanceMonitoring.vue'))

// Component mapping
const componentMap = {
  'basic-pulser': BasicPulser,
  'async-operations': AsyncOperations,
  'callback-system': CallbackSystem,
  'event-communication': EventCommunication,
  'data-processing': DataProcessing,
  'real-time-updates': RealTimeUpdates,
  'form-validation': FormValidation,
  'api-integration': ApiIntegration,
  'state-management': StateManagement,
  'performance-monitoring': PerformanceMonitoring,
}

const handleShowArea = (areaName) => {
  // Load the requested component dynamically
  if (componentMap[areaName]) {
    currentComponent.value = componentMap[areaName]
    console.log(`[Structure] Loading area: ${areaName}`)
  } else {
    console.warn(`[Structure] Unknown area: ${areaName}`)
    currentComponent.value = null
  }
}

const pulsorShowArea = Pulsor('show:area')
const pulsorSidebarLoaded = Pulsor('sidebar:loaded')

onMounted(() => {
  pulsorSidebarLoaded.pulse('Structure.vue')
  pulsorShowArea.bind(handleShowArea)
})

// Unbind the event listener when the component is unmounted
onUnmounted(() => {
  pulsorShowArea.unbind(handleShowArea)
})
</script>

<style scoped></style>
