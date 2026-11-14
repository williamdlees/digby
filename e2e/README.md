# End-to-end tests

The Playwright suite exercises the running Angular application against the local
Flask development backend and its existing database. It does not reset or seed
backend data. Most checks discover a gene, variant, or dataset from the page and
then reuse that value, rather than asserting a particular name or count. The
suite nevertheless requires some specific catalogue entries and non-empty
results.

## Backend data dependencies

The suite expects:

- The backend to respond successfully at
  `http://localhost:5000/api/system/config`.
- A `Human` species entry, including at least one curated-data locus. The home
  search also expects a query for `IGH` to return a result containing `IGH`.
- The route-rendering test opens `/genebrowser/Human/IGH` and
  `/reference_book/Human`, but only asserts that their components render; it
  does not assert a particular genomic or reference-book record.
- Human `IGH` guQTL data with a summary, a gene scan with at least one lead
  variant, and pairing scans with variants in both `P(J|D)` and `P(D|J)`
  directions.
- Human `IGK` guQTL data. One test searches for a variant discovered in the
  Human `IGH` data while `IGK` is selected, exercising cross-locus lookup.

Tests for the repertoire gene table also require Human to have at least one
gene row. These tests read the first row's gene name and use it for the filter
and search checks. The curated-download test similarly selects the first
available locus rather than requiring a particular dataset.

The internal-link test visits every application route, collects same-origin
frontend and backend links found on those pages, and checks that their HTTP
responses succeed. Links exposed by loaded data therefore need to be valid.
Changes to individual study, sample, gene, or variant values are generally
safe; removing the required species/loci, or leaving a required result set
empty, can break the tests.

## What is and is not asserted

The QTL tests use the first available gene and lead variant, then verify the
summary-to-scan-to-variant navigation, URL restoration, variant lookup, and
pairing-direction changes. They do not pin a specific gene name, variant ID,
study name, result count, or p-value. Negative searches use deliberately
unmatched strings, and the downloads workflow uses the first available locus.

The suite checks that routes render, internal links work, and selected
workflows complete. It does not validate external links or the numerical
accuracy of chart rendering.

## Run the suite

Install frontend dependencies, start the Flask backend from the sibling
`digby_backend` repository, and install Playwright's Chromium browser once:

```cmd
npm install
npx playwright install chromium
```

In a separate command window, start the backend:

```cmd
cd ..\digby_backend
flask run
```

In the Digby frontend repository:

```cmd
npm run test:e2e
```

Playwright starts the Angular development server at
`http://127.0.0.1:4200`. The global setup checks backend availability before
running tests.
