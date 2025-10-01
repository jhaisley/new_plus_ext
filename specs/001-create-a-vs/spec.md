# Feature Specification: NewPlus VS Code Extension

**Feature Branch**: `001-create-a-vs`  
**Created**: 2025-10-01  
**Status**: Draft  
**Input**: User description: "Create a VS Code extension named 'New from Template' that replicates the functionality of PowerToys' 'New+' feature."

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ COMPLETE: Feature description provided
2. Extract key concepts from description
   → ✅ COMPLETE: actors (developers), actions (template creation), data (templates, variables), constraints (PowerToys parity)
3. For each unclear aspect:
   → ✅ COMPLETE: All requirements clearly specified
4. Fill User Scenarios & Testing section
   → ✅ COMPLETE: Clear user workflows identified
5. Generate Functional Requirements
   → ✅ COMPLETE: All requirements testable and measurable
6. Identify Key Entities (if data involved)
   → ✅ COMPLETE: Templates, Variables, Configuration entities identified
7. Run Review Checklist
   → ✅ COMPLETE: No implementation details, focused on user value
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a VS Code user, I want to quickly create new files and folders from predefined templates accessible through the File Explorer context menu, so that I can maintain consistent project structure and reduce repetitive setup work.

### Acceptance Scenarios
1. **Given** I right-click on a folder in VS Code File Explorer, **When** I select "New+", **Then** I see a Quick Pick menu with all available templates sorted with folders first
2. **Given** I select a file template from the Quick Pick menu, **When** the template is applied, **Then** a new file is created in the target directory with the template content
3. **Given** I select a folder template from the Quick Pick menu, **When** the template is applied, **Then** the entire folder structure is copied to the target directory
4. **Given** I open the Command Palette and run "New from Template: Open Templates Folder", **When** the command executes, **Then** the configured templates folder opens in my system's file explorer
5. **Given** I have configured variable replacement in filenames, **When** I create a template with date variables like "$YYYY-$MM-$DD", **Then** the filename is updated with current date values
6. **Given** I have templates with sorting prefixes like "01. Component", **When** I enable hiding sorting prefixes, **Then** the template appears as "Component" in the selection menu

### Edge Cases
- What happens when the templates folder doesn't exist or is empty?
- How does the system handle template files that cannot be read due to permissions?
- What occurs when variable substitution results in invalid filename characters?
- How does the extension behave when the target directory has insufficient write permissions?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Extension MUST add "New+" option to VS Code File Explorer context menu when right-clicking folders or empty space
- **FR-002**: Extension MUST display Quick Pick menu with all available templates sorted with folders before files
- **FR-003**: Extension MUST copy selected template file or folder structure to the target directory location
- **FR-004**: Extension MUST provide "New from Template: Open Templates Folder" command accessible from Command Palette
- **FR-005**: Extension MUST support configurable templates folder path via settings.json
- **FR-006**: Extension MUST default templates path to %localappdata%\Microsoft\PowerToys\NewPlus\Templates
- **FR-007**: Extension MUST support hiding file extensions in template selection menu when configured
- **FR-008**: Extension MUST support hiding sorting prefixes (leading digits, spaces, dots) in template names when configured
- **FR-009**: Extension MUST support variable replacement in filenames when enabled
- **FR-010**: Extension MUST process date/time variables ($YYYY, $MM, $DD, etc.) with current timestamp
- **FR-011**: Extension MUST process special variables like $PARENT_FOLDER_NAME with contextual values
- **FR-012**: Extension MUST process environment variables in %VARIABLE% format (case-insensitive)
- **FR-013**: Extension MUST replace invalid filename characters resulting from variable substitution with spaces
- **FR-014**: Extension MUST handle template discovery from configured directory and all subdirectories
- **FR-015**: Extension MUST preserve folder structure and hierarchy when copying folder templates

### Non-Functional Requirements
- **NFR-001**: Template selection menu MUST appear within 500ms of context menu activation
- **NFR-002**: Template copying MUST complete within 2 seconds for files under 10MB
- **NFR-003**: Extension MUST not impact VS Code startup time by more than 100ms
- **NFR-004**: Extension MUST work on Windows, macOS, and Linux platforms
- **NFR-005**: Extension MUST maintain PowerToys NewPlus feature parity for all supported operations

### Key Entities *(include if feature involves data)*
- **Template**: Represents a file or folder structure in the templates directory, with metadata for display name, type (file/folder), and path
- **Configuration**: User settings including templates path, display options (hide extensions, hide prefixes), and behavior options (variable replacement)
- **Variable**: Replaceable tokens in template filenames including date/time patterns, environment variables, and special contextual variables
- **TemplateSelection**: User's choice from Quick Pick menu containing template reference and target directory context

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
