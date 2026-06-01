// Server test setup - wraps vitest with matchers
import { beforeAll, afterAll } from "vitest";

// Set dev mode to avoid Clerk auth requirements
process.env.NODE_ENV = "development";
process.env.DATABASE_PATH = ":memory:";

beforeAll(() => {
  // Silence console logs during tests unless a test fails
  console.log = () => {};
  console.error = () => {};
});

afterAll(() => {
  // Restore console
  console.log = console.log;
  console.error = console.error;
});
