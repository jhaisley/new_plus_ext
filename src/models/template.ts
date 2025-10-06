/**
 * Template entity representing a file or folder template
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
}

/**
 * Represents a file within a template
 */
export interface TemplateFile {
  /** Relative path from template root */
  relativePath: string;
  
  /** File content with variable placeholders */
  content: string;
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
