import * as vscode from 'vscode';

/**
 * Error types for the NewPlus extension
 */
export enum ErrorType {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID = 'TEMPLATE_INVALID',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VARIABLE_ERROR = 'VARIABLE_ERROR',
  WORKSPACE_ERROR = 'WORKSPACE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Enhanced error class for NewPlus extension
 */
export class NewPlusError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly userMessage: string,
    public readonly suggestions: string[] = [],
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NewPlusError';
  }
}

/**
 * Error handling utilities for the NewPlus extension
 */
export class ErrorHandler {
  private static readonly errorMessages: Record<ErrorType, string> = {
    [ErrorType.TEMPLATE_NOT_FOUND]: 'Template not found',
    [ErrorType.TEMPLATE_INVALID]: 'Template is invalid or corrupted',
    [ErrorType.FILE_SYSTEM_ERROR]: 'File system operation failed',
    [ErrorType.CONFIGURATION_ERROR]: 'Configuration error',
    [ErrorType.VARIABLE_ERROR]: 'Variable processing error',
    [ErrorType.WORKSPACE_ERROR]: 'Workspace operation failed',
    [ErrorType.PERMISSION_ERROR]: 'Permission denied',
    [ErrorType.NETWORK_ERROR]: 'Network operation failed',
    [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred'
  };

  private static readonly suggestionMap: Record<ErrorType, string[]> = {
    [ErrorType.TEMPLATE_NOT_FOUND]: [
      'Check if the templates directory exists',
      'Verify the templates path in settings',
      'Try refreshing the templates',
      'Run "New from Template: Open Templates Folder" to create templates'
    ],
    [ErrorType.TEMPLATE_INVALID]: [
      'Check if template.json exists and is valid JSON',
      'Verify template file structure',
      'Ensure all referenced files exist',
      'Check template syntax and format'
    ],
    [ErrorType.FILE_SYSTEM_ERROR]: [
      'Check file/folder permissions',
      'Ensure target directory exists and is writable',
      'Try a different location',
      'Restart VS Code and try again'
    ],
    [ErrorType.CONFIGURATION_ERROR]: [
      'Check extension settings',
      'Reset configuration to defaults',
      'Ensure templates path is valid',
      'Check for configuration conflicts'
    ],
    [ErrorType.VARIABLE_ERROR]: [
      'Check variable syntax ($VARIABLE_NAME$)',
      'Ensure all variables are defined',
      'Check for circular variable references',
      'Simplify variable expressions'
    ],
    [ErrorType.WORKSPACE_ERROR]: [
      'Open a folder or workspace in VS Code',
      'Check workspace permissions',
      'Try opening a different workspace',
      'Ensure workspace is not corrupted'
    ],
    [ErrorType.PERMISSION_ERROR]: [
      'Run VS Code as administrator (if needed)',
      'Check folder permissions',
      'Choose a different target directory',
      'Contact your system administrator'
    ],
    [ErrorType.NETWORK_ERROR]: [
      'Check internet connection',
      'Try again later',
      'Check proxy settings',
      'Use offline templates'
    ],
    [ErrorType.UNKNOWN_ERROR]: [
      'Try restarting VS Code',
      'Check the output console for details',
      'Report this issue on GitHub',
      'Try using a simpler template'
    ]
  };

  /**
   * Create a user-friendly error from any error
   */
  public static createUserFriendlyError(
    error: unknown,
    context: string = ''
  ): NewPlusError {
    if (error instanceof NewPlusError) {
      return error;
    }

    const errorString = String(error);
    const message = error instanceof Error ? error.message : errorString;
    
    // Determine error type based on error content
    let type = ErrorType.UNKNOWN_ERROR;
    if (message.includes('ENOENT') || message.includes('not found')) {
      type = ErrorType.TEMPLATE_NOT_FOUND;
    } else if (message.includes('EACCES') || message.includes('permission')) {
      type = ErrorType.PERMISSION_ERROR;
    } else if (message.includes('EISDIR') || message.includes('ENOTDIR')) {
      type = ErrorType.FILE_SYSTEM_ERROR;
    } else if (message.includes('JSON') || message.includes('parse')) {
      type = ErrorType.TEMPLATE_INVALID;
    } else if (message.includes('network') || message.includes('timeout')) {
      type = ErrorType.NETWORK_ERROR;
    } else if (message.includes('variable') || message.includes('substitution')) {
      type = ErrorType.VARIABLE_ERROR;
    } else if (message.includes('workspace') || message.includes('folder')) {
      type = ErrorType.WORKSPACE_ERROR;
    } else if (message.includes('config')) {
      type = ErrorType.CONFIGURATION_ERROR;
    }

    const userMessage = this.getUserFriendlyMessage(type, context);
    const suggestions = this.suggestionMap[type] || [];

    return new NewPlusError(
      type,
      message,
      userMessage,
      suggestions,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Get a user-friendly error message
   */
  private static getUserFriendlyMessage(type: ErrorType, context: string): string {
    const baseMessage = this.errorMessages[type];
    if (context) {
      return `${baseMessage} while ${context}`;
    }
    return baseMessage;
  }

  /**
   * Show error to user with suggestions
   */
  public static async showError(error: NewPlusError): Promise<void> {
    const actions: string[] = [];
    
    // Add primary suggestions as actions
    if (error.suggestions.length > 0) {
      actions.push('Show Help');
    }
    
    // Add common actions based on error type
    switch (error.type) {
      case ErrorType.TEMPLATE_NOT_FOUND:
        actions.push('Open Templates Folder');
        break;
      case ErrorType.CONFIGURATION_ERROR:
        actions.push('Open Settings');
        break;
      case ErrorType.WORKSPACE_ERROR:
        actions.push('Open Folder');
        break;
    }

    const selectedAction = await vscode.window.showErrorMessage(
      error.userMessage,
      ...actions
    );

    if (selectedAction) {
      await this.handleErrorAction(selectedAction, error);
    }
  }

  /**
   * Handle user action from error dialog
   */
  private static async handleErrorAction(action: string, error: NewPlusError): Promise<void> {
    switch (action) {
      case 'Show Help':
        const helpMessage = error.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
        await vscode.window.showInformationMessage(
          `Troubleshooting suggestions:\n\n${helpMessage}`,
          { modal: true }
        );
        break;
        
      case 'Open Templates Folder':
        await vscode.commands.executeCommand('newFromTemplate.openTemplatesFolder');
        break;
        
      case 'Open Settings':
        await vscode.commands.executeCommand('workbench.action.openSettings', 'newFromTemplate');
        break;
        
      case 'Open Folder':
        await vscode.commands.executeCommand('vscode.openFolder');
        break;
    }
  }

  /**
   * Log error for debugging
   */
  public static logError(error: NewPlusError, context?: string): void {
    const logMessage = [
      `[NewPlus Error] ${error.type}:`,
      `Message: ${error.message}`,
      `User Message: ${error.userMessage}`,
      context ? `Context: ${context}` : '',
      error.originalError ? `Original: ${error.originalError.stack || error.originalError.message}` : ''
    ].filter(Boolean).join('\n');
    
    console.error(logMessage);
  }

  /**
   * Handle any error with full logging and user notification
   */
  public static async handleError(
    error: unknown,
    context: string = '',
    showToUser: boolean = true
  ): Promise<void> {
    const newPlusError = this.createUserFriendlyError(error, context);
    
    // Always log the error
    this.logError(newPlusError, context);
    
    // Show to user if requested
    if (showToUser) {
      await this.showError(newPlusError);
    }
  }

  /**
   * Wrap a function with error handling
   */
  public static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    showErrors: boolean = true
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error, context, showErrors);
      return undefined;
    }
  }
}