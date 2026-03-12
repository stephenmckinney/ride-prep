# Ride Prep

## Testing

After every code change, run the tests to validate the code works:

```
npm test
```

There is also a browser-based test suite at `tests/tests.html` for visual verification.

## Linting

```
npm run lint        # check for issues
npm run lint:fix    # auto-fix issues
```

## Commits

- Commit at logical stopping points — each commit should represent one feature, fix, or coherent changeset
- Run `npm test` and `npm run lint` before every commit
- Keep commit messages concise: a title line, then a bulleted list (or grouped bulleted lists) in the body
- Avoid overly terse messages ("Fix lint") and overly verbose ones — aim for enough detail to understand the "why" at a glance via git blame
