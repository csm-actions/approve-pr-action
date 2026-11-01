import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as github from "@actions/github";
import * as core from "@actions/core";
import { parseAllowedCommitters, validate } from "./validate";

vi.mock("@actions/core", () => ({ warning: vi.fn() }));

type Octokit = ReturnType<typeof github.getOctokit>;

type Commit = {
  oid: string;
  committer?: string | null;
  author?: string | null;
  signed?: boolean | null;
};

const node = (c: Commit) => ({
  commit: {
    oid: c.oid,
    committer: { user: c.committer ? { login: c.committer } : null },
    author: { user: c.author ? { login: c.author } : null },
    signature: c.signed === null ? null : { isValid: c.signed ?? true },
  },
});

// A fake Octokit whose graphql returns the given pages of commits.
const newOctokit = (pages: Commit[][]) => {
  const graphql = vi.fn();
  pages.forEach((commits, i) => {
    graphql.mockResolvedValueOnce({
      repository: {
        pullRequest: {
          commits: {
            totalCount: pages.flat().length,
            pageInfo: {
              hasNextPage: i < pages.length - 1,
              endCursor: i < pages.length - 1 ? `cursor-${i}` : null,
            },
            nodes: commits.map(node),
          },
        },
      },
    });
  });
  return { octokit: { graphql } as unknown as Octokit, graphql };
};

const run = (pages: Commit[][]) => {
  const { octokit, graphql } = newOctokit(pages);
  return {
    graphql,
    result: validate({
      octokit,
      owner: "example",
      repo: "client",
      pullRequestNumber: 1,
      allowedCommitters: ["renovate[bot]"],
    }),
  };
};

beforeEach(() => {
  vi.mocked(core.warning).mockClear();
});

describe("parseAllowedCommitters", () => {
  it("defaults to renovate[bot] and dependabot[bot]", () => {
    expect(parseAllowedCommitters("")).toEqual([
      "renovate[bot]",
      "dependabot[bot]",
    ]);
    expect(parseAllowedCommitters("  \n ")).toEqual([
      "renovate[bot]",
      "dependabot[bot]",
    ]);
  });

  it("parses committers separated by newlines", () => {
    expect(parseAllowedCommitters(" foo \n\nbar[bot]\n")).toEqual([
      "foo",
      "bar[bot]",
    ]);
  });
});

describe("validate", () => {
  it("approves commits signed and committed by allowed users", async () => {
    const { result } = run([
      [
        { oid: "a", committer: "renovate[bot]" },
        { oid: "b", committer: "renovate[bot]", author: "someone" },
      ],
    ]);
    expect(await result).toEqual({ approved: true, lastSha: "b" });
    expect(core.warning).not.toHaveBeenCalled();
  });

  it("checks the author if the committer isn't linked to a user", async () => {
    const { result } = run([[{ oid: "a", author: "renovate[bot]" }]]);
    expect(await result).toEqual({ approved: true, lastSha: "a" });
  });

  it("rejects an unsigned or invalidly signed commit", async () => {
    for (const signed of [null, false]) {
      const { result } = run([
        [{ oid: "a", committer: "renovate[bot]", signed }],
      ]);
      expect(await result).toEqual({ approved: false, lastSha: "a" });
    }
    expect(core.warning).toHaveBeenCalledWith(
      "skip approval as commit signature is invalid: a",
    );
  });

  it("rejects a committer who isn't allowed, even if the author is", async () => {
    const { result } = run([
      [{ oid: "a", committer: "someone", author: "renovate[bot]" }],
    ]);
    expect(await result).toEqual({ approved: false, lastSha: "a" });
  });

  it("rejects an author who isn't allowed", async () => {
    const { result } = run([[{ oid: "a", author: "someone" }]]);
    expect(await result).toEqual({ approved: false, lastSha: "a" });
  });

  it("rejects a commit linked to no user", async () => {
    const { result } = run([[{ oid: "a" }]]);
    expect(await result).toEqual({ approved: false, lastSha: "a" });
    expect(core.warning).toHaveBeenCalledWith(
      "skip approval as both committer and author are null: a",
    );
  });

  it("checks commits in all pages and returns the last SHA", async () => {
    const { result, graphql } = run([
      [{ oid: "a", committer: "renovate[bot]" }],
      [{ oid: "b", committer: "someone" }],
    ]);
    expect(await result).toEqual({ approved: false, lastSha: "b" });
    expect(graphql).toHaveBeenCalledTimes(2);
    expect(graphql.mock.calls[1][1]).toMatchObject({ endCursor: "cursor-0" });
  });
});
