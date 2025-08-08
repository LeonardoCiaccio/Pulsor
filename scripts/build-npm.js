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
    "name": "pulsor",
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

A lightweight and robust module for managing named function executors (pulsers). It provides a unified API for both synchronous and asynchronous operations, complete with a powerful callback system.

## Features

- 🚀 **Unified API** - Same interface for sync and async operations
- ⚡ **High Performance** - Optimized execution with minimal overhead
- 🔄 **Callback System** - Powerful event-driven callback management
- 🛡️ **Type Safety** - Built-in validation and error handling
- 📦 **Lightweight** - Zero dependencies, minimal footprint
- 🔧 **Easy to Use** - Simple and intuitive API

## Installation

\`\`\`bash
npm install pulsor
\`\`\`

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

// Use the pulsers
const mathPulser = new Pulser('add');
const result = mathPulser.pulse(5, 3); // result is 8

const dataPulser = new Pulser('fetchData');
const data = await dataPulser.pulse('https://api.example.com/data');
\`\`\`

## API Reference

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
- \`alias\` - The pulser's alias
- \`isAsync\` - Whether the pulser is asynchronous
- \`callbackCount\` - Number of bound callbacks

#### Methods
- \`pulse(...args)\` - Execute the pulser function
- \`bind(callback)\` - Add a callback function
- \`unbind(callback)\` - Remove a specific callback
- \`unbindAll()\` - Remove all callbacks
- \`bound()\` - Get a bound version of the pulse method

### Utility Functions

- \`DestroyPulser(alias)\` - Remove a pulser from registry
- \`PulserExists(alias)\` - Check if a pulser exists
- \`ListPulsers()\` - Get all registered aliases
- \`GetPulserInfo(alias)\` - Get pulser information

## Examples

### Basic Usage

\`\`\`javascript
import { CreatePulser, Pulser } from 'pulsor';
import process from 'process';

// Create pulsers
CreatePulser('greet', (name) => \`Hello, \${name}!\`);
CreatePulser('delay', async (ms) => new Promise(resolve => setTimeout(resolve, ms)));

// Use pulsers
const greeter = new Pulser('greet');
console.log(greeter.pulse('World')); // "Hello, World!"

const delayer = new Pulser('delay');
await delayer.pulse(1000); // Waits 1 second
\`\`\`

### Callback System

\`\`\`javascript
const calculator = new Pulser('add');

// Add callbacks
calculator.bind((a, b, result) => console.log(\`\${a} + \${b} = \${result}\`));
calculator.bind((a, b, result) => logToFile(result));

// Execute with callbacks
const result = calculator.pulse(5, 3);
// Logs: "5 + 3 = 8" and saves to file
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
