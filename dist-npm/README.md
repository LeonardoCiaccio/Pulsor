# Pulsor

A lightweight and robust module for managing named function executors (pulsers). It provides a unified API for both synchronous and asynchronous operations, complete with a powerful callback system and advanced features for modern JavaScript applications.

## Features

- 🚀 **Unified API** - Same interface for sync and async operations
- ⚡ **High Performance** - Optimized execution with minimal overhead and smart caching
- 🔄 **Advanced Callback System** - Powerful event-driven callback management with bulk operations
- 🛡️ **Type Safety** - Built-in validation and error handling with custom PulsorError class
- 📦 **Lightweight** - Zero dependencies, minimal footprint
- 🔧 **Easy to Use** - Simple and intuitive API with factory functions
- 🎯 **Auto-Detection** - Automatic async/sync detection with override options
- 🔍 **Registry Management** - Complete pulser lifecycle management and introspection
- 🧩 **Method Chaining** - Fluent interface for better developer experience
- 🔒 **Memory Safe** - Smart caching with size limits to prevent memory leaks

## Installation

```bash
npm install pulsor
## Quick Start

```javascript
import { CreatePulser, Pulser } from 'pulsor';

// Create a synchronous pulser
CreatePulser('add', (a, b) => a + b);

// Create an asynchronous pulser
CreatePulser('fetchData', async (url) => {
  const response = await fetch(url);
  return response.json();
});

// Use the pulsers - Traditional approach
const mathPulser = new Pulser('add');
const result = mathPulser.pulse(5, 3); // result is 8

// Use the pulsers - Factory function approach (recommended)
const calculator = Pulsor('add');
const sum = calculator.pulse(10, 5); // sum is 15

// Functional chaining style
Pulsor('add')
  .bind(result => console.log('Result:', result))
  .pulse(7, 3); // Logs: "Result: 10"

const dataPulser = Pulsor('fetchData');
const data = await dataPulser.pulse('https://api.example.com/data');
```

## API Reference

### Pulser(alias) - Factory Function

Factory function to create a Pulser instance without using the 'new' keyword. Provides a more functional programming approach and cleaner syntax.

- **alias** `string` - The alias of the pulser to control
- **Returns** `Pulser` - A new Pulser instance
- **Throws** `PulsorError` - If no pulser with the given alias is found

### CreatePulser(alias, pulseFn, options)

Creates and registers a new pulser.

- **alias** `string` - Unique identifier (max 32 chars)
- **pulseFn** `Function` - The function to execute
- **options** `Object` - Configuration options
  - **override** `boolean` - Allow overwriting existing pulser
  - **isAsync** `boolean` - Force async/sync mode (auto-detected if not specified)

### Pulser Class

#### Constructor
- `new Pulser(alias)` - Creates a pulser instance

#### Properties
- `alias` - The pulser's alias (read-only)
- `isAsync` - Whether the pulser is asynchronous (read-only)
- `callbackCount` - Number of bound callbacks (read-only)

#### Core Methods
- `pulse(...args)` - Execute the pulser function and all bound callbacks
- `bound()` - Get a bound version of the pulse method for use as callback

#### Callback Management
- `bind(callback)` - Add a single callback function (chainable)
- `unbind(callback)` - Remove a specific callback function
- `binds(callbacks[])` - Add multiple callback functions at once (chainable)
- `unbinds(callbacks[])` - Remove multiple callback functions
- `unbindAll()` - Remove all bound callbacks

### Utility Functions

- `DestroyPulser(alias)` - Remove a pulser from registry
- `PulserExists(alias)` - Check if a pulser exists
- `ListPulsers()` - Get all registered aliases
- `GetPulserInfo(alias)` - Get pulser information

## Examples

### Basic Usage

```javascript
import { CreatePulser, Pulser } from 'pulsor';

// Create pulsers
CreatePulser('greet', (name) => `Hello, ${name}!`);
CreatePulser('delay', async (ms) => new Promise(resolve => setTimeout(resolve, ms)));

// Traditional class instantiation
const greeter = new Pulser('greet');
console.log(greeter.pulse('World')); // "Hello, World!"

// Factory function approach (cleaner syntax)
const message = Pulsor('greet').pulse('Universe'); // "Hello, Universe!"
console.log(message);

// Async operations
const delayer = Pulsor('delay');
await delayer.pulse(1000); // Waits 1 second
```

### Factory Function Benefits

```javascript
// Functional composition patterns
CreatePulser('multiply', (x, y) => x * y);
CreatePulser('add', (x, y) => x + y);

const calculate = (a, b) => {
  const product = Pulsor('multiply').pulse(a, b);
  return Pulsor('add').pulse(product, 10);
};

console.log(calculate(5, 3)); // (5 * 3) + 10 = 25

// Array operations with functional style
const numbers = [1, 2, 3, 4, 5];
CreatePulser('square', x => x * x);

const squared = numbers.map(n => Pulsor('square').pulse(n));
console.log(squared); // [1, 4, 9, 16, 25]
```

### Advanced Callback System

```javascript
// Using factory function with method chaining (recommended)
Pulsor('add')
  .bind((a, b, result) => console.log(`${a} + ${b} = ${result}`))
  .bind((a, b, result) => logToFile(result))
  .pulse(5, 3); // Execute immediately

// Traditional approach
const calculator = new Pulser('add');
calculator
  .bind((a, b, result) => console.log(`${a} + ${b} = ${result}`))
  .bind((a, b, result) => logToFile(result));

// Bulk callback binding
const callbacks = [
  (...args) => console.log('First callback:', args),
  (...args) => console.log('Second callback:', args),
  (...args) => saveToDatabase(args)
];
calculator.binds(callbacks);

// Execute with all callbacks
const result = calculator.pulse(5, 3);
// Logs: "5 + 3 = 8", saves to file, and executes all other callbacks

// Remove specific callbacks
calculator.unbinds([callbacks[0], callbacks[1]]);

// Remove all callbacks
calculator.unbindAll();
```

### Bound Methods for Event Handlers

```javascript
const processor = new Pulser('processData');

// Get bound method for use as event handler
const boundProcess = processor.bound();

// Use in event listeners or setTimeout
button.addEventListener('click', boundProcess);
setTimeout(boundProcess, 1000, 'delayed', 'data');
```

### Error Handling

```javascript
import { CreatePulser, Pulser, PulsorError } from 'pulsor';

try {
  // This will throw PulsorError if pulser doesn't exist
  const nonExistent = new Pulser('nonExistent');
} catch (error) {
  if (error instanceof PulsorError) {
    console.log('Pulsor specific error:', error.message);
  }
}

// Safe checking
if (PulserExists('myPulser')) {
  const pulser = new Pulser('myPulser');
  console.log(`Pulser info: async=${pulser.isAsync}, callbacks=${pulser.callbackCount}`);
}
```

### Registry Management

```javascript
// List all registered pulsers
const allPulsers = ListPulsers();
console.log('Registered pulsers:', allPulsers);

// Get detailed information
const info = GetPulserInfo('myPulser');
console.log('Pulser details:', info);

// Clean up
DestroyPulser('temporaryPulser');
```

### Persistence and Inter-Module Connections

Pulsers are persistent in the global registry, enabling powerful inter-module communication patterns.

```javascript
// Module A: Authentication Service
// auth-module.js
import { CreatePulser } from 'pulsor';

CreatePulser('authenticate', async (credentials) => {
  const user = await validateCredentials(credentials);
  return { user, token: generateToken(user) };
});

CreatePulser('logout', (token) => {
  invalidateToken(token);
  return { success: true };
});

// Module B: User Management
// user-module.js
import { Pulser, Pulsor } from 'pulsor';

// Connect to authentication pulser from another module
const authenticateUser = async (email, password) => {
  const authResult = await Pulsor('authenticate').pulse({ email, password });
  
  if (authResult.user) {
    // Trigger user-specific setup
    return Pulsor('setupUserSession').pulse(authResult.user);
  }
  throw new Error('Authentication failed');
};

CreatePulser('setupUserSession', (user) => {
  // Setup user session logic
  return { sessionId: createSession(user), preferences: loadPreferences(user.id) };
});
```

### Cross-Module Event System

```javascript
// Module C: Notification System
// notification-module.js
import { Pulser, Pulsor } from 'pulsor';

// Listen to authentication events from other modules
Pulsor('authenticate')
  .bind((credentials, authResult) => {
    if (authResult.user) {
      console.log(`User ${authResult.user.name} logged in`);
      sendWelcomeNotification(authResult.user);
    }
  });

Pulsor('logout')
  .bind((token, result) => {
    if (result.success) {
      console.log('User logged out successfully');
      clearNotifications();
    }
  });

// Module D: Analytics
// analytics-module.js
Pulsor('authenticate')
  .bind((credentials, authResult) => {
    trackEvent('user_login', {
      timestamp: Date.now(),
      success: !!authResult.user
    });
  });
```

### Shared Configuration Patterns

```javascript
// config-module.js - Central configuration
import { CreatePulser } from 'pulsor';

const appConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

CreatePulser('getConfig', (key) => {
  return key ? appConfig[key] : appConfig;
});

CreatePulser('updateConfig', (updates) => {
  Object.assign(appConfig, updates);
  return appConfig;
});

// Any module can access configuration
// api-module.js
import { Pulsor } from 'pulsor';
const apiUrl = Pulsor('getConfig').pulse('apiUrl');
const timeout = Pulsor('getConfig').pulse('timeout');

// data-module.js
import { Pulsor } from 'pulsor';
Pulsor('updateConfig').pulse({ apiUrl: 'https://new-api.example.com' });
```

### Plugin Architecture Example

```javascript
// core-system.js
import { CreatePulser, ListPulsers } from 'pulsor';

// Core plugin registration system
CreatePulser('registerPlugin', (pluginName, pluginConfig) => {
  CreatePulser(`plugin_${pluginName}`, pluginConfig.handler);
  
  // Auto-bind to core events if specified
  if (pluginConfig.coreEvents) {
    pluginConfig.coreEvents.forEach(eventName => {
      Pulsor(eventName).bind(pluginConfig.eventHandler);
    });
  }
  
  return { registered: true, name: pluginName };
});

// List all active plugins
CreatePulser('listPlugins', () => {
  return ListPulsers().filter(alias => alias.startsWith('plugin_'));
});

// plugin-example.js
import { Pulsor } from 'pulsor';
Pulsor('registerPlugin').pulse('dataValidator', {
  handler: (data) => validateDataStructure(data),
  coreEvents: ['dataProcessing', 'userInput'],
  eventHandler: (data) => console.log('Plugin validating:', data)
});
```

## License

MIT License - see LICENSE file for details.
