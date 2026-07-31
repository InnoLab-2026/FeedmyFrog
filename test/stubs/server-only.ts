// Test stub for the `server-only` package.
//
// The real `server-only` module throws when imported outside a React Server
// Component build, which would break unit tests that import server modules
// (env, session, validators, …) directly. Vitest aliases `server-only` to
// this empty module so those modules load in a plain Node test environment.
export {};
