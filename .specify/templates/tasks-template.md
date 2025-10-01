# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create VS Code extension project structure per implementation plan
- [ ] T002 Initialize TypeScript project with VS Code extension dependencies
- [ ] T003 [P] Configure ESLint, Prettier, and VS Code workspace settings
- [ ] T004 [P] Setup extension manifest (package.json) with contributions

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Extension activation test in tests/extension.test.ts
- [ ] T006 [P] Command registration tests in tests/commands.test.ts
- [ ] T007 [P] Configuration validation tests in tests/config.test.ts
- [ ] T008 [P] Integration test for user workflows in tests/integration/

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] Extension entry point (activate/deactivate) in src/extension.ts
- [ ] T010 [P] Command implementations in src/commands/
- [ ] T011 [P] Configuration schema and handlers in src/config/
- [ ] T012 VS Code API integration and event handlers
- [ ] T013 TypeScript interfaces and type definitions
- [ ] T014 Input validation and error handling
- [ ] T015 Extension context and workspace integration

## Phase 3.4: Integration
- [ ] T016 VS Code workspace and document integration
- [ ] T017 Extension settings and configuration UI
- [ ] T018 Command palette and menu contributions
- [ ] T019 Status bar and notification integration
- [ ] T020 Extension telemetry and logging

## Phase 3.5: Polish
- [ ] T021 [P] Unit tests for utility functions in tests/unit/
- [ ] T022 Performance tests (extension activation <1s, command response <500ms)
- [ ] T023 [P] Update README.md with installation and usage instructions
- [ ] T024 [P] Extension marketplace metadata and icons
- [ ] T025 Remove code duplication and optimize bundle size
- [ ] T026 Manual testing across VS Code stable and insiders
- [ ] T027 Accessibility testing for keyboard navigation

## Dependencies
- Setup (T001-T004) before all other phases
- Tests (T005-T008) before implementation (T009-T015)
- T009 blocks T010, T011 (extension activation before commands)
- T013 blocks T014, T015 (interfaces before integration)
- Core implementation before integration (T016-T020)
- Integration before polish (T021-T027)

## Parallel Example
```
# Launch T005-T008 together:
Task: "Extension activation test in tests/extension.test.ts"
Task: "Command registration tests in tests/commands.test.ts"
Task: "Configuration validation tests in tests/config.test.ts"
Task: "Integration test for user workflows in tests/integration/"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task