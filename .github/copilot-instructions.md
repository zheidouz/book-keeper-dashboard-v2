# Book Keeper Dashboard v2 - GitHub Copilot Configuration

This project includes a comprehensive set of GitHub Copilot custom agents, instructions, and skills to enhance development workflows. Below is a guide on how to use each resource.

---

## 🧠 Custom Agents (Chat Modes)

Available in `.github/agents/` — activate via VS Code Chat by mentioning the agent name.

| Agent | Description | How to Use |
|-------|-------------|------------|
| `expert-react-frontend-engineer` | Expert React 19.2 frontend engineering with modern hooks, Server Components, TypeScript | `/expert-react-frontend-engineer Build this component...` |
| `plan` | Strategic planning and architecture before implementation | `/plan Analyze this feature request and create a plan` |
| `debug` | Systematic debugging of application issues | `/debug Investigate this error...` |
| `swe-subagent` | Senior software engineer for features, bugs, refactoring | `/swe-subagent Implement this feature...` |
| `qa-subagent` | Meticulous QA for test planning, bug hunting, verification | `/qa-subagent Test this feature...` |
| `principal-software-engineer` | Principal-level engineering guidance | `/principal-software-engineer Review this architecture...` |
| `specification` | Generate or update specification documents | `/specification Create spec for this feature` |
| `implementation-plan` | Generate implementation plans for features/refactoring | `/implementation-plan Plan this feature` |
| `prd` | Create comprehensive Product Requirements Documents | `/prd Write PRD for this feature` |
| `critical-thinking` | Challenge assumptions for better solutions | `/critical-thinking Review my approach to...` |
| `devils-advocate` | Ruthless adversarial review — find hidden flaws, pressure-test decisions, surface blind spots | `/devils-advocate Challenge this architecture...` |
| `project-documenter` | Generate professional project documentation | `/project-documenter Document this module` |
| `mentor` | Guided mentorship and learning support | `/mentor Explain this pattern...` |
| `refine-issue` | Refine requirements with AC, edge cases, NFRs | `/refine-issue Improve this issue description` |
| `repo-architect` | Bootstrap and validate agentic project structures | `/repo-architect Scaffold project structure` |
| `context-architect` | Plan multi-file changes by identifying context | `/context-architect Plan this multi-file change` |
| `terminal-helper` | Fast terminal syntax helper for PowerShell/Bash | `/terminal-helper How do I...` |
| `blueprint-mode` | Structured workflows (Debug, Express, Main) | `/blueprint-mode Execute this workflow` |
| `frontend-performance-investigator` | Diagnose Core Web Vitals, Lighthouse regressions, long tasks with Chrome DevTools | `/frontend-performance-investigator Debug dashboard LCP` |
| `neon-optimization-analyzer` | Find and fix slow Postgres queries via Neon branching | `/neon-optimization-analyzer Analyze slow task queries` |
| `postgresql-dba` | PostgreSQL DBA for managing, querying, and optimizing Postgres databases | `/postgresql-dba Show slow queries in pg_stat_statements` |
| `chatbot-ai-optimizer` | AI chatbot optimization — prompt engineering, SSE streaming, error recovery, token cost control | `/chatbot-ai-optimizer Optimize the chatbot prompt for BIR form accuracy` |

## 📋 Custom Instructions

Available in `.github/instructions/` — automatically applied by VS Code Copilot.

| Instruction | Applies To | Description |
|-------------|------------|-------------|
| `react-tailwind` | `**/*.tsx,**/*.ts` | React + Tailwind development standards |
| `context-engineering` | `**/*.ts,**/*.tsx` | Code structure for better Copilot context |
| `security-and-owasp` | `**/*.ts,**/*.tsx,**/*.js` | OWASP secure coding standards |
| `performance-optimization` | `**/*.tsx,**/*.ts` | Core Web Vitals performance standards |
| `markdown-gfm` | `**/*.md` | GitHub Flavored Markdown formatting |
| `no-heredoc` | `**/*` | Prevents heredoc file corruption |
| `taming-copilot` | `**/*` | Keep Copilot focused and controlled |
| `code-review-generic` | `**/*.ts,**/*.tsx` | Generic code review instructions |
| `qa-engineering-best-practices` | `**/*.ts,**/*.tsx` | QA engineering standards |
| `update-docs-on-code-change` | `**/*` | Auto-update docs on code changes |
| `caveman-mode` | `**/*` | Terse, low-token responses |
| `task-implementation` | `**/*` | Progressive task tracking |
| `prompt` | `**/*.prompt.md` | Prompt file creation guidelines |
| `instructions` | `**/*.instructions.md` | Instruction file creation guidelines |
| `agents` | `**/*.agent.md` | Agent file creation guidelines |
| `agent-skills` | `**/SKILL.md` | Agent Skills file creation guidelines |
| `containerization-docker` | `**/*` | Docker best practices |
| `markdown-accessibility` | `**/*.md` | Inclusive documentation |
| `exclude-prompt-data` | `**/*` | Never echo prompt instructions into output |
| `copilot-thought-logging` | `**/*` | See/reshape Copilot's process |

## 🎯 Agent Skills

Available in `.github/skills/` — loaded on demand for specialized workflows.

### Project & Feature Planning
| Skill | Description |
|-------|-------------|
| `breakdown-epic-pm` | Create Epic PRDs from high-level requirements |
| `breakdown-epic-arch` | Create technical architecture from Epic PRDs |
| `breakdown-feature-prd` | Create Feature PRDs from Epic |
| `breakdown-feature-implementation` | Create detailed implementation plans |
| `breakdown-plan` | Generate comprehensive project plans with Epic > Feature > Story hierarchy |
| `breakdown-test` | Generate test strategies and quality validation plans |
| `create-implementation-plan` | Create implementation plan files |
| `update-implementation-plan` | Update existing implementation plans |
| `create-github-issues-feature-from-implementation-plan` | Create GitHub Issues from plans |
| `create-technical-spike` | Create time-boxed research spike documents |
| `create-specification` | Create specification files optimized for AI consumption |
| `prd` | Generate high-quality Product Requirements Documents |
| `create-architectural-decision-record` | Create ADR documents |
| `create-agentsmd` | Generate AGENTS.md for repository |
| `create-llms` | Create llms.txt for AI documentation |
| `ai-ready` | Make any repo AI-ready with config files |

### Code Quality & Review
| Skill | Description |
|-------|-------------|
| `security-review` | AI-powered codebase security scanning |
| `codeql` | CodeQL code scanning setup and configuration |
| `secret-scanning` | GitHub secret scanning setup |
| `dependabot` | Dependabot configuration and management |
| `quality-playbook` | Complete quality engineering audit on any codebase |
| `doublecheck` | Three-layer verification for AI output |
| `review-and-refactor` | Code review and refactoring |

### Development Workflow
| Skill | Description |
|-------|-------------|
| `git-commit` | Conventional commit with intelligent staging |
| `conventional-commit` | Conventional commit message generation |
| `conventional-branch` | Branch naming following spec |
| `commit-message-storyteller` | Narrative commit messages |
| `context-map` | Generate file maps before changes |
| `what-context-needed` | Ask Copilot what files it needs |
| `first-ask` | Interactive task refinement |
| `refactor-plan` | Create multi-file refactor plans |
| `refactor` | Surgical code refactoring |
| `github-issues` | Create and manage GitHub Issues |

### Documentation & Communication
| Skill | Description |
|-------|-------------|
| `documentation-writer` | Diátaxis documentation framework |
| `create-readme` | README.md generation |
| `readme-blueprint-generator` | Intelligent README generation from project analysis |
| `project-workflow-analysis-blueprint-generator` | End-to-end workflow documentation |
| `folder-structure-blueprint-generator` | Project folder structure documentation |
| `technology-stack-blueprint-generator` | Tech stack documentation |
| `copilot-instructions-blueprint-generator` | copilot-instructions.md generation |
| `code-tour` | Create interactive code tours |
| `repo-story-time` | Repository summary from commit history |
| `meeting-minutes` | Generate meeting minutes |
| `pr-screenshots` | Embed before/after screenshots in PRs |

### UI/UX & Testing
| Skill | Description |
|-------|-------------|
| `premium-frontend-ui` | Immersive web experiences with motion and typography |
| `web-design-reviewer` | Visual website inspection for design fixes |
| `chrome-devtools` | Browser automation and performance analysis |
| `ui-screenshots` | Screenshot capture during development |
| `webapp-testing` | Local web app testing with Playwright |
| `excalidraw-diagram-generator` | Generate Excalidraw diagrams |
| `draw-io-diagram-generator` | Generate draw.io diagrams |
| `write-coding-standards-from-file` | Create coding standards from existing code |

### DevOps & Infrastructure
| Skill | Description |
|-------|-------------|
| `multi-stage-dockerfile` | Optimized multi-stage Dockerfiles |
| `github-copilot-starter` | Copilot configuration for new projects |
| `editorconfig` | .editorconfig generation |
| `acquire-codebase-knowledge` | Map and document codebase architecture |

### Database Optimization
| Skill | Description |
|-------|-------------|
| `postgresql-optimization` | PostgreSQL-specific optimization: EXPLAIN ANALYZE, index strategies, JSONB, window functions, full-text search |
| `postgresql-code-review` | Review Postgres code for best practices: schema design, JSONB usage, RLS, PL/pgSQL functions |
| `sql-optimization` | Universal SQL tuning: query analysis, index strategy, pagination, batch ops, anti-pattern detection |
| `sql-code-review` | SQL security & quality review: injection prevention, N+1 queries, join optimization, schema design |

### AI Chatbot Optimization
| Skill | Description |
|-------|-------------|
| `chatbot-prompt-optimizer` | Optimize AI chatbot system prompt, BIR form context injection, and LLM response quality. Covers prompt structure tuning, hallucination reduction, token cost control |
| `chatbot-sse-debugger` | Debug SSE streaming issues: slow responses, timeouts, connection drops, silent error swallowing, partial renders. Covers AbortController, fetch stream parsing, error propagation |

## 🚀 Recommended Workflows

### Feature Development Flow
1. `/prd Write a PRD for [feature]` → Creates Product Requirements
2. `breakdown-epic-arch` skill → Technical architecture
3. `breakdown-feature-implementation` skill → Implementation plan
4. `create-github-issues-feature-from-implementation-plan` skill → Create GitHub Issues
5. `/expert-react-frontend-engineer` → Implement the feature
6. `/qa-subagent` → Verify the implementation
7. `quality-playbook` skill → Quality audit
8. `git-commit` skill → Commit with conventional message

### Debugging Flow
1. `/debug Investigate [issue]` → Debug mode
2. `context-map` skill → Map relevant files
3. `/swe-subagent Fix the issue` → Fix implementation
4. `/qa-subagent Verify the fix` → QA verification
5. `doublecheck` skill → Verify AI output

### Documentation Flow
1. `create-specification` skill → Create feature spec
2. `documentation-writer` skill → Write documentation
3. `create-readme` skill → Generate README
4. `code-tour` skill → Create interactive tours
5. `draw-io-diagram-generator` skill → Architecture diagrams

### Performance Optimization Flow
1. `/frontend-performance-investigator Diagnose route X` → Runtime perf analysis (LCP, INP, CLS)
2. `/neon-optimization-analyzer Analyze slow queries` → DB query optimization
3. `/debug` → Deep-dive into identified bottlenecks
4. `/swe-subagent Implement the fix` → Apply optimizations
5. `/qa-subagent Verify the fix` → Perf regression check
6. `doublecheck` skill → Verify AI output

### Database Optimization Flow
1. `/postgresql-dba Connect to DB and check pg_stat_statements` → Identify slow queries
2. `/neon-optimization-analyzer Analyze slow task queries` → Deep Neon branch analysis
3. `sql-optimization` skill → Universal SQL tuning (indexes, pagination, batch ops)
4. `postgresql-optimization` skill → Postgres-specific optimization (JSONB, GIN, CTEs)
5. `postgresql-code-review` skill → Review schema design, custom types, RLS
6. `sql-code-review` skill → Security audit: injection, N+1, anti-patterns
7. `/swe-subagent Implement the fix` → Apply optimizations
8. `/qa-subagent Verify the fix` → Performance regression check

### Code Review Flow
1. `security-review` skill → Security audit
2. `codeql` skill → CodeQL analysis
3. `dependabot` skill → Dependency check
4. `review-and-refactor` skill → Code review
5. `/critical-thinking` → Challenge assumptions

### Chatbot AI Optimization Flow
1. `/chatbot-ai-optimizer Audit current prompt quality` → Prompt structure review
2. `chatbot-prompt-optimizer` skill → Tune system prompt, BIR form context, cost
3. `chatbot-sse-debugger` skill → Debug streaming, timeout, error handling
4. `/debug` → Deep-dive into identified issues
5. `/qa-subagent` → Verify response quality improvements
6. `doublecheck` skill → Verify AI output
