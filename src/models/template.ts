/**
 * Template entity representing a file or folder template
 * with variables for dynamic content generation
 */
export interface Template {
  /** Unique name of the template */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Type of template - 'file' or 'folder' */
  type: 'file' | 'folder';
  
  /** Absolute path to the template directory */
  path: string;
  
  /** Array of files contained in the template */
  files: TemplateFile[];
  
  /** Array of variables that can be substituted */
  variables: TemplateVariable[];
  
  /** Optional category for template organization */
  category?: string;
  
  /** Optional tags for searching and filtering */
  tags?: string[];
  
  /** Creation timestamp */
  createdAt?: Date;
  
  /** Last modified timestamp */
  modifiedAt?: Date;
  
  /** Template version for migration support */
  version?: string;
}

/**
 * Represents a file within a template
 */
export interface TemplateFile {
  /** Relative path from template root */
  relativePath: string;
  
  /** File content with variable placeholders */
  content: string;
  
  /** Optional file encoding (defaults to utf8) */
  encoding?: string;
  
  /** Whether this file is binary */
  isBinary?: boolean;
}

/**
 * Represents a variable that can be substituted in templates
 */
export interface TemplateVariable {
  /** Variable name (used in {{name}} syntax) */
  name: string;
  
  /** User prompt for input */
  prompt: string;
  
  /** Default value if user doesn't provide input */
  defaultValue: string;
  
  /** Optional validation regex pattern */
  validation?: string;
  
  /** Optional validation error message */
  validationMessage?: string;
  
  /** Variable type for specialized input handling */
  type?: 'string' | 'number' | 'boolean' | 'choice';
  
  /** For choice type, available options */
  choices?: string[];
  
  /** Whether this variable is required */
  required?: boolean;
}

/**
 * Result of template creation operation
 */
export interface TemplateCreationResult {
  /** Whether creation was successful */
  success: boolean;
  
  /** Error message if creation failed */
  error?: string;
  
  /** Path to created file/folder */
  createdPath?: string;
  
  /** Whether existing files were overwritten */
  overwritten?: boolean;
  
  /** Number of files created */
  filesCreated?: number;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether template is valid */
  isValid: boolean;
  
  /** Array of validation errors */
  errors: string[];
  
  /** Array of validation warnings */
  warnings?: string[];
}

/**
 * Template discovery options
 */
export interface TemplateDiscoveryOptions {
  /** Include nested directories */
  recursive?: boolean;
  
  /** Filter by template type */
  type?: 'file' | 'folder';
  
  /** Filter by category */
  category?: string;
  
  /** Filter by tags */
  tags?: string[];
  
  /** Include hidden templates */
  includeHidden?: boolean;
}
