import * as vscode from 'vscode';
import { Template } from '../models/template';

/**
 * Context menu integration utilities for VS Code explorer
 */
export class ContextMenuIntegration {
  /**
   * Determine appropriate templates based on context
   */
  public static async getContextualTemplates(
    uri: vscode.Uri | undefined,
    allTemplates: Template[]
  ): Promise<{ suggested: Template[]; other: Template[] }> {
    const suggested: Template[] = [];
    const other: Template[] = [];
    
    if (!uri) {
      // No context, return all templates
      return { suggested: [], other: allTemplates };
    }
    
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const isDirectory = (stat.type & vscode.FileType.Directory) !== 0;
      
      if (isDirectory) {
        // In a folder context, suggest both file and folder templates
        // File templates first (more common), then folder templates
        for (const template of allTemplates) {
          if (template.type === 'file') {
            suggested.push(template);
          }
        }
        for (const template of allTemplates) {
          if (template.type === 'folder') {
            suggested.push(template);
          }
        }
      } else {
        // In a file context (same directory), suggest file templates first
        for (const template of allTemplates) {
          if (template.type === 'file') {
            suggested.push(template);
          } else {
            other.push(template);
          }
        }
      }
    } catch {
      // If we can't determine the type, show all templates
      suggested.push(...allTemplates);
    }
    
    return { suggested, other };
  }

  /**
   * Get context-aware menu label
   */
  public static getContextMenuLabel(uri?: vscode.Uri): string {
    return 'New from Template...';
  }

  /**
   * Create quick pick items with context awareness
   */
  public static createContextualQuickPickItems(
    suggested: Template[],
    other: Template[],
    recentTemplates: string[]
  ): Array<vscode.QuickPickItem & { template?: Template }> {
    const items: Array<vscode.QuickPickItem & { template?: Template }> = [];
    
    // Add recent templates first
    const recentItems = recentTemplates
      .map(name => [...suggested, ...other].find(t => t.name === name))
      .filter(t => t !== undefined) as Template[];
    
    if (recentItems.length > 0) {
      items.push({
        label: 'Recently Used',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      recentItems.forEach(template => {
        items.push({
          label: `$(clock) ${template.name}`,
          description: template.description,
          detail: `${template.type} template`,
          template
        });
      });
    }
    
    // Add suggested templates
    if (suggested.length > 0) {
      items.push({
        label: 'Suggested for This Context',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      suggested
        .filter(t => !recentTemplates.includes(t.name))
        .forEach(template => {
          const icon = template.type === 'file' ? '$(file)' : '$(folder)';
          items.push({
            label: `${icon} ${template.name}`,
            description: template.description,
            detail: `${template.type} template`,
            template
          });
        });
    }
    
    // Add other templates
    const otherFiltered = other.filter(t => !recentTemplates.includes(t.name));
    if (otherFiltered.length > 0) {
      items.push({
        label: 'All Templates',
        kind: vscode.QuickPickItemKind.Separator
      });
      
      otherFiltered.forEach(template => {
        const icon = template.type === 'file' ? '$(file)' : '$(folder)';
        items.push({
          label: `${icon} ${template.name}`,
          description: template.description,
          detail: `${template.type} template`,
          template
        });
      });
    }
    
    return items;
  }
}