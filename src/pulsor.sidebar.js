/* eslint-disable no-unused-vars */

// Import Pulsor system for event management
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js';

// DOM element ID where buttons will be added
const SIDEBAR_ID = 'sidebar-buttons';
const WORK_AREA = 'work-area';


// Event name triggered when sidebar is loaded
const PULSE_RENDERED_SIDEBAR = 'sidebar:loaded';


// Configuration array for sidebar buttons
const sideBarButtons = [
  {
    area: 'example1',
    classes: ['sidebar-button'], // CSS classes to apply
    label: 'Example 1' // Button text
  },
  {
    area: 'example2',
    classes: ['sidebar-button'], // CSS classes to apply
    label: 'Example 2' // Button text
  }
];

// Utility function to create and append buttons to sidebar
const installButtonsToSidebar = (validatedSidebarId, buttonConfig) => {
  // Create new button element
  const button = document.createElement('button');
  button.textContent = buttonConfig.label;

  // Apply all CSS classes to the button
  buttonConfig.classes.forEach(className => button.classList.add(className));

  button.addEventListener('click', () => {
    Pulsor('show:area').pulse(buttonConfig.area);
  });

  Pulsor('show:area').bind((areaName) => {
    // Se areaName è uguale a buttonConfig.area
    if (areaName === buttonConfig.area) {
      // Aggiungi la classe active se non esiste già
      if (!button.classList.contains('active')) {
        button.classList.add('active');
      }
    } else {
      // Rimuove tutte le classi 'active'
      button.classList.remove('active');
    }
  });

  // Find sidebar container and append the button
  document.querySelector(`#${validatedSidebarId}`).appendChild(button);
};

// Main initialization function for sidebar events
function initializeSidebarEvents() {
  console.log('Initializing sidebar events');

  // Create pulser for show:area event
  CreatePulser('show:area');

  // Create pulser for sidebar loaded event and bind callbacks
  CreatePulser(PULSE_RENDERED_SIDEBAR, (moduleName) => console.log('Pulsed Sidebar loaded from: ', moduleName))
    .bind(() => {
      // First callback: install all configured buttons
      sideBarButtons.forEach(buttonConfig => {
        installButtonsToSidebar(SIDEBAR_ID, buttonConfig);
      });
    }).bind(() => {
      // Second callback: log completion message
      console.log('Message example for sidebar buttons installed');
    });


};

// Export both named and default
export { initializeSidebarEvents };
export default initializeSidebarEvents;
