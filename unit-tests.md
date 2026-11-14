# Unit tests

Unit tests run with Vitest, using the Angular integration from
`@analogjs/vitest-angular` and a jsdom browser environment. Vitest discovers
`*.spec.ts` files under `src/` and `projects/`; most application specs live
alongside the code in `src/app`, and the maintained reference-book API client
has a spec under `projects/digby-swagger-client`.

The shared setup in `src/test-setup.ts` initializes Angular's testing
environment. Tests use Angular `TestBed` where needed, along with Vitest mocks
and local fixtures. Backend-facing services are generally replaced with
in-memory mock providers that return controlled values or errors. The
reference-book API client tests use Angular's HTTP testing controller to
inspect requests and supply responses. No unit test needs the Flask backend or
its database.

## What the tests cover

The specs cover focused behavior across application components, services, and
utilities, including:

- Route and component state, selection, filtering, and navigation behavior.
- QTL and reference-book dashboards, plots, and drill-down interactions using
  fixture data.
- Data-source failures, empty results, loading state, and fallback behavior.
- Authentication and request handling.
- Table filters, sorting, resizing, sequence helpers, and report parameters.
- API request paths, query parameters, encoding, validation, and error
  propagation in the maintained reference-book client.

Fixture values such as `Human`, `IGH`, or sample gene and variant names describe
the scenario being tested. They do not assert that those species, datasets, or
records exist in the development backend. When changing a behavior, update its
fixture and expected result in the corresponding spec.

## Run and measure

```cmd
npm test
npm run test:watch
npm run test:coverage
```

Coverage includes TypeScript under `src/app` and
`projects/digby-swagger-client/api/refbook.service.ts`. Specs and other
generated client code, bootstrap, and configuration files are excluded. The
coverage run enforces 80% for statements, branches, functions, and lines.
GitHub Actions type-checks the specs and runs the same coverage gate without
starting a backend.
