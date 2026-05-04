# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test               # lint + unit tests (run before committing)
npm run test:unit      # unit tests only (jest, matches *.unit.test.js)
npm run test:int       # integration tests against deployed AWS stack (STAGE=dev)
npm run test:e2e       # e2e tests against deployed AWS stack (STAGE=dev)
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npx cdk deploy         # deploy to AWS (defaults to dev stage)
npx cdk deploy -c stageName=prod   # deploy to a specific stage
```

To run a single test file:

```bash
npx jest path/to/test.file.js --config jest.config.js
```

The pre-commit hook runs `lint-staged` and `npm test` automatically.

## Architecture

This is a serverless AWS project using CDK (not Serverless Framework). The stack deploys a Lambda function behind an HTTP API Gateway (API Gateway v2).

**Infrastructure (`cdk/`)**

- `cdk/main.js` — CDK app entry point; reads `stageName` and `stableStageName` from CDK context, defaults to `dev`
- `cdk/constructs/my-stack.js` — defines the HTTP API + Lambda; uses `NodejsFunction` with esbuild bundling (minified); Lambda runtime is Node.js 24.x

**Application (`src/`)**

- Lambda handlers live in `src/`. Each handler is wrapped with Middy middleware (`@middy/core`).
- `@aws-lambda-powertools/logger` is used for structured logging. Log level is `DEBUG` for non-prod stages, `INFO` for prod. Set via `POWERTOOLS_LOG_LEVEL` env var.

**Test structure**
Tests are co-located in `test/` and matched by filename suffix:

| Suffix          | Config               | What it tests                                          |
| --------------- | -------------------- | ------------------------------------------------------ |
| `.unit.test.js` | `jest.config.js`     | Pure logic, no AWS calls                               |
| `.int.test.js`  | `jest.config.int.js` | Handler invoked in-process; may call real AWS services |
| `.e2e.test.js`  | `jest.config.e2e.js` | HTTP calls against the deployed API                    |

The e2e global setup (`test/common/jest.e2e.setup.js`) queries CloudFormation to discover the deployed stack's `HttpApiUrl` output and sets `process.env.API_URL`. Both int and e2e tests require a deployed stack and valid AWS credentials.

**Transforms**
All jest configs use `@swc/jest` for fast transpilation. The int config adds `transformIgnorePatterns` to handle Middy's ESM packages.

**ESLint rules of note**

- `max-params: warn` at 1 — prefer destructured object params
- `no-param-reassign: error` including props
- `no-only-tests/no-only-tests: error` — `.only` is banned in test files
