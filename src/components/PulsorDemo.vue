<script setup>
import { ref } from 'vue'
import { usePulsor } from '../plugins/pulsor/plugin.js'
import { HeartIcon, CogIcon, SparklesIcon } from '@heroicons/vue/24/solid'

const pulsor = usePulsor()
const count = ref(0)
const customColor = ref('#3b82f6')
const customDuration = ref(1000)

const increment = () => {
  count.value++
}

const triggerCustomPulse = (event) => {
  pulsor.pulse(event.target, {
    pulseColor: customColor.value + '40',
    pulseDuration: parseInt(customDuration.value),
    pulseScale: 1.2,
  })
}

const updateConfig = () => {
  pulsor.setConfig({
    pulseDuration: parseInt(customDuration.value),
    pulseColor: customColor.value + '40',
  })
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
      <h1 class="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        <SparklesIcon class="inline-block w-10 h-10 mr-2 text-yellow-500" />
        Pulsor Plugin Demo
      </h1>

      <!-- Basic Pulse Button -->
      <div class="mb-8 text-center">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Basic Pulse</h2>
        <button
          v-pulse
          @click="increment"
          class="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
        >
          <HeartIcon class="inline-block w-6 h-6 mr-2" />
          Click me! Count: {{ count }}
        </button>
      </div>

      <!-- Custom Configuration -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Custom Configuration
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pulse Color
            </label>
            <input v-model="customColor" type="color" class="w-full h-10 rounded cursor-pointer" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration: {{ customDuration }}ms
            </label>
            <input
              v-model="customDuration"
              type="range"
              min="300"
              max="3000"
              step="100"
              class="w-full"
            />
          </div>

          <button
            @click="updateConfig"
            class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
          >
            <CogIcon class="inline-block w-5 h-5 mr-2" />
            Update Global Config
          </button>
        </div>
      </div>

      <!-- Custom Pulse Button -->
      <div class="mb-8 text-center">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Custom Pulse</h2>
        <button
          @click="triggerCustomPulse"
          class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-105"
        >
          Custom Pulse Effect
        </button>
      </div>

      <!-- Multiple Buttons -->
      <div>
        <h2 class="text-2xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">
          Multiple Elements
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <button
            v-pulse="{ pulseColor: 'rgba(239, 68, 68, 0.3)' }"
            class="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
          >
            Red Pulse
          </button>
          <button
            v-pulse="{ pulseColor: 'rgba(34, 197, 94, 0.3)', pulseDuration: 1500 }"
            class="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
          >
            Green Pulse
          </button>
          <button
            v-pulse="{ pulseColor: 'rgba(168, 85, 247, 0.3)', pulseScale: 1.3 }"
            class="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300"
          >
            Purple Pulse
          </button>
          <button
            v-pulse="{ pulseColor: 'rgba(251, 191, 36, 0.3)', pulseDuration: 800 }"
            class="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
          >
            Yellow Pulse
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
