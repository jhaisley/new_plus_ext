/**
 * Service for processing template variables and substitutions
 */
export class VariableService {
  private static readonly variablePattern = /\$([A-Z_][A-Z0-9_]*)\$/g;
  private static readonly maxRecursionDepth = 10;
  private processingCache = new Map<string, string>();
  private cachingEnabled = true;

  /**
   * Process template content with variable substitutions
   */
  public processTemplate(template: string, variables: Map<string, string>): string {
    if (!template) {return template;}
    
    // Check cache for identical inputs
    const cacheKey = this.createCacheKey(template, variables);
    if (this.cachingEnabled && this.processingCache.has(cacheKey)) {
      return this.processingCache.get(cacheKey)!;
    }
    
    let result = template;
    const processedVariables = new Set<string>();
    let recursionDepth = 0;
    
    // Process variables with recursion detection
    while (recursionDepth < VariableService.maxRecursionDepth) {
      const originalResult = result;
      
      result = result.replace(VariableService.variablePattern, (match, variableName) => {
        const trimmedName = variableName.trim();
        
        // Check for circular reference
        if (processedVariables.has(trimmedName)) {
          console.warn(`Circular reference detected for variable: ${trimmedName}`);
          return match; // Return original placeholder
        }
        
        const value = variables.get(trimmedName);
        if (value !== undefined) {
          processedVariables.add(trimmedName);
          return value;
        }
        
        // Variable not found, leave placeholder
        return match;
      });
      
      // If no changes were made, we're done
      if (result === originalResult) {
        break;
      }
      
      recursionDepth++;
    }
    
    if (recursionDepth >= VariableService.maxRecursionDepth) {
      console.warn('Maximum recursion depth reached during variable processing');
    }
    
    // Cache the result
    if (this.cachingEnabled) {
      this.processingCache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * Extract variable names from template content
   */
  public extractVariables(template: string): string[] {
    if (!template) {return [];}
    
    const variables = new Set<string>();
    let match;
    
    const regex = new RegExp(VariableService.variablePattern.source, 'g');
    while ((match = regex.exec(template)) !== null) {
      const variableName = match[1].trim();
      if (variableName) {
        variables.add(variableName);
      }
    }
    
    return Array.from(variables);
  }

  /**
   * Process variables in file path (for dynamic file naming)
   */
  public processPath(filePath: string, variables: Map<string, string>): string {
    return this.processTemplate(filePath, variables);
  }

  /**
   * Create built-in variables (date, time, etc.)
   */
  public createBuiltInVariables(): Map<string, string> {
    const now = new Date();
    const variables = new Map<string, string>();
    
    // Date and time variables
    variables.set('DATE', now.toISOString().split('T')[0]);
    variables.set('TIME', now.toTimeString().split(' ')[0]);
    variables.set('DATETIME', now.toISOString().replace('T', ' ').split('.')[0]);
    variables.set('TIMESTAMP', now.getTime().toString());
    
    // Date components
    variables.set('YEAR', now.getFullYear().toString());
    variables.set('MONTH', (now.getMonth() + 1).toString().padStart(2, '0'));
    variables.set('DAY', now.getDate().toString().padStart(2, '0'));
    
    // User and system variables
    variables.set('USER', process.env.USER || process.env.USERNAME || 'user');
    variables.set('HOME', process.env.HOME || process.env.USERPROFILE || '');
    variables.set('PLATFORM', process.platform);
    
    // Random values
    variables.set('RANDOM', Math.random().toString(36).substring(2, 8));
    variables.set('UUID', this.generateUUID());
    
    return variables;
  }

  /**
   * Merge variable maps with priority (later maps override earlier ones)
   */
  public mergeVariables(...variableMaps: (Map<string, string> | Record<string, string>)[]): Map<string, string> {
    const result = new Map<string, string>();
    
    for (const variables of variableMaps) {
      if (variables instanceof Map) {
        for (const [key, value] of variables) {
          result.set(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(variables)) {
          result.set(key, value);
        }
      }
    }
    
    return result;
  }

  /**
   * Check if caching is enabled
   */
  public isCachingEnabled(): boolean {
    return this.cachingEnabled;
  }

  /**
   * Enable or disable processing cache
   */
  public setCachingEnabled(enabled: boolean): void {
    this.cachingEnabled = enabled;
    if (!enabled) {
      this.processingCache.clear();
    }
  }

  /**
   * Clear processing cache
   */
  public clearCache(): void {
    this.processingCache.clear();
  }

  /**
   * Create cache key for template and variables
   */
  private createCacheKey(template: string, variables: Map<string, string>): string {
    const varsArray = Array.from(variables.entries()).sort();
    return `${template}|${JSON.stringify(varsArray)}`;
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
