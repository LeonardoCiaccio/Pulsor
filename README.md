# Pulsor Development Environment

> **⚠️ Demonstration Project**  
> This repository is intended exclusively for demonstration and development purposes. It is designed to facilitate modification, testing, and improvement of the Pulsor module.

## 📋 Overview

This project provides a complete development environment for **Pulsor**, a lightweight and robust JavaScript module for managing named function executors (pulsers). The environment includes:

- 🧪 **Testing Environment**: Vue.js interface for testing Pulsor functionalities
- 🔧 **Development Tools**: Build scripts and development tools
- 📦 **NPM Distribution**: Automated system for creating NPM packages
- 📚 **Documentation**: Practical examples and complete documentation

## 🚀 Pulsor Features

### Core Features
- **Unified API**: Same interface for synchronous and asynchronous operations
- **Advanced Callback System**: Event management with bulk operations
- **Auto-Detection**: Automatic async/sync detection with override options
- **Registry Management**: Complete lifecycle management of pulsers
- **Method Chaining**: Fluid interface for a better developer experience
- **Memory Safe**: Intelligent caching with size limits
- **Factory Functions**: Functional pattern with `Pulsor()` wrapper
- **Error Handling**: Robust error handling with custom `PulsorError`

### Advanced Capabilities
- **Persistence**: Pulsers remain in the global registry
- **Inter-Module Communication**: Seamless communication between modules
- **Plugin Architecture**: Extensible system for modular components
- **Configuration Sharing**: Configuration sharing between modules

## 📁 Project Structure

```
Pulsor/
├── src/
│   ├── plugins/
│   │   └── pulsor/           # Core Pulsor module
│   │       ├── pulsor.js     # Main Pulsor implementation
│   │       └── logger.class.js # Logging utilities
│   ├── components/           # Vue.js demo components
│   │   ├── Example1.vue      # Basic usage examples
│   │   ├── Example2.vue      # Advanced examples
│   │   ├── Structure.vue     # Code structure viewer
│   │   └── examples/         # Additional examples
│   ├── pulsor.main.js        # Main Pulsor integration
│   ├── pulsor.sidebar.js     # Sidebar integration
│   └── App.vue               # Main Vue application
├── scripts/
│   └── build-npm.js          # NPM build automation
├── dist-npm/                 # Generated NPM package
└── public/                   # Static assets
```

## 🛠️ Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Pulsor

# Install dependencies
npm install

# Start the development environment
npm run dev
```

### Available Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview the build

# NPM Distribution
npm run build:npm    # Generate NPM package in dist-npm/

# Code Quality
npm run lint         # Code linting
npm run format       # Code formatting
```

## 🧪 Testing and Development

### Testing Environment
The Vue.js application provides an interactive interface to:
- Test all Pulsor functionalities
- View real-time code examples
- Experiment with new features
- Debug and troubleshooting

### Modifying Pulsor
1. **Core Module**: Edit `src/plugins/pulsor/pulsor.js`
2. **Test Changes**: Use the web interface to test modifications
3. **Build NPM**: Run `npm run build:npm` to generate the package
4. **Documentation**: README is generated automatically

### Adding New Features
```javascript
// Example: Adding a new functionality
// In src/plugins/pulsor/pulsor.js

// 1. Implement the functionality
function newFeature(params) {
    // Implementation here
}

// 2. Add to Registry if necessary
Registry.newFeature = newFeature;

// 3. Export if public
export { newFeature };
```

## 📦 NPM Distribution

### Automated Build
The automated build system:
1. **Copies core files** from `src/plugins/pulsor/`
2. **Generates package.json** with automatically extracted version
3. **Creates complete README.md** with updated documentation
4. **Adds LICENSE** file

### Publishing Process
```bash
# 1. Build the package
npm run build:npm

# 2. Navigate to distribution directory
cd dist-npm

# 3. Publish to NPM
npm publish
```

### NPM Package Structure
```
dist-npm/
├── pulsor.js         # Core module
├── logger.class.js   # Logger utilities
├── package.json      # NPM package configuration
├── README.md         # Generated documentation
└── LICENSE           # MIT License
```

## 🔧 Configuration and Customization

### Vite Configuration
```javascript
// vite.config.js
export default {
  // Development server configuration
  server: {
    port: 3000,
    open: true
  },
  // Build configuration
  build: {
    outDir: 'dist'
  }
}
```

### Tailwind CSS
The project uses Tailwind CSS for styling:
- Configuration in `tailwind.config.js`
- Custom styles in `src/css/styles.css`

## 📚 Usage Examples

### Basic Usage
```javascript
import { CreatePulser, Pulser, Pulsor } from './src/plugins/pulsor/pulsor.js';

// Create a pulser
CreatePulser('calculator', (a, b) => a + b);

// Use the pulser - Traditional approach
const calc = new Pulser('calculator');
const result = calc.pulse(5, 3); // 8

// Use the pulser - Factory function
const sum = Pulsor('calculator').pulse(10, 5); // 15
```

### Advanced Features
```javascript
// Callback system
Pulsor('calculator')
  .bind((a, b, result) => console.log(`${a} + ${b} = ${result}`))
  .pulse(7, 3); // Logs: "7 + 3 = 10"

// Async operations
CreatePulser('fetchData', async (url) => {
  const response = await fetch(url);
  return response.json();
});

const data = await Pulsor('fetchData').pulse('/api/data');
```

## 🐛 Debug and Troubleshooting

### Logging
Pulsor includes an integrated logging system:
```javascript
// Enable detailed logging
Pulsor.setLogLevel('debug');

// Display pulser information
console.log(ListPulsers());
console.log(GetPulserInfo('myPulser'));
```

### Common Issues
1. **Pulser not found**: Verify it was created with `CreatePulser`
2. **Async/Sync mismatch**: Use the `isAsync` option to force behavior
3. **Memory leaks**: Use `DestroyPulser` to clean up unused pulsers

## 🤝 Contributing

### Guidelines
1. **Fork** the repository
2. **Create** a branch for your feature (`git checkout -b feature/amazing-feature`)
3. **Test** changes in the development environment
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Style
- Use ESLint for linting
- Follow JavaScript ES6+ conventions
- Add comments for complex logic
- Maintain compatibility with existing API

## 📄 License

This project is released under the MIT license. See the `LICENSE` file for details.

## 🔗 Useful Links

- [Pulsor Documentation](./dist-npm/README.md)
- [Vue.js Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is a demonstration project. For production use, utilize the NPM package generated in the `dist-npm/` folder.