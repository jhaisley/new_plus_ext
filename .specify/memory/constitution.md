<!--
Sync Impact Report:
- Version change: none → 1.0.0
- Modified principles: Initial creation of all principles focused on PowerToys NewPlus parity
- Added sections: All core principles, Development Standards, Quality Assurance, Governance, Attribution
- Removed sections: None
- Templates requiring updates:
  ✅ Updated .specify/templates/plan-template.md (Constitution Check references)
  ✅ Updated .specify/templates/spec-template.md (Requirements alignment)
  ✅ Updated .specify/templates/tasks-template.md (Task categorization)
- Follow-up TODOs: None
-->

# NewPlus for VS Code Constitution

## Core Principles

### I. PowerToys NewPlus Parity
Feature implementation MUST maintain full parity with PowerToys NewPlus functionality.
File and directory creation workflows MUST replicate the Windows Explorer NewPlus experience.
Template management MUST use the default PowerToys NewPlus template directory.
"Open Template Directory" command MUST be implemented for template access.
All PowerToys NewPlus features MUST be accurately reproduced in VS Code context.

### II. VS Code File Explorer Integration
Extension MUST integrate seamlessly with VS Code's native file explorer.
Context menu integration MUST provide "New+" option that handles both file and folder templates.
Template selection MUST distinguish between file and folder templates in the Quick Pick interface.
File creation workflows MUST respect VS Code workspace and folder structures.
Template selection MUST be intuitive and follow VS Code UX patterns.
Created files MUST automatically open in VS Code editor when appropriate.

### III. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written before implementation: Unit tests → Integration tests → Implementation.
Extension activation, commands, and UI interactions MUST have automated test coverage.
VS Code test environment MUST be configured for reliable CI/CD execution.
Red-Green-Refactor cycle strictly enforced for all feature development.

### IV. Template Management Fidelity
Template directory MUST default to PowerToys NewPlus template location.
Template discovery MUST support all PowerToys NewPlus template formats and structures.
Template variables and placeholders MUST be processed identically to PowerToys NewPlus.
Template organization (folders, categories) MUST be preserved and respected.
Custom template paths MUST be configurable for user flexibility.

### V. Marketplace Readiness
Extension metadata MUST include clear description, categories, and keywords for discoverability.
Documentation MUST include installation instructions, usage examples, and troubleshooting.
Packaging MUST follow VS Code marketplace guidelines with proper versioning and changelog.
Security and privacy considerations MUST be documented for any data collection or external calls.

## Development Standards

TypeScript MUST be used for all extension code with strict mode enabled.
ESLint and Prettier MUST be configured for consistent code style and quality.
VS Code Workspace settings MUST be included for consistent development environment.
Dependencies MUST be minimal and regularly audited for security vulnerabilities.

## Quality Assurance

All releases MUST pass automated testing in VS Code stable and insiders builds.
Extension MUST be tested on Windows, macOS, and Linux platforms.
Performance regression testing MUST be performed for activation time and memory usage.
User feedback MUST be collected and addressed through GitHub issues and marketplace reviews.

## Attribution

**Extension Author**: Jordan Haisley  
**Original Concept**: Microsoft PowerToys Team, specifically @lei9444  
**Source Inspiration**: https://github.com/microsoft/PowerToys/tree/main/src/modules/NewPlus

This extension implements PowerToys NewPlus functionality within VS Code. All credit for the original concept, design, and implementation patterns belongs to the Microsoft PowerToys team.

## Governance

This constitution supersedes all other development practices and guidelines.
Constitutional amendments require documentation of rationale and impact assessment.
All feature implementations MUST demonstrate compliance with constitutional principles.
Complexity that violates principles MUST be justified in writing or simplified.

**Version**: 1.0.0 | **Ratified**: 2025-10-01 | **Last Amended**: 2025-10-01