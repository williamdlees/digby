# Digby

Digby is the Angular frontend for VDJbase. It uses Angular CLI 20.

## Development

Use Node.js 20.19 or later in the 20.x series, 22.12 or later in the 22.x series, or 24.x. Install the JavaScript dependencies with `npm install`, then start the frontend:

```cmd
npm start
```

The development server is available at `http://localhost:4200/` and reloads when source files change. The app uses the Python Flask backend in the sibling `../digby_backend` repository, which must be running locally at `http://localhost:5000`.

## Build and unit tests

```cmd
npm run build
npm test
```

Unit tests run with Vitest and jsdom; they mock backend calls and do not require Flask. Use `npm run test:watch` while developing and `npm run test:coverage` to generate text and LCOV reports.

Coverage includes application TypeScript under `src/app` and the maintained refbook client; other generated client code, unit specs and bootstrap/configuration files outside that scope are excluded. The coverage command enforces 80% for statements, branches, functions and lines.

The GitHub Actions unit-test workflow uses Node.js 22, type-checks the specs and runs the same coverage gate without a backend.

## End-to-end tests

The Playwright suite covers direct route loading, internal links and their HTTP responses, common search/selection workflows, and desktop/mobile navigation. It uses the local backend and its existing database; it does not reset or seed data. External links and chart rendering are not tested.

Prerequisites:

- A Node.js version supported by Angular 20, as listed above.
- The frontend dependencies installed with `npm install`.
- The Flask backend running from `../digby_backend`, typically in its configured Python environment:

  ```cmd
  cd ..\digby_backend
  flask run
  ```

  Confirm that `http://localhost:5000/api/system/config` responds before starting the suite.
- Playwright's Chromium browser installed once:

  ```cmd
  npx playwright install chromium
  ```

Run the end-to-end suite from the frontend repository:

```cmd
npm run test:e2e
```

Playwright starts the Angular development server at `http://127.0.0.1:4200` and shuts down the instance it starts after the tests. If the backend health check fails, start Flask in the sibling backend repository and retry.
