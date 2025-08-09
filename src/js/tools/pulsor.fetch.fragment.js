import { CreatePulser } from '/src/js/pulsor/pulsor';

/**
 * Installs the Pulsor fetch fragment functionality.
 * This function creates a Pulser that fetches HTML fragments from the `/src/fragments/` directory.
 * It handles cases where the fragment is not found or if the response is a full HTML document (e.g., index.html).
 * @returns {Function} A Pulser function that takes a fragment name as an argument and returns its content or null.
 */
export const InstallPulsorFetchFragment = function () {

  // Returns the Pulser function for fetching fragments
  return CreatePulser('fetch:fragment', async (fragment) => {
    /**
     * The absolute URL for the fragment.
     * @type {string}
     */
    const url = `/src/fragments/${fragment}.html`;

    try {
      const response = await fetch(new URL(url, import.meta.url).href);

      // If the response is not OK (e.g., 404 Not Found), return null
      if (!response.ok) {
        return null;
      }

      const textContent = await response.text();

      // Check if the fetched content is likely a full HTML document (e.g., contains <!DOCTYPE html> or <html> tags)
      // This helps to prevent returning the main index.html when a fragment is not found by the server.
      if (textContent.includes('<!DOCTYPE html>') || textContent.includes('<html')) {
        console.warn(`Fragment '${fragment}' not found or returned a full HTML document.`);
        return null; // Treat as not found if it's a full HTML document
      }

      // Extract content within <template> tags if present, otherwise return the whole text content.
      // This allows fragments to be defined with or without a <template> wrapper.
      const templateMatch = textContent.match(/<template>([\s\S]*?)<\/template>/);
      const template = templateMatch && templateMatch.length > 1 ? templateMatch[1] : textContent;

      // If no content is found (e.g., empty file or no template/text content), return null
      if (template === undefined || template.trim() === '') {
        return null;
      }

      return template;

    } catch (error) {
      // Handle network errors or other fetch-related issues gracefully
      console.error(`Error fetching fragment '${fragment}':`, error);
      return null;
    }
  });
};
