<template>
  <div class="p-8 bg-gradient-to-br from-red-50 to-pink-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-red-800 mb-4">⚡ Performance Monitoring</h1>
      <p class="text-lg text-red-600 mb-6">
        Monitor and optimize Pulsor performance with real-time metrics, execution profiling, memory usage tracking, and comprehensive performance analytics.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Performance Controls -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🎛️ Performance Tests</h2>
        
        <div class="space-y-6">
          <!-- Execution Speed Tests -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Execution Speed</h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <input 
                  v-model.number="testConfig.iterations" 
                  type="number" 
                  min="1" 
                  max="10000"
                  placeholder="Iterations"
                  class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                <span class="text-sm text-gray-600">iterations</span>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <button 
                  @click="runSyncPerformanceTest" 
                  :disabled="isRunningTest"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {{ isRunningTest ? 'Running...' : 'Test Sync' }}
                </button>
                
                <button 
                  @click="runAsyncPerformanceTest" 
                  :disabled="isRunningTest"
                  class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {{ isRunningTest ? 'Running...' : 'Test Async' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Memory Usage Tests -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Memory Usage</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="runMemoryTest" 
                :disabled="isRunningTest"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Memory Test
              </button>
              
              <button 
                @click="runGarbageCollectionTest" 
                :disabled="isRunningTest"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                GC Test
              </button>
            </div>
          </div>

          <!-- Load Testing -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Load Testing</h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <input 
                  v-model.number="testConfig.concurrentTasks" 
                  type="number" 
                  min="1" 
                  max="1000"
                  placeholder="Concurrent tasks"
                  class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                <span class="text-sm text-gray-600">concurrent tasks</span>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <button 
                  @click="runConcurrencyTest" 
                  :disabled="isRunningTest"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Concurrency Test
                </button>
                
                <button 
                  @click="runStressTest" 
                  :disabled="isRunningTest"
                  class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  Stress Test
                </button>
              </div>
            </div>
          </div>

          <!-- Profiling Controls -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Profiling</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="toggleProfiling" 
                class="px-4 py-2 rounded-md transition-colors"
                :class="isProfiling ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'"
              >
                {{ isProfiling ? 'Stop Profiling' : 'Start Profiling' }}
              </button>
              
              <button 
                @click="clearMetrics" 
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Metrics
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 Real-time Metrics</h2>
        
        <div class="space-y-4">
          <!-- Current Performance -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Current Performance</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ currentMetrics.executionTime }}ms</div>
                <div class="text-sm text-gray-600">Avg Execution</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">{{ currentMetrics.throughput }}/s</div>
                <div class="text-sm text-gray-600">Throughput</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">{{ currentMetrics.memoryUsage }}MB</div>
                <div class="text-sm text-gray-600">Memory Usage</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ currentMetrics.successRate }}%</div>
                <div class="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>

          <!-- Performance History Chart -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Performance History</h3>
            <div class="h-32 bg-gray-50 rounded flex items-end justify-between px-2 py-2">
              <div 
                v-for="(point, index) in performanceHistory.slice(-20)" 
                :key="index"
                class="bg-red-500 rounded-t transition-all duration-300"
                :style="{ 
                  height: `${Math.max(2, (point.executionTime / Math.max(...performanceHistory.map(p => p.executionTime))) * 100)}%`,
                  width: '4px',
                  marginRight: '1px'
                }"
                :title="`${point.executionTime}ms at ${new Date(point.timestamp).toLocaleTimeString()}`"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-2 text-center">
              Execution time over last 20 measurements
            </div>
          </div>

          <!-- Pulser Registry Stats -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Pulser Registry</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Total Pulsers:</span>
                <span class="font-semibold">{{ registryStats.totalPulsers }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Active Pulsers:</span>
                <span class="font-semibold">{{ registryStats.activePulsers }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Async Pulsers:</span>
                <span class="font-semibold">{{ registryStats.asyncPulsers }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Total Callbacks:</span>
                <span class="font-semibold">{{ registryStats.totalCallbacks }}</span>
              </div>
            </div>
          </div>

          <!-- Top Performers -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold text-gray-700 mb-3">Top Performers</h3>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div v-for="performer in topPerformers" :key="performer.alias" 
                   class="flex justify-between items-center text-sm">
                <span class="font-medium text-gray-700">{{ performer.alias }}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-green-600">{{ performer.avgTime }}ms</span>
                  <span class="text-gray-500">({{ performer.calls }})</span>
                </div>
              </div>
              
              <div v-if="topPerformers.length === 0" class="text-center py-4">
                <div class="text-gray-400 text-sm">No performance data yet</div>
                <div class="text-gray-400 text-xs mt-1">Run some tests to see top performers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">Performance Monitoring Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Performance monitoring system for Pulsor
const createPerformanceMonitor = CreatePulser('performance:monitor', () => {
  const metrics = reactive({
    executionTimes: [],
    memoryUsage: [],
    throughput: 0,
    successRate: 100,
    errors: [],
    pulserStats: new Map()
  })
  
  const startTime = performance.now()
  let isMonitoring = false
  
  return {
    metrics,
    
    // Start performance monitoring
    start: () => {
      isMonitoring = true
      console.log('🚀 Performance monitoring started')
      
      // Monitor memory usage every second
      const memoryInterval = setInterval(() => {
        if (!isMonitoring) {
          clearInterval(memoryInterval)
          return
        }
        
        if (performance.memory) {
          const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
          metrics.memoryUsage.push({
            value: memoryMB,
            timestamp: Date.now()
          })
          
          // Keep only last 100 measurements
          if (metrics.memoryUsage.length > 100) {
            metrics.memoryUsage = metrics.memoryUsage.slice(-100)
          }
        }
      }, 1000)
      
      return memoryInterval
    },
    
    // Stop performance monitoring
    stop: () => {
      isMonitoring = false
      console.log('⏹️ Performance monitoring stopped')
    },
    
    // Measure execution time of a function
    measureExecution: async (pulserAlias, fn, ...args) => {
      const startTime = performance.now()
      let result, error
      
      try {
        result = await fn(...args)
        
        const endTime = performance.now()
        const executionTime = endTime - startTime
        
        // Record execution metrics
        metrics.executionTimes.push({
          alias: pulserAlias,
          time: executionTime,
          timestamp: Date.now(),
          success: true
        })
        
        // Update pulser-specific stats
        if (!metrics.pulserStats.has(pulserAlias)) {
          metrics.pulserStats.set(pulserAlias, {
            totalCalls: 0,
            totalTime: 0,
            errors: 0,
            avgTime: 0
          })
        }
        
        const stats = metrics.pulserStats.get(pulserAlias)
        stats.totalCalls++
        stats.totalTime += executionTime
        stats.avgTime = stats.totalTime / stats.totalCalls
        
        // Calculate throughput (operations per second)
        const recentExecutions = metrics.executionTimes.filter(
          exec => Date.now() - exec.timestamp < 1000
        )
        metrics.throughput = recentExecutions.length
        
        // Calculate success rate
        const recentTotal = metrics.executionTimes.filter(
          exec => Date.now() - exec.timestamp < 10000
        ).length
        const recentSuccesses = metrics.executionTimes.filter(
          exec => Date.now() - exec.timestamp < 10000 && exec.success
        ).length
        
        metrics.successRate = recentTotal > 0 ? Math.round((recentSuccesses / recentTotal) * 100) : 100
        
        return result
      } catch (err) {
        error = err
        
        const endTime = performance.now()
        const executionTime = endTime - startTime
        
        // Record error metrics
        metrics.executionTimes.push({
          alias: pulserAlias,
          time: executionTime,
          timestamp: Date.now(),
          success: false,
          error: err.message
        })
        
        metrics.errors.push({
          alias: pulserAlias,
          error: err.message,
          timestamp: Date.now()
        })
        
        // Update error stats
        if (metrics.pulserStats.has(pulserAlias)) {
          metrics.pulserStats.get(pulserAlias).errors++
        }
        
        throw err
      } finally {
        // Keep only last 1000 execution records
        if (metrics.executionTimes.length > 1000) {
          metrics.executionTimes = metrics.executionTimes.slice(-1000)
        }
        
        // Keep only last 100 error records
        if (metrics.errors.length > 100) {
          metrics.errors = metrics.errors.slice(-100)
        }
      }
    },
    
    // Get performance summary
    getSummary: () => {
      const recentExecutions = metrics.executionTimes.filter(
        exec => Date.now() - exec.timestamp < 60000 // Last minute
      )
      
      if (recentExecutions.length === 0) {
        return {
          avgExecutionTime: 0,
          minExecutionTime: 0,
          maxExecutionTime: 0,
          totalExecutions: 0,
          errorsPerMinute: 0,
          throughputPerSecond: 0
        }
      }
      
      const executionTimes = recentExecutions.map(exec => exec.time)
      const errors = metrics.errors.filter(
        err => Date.now() - err.timestamp < 60000
      )
      
      return {
        avgExecutionTime: Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length),
        minExecutionTime: Math.round(Math.min(...executionTimes)),
        maxExecutionTime: Math.round(Math.max(...executionTimes)),
        totalExecutions: recentExecutions.length,
        errorsPerMinute: errors.length,
        throughputPerSecond: Math.round(recentExecutions.length / 60)
      }
    },
    
    // Get top performing pulsers
    getTopPerformers: (limit = 10) => {
      return Array.from(metrics.pulserStats.entries())
        .map(([alias, stats]) => ({ alias, ...stats }))
        .sort((a, b) => a.avgTime - b.avgTime)
        .slice(0, limit)
    },
    
    // Clear all metrics
    clear: () => {
      metrics.executionTimes = []
      metrics.memoryUsage = []
      metrics.errors = []
      metrics.pulserStats.clear()
      metrics.throughput = 0
      metrics.successRate = 100
    }
  }
})

// Create performance-aware pulser wrapper
const createMonitoredPulser = CreatePulser('performance:wrapper', (alias, originalFn, isAsync = false) => {
  const monitor = Pulsor('performance:monitor').pulse()
  
  if (isAsync) {
    return CreatePulser(alias, async (...args) => {
      return await monitor.measureExecution(alias, originalFn, ...args)
    }, { async: true })
  } else {
    return CreatePulser(alias, (...args) => {
      return monitor.measureExecution(alias, () => originalFn(...args))
    })
  }
})

// Benchmark suite for comparing performance
const createBenchmarkSuite = CreatePulser('performance:benchmark', () => {
  const benchmarks = new Map()
  
  return {
    // Add a benchmark test
    add: (name, fn, options = {}) => {
      benchmarks.set(name, {
        fn,
        options: {
          iterations: 1000,
          warmup: 100,
          ...options
        },
        results: []
      })
    },
    
    // Run a specific benchmark
    run: async (name) => {
      const benchmark = benchmarks.get(name)
      if (!benchmark) {
        throw new Error(`Benchmark '${name}' not found`)
      }
      
      const { fn, options } = benchmark
      const results = []
      
      // Warmup phase
      console.log(`🔥 Warming up ${name}...`)
      for (let i = 0; i < options.warmup; i++) {
        await fn()
      }
      
      // Actual benchmark
      console.log(`⚡ Running ${name} benchmark...`)
      for (let i = 0; i < options.iterations; i++) {
        const startTime = performance.now()
        await fn()
        const endTime = performance.now()
        results.push(endTime - startTime)
      }
      
      // Calculate statistics
      const sortedResults = results.sort((a, b) => a - b)
      const stats = {
        name,
        iterations: options.iterations,
        min: sortedResults[0],
        max: sortedResults[sortedResults.length - 1],
        avg: results.reduce((a, b) => a + b, 0) / results.length,
        median: sortedResults[Math.floor(sortedResults.length / 2)],
        p95: sortedResults[Math.floor(sortedResults.length * 0.95)],
        p99: sortedResults[Math.floor(sortedResults.length * 0.99)],
        opsPerSecond: 1000 / (results.reduce((a, b) => a + b, 0) / results.length)
      }
      
      benchmark.results.push(stats)
      return stats
    },
    
    // Run all benchmarks
    runAll: async () => {
      const results = []
      for (const [name] of benchmarks) {
        const result = await this.run(name)
        results.push(result)
      }
      return results
    },
    
    // Compare benchmark results
    compare: (baseline, comparison) => {
      const baselineResult = benchmarks.get(baseline)?.results?.slice(-1)[0]
      const comparisonResult = benchmarks.get(comparison)?.results?.slice(-1)[0]
      
      if (!baselineResult || !comparisonResult) {
        throw new Error('Both benchmarks must be run before comparison')
      }
      
      const speedup = baselineResult.avg / comparisonResult.avg
      const improvement = ((baselineResult.avg - comparisonResult.avg) / baselineResult.avg) * 100
      
      return {
        baseline: baselineResult,
        comparison: comparisonResult,
        speedup,
        improvement,
        faster: speedup > 1 ? comparison : baseline
      }
    }
  }
})

// Memory profiler
const createMemoryProfiler = CreatePulser('performance:memory', () => {
  let baseline = null
  const snapshots = []
  
  return {
    // Take memory snapshot
    snapshot: (label = 'snapshot') => {
      if (!performance.memory) {
        console.warn('Memory API not available in this browser')
        return null
      }
      
      const snapshot = {
        label,
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
      
      snapshots.push(snapshot)
      return snapshot
    },
    
    // Set baseline for memory comparisons
    setBaseline: (label = 'baseline') => {
      baseline = this.snapshot(label)
      return baseline
    },
    
    // Compare current memory usage to baseline
    compareToBaseline: () => {
      if (!baseline) {
        throw new Error('No baseline set. Call setBaseline() first.')
      }
      
      const current = this.snapshot('current')
      if (!current) return null
      
      return {
        baseline,
        current,
        difference: current.usedJSHeapSize - baseline.usedJSHeapSize,
        percentageIncrease: ((current.usedJSHeapSize - baseline.usedJSHeapSize) / baseline.usedJSHeapSize) * 100
      }
    },
    
    // Get memory usage trend
    getTrend: (timeWindow = 60000) => {
      const cutoff = Date.now() - timeWindow
      const recentSnapshots = snapshots.filter(s => s.timestamp > cutoff)
      
      if (recentSnapshots.length < 2) {
        return { trend: 'insufficient_data', snapshots: recentSnapshots }
      }
      
      const first = recentSnapshots[0]
      const last = recentSnapshots[recentSnapshots.length - 1]
      const change = last.usedJSHeapSize - first.usedJSHeapSize
      
      return {
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        change,
        percentageChange: (change / first.usedJSHeapSize) * 100,
        snapshots: recentSnapshots
      }
    },
    
    // Clear snapshots
    clear: () => {
      snapshots.length = 0
      baseline = null
    }
  }
})

// Performance testing utilities
const runPerformanceTest = CreatePulser('performance:test', async (testConfig) => {
  const {
    name = 'Performance Test',
    fn,
    iterations = 1000,
    concurrency = 1,
    warmup = 100,
    timeout = 30000
  } = testConfig
  
  console.log(`🧪 Starting performance test: ${name}`)
  
  const results = {
    name,
    config: testConfig,
    startTime: Date.now(),
    endTime: null,
    duration: null,
    iterations: 0,
    errors: [],
    executionTimes: [],
    memoryUsage: {
      before: null,
      after: null,
      peak: null
    }
  }
  
  // Memory baseline
  if (performance.memory) {
    results.memoryUsage.before = performance.memory.usedJSHeapSize
  }
  
  try {
    // Warmup phase
    console.log(`🔥 Warmup phase: ${warmup} iterations`)
    for (let i = 0; i < warmup; i++) {
      await fn()
    }
    
    // Main test phase
    console.log(`⚡ Test phase: ${iterations} iterations with concurrency ${concurrency}`)
    
    if (concurrency === 1) {
      // Sequential execution
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        try {
          await fn()
          results.iterations++
        } catch (error) {
          results.errors.push({ iteration: i, error: error.message })
        }
        const endTime = performance.now()
        results.executionTimes.push(endTime - startTime)
        
        // Track peak memory usage
        if (performance.memory && (!results.memoryUsage.peak || performance.memory.usedJSHeapSize > results.memoryUsage.peak)) {
          results.memoryUsage.peak = performance.memory.usedJSHeapSize
        }
      }
    } else {
      // Concurrent execution
      const batches = Math.ceil(iterations / concurrency)
      
      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = []
        const batchSize = Math.min(concurrency, iterations - batch * concurrency)
        
        for (let i = 0; i < batchSize; i++) {
          const startTime = performance.now()
          const promise = fn()
            .then(() => {
              results.iterations++
              const endTime = performance.now()
              results.executionTimes.push(endTime - startTime)
            })
            .catch(error => {
              results.errors.push({ batch, iteration: i, error: error.message })
            })
          
          batchPromises.push(promise)
        }
        
        await Promise.all(batchPromises)
        
        // Track peak memory usage
        if (performance.memory && (!results.memoryUsage.peak || performance.memory.usedJSHeapSize > results.memoryUsage.peak)) {
          results.memoryUsage.peak = performance.memory.usedJSHeapSize
        }
      }
    }
    
    results.endTime = Date.now()
    results.duration = results.endTime - results.startTime
    
    // Memory after test
    if (performance.memory) {
      results.memoryUsage.after = performance.memory.usedJSHeapSize
    }
    
    // Calculate statistics
    if (results.executionTimes.length > 0) {
      const sortedTimes = results.executionTimes.sort((a, b) => a - b)
      results.statistics = {
        min: sortedTimes[0],
        max: sortedTimes[sortedTimes.length - 1],
        avg: results.executionTimes.reduce((a, b) => a + b, 0) / results.executionTimes.length,
        median: sortedTimes[Math.floor(sortedTimes.length / 2)],
        p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
        p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
        opsPerSecond: (results.iterations / results.duration) * 1000,
        successRate: (results.iterations / (results.iterations + results.errors.length)) * 100
      }
    }
    
    console.log(`✅ Performance test completed: ${name}`)
    console.table(results.statistics)
    
    return results
  } catch (error) {
    results.endTime = Date.now()
    results.duration = results.endTime - results.startTime
    results.errors.push({ error: error.message, fatal: true })
    
    console.error(`❌ Performance test failed: ${name}`, error)
    throw error
  }
})</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-red-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Real-time Metrics</h3>
        <p class="text-gray-600 text-sm">Monitor execution time, throughput, memory usage, and success rates in real-time.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-red-600 text-2xl mb-3">🔍</div>
        <h3 class="font-semibold text-gray-800 mb-2">Performance Profiling</h3>
        <p class="text-gray-600 text-sm">Deep dive into performance bottlenecks with detailed execution profiling and analysis.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-red-600 text-2xl mb-3">🧪</div>
        <h3 class="font-semibold text-gray-800 mb-2">Load Testing</h3>
        <p class="text-gray-600 text-sm">Test system performance under various loads with concurrent execution and stress testing.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-red-600 text-2xl mb-3">📊</div>
        <h3 class="font-semibold text-gray-800 mb-2">Analytics Dashboard</h3>
        <p class="text-gray-600 text-sm">Comprehensive performance analytics with historical data and trend analysis.</p>
      </div>
    </div>

    <!-- Performance Statistics -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">📈 Performance Statistics</h2>
      <div class="grid grid-cols-2 md:grid-cols-6 gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ performanceStats.totalTests }}</div>
          <div class="text-sm text-gray-600">Total Tests</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ performanceStats.avgExecutionTime }}ms</div>
          <div class="text-sm text-gray-600">Avg Execution</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ performanceStats.peakMemory }}MB</div>
          <div class="text-sm text-gray-600">Peak Memory</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ performanceStats.maxThroughput }}/s</div>
          <div class="text-sm text-gray-600">Max Throughput</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ performanceStats.successRate }}%</div>
          <div class="text-sm text-gray-600">Success Rate</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ performanceStats.totalOperations }}</div>
          <div class="text-sm text-gray-600">Total Ops</div>
        </div>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Performance Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No performance activity yet. Run some performance tests to see the activity log!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Performance monitoring state
const isRunningTest = ref(false)
const isProfiling = ref(false)
const activityLog = ref([])
const performanceHistory = ref([])
const testResults = ref([])

// Test configuration
const testConfig = reactive({
  iterations: 1000,
  concurrentTasks: 10
})

// Current metrics
const currentMetrics = reactive({
  executionTime: 0,
  throughput: 0,
  memoryUsage: 0,
  successRate: 100
})

// Registry statistics
const registryStats = reactive({
  totalPulsers: 0,
  activePulsers: 0,
  asyncPulsers: 0,
  totalCallbacks: 0
})

// Top performers
const topPerformers = ref([])

// Performance statistics
const performanceStats = computed(() => {
  const totalTests = testResults.value.length
  const avgExecutionTime = performanceHistory.value.length > 0 
    ? Math.round(performanceHistory.value.reduce((sum, p) => sum + p.executionTime, 0) / performanceHistory.value.length)
    : 0
  
  const peakMemory = performanceHistory.value.length > 0
    ? Math.max(...performanceHistory.value.map(p => p.memoryUsage || 0))
    : 0
  
  const maxThroughput = performanceHistory.value.length > 0
    ? Math.max(...performanceHistory.value.map(p => p.throughput || 0))
    : 0
  
  const successfulTests = testResults.value.filter(t => t.success).length
  const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 100
  
  const totalOperations = testResults.value.reduce((sum, t) => sum + (t.iterations || 0), 0)
  
  return {
    totalTests,
    avgExecutionTime,
    peakMemory,
    maxThroughput,
    successRate,
    totalOperations
  }
})

// Setup performance monitoring system
const setupPerformanceMonitoring = () => {
  // Performance monitor
  CreatePulser('performance:monitor', () => {
    const metrics = reactive({
      executionTimes: [],
      memoryUsage: [],
      throughput: 0,
      successRate: 100,
      errors: [],
      pulserStats: new Map()
    })
    
    let isMonitoring = false
    let monitoringInterval = null
    
    return {
      metrics,
      
      start: () => {
        isMonitoring = true
        logActivity('Performance monitoring started', 'info')
        
        // Monitor memory usage every second
        monitoringInterval = setInterval(() => {
          if (!isMonitoring) {
            clearInterval(monitoringInterval)
            return
          }
          
          if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
            currentMetrics.memoryUsage = memoryMB
            
            metrics.memoryUsage.push({
              value: memoryMB,
              timestamp: Date.now()
            })
            
            if (metrics.memoryUsage.length > 100) {
              metrics.memoryUsage = metrics.memoryUsage.slice(-100)
            }
          }
        }, 1000)
        
        return monitoringInterval
      },
      
      stop: () => {
        isMonitoring = false
        if (monitoringInterval) {
          clearInterval(monitoringInterval)
        }
        logActivity('Performance monitoring stopped', 'info')
      },
      
      measureExecution: async (pulserAlias, fn, ...args) => {
        const startTime = performance.now()
        let result, error
        
        try {
          result = await fn(...args)
          
          const endTime = performance.now()
          const executionTime = endTime - startTime
          
          // Update current metrics
          currentMetrics.executionTime = Math.round(executionTime)
          
          // Record execution metrics
          metrics.executionTimes.push({
            alias: pulserAlias,
            time: executionTime,
            timestamp: Date.now(),
            success: true
          })
          
          // Add to performance history
          performanceHistory.value.push({
            executionTime: Math.round(executionTime),
            memoryUsage: currentMetrics.memoryUsage,
            throughput: currentMetrics.throughput,
            timestamp: Date.now()
          })
          
          // Keep only last 100 entries
          if (performanceHistory.value.length > 100) {
            performanceHistory.value = performanceHistory.value.slice(-100)
          }
          
          // Update pulser-specific stats
          if (!metrics.pulserStats.has(pulserAlias)) {
            metrics.pulserStats.set(pulserAlias, {
              totalCalls: 0,
              totalTime: 0,
              errors: 0,
              avgTime: 0
            })
          }
          
          const stats = metrics.pulserStats.get(pulserAlias)
          stats.totalCalls++
          stats.totalTime += executionTime
          stats.avgTime = Math.round(stats.totalTime / stats.totalCalls)
          
          // Update top performers
          updateTopPerformers()
          
          // Calculate throughput
          const recentExecutions = metrics.executionTimes.filter(
            exec => Date.now() - exec.timestamp < 1000
          )
          currentMetrics.throughput = recentExecutions.length
          
          // Calculate success rate
          const recentTotal = metrics.executionTimes.filter(
            exec => Date.now() - exec.timestamp < 10000
          ).length
          const recentSuccesses = metrics.executionTimes.filter(
            exec => Date.now() - exec.timestamp < 10000 && exec.success
          ).length
          
          currentMetrics.successRate = recentTotal > 0 ? Math.round((recentSuccesses / recentTotal) * 100) : 100
          
          return result
        } catch (err) {
          error = err
          
          const endTime = performance.now()
          const executionTime = endTime - startTime
          
          // Record error metrics
          metrics.executionTimes.push({
            alias: pulserAlias,
            time: executionTime,
            timestamp: Date.now(),
            success: false,
            error: err.message
          })
          
          metrics.errors.push({
            alias: pulserAlias,
            error: err.message,
            timestamp: Date.now()
          })
          
          // Update error stats
          if (metrics.pulserStats.has(pulserAlias)) {
            metrics.pulserStats.get(pulserAlias).errors++
          }
          
          throw err
        } finally {
          // Keep only last 1000 execution records
          if (metrics.executionTimes.length > 1000) {
            metrics.executionTimes = metrics.executionTimes.slice(-1000)
          }
          
          // Keep only last 100 error records
          if (metrics.errors.length > 100) {
            metrics.errors = metrics.errors.slice(-100)
          }
        }
      },
      
      clear: () => {
        metrics.executionTimes = []
        metrics.memoryUsage = []
        metrics.errors = []
        metrics.pulserStats.clear()
        metrics.throughput = 0
        metrics.successRate = 100
        
        currentMetrics.executionTime = 0
        currentMetrics.throughput = 0
        currentMetrics.memoryUsage = 0
        currentMetrics.successRate = 100
        
        performanceHistory.value = []
        topPerformers.value = []
      }
    }
  })
  
  // Performance test runner
  CreatePulser('performance:test:sync', async (iterations) => {
    const monitor = Pulsor('performance:monitor').pulse()
    
    const testFn = () => {
      // Simulate synchronous work
      let result = 0
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(i) * Math.random()
      }
      return result
    }
    
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const result = await monitor.measureExecution('sync-test', testFn)
      results.push(result)
    }
    
    return {
      type: 'sync',
      iterations,
      results: results.length,
      success: true
    }
  })
  
  CreatePulser('performance:test:async', async (iterations) => {
    const monitor = Pulsor('performance:monitor').pulse()
    
    const testFn = async () => {
      // Simulate asynchronous work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
      return Math.random() * 1000
    }
    
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const result = await monitor.measureExecution('async-test', testFn)
      results.push(result)
    }
    
    return {
      type: 'async',
      iterations,
      results: results.length,
      success: true
    }
  })
  
  CreatePulser('performance:test:memory', async () => {
    const monitor = Pulsor('performance:monitor').pulse()
    
    const testFn = () => {
      // Create memory pressure
      const arrays = []
      for (let i = 0; i < 1000; i++) {
        arrays.push(new Array(1000).fill(Math.random()))
      }
      
      // Process arrays
      let result = 0
      arrays.forEach(arr => {
        result += arr.reduce((sum, val) => sum + val, 0)
      })
      
      return result
    }
    
    const result = await monitor.measureExecution('memory-test', testFn)
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    return {
      type: 'memory',
      result,
      success: true
    }
  })
  
  CreatePulser('performance:test:concurrency', async (concurrentTasks) => {
    const monitor = Pulsor('performance:monitor').pulse()
    
    const testFn = async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
      return Math.random() * 100
    }
    
    const promises = []
    for (let i = 0; i < concurrentTasks; i++) {
      promises.push(monitor.measureExecution(`concurrent-test-${i}`, testFn))
    }
    
    const results = await Promise.all(promises)
    
    return {
      type: 'concurrency',
      concurrentTasks,
      results: results.length,
      success: true
    }
  })
  
  CreatePulser('performance:test:stress', async () => {
    const monitor = Pulsor('performance:monitor').pulse()
    
    const testFn = () => {
      // CPU intensive task
      let result = 0
      for (let i = 0; i < 100000; i++) {
        result += Math.sin(i) * Math.cos(i) * Math.tan(i)
      }
      return result
    }
    
    const startTime = Date.now()
    const results = []
    
    // Run for 5 seconds
    while (Date.now() - startTime < 5000) {
      const result = await monitor.measureExecution('stress-test', testFn)
      results.push(result)
    }
    
    return {
      type: 'stress',
      duration: Date.now() - startTime,
      iterations: results.length,
      success: true
    }
  })
}

// Performance test functions
const runSyncPerformanceTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity(`Starting sync performance test (${testConfig.iterations} iterations)`, 'info')
  
  try {
    const result = await Pulsor('performance:test:sync').pulse(testConfig.iterations)
    testResults.value.push(result)
    logActivity(`Sync test completed: ${result.iterations} iterations`, 'success')
  } catch (error) {
    logActivity(`Sync test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'sync', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const runAsyncPerformanceTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity(`Starting async performance test (${testConfig.iterations} iterations)`, 'info')
  
  try {
    const result = await Pulsor('performance:test:async').pulse(testConfig.iterations)
    testResults.value.push(result)
    logActivity(`Async test completed: ${result.iterations} iterations`, 'success')
  } catch (error) {
    logActivity(`Async test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'async', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const runMemoryTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity('Starting memory usage test', 'info')
  
  try {
    const result = await Pulsor('performance:test:memory').pulse()
    testResults.value.push(result)
    logActivity('Memory test completed', 'success')
  } catch (error) {
    logActivity(`Memory test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'memory', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const runGarbageCollectionTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity('Starting garbage collection test', 'info')
  
  try {
    // Create memory pressure
    const arrays = []
    for (let i = 0; i < 10000; i++) {
      arrays.push(new Array(100).fill(Math.random()))
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
      logActivity('Garbage collection triggered', 'success')
    } else {
      logActivity('Garbage collection not available in this browser', 'warning')
    }
    
    testResults.value.push({ type: 'gc', success: true })
  } catch (error) {
    logActivity(`GC test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'gc', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const runConcurrencyTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity(`Starting concurrency test (${testConfig.concurrentTasks} tasks)`, 'info')
  
  try {
    const result = await Pulsor('performance:test:concurrency').pulse(testConfig.concurrentTasks)
    testResults.value.push(result)
    logActivity(`Concurrency test completed: ${result.concurrentTasks} tasks`, 'success')
  } catch (error) {
    logActivity(`Concurrency test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'concurrency', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const runStressTest = async () => {
  if (isRunningTest.value) return
  
  isRunningTest.value = true
  logActivity('Starting stress test (5 seconds)', 'info')
  
  try {
    const result = await Pulsor('performance:test:stress').pulse()
    testResults.value.push(result)
    logActivity(`Stress test completed: ${result.iterations} iterations in ${result.duration}ms`, 'success')
  } catch (error) {
    logActivity(`Stress test failed: ${error.message}`, 'error')
    testResults.value.push({ type: 'stress', success: false, error: error.message })
  } finally {
    isRunningTest.value = false
  }
}

const toggleProfiling = () => {
  const monitor = Pulsor('performance:monitor').pulse()
  
  if (isProfiling.value) {
    monitor.stop()
    isProfiling.value = false
  } else {
    monitor.start()
    isProfiling.value = true
  }
}

const clearMetrics = () => {
  const monitor = Pulsor('performance:monitor').pulse()
  monitor.clear()
  
  testResults.value = []
  activityLog.value = []
  
  logActivity('All performance metrics cleared', 'warning')
}

// Utility functions
const updateTopPerformers = () => {
  const monitor = Pulsor('performance:monitor').pulse()
  const performers = []
  
  monitor.metrics.pulserStats.forEach((stats, alias) => {
    performers.push({
      alias,
      avgTime: stats.avgTime,
      calls: stats.totalCalls,
      errors: stats.errors
    })
  })
  
  topPerformers.value = performers
    .sort((a, b) => a.avgTime - b.avgTime)
    .slice(0, 10)
}

const updateRegistryStats = () => {
  // This would typically query the actual Pulsor registry
  // For demo purposes, we'll simulate some stats
  registryStats.totalPulsers = 15 + testResults.value.length
  registryStats.activePulsers = 8 + (isProfiling.value ? 1 : 0)
  registryStats.asyncPulsers = 6
  registryStats.totalCallbacks = 25 + testResults.value.length * 2
}

const logActivity = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  activityLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 30 entries
  if (activityLog.value.length > 30) {
    activityLog.value = activityLog.value.slice(0, 30)
  }
}

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    case 'warning': return 'text-orange-600'
    case 'info': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupPerformanceMonitoring()
  
  // Update registry stats periodically
  const statsInterval = setInterval(updateRegistryStats, 2000)
  
  logActivity('Performance Monitoring demo initialized', 'info')
  
  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(statsInterval)
    
    if (isProfiling.value) {
      const monitor = Pulsor('performance:monitor').pulse()
      monitor.stop()
    }
    
    logActivity('Performance Monitoring demo unmounted', 'info')
  })
})
</script>