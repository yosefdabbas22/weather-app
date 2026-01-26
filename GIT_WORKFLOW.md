# Git Workflow Guide

This document outlines the Git workflow and conventions for the Weather App project.

## Branching Strategy

### Branch Types

1. **`main`** - Production branch
   - Always deployable
   - Protected branch (requires PR)
   - Only merged from feature/fix branches

2. **`feature/*`** - New features
   - Example: `feature/geolocation-api`
   - Example: `feature/recent-searches`

3. **`fix/*`** - Bug fixes
   - Example: `fix/search-debounce`
   - Example: `fix/accessibility-issues`

4. **`docs/*`** - Documentation
   - Example: `docs/api-documentation`
   - Example: `docs/contributing-guide`

5. **`refactor/*`** - Code refactoring
   - Example: `refactor/component-structure`
   - Example: `refactor/api-routes`

## Conventional Commits

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(geolocation): add use my location button` |
| `fix` | Bug fix | `fix(search): debounce input to prevent API spam` |
| `docs` | Documentation | `docs(readme): update installation steps` |
| `style` | Formatting | `style(components): format with prettier` |
| `refactor` | Code refactoring | `refactor(hooks): extract geolocation logic` |
| `perf` | Performance | `perf(api): add response caching` |
| `test` | Tests | `test(utils): add temperature conversion tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `ui` | UI changes | `ui(forecast): update dark theme colors` |

### Scope (Optional)

The scope should be the area of the codebase affected:
- Component name: `feat(searchbar): add debouncing`
- Feature area: `fix(geolocation): handle permission denied`
- File/Module: `refactor(api): restructure weather route`

### Examples

**Simple commit:**
```bash
git commit -m "feat(geolocation): add use my location button"
```

**Commit with body:**
```bash
git commit -m "fix(search): debounce input to prevent excessive API calls

- Add useDebounce custom hook
- Update SearchBar component
- Reduce API calls by 80%

Fixes #123"
```

**Breaking change:**
```bash
git commit -m "feat(api): change weather response structure

BREAKING CHANGE: Weather response now includes timezone field"
```

## Pull Request Workflow

### 1. Create an Issue
- Describe the feature or bug
- Use appropriate labels
- Reference in PR

### 2. Create a Branch
```bash
# For features
git checkout -b feature/your-feature-name

# For fixes
git checkout -b fix/your-fix-name
```

### 3. Make Changes
- Write clear, focused commits
- Follow code style guidelines
- Test your changes

### 4. Create Pull Request
- Use descriptive title (follow Conventional Commits)
- Fill out PR template
- Link related issues
- Add screenshots for UI changes
- Request review

### 5. Code Review
- Address review comments
- Make requested changes
- Re-request review when ready

### 6. Merge
- Squash and merge (preferred for feature branches)
- Delete branch after merge

## Example Workflow

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/geolocation-api

# 3. Make changes and commit
git add .
git commit -m "feat(geolocation): add use my location button"

# 4. Push branch
git push origin feature/geolocation-api

# 5. Create PR on GitHub
# 6. After merge, clean up
git checkout main
git pull origin main
git branch -d feature/geolocation-api
```

## Best Practices

1. **Keep commits atomic** - One logical change per commit
2. **Write clear messages** - Future you will thank you
3. **Pull before push** - Always sync with remote
4. **Review your own code** - Check diff before PR
5. **Test before commit** - Don't commit broken code
6. **Use meaningful branch names** - Clear and descriptive

## Common Commands

```bash
# Check current branch
git branch

# See commit history
git log --oneline

# See changes
git status
git diff

# Stash changes
git stash
git stash pop

# Update from remote
git fetch origin
git pull origin main
```
