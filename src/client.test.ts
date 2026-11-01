import { describe, it, expect } from "vitest";
import { parseServerWorkflowRef } from "./client";

describe("parseServerWorkflowRef", () => {
  const ref = "my-org/server/.github/workflows/approve.yaml@main";

  it("parses a workflow ref", () => {
    expect(parseServerWorkflowRef(ref, "other-org", "")).toEqual({
      owner: "my-org",
      repo: "server",
      workflow: "approve.yaml",
      ref: "main",
    });
  });

  it("accepts the same repository case-insensitively", () => {
    expect(parseServerWorkflowRef(ref, "My-Org", "Server").repo).toBe("server");
  });

  it("fails if the repository doesn't match", () => {
    for (const [owner, name] of [
      ["my-org", "other"],
      ["other-org", "server"],
    ]) {
      expect(() => parseServerWorkflowRef(ref, owner, name)).toThrowError(
        "server_repository_owner, server_repository_name, and server_workflow_ref must point to the same repository",
      );
    }
  });

  it("fails if the workflow ref is invalid", () => {
    for (const s of [
      "my-org/server",
      "my-org/server/approve.yaml@main",
      "my-org/server/.github/workflows/approve.yaml@0123456789abcdef0123456789abcdef01234567",
    ]) {
      expect(() => parseServerWorkflowRef(s, "my-org", "")).toThrowError(
        "server_workflow_ref is invalid",
      );
    }
  });
});
