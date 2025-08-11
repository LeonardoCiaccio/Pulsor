# Pulsor Framework

[![npm version](https://badge.fury.io/js/pulsor.svg)](https://badge.fury.io/js/pulsor)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/pulsor/pulsor/workflows/CI/badge.svg)](https://github.com/pulsor/pulsor/actions)
[![Coverage Status](https://coveralls.io/repos/github/pulsor/pulsor/badge.svg?branch=main)](https://coveralls.io/github/pulsor/pulsor?branch=main)

**Pulsor** is an advanced function execution framework for JavaScript and TypeScript that provides caching, metrics, performance optimization, and enterprise-grade features like circuit breakers, rate limiting, and security validation.

## 🚀 Features

### Core Features
- **Function Wrapping**: Transform any function into a "Pulser" with enhanced capabilities
- **Intelligent Caching**: Built-in caching with configurable strategies
- **Performance Metrics**: Detailed execution metrics and performance monitoring
- **Circuit Breaker**: Automatic failure detection and recovery
- **Rate Limiting**: Configurable rate limiting and throttling
- **Security Validation**: Input sanitization and security checks
- **Memory Management**: Advanced memory monitoring and leak detection
- **Event System**: Comprehensive event emission for monitoring and debugging

### Advanced Features
- **Async Lock Management**: Prevent race conditions with sophisticated locking
- **Retry Logic**: Configurable retry strategies with exponential backoff
- **Timeout Handling**: Automatic timeout management
- **Pattern Callbacks**: Pattern-based callback registration
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: No external runtime dependencies

## 📦 Installation

```bash
npm install pulsor
```

```bash
yarn add pulsor
```

```bash
pnpm add pulsor
```

## 🏃 Quick Start

### Basic Usage

```typescript
import { createPulsor } from 'pulsor';

// Create a Pulsor instance
const pulsor = createPulsor();

// Wrap a function
const fetchUser = pulsor.createPulser(
  'fetchUser',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  {
    cache: true,
    timeout: 5000,
    retries: 3
  }
);

// Use the enhanced function
const user = await fetchUser('123');
console.log(user);
```

### Using the Global Instance

```typescript
import { pulser, getPulser } from 'pulsor';

// Create a Pulser using the global instance
const calculateSum = pulser(
  'calculateSum',
  (a: number, b: number) => a + b,
  { cache: true }
);

// Use it
const result = await calculateSum(5, 3); // 8

// Get it later
const samePulser = getPulser<[number, number], number>('calculateSum');
```

## 🔧 Configuration

### Pulser Options

```typescript
interface CreatePulserOptions {
  /** Enable caching (default: true) */
  cache?: boolean;
  
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  
  /** Maximum cache size */
  cacheSize?: number;
  
  /** Execution timeout in milliseconds */
  timeout?: number;
  
  /** Number of retry attempts */
  retries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** Enable circuit breaker */
  circuitBreaker?: boolean;
  
  /** Enable metrics collection */
  metrics?: boolean;
  
  /** Rate limit (calls per second) */
  rateLimit?: number;
  
  /** Enable security validation */
  security?: boolean;
}
```

### Instance Configuration

```typescript
import { createPulsor } from 'pulsor';

const pulsor = createPulsor({
  enableMetrics: true,
  enableMemoryMonitoring: true,
  enableSecurity: true,
  globalTimeout: 30000,
  maxConcurrentExecutions: 100,
  debug: true
});
```

## 📊 Metrics and Monitoring

### Getting Metrics

```typescript
// Get overall metrics
const metrics = pulsor.getMetrics();
console.log(metrics);

// Get memory usage
const memoryUsage = pulsor.getMemoryUsage();
console.log(memoryUsage);

// Get security metrics
const securityMetrics = pulsor.getSecurityMetrics();
console.log(securityMetrics);
```

### Event Monitoring

```typescript
import { globalPulsor } from 'pulsor';

// Listen to execution events
globalPulsor.eventEmitter.on('pulser:executed', (event) => {
  console.log(`Pulser ${event.alias} executed in ${event.duration}ms`);
});

// Listen to error events
globalPulsor.eventEmitter.on('pulser:error', (event) => {
  console.error(`Pulser ${event.alias} failed:`, event.error);
});
```

## 🔒 Security Features

### Input Validation

```typescript
const securePulser = pulsor.createPulser(
  'secureFunction',
  (data: any) => {
    // Your function logic
    return processData(data);
  },
  {
    security: true, // Enable security validation
    rateLimit: 10   // 10 calls per second max
  }
);
```

### Rate Limiting

```typescript
const rateLimitedPulser = pulser(
  'apiCall',
  async (endpoint: string) => {
    return fetch(endpoint).then(r => r.json());
  },
  {
    rateLimit: 5, // Maximum 5 calls per second
    timeout: 10000
  }
);
```

## 🔄 Circuit Breaker

```typescript
const resilientPulser = pulser(
  'externalService',
  async (data: any) => {
    // Call to external service that might fail
    return await externalServiceCall(data);
  },
  {
    circuitBreaker: true,
    retries: 3,
    timeout: 5000
  }
);
```

## 📝 Callbacks and Patterns

### Adding Callbacks

```typescript
// Add a specific callback
pulsor.addCallback('onUserFetch', (result, context) => {
  console.log('User fetched:', result);
});

// Add a pattern-based callback
pulsor.addPatternCallback('fetch*', (result, context) => {
  console.log('Fetch operation completed:', context.alias);
});
```

## 🏭 Factory Functions

### Specialized Instances

```typescript
import {
  createHighPerformancePulsor,
  createDevelopmentPulsor,
  createTestPulsor
} from 'pulsor';

// High-performance instance (minimal overhead)
const fastPulsor = createHighPerformancePulsor();

// Development instance (full monitoring)
const devPulsor = createDevelopmentPulsor();

// Test instance (minimal features)
const testPulsor = createTestPulsor();
```

## 🧪 Testing

```typescript
import { createTestPulsor } from 'pulsor';

describe('My Function Tests', () => {
  let testPulsor: Pulsor;
  
  beforeEach(() => {
    testPulsor = createTestPulsor();
  });
  
  afterEach(() => {
    testPulsor.destroy();
  });
  
  it('should execute function correctly', async () => {
    const testFunction = testPulsor.createPulser(
      'test',
      (x: number) => x * 2
    );
    
    const result = await testFunction(5);
    expect(result).toBe(10);
  });
});
```

## 📚 API Reference

### Core Classes

- **`Pulsor`** - Main framework class
- **`MetricsService`** - Metrics collection and reporting
- **`MemoryService`** - Memory monitoring and management
- **`SecurityService`** - Security validation and rate limiting
- **`Logger`** - Advanced logging with context
- **`AsyncLock`** - Asynchronous locking mechanism
- **`CircuitBreaker`** - Circuit breaker implementation
- **`EventEmitter`** - Type-safe event emission
- **`Validator`** - Input validation and sanitization

### Utility Functions

- **`createPulsor(config?)`** - Create a new Pulsor instance
- **`pulser(alias, fn, options?)`** - Create a Pulser using global instance
- **`getPulser(alias)`** - Get an existing Pulser
- **`hasPulser(alias)`** - Check if Pulser exists
- **`removePulser(alias)`** - Remove a Pulser
- **`getMetrics()`** - Get global metrics
- **`clear()`** - Clear all Pulsers

## 🔧 Advanced Configuration

### Custom Services

```typescript
import { createPulsor, createLogger, createMetricsService } from 'pulsor';

const customLogger = createLogger({
  level: 'debug',
  prefix: '[MyApp]',
  colors: true
});

const customMetrics = createMetricsService({
  enabled: true,
  bufferSize: 10000,
  flushInterval: 30000
});

const pulsor = createPulsor({
  logger: customLogger,
  serviceFactory: {
    createMetricsService: () => customMetrics
  }
});
```

### Environment-Specific Configuration

```typescript
const config = {
  development: {
    enableMetrics: true,
    enableMemoryMonitoring: true,
    enableSecurity: true,
    debug: true
  },
  production: {
    enableMetrics: true,
    enableMemoryMonitoring: false,
    enableSecurity: true,
    debug: false
  },
  test: {
    enableMetrics: false,
    enableMemoryMonitoring: false,
    enableSecurity: false,
    debug: false
  }
};

const pulsor = createPulsor(config[process.env.NODE_ENV || 'development']);
```

## 🚀 Performance Tips

1. **Use High-Performance Mode**: For production environments with high throughput
2. **Disable Unnecessary Features**: Turn off metrics/monitoring in performance-critical paths
3. **Configure Cache Appropriately**: Set reasonable cache sizes and TTL values
4. **Monitor Memory Usage**: Use memory service to detect leaks early
5. **Use Circuit Breakers**: Protect against cascading failures

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/pulsor/pulsor.git
cd pulsor

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run linting
npm run lint

# Generate documentation
npm run docs
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various function execution and caching libraries
- Built with modern TypeScript and performance best practices
- Designed for enterprise-grade applications

## 📞 Support

- **Documentation**: [https://pulsor.dev/docs](https://pulsor.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/pulsor/pulsor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pulsor/pulsor/discussions)
- **Email**: team@pulsor.dev

---

**Pulsor** - Elevate your function execution to the next level! 🚀

## Sommario

* Introduzione
* Caratteristiche Principali
* Installazione
* Struttura del Progetto
* Utilizzo Base
* Configurazione e Opzioni
* Hook e Strategie di Callback
* API Reference
* Metriche e Osservabilità
* Gestione Errori
* Esempi Avanzati
* Best Practice
* Licenza

## Introduzione

Pulsor è un orchestratore di funzioni JavaScript/TypeScript che consente di registrare metodi sincroni e asincroni sotto alias nominali, aggiungere hook in tre fasi (`before`, `after`, `error`), raccogliere metriche e gestire side-effects in modo disaccoppiato.

Ideale per plugin system, microfrontend, pipeline di eventi, logging, metriche e ogni scenario in cui serva estendere o osservare l’esecuzione di funzioni in modo modulare e scalabile.

## Caratteristiche Principali

* Registrazione e aggiornamento di funzioni con alias stringa
* Esecuzione unica per funzioni sincrone e asincrone
* Hook di fase (`before`, `after`, `error`) con priorità, contesto e flag `once`
* Strategie di callback: `parallel` o `sequential`
* Configurazione fail-fast sui callback
* Iniezione di contesto pre/post esecuzione
* Metriche interne (conteggio, durata media, timestamp)
* Supporto a wildcard e namespace per introspezione
* API per distruzione, verifica esistenza, elenchi e debug

## Installazione

npm install pulsor

// ES Module
import {
  CreatePulser,
  Pulsor,
  UpdatePulser,
  DestroyPulser,
  PulserExists,
  ListPulsers,
  GetPulserInfo,
  SetLoggy,
  PulsorError
} from 'pulsor';

// CommonJS
const {
  CreatePulser,
  Pulsor,
  UpdatePulser,
  DestroyPulser,
  PulserExists,
  ListPulsers,
  GetPulserInfo,
  SetLoggy,
  PulsorError
} = require('pulsor');

## Struttura del Progetto

/src
  /orchestrator
    pulsor.js          # Import e setup base Pulsor
  /modules
    logger.js          # Plugin di logging
    analytics.js       # Plugin di metriche personalizzate
    ui-spinner.js      # Spinner per UI
  index.js             # Punto di ingresso
README.md              # Documentazione progetto

## Utilizzo Base

// Definisci la funzione sotto alias 'sum'
CreatePulser('sum', (a, b) => a + b);

// Ottieni il controller
const sumPulser = Pulsor('sum');

// Esegui la funzione
const result = sumPulser.pulse(3, 5);
console.log(result); // 8

// Funzione asincrona
CreatePulser('fetchUser', async (id) => {
  const resp = await fetch(`/api/user/${id}`);
  return resp.json();
}, { isAsync: true });

const fetchUser = Pulsor('fetchUser');
const user = await fetchUser.pulse(42);

## Configurazione e Opzioni

| Opzione | Tipo | Default | Descrizione | 
| --- | --- | --- | --- | 
| isAsync | boolean | auto | Forza il pulser a trattare la funzione come async o sync | 
| callbackStrategy | 'parallel' | 'sequential' | 'parallel' | Modalità di esecuzione dei callback | 
| failFastCallbacks | boolean | false | Se true, ferma l’esecuzione dei callback al primo errore | 
| schedule | 'immediate' | 'microtask' | 'immediate' | Quando eseguire i callback post-esecuzione | 
| provideContext | 'none' | 'prepend' | 'append' | 'none' | Inietta un oggetto contesto nei callback | 
| errorCallbacksBeforeThrow | boolean | true | Esegue hook error prima di rilanciare l’errore principale | 
| propagateMainError | boolean | true | Se true, rilancia l’errore generato dalla funzione principale | 
| override | boolean | false | Se true, sovrascrive un pulser già esistente | 
| resetCallbacks | boolean | false | Se true e override, rimuove i callback esistenti | 
| resetMetrics | boolean | false | Se true e override, azzera le metriche | 

## Hook e Strategie di Callback

Ogni Pulser controller espone i metodi:

* bind(fn, options?)
* unbind(fn, options?)
* unbindAll(options?)

Le opzioni per hook:

| Opzione | Tipo | Default | Descrizione | 
| --- | --- | --- | --- | 
| phase | 'before' | 'after' | 'error' | 'after' | Fase in cui eseguire il callback | 
| priority | number | 0 | Ordine di esecuzione (più alto = prima) | 
| once | boolean | false | Esegui solo una volta | 

// Esempio con hook di fase
const checkout = Pulsor('checkout');

// Prima dell’esecuzione
checkout.bind((order, ctx) => {
  ctx.startedAt = Date.now();
}, { phase: 'before' });

// Dopo l’esecuzione
checkout.bind((order, ctx) => {
  console.log('Durata:', Date.now() - ctx.startedAt, 'ms');
}, { phase: 'after', priority: 5 });

// In caso di errore
checkout.bind((order, ctx) => {
  console.error('Errore durante checkout:', ctx.error);
}, { phase: 'error', once: true });

## API Reference

CreatePulser(alias: string, fn: Function, options?: object): void
UpdatePulser(alias: string, fn: Function, options?: object): void
DestroyPulser(alias: string): void
PulserExists(alias: string): boolean
ListPulsers(pattern?: string): string[]
GetPulserInfo(alias: string): {
  options, pulseCount, lastPulsedAt, avgDuration, totalDuration
}
SetLoggy(config: { error: boolean, warn: boolean, info: boolean, log: boolean }): void
Pulsor(alias: string): PulserController

PulserController interface:

interface PulserController {
  pulse(...args: any[]): any | Promise<any>
  bind(fn: Function, options?: { phase?: string; priority?: number; once?: boolean }): void
  unbind(fn: Function, options?: object): void
  unbindAll(options?: object): void
  bound(): (...args: any[]) => any | Promise<any>
}

## Metriche e Osservabilità

Ogni Pulser traccia:

* pulseCount — numero di esecuzioni
* lastPulsedAt — timestamp ultima pulsazione
* avgDuration — durata media in millisecondi
* totalDuration — somma delle durate

const info = GetPulserInfo('sum');
console.table(info);

## Gestione Errori

* Callback phase: 'error' intercetta errori della funzione principale
* propagateMainError: false sopprime il rilancio dell’errore
* failFastCallbacks: true arresta la catena callback in caso di eccezione

try {
  await Pulsor('checkout').pulse(order);
} catch (err) {
  if (err instanceof PulsorError) {
    console.error('Errore pulsor:', err.message);
  } else {
    throw err;
  }
}

## Esempi Avanzati

// Modulo Logger Separato
import { Pulsor } from 'pulsor';

export function initLogger() {
  const logger = Pulsor('sum');
  logger.bind((a, b, result, ctx) => {
    console.info(`[SUM] Args: ${a},${b} → ${result}`);
  }, { phase: 'after' });
}

// Pipeline di Eventi con Wildcard
CreatePulser('user:created', data => sendWelcomeEmail(data), { isAsync: true });
CreatePulser('user:created', data => analytics.track('signup', data));
CreatePulser('user:deleted', data => analytics.track('delete', data));

const handlers = ListPulsers('user:*').map(alias => Pulsor(alias));
handlers.forEach(h => h.bind((data) => console.log(alias, data), { phase: 'after' }));

// UI Spinner Plugin
import { Pulsor } from 'pulsor';

export function attachSpinner(alias) {
  const p = Pulsor(alias);
  p.bind(() => showSpinner(), { phase: 'before' });
  p.bind(() => hideSpinner(), { phase: 'after', once: true });
}

## Best Practice

* Usa alias namespaced (module:action) per chiarezza
* Separa plugin in moduli distinti
* Inietta contesto per comunicare dati tra hook
* Monitora le metriche per ottimizzare le performance
* Aggiorna funzioni con UpdatePulser per deploy senza downtime

## Licenza

Rilasciato sotto licenza MIT. Libera a riutilizzare e modificare secondo le tue esigenze.
