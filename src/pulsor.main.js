/**
 * Pulsor Main Events Registry
 * Centralizes all Pulsor events to demonstrate persistence and execution order
 * This file should be imported once at application startup
 */

import { initializeSidebarEvents } from './pulsor.sidebar.js';


function initializePulsorEvents() {

  console.log('Initializing Pulsor events');
  initializeSidebarEvents();
};

// Export both named and default
export { initializePulsorEvents };
//export default initializePulsorEvents;
