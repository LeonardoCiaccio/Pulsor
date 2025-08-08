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
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">Seleziona un'area</h2>
            <p class="text-gray-600">
              Usa i pulsanti della sidebar per caricare un componente nell'area di lavoro
            </p>
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
const Example1 = defineAsyncComponent(() => import('./Example1.vue'))
const Example2 = defineAsyncComponent(() => import('./Example2.vue'))

// Component mapping
const componentMap = {
  example1: Example1,
  example2: Example2,
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
  pulsorShowArea.bind(handleShowArea).pulse('example2')
})

// Unbind the event listener when the component is unmounted
onUnmounted(() => {
  pulsorShowArea.unbind(handleShowArea)
})
</script>

<style scoped></style>
