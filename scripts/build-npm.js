#!/usr/bin/env node

/**
 * Build script for NPM distribution of Pulsor module
 * This script prepares the Pulsor module for NPM publication
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist-npm');
const srcDir = path.join(rootDir, 'src', 'plugins', 'pulsor');

/**
 * Extract version from pulsor.js file
 * @returns {string} Version string
 */
function extractVersionFromPulsor() {
  console.log('🔍 Extracting version from pulsor.js...');
  
  const pulsorFilePath = path.join(srcDir, 'pulsor.js');
  
  if (!fs.existsSync(pulsorFilePath)) {
    throw new Error('pulsor.js file not found');
  }
  
  const pulsorContent = fs.readFileSync(pulsorFilePath, 'utf8');
  const versionMatch = pulsorContent.match(/@version\s+(\d+\.\d+\.\d+)/);
  
  if (!versionMatch) {
    throw new Error('Version not found in pulsor.js. Expected @version x.x.x format');
  }
  
  const version = versionMatch[1];
  console.log(`✅ Found version: ${version}`);
  return version;
}

/**
 * Clean and create distribution directory
 */
function setupDistDirectory() {
  console.log('🧹 Cleaning distribution directory...');

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Distribution directory created');
}

/**
 * Copy Pulsor module files to distribution directory
 */
function copyModuleFiles() {
  console.log('📦 Copying Pulsor module files...');

  const filesToCopy = [
    'pulsor.js',
    'logger.class.js'
  ];

  filesToCopy.forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(distDir, file);

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`  ✓ Copied ${file}`);
    } else {
      console.warn(`  ⚠️  Warning: ${file} not found`);
    }
  });
}

/**
 * Create package.json for NPM distribution
 */
function createNpmPackageJson() {
  console.log('📄 Creating NPM package.json...');
  
  const version = extractVersionFromPulsor();

  const packageJson = {
    "name": "@leonardo_ciaccio/pulsor",
    "version": version,
    "description": "A lightweight and robust module for managing named function executors with unified API for sync/async operations",
    "main": "pulsor.js",
    "type": "module",
    "exports": {
      ".": {
        "import": "./pulsor.js",
        "require": "./pulsor.js"
      }
    },
    "files": [
      "pulsor.js",
      "logger.class.js",
      "README.md",
      "LICENSE"
    ],
    "keywords": [
      "pulsor",
      "function-executor",
      "async",
      "sync",
      "callback",
      "event-driven",
      "lightweight",
      "performance"
    ],
    "author": "Leonardo Ciaccio",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/LeonardoCiaccio/Pulsor.git"
    },
    "bugs": {
      "url": "https://github.com/LeonardoCiaccio/Pulsor/issues"
    },
    "homepage": "https://github.com/LeonardoCiaccio/Pulsor#readme",
    "engines": {
      "node": ">=16.0.0"
    }
  };

  const packageJsonPath = path.join(distDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ NPM package.json created');
}

/**
 * Create README.md for NPM distribution
 */
function createNpmReadme() {
  console.log('📖 Creating NPM README.md...');

  const readme = `# Pulsor

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

\`\`\`bash
npm install pulsor
## Quick Start

\`\`\`javascript
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
\`\`\`

## API Reference

### Pulser(alias) - Factory Function

Factory function to create a Pulser instance without using the 'new' keyword. Provides a more functional programming approach and cleaner syntax.

- **alias** \`string\` - The alias of the pulser to control
- **Returns** \`Pulser\` - A new Pulser instance
- **Throws** \`PulsorError\` - If no pulser with the given alias is found

### CreatePulser(alias, pulseFn, options)

Creates and registers a new pulser.

- **alias** \`string\` - Unique identifier (max 32 chars)
- **pulseFn** \`Function\` - The function to execute
- **options** \`Object\` - Configuration options
  - **override** \`boolean\` - Allow overwriting existing pulser
  - **isAsync** \`boolean\` - Force async/sync mode (auto-detected if not specified)

### Pulser Class

#### Constructor
- \`new Pulser(alias)\` - Creates a pulser instance

#### Properties
- \`alias\` - The pulser's alias (read-only)
- \`isAsync\` - Whether the pulser is asynchronous (read-only)
- \`callbackCount\` - Number of bound callbacks (read-only)

#### Core Methods
- \`pulse(...args)\` - Execute the pulser function and all bound callbacks
- \`bound()\` - Get a bound version of the pulse method for use as callback

#### Callback Management
- \`bind(callback)\` - Add a single callback function (chainable)
- \`unbind(callback)\` - Remove a specific callback function
- \`binds(callbacks[])\` - Add multiple callback functions at once (chainable)
- \`unbinds(callbacks[])\` - Remove multiple callback functions
- \`unbindAll()\` - Remove all bound callbacks

### Utility Functions

- \`DestroyPulser(alias)\` - Remove a pulser from registry
- \`PulserExists(alias)\` - Check if a pulser exists
- \`ListPulsers()\` - Get all registered aliases
- \`GetPulserInfo(alias)\` - Get pulser information

## Examples

### Basic Usage

\`\`\`javascript
import { CreatePulser, Pulser } from 'pulsor';

// Create pulsers
CreatePulser('greet', (name) => \`Hello, \${name}!\`);
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
\`\`\`

### Factory Function Benefits

\`\`\`javascript
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
\`\`\`

### Advanced Callback System

\`\`\`javascript
// Using factory function with method chaining (recommended)
Pulsor('add')
  .bind((a, b, result) => console.log(\`\${a} + \${b} = \${result}\`))
  .bind((a, b, result) => logToFile(result))
  .pulse(5, 3); // Execute immediately

// Traditional approach
const calculator = new Pulser('add');
calculator
  .bind((a, b, result) => console.log(\`\${a} + \${b} = \${result}\`))
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
\`\`\`

### Bound Methods for Event Handlers

\`\`\`javascript
const processor = new Pulser('processData');

// Get bound method for use as event handler
const boundProcess = processor.bound();

// Use in event listeners or setTimeout
button.addEventListener('click', boundProcess);
setTimeout(boundProcess, 1000, 'delayed', 'data');
\`\`\`

### Error Handling

\`\`\`javascript
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
  console.log(\`Pulser info: async=\${pulser.isAsync}, callbacks=\${pulser.callbackCount}\`);
}
\`\`\`

### Registry Management

\`\`\`javascript
// List all registered pulsers
const allPulsers = ListPulsers();
console.log('Registered pulsers:', allPulsers);

// Get detailed information
const info = GetPulserInfo('myPulser');
console.log('Pulser details:', info);

// Clean up
DestroyPulser('temporaryPulser');
\`\`\`

### Persistence and Inter-Module Connections

Pulsers are persistent in the global registry, enabling powerful inter-module communication patterns.

\`\`\`javascript
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
\`\`\`

### Cross-Module Event System

\`\`\`javascript
// Module C: Notification System
// notification-module.js
import { Pulser, Pulsor } from 'pulsor';

// Listen to authentication events from other modules
Pulsor('authenticate')
  .bind((credentials, authResult) => {
    if (authResult.user) {
      console.log(\`User \${authResult.user.name} logged in\`);
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
\`\`\`

### Shared Configuration Patterns

\`\`\`javascript
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
\`\`\`

### Plugin Architecture Example

\`\`\`javascript
// core-system.js
import { CreatePulser, ListPulsers } from 'pulsor';

// Core plugin registration system
CreatePulser('registerPlugin', (pluginName, pluginConfig) => {
  CreatePulser(\`plugin_\${pluginName}\`, pluginConfig.handler);
  
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
\`\`\`

## License

MIT License - see LICENSE file for details.
`;

  const readmePath = path.join(distDir, 'README.md');
  fs.writeFileSync(readmePath, readme);
  console.log('✅ NPM README.md created');
}

/**
 * Create LICENSE file
 */
function createLicense() {
  console.log('📜 Creating LICENSE file...');

  const license = `MIT License

Copyright (c) 2024 Leonardo Ciaccio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORs OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

  const licensePath = path.join(distDir, 'LICENSE');
  fs.writeFileSync(licensePath, license);
  console.log('✅ LICENSE file created');
}

/**
 * Main build function
 */
function buildForNpm() {
  console.log('🚀 Building Pulsor for NPM distribution...\n');

  try {
    setupDistDirectory();
    copyModuleFiles();
    createNpmPackageJson();
    createNpmReadme();
    createLicense();

    console.log('\n🎉 NPM build completed successfully!');
    console.log(`📁 Distribution files created in: ${distDir}`);
    console.log('\n📋 Next steps:');
    console.log('   1. cd dist-npm');
    console.log('   2. npm publish');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
buildForNpm();
