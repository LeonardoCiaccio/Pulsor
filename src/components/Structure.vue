<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-lg">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Sidebar</h2>
      </div>
      <div id="sidebar-buttons" class="p-4 flex flex-col space-y-2">
        <slot name="sidebar">
          <!-- Default sidebar content -->
          <p class="text-gray-600">Sidebar content goes here</p>
        </slot>
      </div>
    </div>

    <!-- Main Work Area -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 p-4">
        <slot name="header">
          <h1 class="text-xl font-semibold text-gray-800">Work Area</h1>
        </slot>
      </div>

      <!-- Content -->
      <div id="work-area" class="flex-1 p-6 overflow-auto">
        <slot name="content">
          <!-- Dynamic component area -->
          <component v-if="currentComponent" :is="currentComponent" />
          <!-- Default content when no component is loaded -->
          <div v-else class="text-center py-12">
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">Pulsor Dashboard</h2>
            <p class="text-gray-600 mb-6">
              Select an example from the sidebar to explore Pulsor's powerful features
            </p>
            <div class="bg-blue-50 p-6 rounded-lg max-w-2xl mx-auto">
              <h3 class="text-lg font-semibold text-blue-800 mb-3">🚀 Welcome to Pulsor</h3>
              <p class="text-blue-700 text-sm leading-relaxed">
                Pulsor is a unified, event-driven function execution system that provides a powerful API for managing named function executors with callback systems, async support, and real-time communication.
              </p>
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
