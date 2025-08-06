<script setup>
import { ref } from 'vue'
import { PlusIcon, SunIcon, MoonIcon } from '@heroicons/vue/24/solid'

const count = ref(0)
const isDarkMode = ref(false)

const increment = () => {
  count.value++
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
</script>

<template>
  <div
    :class="{ 'bg-gray-100 text-gray-900': !isDarkMode, 'bg-gray-900 text-gray-100': isDarkMode }"
    class="flex flex-col items-center justify-center min-h-screen transition-colors duration-300"
  >
    <h1 class="text-5xl font-bold text-blue-600 mb-8 animate-bounce">Hello World</h1>
    <button
      @click="increment"
      class="px-6 py-3 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition duration-300 ease-in-out flex items-center space-x-2 mb-4"
    >
      <PlusIcon class="h-6 w-6" />
      <span>Click me: {{ count }}</span>
    </button>

    <button
      @click="toggleTheme"
      :class="{
        'bg-blue-500 hover:bg-blue-600': !isDarkMode,
        'bg-yellow-500 hover:bg-yellow-600': isDarkMode,
      }"
      class="px-6 py-3 text-white rounded-lg shadow-lg transition duration-300 ease-in-out flex items-center space-x-2"
    >
      <template v-if="isDarkMode">
        <SunIcon class="h-6 w-6" />
        <span>Light Mode</span>
      </template>
      <template v-else>
        <MoonIcon class="h-6 w-6" />
        <span>Dark Mode</span>
      </template>
    </button>
  </div>
</template>

<style scoped>
/* No custom styles needed, Tailwind handles everything */
</style>
