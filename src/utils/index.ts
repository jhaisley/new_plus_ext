import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Validation utilities
 */

/**
 * Validate template name
 */
export function isValidTemplateName(name: string): boolean {
  if (!name || name.trim() === '') {
    return false;
  }
  
  // Allow alphanumeric, dash, underscore, dot
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(name);
}

/**
 * Validate file name
 */
export function isValidFileName(name: string): boolean {
  if (!name || name.trim() === '') {
    return false;
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*\\]/;
  if (invalidChars.test(name)) {
    return false;
  }
  
  // Check for Windows reserved names
  if (process.platform === 'win32') {
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reserved.test(name)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate folder name
 */
export function isValidFolderName(name: string): boolean {
  if (!name || name.trim() === '') {
    return false;
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:\"|?*\\\\/]/;
  if (invalidChars.test(name)) {
    return false;
  }
  
  // Check for Windows reserved names
  if (process.platform === 'win32') {
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reserved.test(name)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize name by removing invalid characters
 */
export function sanitizeName(name: string): string {
  if (!name) {
    return '';
  }
  
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
export function isValidPath(pathStr: string): boolean {
  if (!pathStr || pathStr.trim() === '') {
    return false;
  }
  
  try {
    // Basic path validation
    const normalized = path.normalize(pathStr);
    
    // Check for invalid characters in path
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(normalized)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * File operation utilities
 */

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
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
export async function directoryExists(dirPath: string): Promise<boolean> {
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
export async function ensureDirectory(dirPath: string): Promise<void> {
  await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
}

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<string> {
  const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
  return Buffer.from(content).toString('utf8');
}

/**
 * Write file content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), encoder.encode(content));
}

/**
 * Copy file
 */
export async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
  await vscode.workspace.fs.copy(
    vscode.Uri.file(sourcePath),
    vscode.Uri.file(targetPath),
    { overwrite: true }
  );
}

/**
 * Copy directory recursively
 */
export async function copyDirectory(sourcePath: string, targetPath: string): Promise<void> {
  await vscode.workspace.fs.copy(
    vscode.Uri.file(sourcePath),
    vscode.Uri.file(targetPath),
    { overwrite: true }
  );
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<void> {
  await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
}

/**
 * Remove directory
 */
export async function removeDirectory(dirPath: string): Promise<void> {
  await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
}

/**
 * List directory contents
 */
export async function listDirectory(dirPath: string): Promise<string[]> {
  const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
  return entries.map(([name]) => name);
}

/**
 * Path utilities
 */

/**
 * Normalize path
 */
export function normalize(pathStr: string): string {
  return path.normalize(pathStr);
}

/**
 * Join paths
 */
export function joinPaths(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Resolve path
 */
export function resolvePath(pathStr: string): string {
  return path.resolve(pathStr);
}

/**
 * Get file extension
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath);
}

/**
 * Get basename
 */
export function getBasename(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Get dirname
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Check if path is absolute
 */
export function isAbsolute(pathStr: string): boolean {
  return path.isAbsolute(pathStr);
}

/**
 * Convert to platform-specific path separators
 */
export function toPlatformPath(pathStr: string): string {
  if (process.platform === 'win32') {
    return pathStr.replace(/\//g, '\\');
  } else {
    return pathStr.replace(/\\/g, '/');
  }
}

/**
 * Expand environment variables
 */
export function expandEnvironmentVariables(pathStr: string): string {
  if (!pathStr) {
    return pathStr;
  }
  
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
export function makeRelative(from: string, to: string): string {
  return path.relative(from, to);
}