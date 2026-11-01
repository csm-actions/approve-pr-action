import { describe, it, expect } from "vitest";
import { parseLabelDescription } from "./server";

describe("parseLabelDescription", () => {
  it("parses a label description", () => {
    expect(parseLabelDescription("example/client/123")).toEqual({
      owner: "example",
      repo: "client",
      prNumber: 123,
    });
  });

  it("fails unless the description has three elements", () => {
    for (const d of ["example/client", "example/client/123/456"]) {
      expect(() => parseLabelDescription(d)).toThrowError(
        "Invalid label description format",
      );
    }
  });

  // The current behavior: the pull request number isn't validated.
  it("doesn't validate the pull request number", () => {
    expect(parseLabelDescription("example/client/abc").prNumber).toBeNaN();
  });
});
