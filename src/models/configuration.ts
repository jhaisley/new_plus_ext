/**
 * Extension configuration settings
 * These match the actual settings defined in package.json
 */
export interface Configuration {
  /** Path to templates directory */
  templatesPath: string;
  
  /** Hide file extensions in template picker */
  hideFileExtensions: boolean;
  
  /** Hide sorting prefixes (leading digits) from template names */
  hideSortingPrefix: boolean;
  
  /** Enable variable substitution in filenames */
  replaceVariablesInFilename: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGURATION: Configuration = {
  templatesPath: '',  // Will be set based on platform
  hideFileExtensions: true,
  hideSortingPrefix: false,
  replaceVariablesInFilename: false
};
