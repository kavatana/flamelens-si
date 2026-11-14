import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // The database client needs an address to be built. These tests never connect to it.
    env: { DATABASE_URL: "postgres://localhost:5432/flamelens_not_used_by_tests" },
  },
});
