# Digby

Digby is the Angular frontend for VDJbase. It uses Angular CLI 22.

## Development

Use Node.js 22.22.3 or later in the 22.x series, 24.15 or later in the 24.x series, or 26.x. Install the JavaScript dependencies with `npm install`, then start the frontend:

```cmd
npm start
```

`angular-google-charts` does not yet declare Angular 22 support. A scoped npm
peer override permits the existing chart integration; remove it when a compatible
upstream release is available.

The development server is available at `http://localhost:4200/` and reloads when source files change. The app uses the Python Flask backend in the sibling `../digby_backend` repository, which must be running locally at `http://localhost:5000`.

## Build and unit tests

```cmd
npm run build
npm test
```

See [unit-tests.md](./unit-tests.md) for how unit tests are discovered, how
they handle backend data, what they cover, and how to run coverage.

In VS Code, select **TypeScript: Select TypeScript Version** and choose **Use Workspace Version** to use the project's Angular-compatible TypeScript version. If test globals are still reported as missing after reinstalling dependencies, run **TypeScript: Restart TS Server**.

The Angular native Vitest test builder is not used. The ESLint dependencies use
scoped minimatch overrides for a security fix; revisit them when the parent
packages support a patched version.

## End-to-end tests

See [e2e/README.md](./e2e/README.md) for test coverage, development-backend
data dependencies, and run instructions. The suite uses the backend's existing
database; it does not reset or seed data.

Run the end-to-end suite from the frontend repository after installing
Playwright's browser and starting the Flask backend:

```cmd
npm run test:e2e
```

Playwright starts the Angular development server at `http://127.0.0.1:4200`.
