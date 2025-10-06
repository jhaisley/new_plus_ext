/**
 * Extension configuration settings
 */
export interface Configuration {
  /** Path to templates directory */
  templatesPath: string;
  
  /** Whether to show quick pick for template selection */
  showQuickPick: boolean;
  
  /** Whether to create subfolders for nested templates */
  createSubfolders: boolean;
  
  /** Global variables available to all templates */
  variables: Record<string, string>;
  
  /** Whether to enable template caching for performance */
  enableCaching?: boolean;
  
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
  
  /** Whether to watch templates directory for changes */
  watchForChanges?: boolean;
  
  /** File patterns to exclude from template discovery */
  excludePatterns?: string[];
  
  /** Maximum number of recent templates to remember */
  maxRecentTemplates?: number;
  
  /** Whether to show progress for template operations */
  showProgress?: boolean;
  
  /** Default file encoding for created files */
  defaultEncoding?: string;
  
  /** Whether to open created files after creation */
  openAfterCreation?: boolean;
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  
  /** Array of validation errors */
  errors: string[];
  
  /** Array of validation warnings */
  warnings?: string[];
}

/**
 * Configuration migration information
 */
export interface ConfigurationMigration {
  /** Source version */
  fromVersion: string;
  
  /** Target version */
  toVersion: string;
  
  /** Migration steps to apply */
  steps: ConfigurationMigrationStep[];
}

/**
 * Individual configuration migration step
 */
export interface ConfigurationMigrationStep {
  /** Type of migration step */
  type: 'rename' | 'remove' | 'add' | 'transform';
  
  /** Source property path */
  from?: string;
  
  /** Target property path */
  to?: string;
  
  /** Default value for new properties */
  defaultValue?: any;
  
  /** Transformation function for complex migrations */
  transform?: (value: any) => any;
}

/**
 * Configuration export format
 */
export interface ConfigurationExport {
  /** Export format version */
  version: string;
  
  /** Export timestamp */
  exportedAt: Date;
  
  /** Configuration data */
  configuration: Configuration;
  
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGURATION: Configuration = {
  templatesPath: '',  // Will be set based on platform
  showQuickPick: true,
  createSubfolders: true,
  variables: {},
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  watchForChanges: true,
  excludePatterns: ['node_modules', '.git', '.vscode', '*.tmp'],
  maxRecentTemplates: 10,
  showProgress: true,
  defaultEncoding: 'utf8',
  openAfterCreation: true
};

/**
 * Configuration schema for validation
 */
export const CONFIGURATION_SCHEMA = {
  type: 'object',
  properties: {
    templatesPath: { type: 'string', minLength: 1 },
    showQuickPick: { type: 'boolean' },
    createSubfolders: { type: 'boolean' },
    variables: { type: 'object' },
    enableCaching: { type: 'boolean' },
    cacheTimeout: { type: 'number', minimum: 0 },
    watchForChanges: { type: 'boolean' },
    excludePatterns: { type: 'array', items: { type: 'string' } },
    maxRecentTemplates: { type: 'number', minimum: 1, maximum: 50 },
    showProgress: { type: 'boolean' },
    defaultEncoding: { type: 'string' },
    openAfterCreation: { type: 'boolean' }
  },
  required: ['templatesPath', 'showQuickPick', 'createSubfolders', 'variables']
};
