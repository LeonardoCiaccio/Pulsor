/**
 * Pulsor Main Events Registry
 * Centralizes all Pulsor events to demonstrate persistence and execution order
 * This file should be imported once at application startup
 */

import { CreatePulser } from './plugins/pulsor/pulsor.js';


export default function initializePulsorEvents() {

  // Aggiunge un pulsante alla sidebar
  CreatePulser('add.button.toSiderBar', (validatedSidebarId, validatedSelectorClassesArray, validatedLabel) => {
    const button = document.createElement('button');
    button.textContent = validatedLabel;
    validatedSelectorClassesArray.forEach(className => button.classList.add(className));
    document.querySelector(validatedSidebarId).appendChild(button);
  });



};
