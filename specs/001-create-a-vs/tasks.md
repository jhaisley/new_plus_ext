# Tasks: NewPlus VS Code Extension

**Input**: Design documents from `/specs/001-create-a-vs/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ COMPLETE: TypeScript 5.0+, VS Code Extension API, Node.js fs
2. Load optional design documents:
   → data-model.md: Template, Configuration, Variable, TemplateSelection entities
   → contracts/: Extension manifest and VS Code API contracts
   → research.md: yo code, contributes.menus, Quick Pick API decisions
3. Generate tasks by category:
   → Setup: yo code scaffolding, dependencies, extension manifest
   → Tests: contract tests, entity tests, integration scenarios
   → Core: models, services, commands, VS Code API integration
   → Integration: context menus, Quick Pick UI, file operations
   → Polish: performance validation, documentation, marketplace prep
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests ✅
   → All entities have models ✅
   → All quickstart scenarios covered ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
VS Code extension structure with TypeScript:
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root
- **Config**: `package.json`, `tsconfig.json`, `.vscode/` settings

## Phase 3.1: Setup
- [x] T001 Generate TypeScript VS Code extension using yo code (new-from-template)
- [x] T002 Install additional dependencies (@types/node, file system utilities)
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T004 [P] Setup ESLint and Prettier configuration files
- [x] T005 [P] Create .vscode/launch.json for extension debugging
- [x] T006 Configure extension manifest in package.json with contributes.commands
- [x] T007 Add contributes.menus for explorer/context and file/newFile integration
- [x] T008 [P] Setup contributes.configuration schema for user settings

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T009 [P] Extension activation test in tests/extension.test.ts
- [ ] T010 [P] Template entity validation tests in tests/models/template.test.ts
- [ ] T011 [P] Configuration entity tests in tests/models/configuration.test.ts
- [ ] T012 [P] Variable service pattern matching tests in tests/services/variableService.test.ts
- [ ] T013 [P] Template service discovery tests in tests/services/templateService.test.ts
- [ ] T014 [P] Configuration service tests in tests/services/configService.test.ts
- [ ] T015 [P] New+ command tests in tests/commands/newFromTemplate.test.ts
- [ ] T016 [P] Open templates folder command tests in tests/commands/openTemplatesFolder.test.ts
- [ ] T017 [P] File utilities tests in tests/utils/fileUtils.test.ts
- [ ] T018 [P] Path utilities tests in tests/utils/pathUtils.test.ts
- [ ] T019 Integration test for Scenario 1 (basic file creation) in tests/integration/basicFileCreation.test.ts
- [ ] T020 Integration test for Scenario 2 (folder creation) in tests/integration/folderCreation.test.ts
- [ ] T021 Integration test for Scenario 3 (variable substitution) in tests/integration/variableSubstitution.test.ts
- [ ] T022 Integration test for Scenario 4 (configuration management) in tests/integration/configManagement.test.ts
- [ ] T023 Integration test for Scenario 5 (error handling) in tests/integration/errorHandling.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T024 [P] Template entity model in src/models/template.ts
- [ ] T025 [P] Configuration entity model in src/models/configuration.ts
- [ ] T026 Extension entry point (activate/deactivate) in src/extension.ts
- [ ] T027 [P] Configuration service implementation in src/services/configService.ts
- [ ] T028 [P] Variable service with date/time/environment processing in src/services/variableService.ts
- [ ] T029 Template service with discovery and validation in src/services/templateService.ts
- [ ] T030 [P] File utilities for cross-platform operations in src/utils/fileUtils.ts
- [ ] T031 [P] Path utilities for template path handling in src/utils/pathUtils.ts
- [ ] T032 New+ command implementation in src/commands/newFromTemplate.ts
- [ ] T033 [P] Open templates folder command in src/commands/openTemplatesFolder.ts

## Phase 3.4: Integration
- [ ] T034 VS Code Quick Pick integration for template selection
- [ ] T035 Context menu command registration and activation
- [ ] T036 File Explorer context detection and URI handling
- [ ] T037 Template copying with folder structure preservation
- [ ] T038 Variable substitution integration in template creation flow
- [ ] T039 Configuration change reactivity and settings integration
- [ ] T040 Error handling and user notifications for missing templates

## Phase 3.5: Polish
- [ ] T041 [P] Performance optimization for template discovery caching
- [ ] T042 Performance validation: startup impact <100ms
- [ ] T043 Performance validation: context menu response <500ms
- [ ] T044 Performance validation: template copying <2s for 10MB files
- [ ] T045 [P] Extension marketplace metadata (description, keywords, categories)
- [ ] T046 [P] Create extension icon and marketplace assets
- [ ] T047 [P] Update README.md with installation and usage instructions
- [ ] T048 [P] Add CHANGELOG.md with initial release notes
- [ ] T049 Cross-platform testing on Windows, macOS, Linux
- [ ] T050 Manual validation using quickstart scenarios
- [ ] T051 [P] Remove code duplication and optimize bundle size
- [ ] T052 PowerToys compatibility validation and documentation

## Dependencies
- Setup (T001-T008) before all other phases
- Tests (T009-T023) before implementation (T024-T033)
- Models (T024-T025) before services (T027-T029)
- Services before commands (T032-T033)
- Core implementation before integration (T034-T040)
- Integration before polish (T041-T052)

### Specific Dependencies
- T026 (extension.ts) blocks T032, T033 (commands need activation)
- T027 (configService) blocks T028, T029 (other services need config)
- T024, T025 (models) block T029 (templateService needs entities)
- T030, T031 (utilities) block T029, T032 (file operations)
- T032 (new+ command) blocks T034-T038 (integration features)

## Parallel Example
```
# Launch T010-T018 together (all independent test files):
Task: "Template entity validation tests in tests/models/template.test.ts"
Task: "Configuration entity tests in tests/models/configuration.test.ts"  
Task: "Variable service pattern matching tests in tests/services/variableService.test.ts"
Task: "Template service discovery tests in tests/services/templateService.test.ts"
Task: "Configuration service tests in tests/services/configService.test.ts"
Task: "New+ command tests in tests/commands/newFromTemplate.test.ts"
Task: "Open templates folder command tests in tests/commands/openTemplatesFolder.test.ts"
Task: "File utilities tests in tests/utils/fileUtils.test.ts"
Task: "Path utilities tests in tests/utils/pathUtils.test.ts"

# Launch T024-T025, T030-T031, T033 together (independent model and utility files):
Task: "Template entity model in src/models/template.ts"
Task: "Configuration entity model in src/models/configuration.ts"
Task: "File utilities for cross-platform operations in src/utils/fileUtils.ts"
Task: "Path utilities for template path handling in src/utils/pathUtils.ts"
Task: "Open templates folder command in src/commands/openTemplatesFolder.ts"
```

## Notes
- [P] tasks = different files, no dependencies between them
- All tests must fail initially to verify TDD approach
- Each integration test maps to a quickstart scenario
- Variable service must match PowerToys NewPlus patterns exactly
- Extension manifest changes require VS Code reload during development

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - extension-manifest.md → package.json configuration tasks (T006-T008)
   - vscode-api.md → API integration tasks (T034-T040)
   
2. **From Data Model**:
   - Template entity → model task T024 [P]
   - Configuration entity → model task T025 [P]
   - Variable → service task T028 [P]
   - TemplateSelection → integrated in command T032
   
3. **From Quickstart Scenarios**:
   - Scenario 1 → integration test T019 [P]
   - Scenario 2 → integration test T020 [P]
   - Scenario 3 → integration test T021 [P]
   - Scenario 4 → integration test T022 [P]
   - Scenario 5 → integration test T023 [P]

4. **From Research Decisions**:
   - yo code → setup task T001
   - Node.js fs → utility tasks T030, T031 [P]
   - VS Code APIs → integration tasks T034-T040

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T009-T023)
- [x] All entities have model tasks (T024-T025)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios have integration tests
- [x] PowerToys compatibility requirements covered
- [x] Performance requirements have validation tasks