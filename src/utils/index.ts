import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate template name
   */
  public static isValidTemplateName(name: string): boolean {
    if (!name || name.trim() === '') {return false;}
    
    // Allow alphanumeric, dash, underscore, dot
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    return validPattern.test(name);
  }

  /**
   * Validate file name
   */
  public static isValidFileName(name: string): boolean {
    if (!name || name.trim() === '') {return false;}
    
    // Check for invalid characters
    const invalidChars = /[<>:"|?*\\]/;
    if (invalidChars.test(name)) {return false;}
    
    // Check for Windows reserved names
    if (process.platform === 'win32') {
      const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
      if (reserved.test(name)) {return false;}
    }
    
    return true;
  }

  /**
   * Validate folder name
   */
  public static isValidFolderName(name: string): boolean {
    if (!name || name.trim() === '') {return false;}
    
    // Check for invalid characters
    const invalidChars = /[<>:\"|?*\\\\/]/;
    if (invalidChars.test(name)) {return false;}
    
    // Check for Windows reserved names
    if (process.platform === 'win32') {
      const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
      if (reserved.test(name)) {return false;}
    }
    
    return true;
  }

  /**
   * Sanitize name by removing invalid characters
   */
  public static sanitizeName(name: string): string {
    if (!name) {return '';}
    
    // Remove invalid characters
    let sanitized = name.replace(/[<>:"|?*\\/\s]/g, '');
    
    // Handle Windows reserved names
    if (process.platform === 'win32') {
      const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
      if (reserved.test(sanitized)) {
        sanitized += '_';
      }
    }
    
    return sanitized;
  }

  /**
   * Validate path
   */
  public static isValidPath(pathStr: string): boolean {
    if (!pathStr || pathStr.trim() === '') {return false;}
    
    try {
      // Basic path validation
      const normalized = path.normalize(pathStr);
      
      // Check for invalid characters in path
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(normalized)) {return false;}
      
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * File operation utilities
 */
export class FileOperationUtils {
  /**
   * Check if file exists
   */
  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return (stat.type & vscode.FileType.File) !== 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  public static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
      return (stat.type & vscode.FileType.Directory) !== 0;
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists (create if necessary)
   */
  public static async ensureDirectory(dirPath: string): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
  }

  /**
   * Read file content
   */
  public static async readFile(filePath: string): Promise<string> {
    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    return Buffer.from(content).toString('utf8');
  }

  /**
   * Write file content
   */
  public static async writeFile(filePath: string, content: string): Promise<void> {
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), encoder.encode(content));
  }

  /**
   * Copy file
   */
  public static async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    await vscode.workspace.fs.copy(
      vscode.Uri.file(sourcePath),
      vscode.Uri.file(targetPath),
      { overwrite: true }
    );
  }

  /**
   * Copy directory recursively
   */
  public static async copyDirectory(sourcePath: string, targetPath: string): Promise<void> {
    await vscode.workspace.fs.copy(
      vscode.Uri.file(sourcePath),
      vscode.Uri.file(targetPath),
      { overwrite: true }
    );
  }

  /**
   * Delete file
   */
  public static async deleteFile(filePath: string): Promise<void> {
    await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
  }

  /**
   * Remove directory
   */
  public static async removeDirectory(dirPath: string): Promise<void> {
    await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
  }

  /**
   * List directory contents
   */
  public static async listDirectory(dirPath: string): Promise<string[]> {
    const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
    return entries.map(([name]) => name);
  }
}

/**
 * Path utilities
 */
export class PathUtils {
  /**
   * Normalize path
   */
  public static normalize(pathStr: string): string {
    return path.normalize(pathStr);
  }

  /**
   * Join paths
   */
  public static join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Resolve path
   */
  public static resolve(pathStr: string): string {
    return path.resolve(pathStr);
  }

  /**
   * Get file extension
   */
  public static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get basename
   */
  public static getBasename(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Get dirname
   */
  public static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Check if path is absolute
   */
  public static isAbsolute(pathStr: string): boolean {
    return path.isAbsolute(pathStr);
  }

  /**
   * Convert to platform-specific path separators
   */
  public static toPlatformPath(pathStr: string): string {
    if (process.platform === 'win32') {
      return pathStr.replace(/\//g, '\\');
    } else {
      return pathStr.replace(/\\/g, '/');
    }
  }

  /**
   * Expand environment variables
   */
  public static expandEnvironmentVariables(pathStr: string): string {
    if (!pathStr) {return pathStr;}
    
    // Windows style environment variables
    pathStr = pathStr.replace(/%([^%]+)%/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    // Unix style environment variables
    pathStr = pathStr.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    pathStr = pathStr.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || match;
    });
    
    return pathStr;
  }

  /**
   * Make relative path
   */
  public static makeRelative(from: string, to: string): string {
    return path.relative(from, to);
  }
}