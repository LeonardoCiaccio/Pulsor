
// Import Pulsor system for event management
import { CreatePulser } from '@/plugins/pulsor/pulsor.js';

// DOM element ID where buttons will be added
const SIDEBAR_ID = 'sidebar-buttons';
// Event name triggered when sidebar is loaded
const PULSE_RENDERED_SIDEBAR = 'sidebar:loaded';

// Configuration array for sidebar buttons
const sideBarButtons = [
  {
    classes: ['sidebar-button'], // CSS classes to apply
    label: 'Example 1' // Button text
  }
];

// Utility function to create and append buttons to sidebar
const installButtonsToSidebar = (validatedSidebarId, validatedSelectorClassesArray, validatedLabel) => {
  // Create new button element
  const button = document.createElement('button');
  button.textContent = validatedLabel;

  // Apply all CSS classes to the button
  validatedSelectorClassesArray.forEach(className => button.classList.add(className));

  // Find sidebar container and append the button
  document.querySelector(`#${validatedSidebarId}`).appendChild(button);
};

// Main initialization function for sidebar events
function initializeSidebarEvents() {
  console.log('Initializing sidebar events');

  // Create pulser for sidebar loaded event and bind callbacks
  CreatePulser(PULSE_RENDERED_SIDEBAR, () => console.log('Pulsed Sidebar loaded'))
    .bind(() => {
      // First callback: install all configured buttons
      sideBarButtons.forEach(button => {
        installButtonsToSidebar(SIDEBAR_ID, button.classes, button.label);
      });
    }).bind(() => {
      // Second callback: log completion message
      console.log('Message example for sidebar buttons installed');
    });
};

// Export both named and default
export { initializeSidebarEvents };
export default initializeSidebarEvents;
