import { CreatePulser } from '/src/js/pulsor/pulsor';

/**
 * Installs the Pulsor fetch template functionality.
 * This function creates a Pulser that fetches HTML templates from the `/src/templates/` directory.
 * It handles cases where the fragment is not found or if the response is a full HTML document (e.g., index.html).
 * @returns {Function} A Pulser function that takes a template name as an argument and returns its content or null.
 */
export const InstallPulsorFetchTemplate = function () {

  // Returns the Pulser function for fetching templates
  CreatePulser('fetch:template', async (template) => {


    // Prepend 'template.' to the template name and remove any .html extensions
    template = `template.${template}`.replace(/\.html/gi, '');

    /**
     * The absolute URL for the template.
     * @type {string}
     */
    const url = `/src/templates/${template}.html`;

    try {
      const response = await fetch(new URL(url, import.meta.url).href);

      // If the response is not OK (e.g., 404 Not Found), return null
      if (!response.ok) {
        return null;
      }

      const textContent = await response.text();

      // Extract content within <template> tags if present, otherwise return the whole text content.
      // This allows templates to be defined with or without a <template> wrapper.
      const templateMatch = textContent.match(/<template>([\s\S]*?)<\/template>/);
      const templateBody = templateMatch && templateMatch.length > 1 ? templateMatch[1] : undefined;

      // If no content is found (e.g., empty file or no template/text content), return null
      if (templateBody === undefined || templateBody.trim() === '') {
        console.warn(`Template '${template}' not found or returned empty content.`);
        return null;
      }

      return templateBody;

    } catch (error) {
      // Handle network errors or other fetch-related issues gracefully
      console.error(`Error fetching template '${template}':`, error);
      return null;
    }
  });

};
