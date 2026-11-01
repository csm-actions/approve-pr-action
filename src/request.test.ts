import { describe, it, expect } from "vitest";
import {
  parseLabelDescription,
  parsePRNumber,
  readDispatchInputs,
  validateRef,
} from "./request";

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

  it("fails if the pull request number isn't a positive integer", () => {
    for (const n of ["abc", "0", "-1", "1.5", "0x1A", "1e3", " 42 ", "12abc"]) {
      expect(() => parseLabelDescription(`example/client/${n}`)).toThrowError(
        "the pull request number of the label description must be a positive integer",
      );
    }
  });

  it("fails if the owner or name is invalid", () => {
    expect(() => parseLabelDescription("exa mple/client/1")).toThrowError(
      "the repository owner of the label description is invalid",
    );
    expect(() => parseLabelDescription("example/../1")).toThrowError(
      "the repository name of the label description is invalid",
    );
  });
});

describe("parsePRNumber", () => {
  it("parses a positive integer", () => {
    expect(parsePRNumber("pull_request_number", "42")).toBe(42);
  });

  it("fails for other values", () => {
    expect(() => parsePRNumber("pull_request_number", "")).toThrowError(
      "pull_request_number must be a positive integer",
    );
  });
});

describe("readDispatchInputs", () => {
  const inputs = {
    repository_owner: "example",
    repository_name: "client",
    pull_request_number: "123",
  };

  it("reads the inputs", () => {
    expect(readDispatchInputs(inputs)).toEqual({
      owner: "example",
      repo: "client",
      prNumber: 123,
    });
  });

  it("fails if inputs are missing", () => {
    expect(() =>
      readDispatchInputs({ repository_owner: "example" }),
    ).toThrowError("Missing: repository_name, pull_request_number");
    expect(() => readDispatchInputs(undefined)).toThrowError(
      "Missing: repository_owner, repository_name, pull_request_number",
    );
  });

  it("fails if values are invalid", () => {
    expect(() =>
      readDispatchInputs({ ...inputs, pull_request_number: "0x1A" }),
    ).toThrowError("pull_request_number must be a positive integer");
    expect(() =>
      readDispatchInputs({ ...inputs, repository_name: "client/other" }),
    ).toThrowError("repository_name is invalid");
  });
});

describe("validateRef", () => {
  it("accepts the default branch", () => {
    expect(() => validateRef("refs/heads/main", "main")).not.toThrow();
  });

  it("rejects other branches and tags", () => {
    for (const ref of ["refs/heads/feature", "refs/tags/v1.0.0", "main"]) {
      expect(() => validateRef(ref, "main")).toThrowError(
        "The server workflow must run on the default branch main",
      );
    }
  });

  it("fails if the default branch is unknown", () => {
    expect(() => validateRef("refs/heads/main", undefined)).toThrowError(
      "The default branch of the server repository isn't found",
    );
  });
});
