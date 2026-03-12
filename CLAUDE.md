# Ride Prep

## Testing & Linting

After every code change, run the tests and linters:

```
npm test
npm run lint        # check for issues
npm run lint:fix    # auto-fix issues
```

There is also a browser-based test suite at `tests/tests.html` for visual verification.

## Commits

- Commit at logical stopping points — each commit should represent a coherent changeset
- Run `npm test` and `npm run lint` before every commit
- Run `npm run lint:fix` to auto-fix issues
- Keep commit messages concise: a title line, then a bulleted list (or grouped bulleted lists) in the body
- Avoid overly verbose messages and overly terse ones — aim for enough detail to understand the "why" at a glance via git blame

## Pull Requests

Use two main headers:

- **Problem** — concise explanation of what's being solved, fixed, or built. If user-facing, summarize the user/code-facing reason. If purely technical/internal, provide that detail instead.
- **Solution** — a concise summary of the approach (a sentence or three, then a bulleted list as needed). Can have multiple prose+bullets sections. Don't repeat the commit log — someone can read `git log` for that.
- **Technical Notes** (optional) — specific callouts worth highlighting. Only include when warranted.
