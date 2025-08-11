# Pulsor Security & Resilience Guide

## Overview

Pulsor v2.0 introduces comprehensive security and resilience features to protect against common vulnerabilities and system failures. This guide covers all security enhancements and best practices.

## Security Features

### 1. Prototype Pollution Protection

Pulsor automatically prevents prototype pollution attacks by:

- **Dangerous Key Filtering**: Blocks `__proto__`, `constructor`, and `prototype` keys in options
- **Argument Sanitization**: Deep clones objects when `freezeArgs` is enabled
- **Input Validation**: Strict validation of all user inputs

```javascript
// ❌ This will throw an error
try {
  pulsor.register('test', fn, {
    '__proto__': { polluted: true },
    callbackStrategy: 'parallel'
  });
} catch (error) {
  console.log('Prototype pollution attempt blocked');
}

// ✅ Safe usage with argument sanitization
pulsor.register('api', fetchData, { freezeArgs: true });
const result = await pulsor.pulse('api', { data: userInput });
```

### 2. Injection Attack Prevention

- **Alias Validation**: Only alphanumeric characters, underscores, colons, and dashes allowed
- **Input Sanitization**: Automatic sanitization of function arguments
- **Safe Execution**: Isolated execution context for user functions

```javascript
// ❌ These aliases will be rejected
const invalidAliases = [
  'test<script>alert(1)</script>',
  'test${process.exit()}',
  'test\x00null',
  'test with spaces'
];

// ✅ Valid aliases
const validAliases = [
  'user-service',
  'api_call',
  'data:processor',
  'cache123'
];
```

### 3. Memory Leak Prevention

- **Pattern Callback Limits**: Maximum 1000 pattern callbacks
- **Cache Size Management**: Automatic cleanup of old cache entries
- **Event Listener Limits**: Maximum 50 listeners per event
- **Metrics Cleanup**: Periodic cleanup of old performance data

```javascript
// Automatic memory management
const metrics = pulsor.getMetrics();
console.log(metrics.memoryUsage);
// {
//   patternCache: 45,
//   performanceMetrics: 234,
//   errorsByFunction: 12
// }
```

## Resilience Features

### 1. Circuit Breaker Pattern

Protects against cascading failures by temporarily disabling failing functions:

```javascript
// Configure circuit breaker
pulsor.register('external-api', fetchExternalData, {
  circuitBreakerThreshold: 5, // Open after 5 failures
  maxRetries: 3
});

// Monitor circuit breaker status
const status = pulsor.getCircuitBreakerStatus('external-api');
console.log(status);
// {
//   state: 'CLOSED',        // CLOSED, OPEN, or HALF_OPEN
//   failureCount: 2,
//   threshold: 5,
//   nextAttempt: 1640995200000
// }

// Reset circuit breaker manually
if (status.state === 'OPEN') {
  pulsor.resetCircuitBreaker('external-api');
}

// Listen for circuit breaker events
pulsor.on('circuitBreakerTripped', ({ alias, threshold }) => {
  console.log(`Circuit breaker opened for ${alias} after ${threshold} failures`);
  // Implement fallback logic or alerting
});
```

### 2. Timeout Protection

Prevents functions from running indefinitely:

```javascript
// Set timeout for long-running operations
pulsor.register('data-processing', processLargeDataset, {
  timeout: 30000, // 30 seconds
  maxRetries: 2
});

try {
  const result = await pulsor.pulse('data-processing', dataset);
} catch (error) {
  if (error.message.includes('aborted')) {
    console.log('Operation timed out');
  }
}
```

### 3. Retry Logic with Exponential Backoff

Automatically retries failed operations with intelligent backoff:

```javascript
// Configure retry behavior
pulsor.register('flaky-service', callFlakyAPI, {
  maxRetries: 5,
  timeout: 10000,
  circuitBreakerThreshold: 10
});

// Exponential backoff schedule:
// Attempt 1: immediate
// Attempt 2: ~100ms delay
// Attempt 3: ~200ms delay
// Attempt 4: ~400ms delay
// Attempt 5: ~800ms delay
// Attempt 6: ~1000ms delay (capped)

const result = await pulsor.pulse('flaky-service', params);
```

### 4. Concurrent Execution Control

Prevents race conditions in critical functions:

```javascript
// Ensure only one instance runs at a time
pulsor.register('critical-update', updateCriticalData, {
  preventConcurrentExecution: true
});

// First call starts execution
const promise1 = pulsor.pulse('critical-update', data1);

// Second call will fail immediately
try {
  await pulsor.pulse('critical-update', data2);
} catch (error) {
  console.log('Concurrent execution prevented');
}

// Wait for first call to complete
await promise1;

// Now second call can proceed
const result2 = await pulsor.pulse('critical-update', data2);
```

## Enhanced Monitoring

### 1. Comprehensive Metrics

```javascript
const metrics = pulsor.getMetrics();
console.log(metrics);
// {
//   totalExecutions: 1250,
//   totalErrors: 23,
//   avgDuration: 145.67,
//   maxDuration: 2341,
//   minDuration: 12,
//   p95Duration: 456,      // 95th percentile
//   p99Duration: 1234,     // 99th percentile
//   activeExecutions: 3,
//   circuitBreakerTrips: 2,
//   cacheStats: {
//     hits: 890,
//     misses: 234,
//     hitRate: 0.79
//   },
//   memoryUsage: {
//     patternCache: 45,
//     performanceMetrics: 234,
//     errorsByFunction: 12
//   }
// }
```

### 2. Event-Driven Monitoring

```javascript
// Monitor security events
pulsor.on('securityViolation', ({ type, details }) => {
  console.log(`Security violation: ${type}`, details);
  // Send to security monitoring system
});

// Monitor performance issues
pulsor.on('circuitBreakerTripped', ({ alias, threshold }) => {
  // Alert operations team
  sendAlert(`Service ${alias} is experiencing issues`);
});

// Monitor execution attempts
pulsor.on('beforeExecution', ({ alias, attempt }) => {
  if (attempt > 0) {
    console.log(`Retrying ${alias}, attempt ${attempt + 1}`);
  }
});

// Monitor timeouts
pulsor.on('pulseError', ({ alias, error, attempt }) => {
  if (error.message.includes('aborted')) {
    console.log(`Timeout in ${alias} on attempt ${attempt + 1}`);
  }
});
```

## Best Practices

### 1. Security Configuration

```javascript
// Always enable argument sanitization for user-facing functions
pulsor.register('user-action', handleUserAction, {
  freezeArgs: true,
  timeout: 5000,
  maxRetries: 2
});

// Use strict validation for external inputs
function validateUserInput(input) {
  if (typeof input !== 'object' || input === null) {
    throw new PulsorError('Invalid input type');
  }
  
  // Remove dangerous properties
  const safe = JSON.parse(JSON.stringify(input));
  delete safe.__proto__;
  delete safe.constructor;
  delete safe.prototype;
  
  return safe;
}
```

### 2. Resilience Configuration

```javascript
// Configure based on service criticality
const criticalServiceConfig = {
  timeout: 30000,
  maxRetries: 5,
  circuitBreakerThreshold: 3,
  preventConcurrentExecution: true
};

const nonCriticalServiceConfig = {
  timeout: 10000,
  maxRetries: 2,
  circuitBreakerThreshold: 10
};

pulsor.register('payment-processor', processPayment, criticalServiceConfig);
pulsor.register('analytics-tracker', trackEvent, nonCriticalServiceConfig);
```

### 3. Monitoring Setup

```javascript
// Set up comprehensive monitoring
class PulsorMonitor {
  constructor(pulsor) {
    this.setupEventListeners(pulsor);
    this.startMetricsCollection(pulsor);
  }
  
  setupEventListeners(pulsor) {
    pulsor.on('circuitBreakerTripped', this.handleCircuitBreakerTrip);
    pulsor.on('pulseError', this.handleExecutionError);
    pulsor.on('securityViolation', this.handleSecurityViolation);
  }
  
  startMetricsCollection(pulsor) {
    setInterval(() => {
      const metrics = pulsor.getMetrics();
      this.sendMetricsToMonitoring(metrics);
    }, 60000); // Every minute
  }
  
  handleCircuitBreakerTrip({ alias, threshold }) {
    // Send alert to operations team
    this.sendAlert({
      severity: 'high',
      message: `Circuit breaker opened for ${alias}`,
      details: { threshold }
    });
  }
  
  handleExecutionError({ alias, error, attempt }) {
    // Log error for analysis
    this.logError({
      service: alias,
      error: error.message,
      attempt,
      timestamp: Date.now()
    });
  }
  
  handleSecurityViolation({ type, details }) {
    // Immediate security alert
    this.sendSecurityAlert({
      type,
      details,
      timestamp: Date.now(),
      severity: 'critical'
    });
  }
}

// Initialize monitoring
const monitor = new PulsorMonitor(pulsor);
```

### 4. Graceful Degradation

```javascript
// Implement fallback strategies
async function robustDataFetch(id) {
  try {
    // Try primary service
    return await pulsor.pulse('primary-api', id);
  } catch (error) {
    if (error.message.includes('Circuit breaker is OPEN')) {
      // Use cached data or secondary service
      try {
        return await pulsor.pulse('cache-service', id);
      } catch (cacheError) {
        return await pulsor.pulse('secondary-api', id);
      }
    }
    throw error;
  }
}
```

## Migration Guide

To upgrade existing Pulsor implementations:

1. **Update Configuration**: Add new security and resilience options
2. **Review Aliases**: Ensure all aliases follow the new validation rules
3. **Add Monitoring**: Implement event listeners for new events
4. **Test Security**: Run security tests to verify protection
5. **Configure Circuit Breakers**: Set appropriate thresholds for your services

```javascript
// Before (v1.x)
pulsor.register('api', fetchData);

// After (v2.0)
pulsor.register('api', fetchData, {
  timeout: 10000,
  maxRetries: 3,
  circuitBreakerThreshold: 5,
  freezeArgs: true
});

// Add monitoring
pulsor.on('circuitBreakerTripped', ({ alias }) => {
  console.log(`Service ${alias} is experiencing issues`);
});
```

## Security Checklist

- [ ] Enable `freezeArgs` for functions handling user input
- [ ] Set appropriate timeouts for all functions
- [ ] Configure circuit breakers based on service criticality
- [ ] Implement comprehensive monitoring
- [ ] Validate all function aliases
- [ ] Set up alerting for security violations
- [ ] Regular review of metrics and performance
- [ ] Test failure scenarios and recovery
- [ ] Document security configurations
- [ ] Train team on new security features

## Conclusion

Pulsor v2.0 provides enterprise-grade security and resilience features that protect against common vulnerabilities and system failures. By following these guidelines and best practices, you can build robust, secure applications that gracefully handle failures and protect against attacks.

For additional support or security questions, please refer to the main documentation or open an issue in the repository.