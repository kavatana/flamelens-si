import { describe, expect, it } from "vitest";
import { READS, app } from "./app";

/** These tests stop at the door: they check what the API refuses, which needs no database. */
describe("the API", () => {
  it("says it is up", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("answers an unknown path with a 404 in JSON", async () => {
    const response = await app.request("/nowhere");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found." });
  });

  it("refuses a read that is not in its list", async () => {
    expect((await app.request("/v1/passwords")).status).toBe(404);
    // Names every object has must not be mistaken for reads.
    expect((await app.request("/v1/constructor")).status).toBe(404);
    expect((await app.request("/v1/toString")).status).toBe(404);
  });

  it("refuses an investigation id that is not one, before looking anything up", async () => {
    expect((await app.request("/v1/investigations/drop%20table")).status).toBe(404);
    expect((await app.request("/v1/investigations/PSI-x/variation")).status).toBe(404);
  });

  it("refuses a record id that is not one", async () => {
    const response = await app.request("/v1/record?id=1%3B%20drop%20table%20record");
    expect(response.status).toBe(400);
  });

  it("refuses an export format it does not have", async () => {
    expect((await app.request("/v1/export?format=xml")).status).toBe(400);
  });

  it("refuses a question that is empty or not JSON", async () => {
    const empty = await app.request("/v1/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: " " }) });
    expect(empty.status).toBe(400);
    const notJson = await app.request("/v1/ask", { method: "POST", body: "hello" });
    expect(notJson.status).toBe(400);
  });

  it("refuses a video id that is not one, before looking anything up or asking NASA", async () => {
    expect((await app.request("/v1/footage?id=..%2F..%2Fetc&view=main")).status).toBe(400);
    expect((await app.request("/v1/footage?view=main")).status).toBe(400);
  });

  it("refuses feedback that is not in its shape", async () => {
    const response = await app.request("/v1/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "analysis", rating: "up", page: "/explore" }) });
    expect(response.status).toBe(400);
  });

  it("names its reads in lower case with dashes, as they appear in the address", () => {
    for (const name of Object.keys(READS)) expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});
