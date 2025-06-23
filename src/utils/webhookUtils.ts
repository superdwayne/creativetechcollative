/**
 * Webhook utility functions for handling production vs test URLs
 */

/**
 * Get the appropriate webhook base URL based on TEST environment variable
 */
export const getWebhookBaseUrl = (): string => {
  const isTest = import.meta.env.VITE_TEST === 'TRUE';
  
  if (isTest) {
    return 'https://n8n.creativetechnologists.nl/webhook-test';
  }
  
  return 'https://n8n.creativetechnologists.nl/webhook';
};

/**
 * Get the full webhook URL for a specific endpoint
 */
export const getWebhookUrl = (endpoint: string): string => {
  const baseUrl = getWebhookBaseUrl();
  return `${baseUrl}/${endpoint}`;
};

/**
 * Check if we're in test mode
 */
export const isTestMode = (): boolean => {
  return import.meta.env.VITE_TEST === 'TRUE';
};