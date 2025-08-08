<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-lg">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Sidebar</h2>
      </div>
      <div id="sidebar-buttons" class="p-4">
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
          <!-- Default content -->
          <p class="text-gray-600">Main content goes here</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
// Quando montato richiamo il pulsor loaded
import { Pulser } from '@/plugins/pulsor/pulsor.js'
import { onMounted } from 'vue'

onMounted(() => {
  new Pulser('sidebar:loaded').pulse()
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
