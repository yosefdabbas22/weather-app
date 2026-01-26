# Contributing to Weather App

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Git Workflow

### Branching Strategy

We follow a feature branch workflow:

- **`main`** - Production-ready code
- **`feature/*`** - New features (e.g., `feature/geolocation`)
- **`fix/*`** - Bug fixes (e.g., `fix/search-debounce`)
- **`docs/*`** - Documentation updates (e.g., `docs/readme-update`)
- **`refactor/*`** - Code refactoring (e.g., `refactor/api-routes`)

### Creating a Branch

```bash
# For a new feature
git checkout -b feature/your-feature-name

# For a bug fix
git checkout -b fix/your-bug-fix-name
```

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit messages:

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ui`: UI/UX changes

**Examples:**
```bash
feat(geolocation): add use my location button

- Implement geolocation API integration
- Add location permission handling
- Update API route to support coordinates

Closes #123

---

fix(search): debounce search input to prevent excessive API calls

- Add useDebounce hook
- Update SearchBar component
- Reduce API call frequency by 80%

Fixes #456

---

docs(readme): update installation instructions

- Add Node.js version requirement
- Include environment variable setup
```

### Pull Request Process

1. **Create an Issue** (for features/bugs) or reference existing issue
2. **Create a Branch** following naming conventions
3. **Make Changes** with clear, atomic commits
4. **Write Tests** (if applicable)
5. **Update Documentation** (if needed)
6. **Create Pull Request** with:
   - Clear title following Conventional Commits
   - Description of changes
   - Link to related issue
   - Screenshots (for UI changes)
   - Checklist items completed

### Code Review Guidelines

**For Authors:**
- Keep PRs focused and small when possible
- Respond to review comments promptly
- Update PR based on feedback

**For Reviewers:**
- Be constructive and respectful
- Focus on code quality and maintainability
- Test the changes locally if possible
- Approve when ready or request changes with clear feedback

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Make your changes
5. Run linter: `npm run lint`
6. Format code: `npm run format`

## Code Standards

- **TypeScript**: All components must be typed
- **ESLint**: Follow project ESLint rules
- **Prettier**: Code is auto-formatted with Prettier
- **Accessibility**: Follow WCAG 2.1 AA standards
- **Performance**: Optimize for performance and avoid unnecessary re-renders

## Testing

- Test your changes manually
- Verify accessibility with keyboard navigation
- Test on different screen sizes
- Check error handling

## Questions?

Feel free to open an issue for questions or clarifications!
