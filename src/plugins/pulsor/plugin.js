
/**
 * L'orchestratore Pulsor
 */

export const install = (app, options = {}) => {

  const config = {
    enableLogging: options.enableLogging ?? true,
    ...options
  };

  app.config.globalProperties.$pulsor = {
  };

  if (config.enableLogging) {
    console.log('Pulsor plugin installed successfully!');
  }
};

// Default export for plugin installation
export default {
  install
};

export { };
