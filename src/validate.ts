import * as core from "@actions/core";
import * as github from "@actions/github";

export type ValidateInput = {
  octokit: ReturnType<typeof github.getOctokit>;
  owner: string;
  repo: string;
  pullRequestNumber: number;
  allowedCommitters: string[];
};

export type ValidateResult = {
  approved: boolean;
  lastSha: string;
};

type CommitNode = {
  commit: {
    oid: string;
    committer: {
      user: {
        login: string;
      } | null;
    };
    author: {
      user: {
        login: string;
      } | null;
    };
    signature: {
      isValid: boolean;
    } | null;
  };
};

type GraphQLResponse = {
  repository: {
    pullRequest: {
      commits: {
        totalCount: number;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: CommitNode[];
      };
    };
  };
};

const QUERY = `
  query($owner: String!, $repo: String!, $pr: Int!, $endCursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        commits(first: 100, after: $endCursor) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            commit {
              oid
              committer {
                user {
                  login
                }
              }
              author {
                user {
                  login
                }
              }
              signature {
                isValid
              }
            }
          }
        }
      }
    }
  }
`;

export const validate = async (input: ValidateInput): Promise<ValidateResult> => {
  const allowedSet = new Set(input.allowedCommitters);
  let endCursor: string | null = null;
  let approved = true;
  let lastSha = "";

  // Paginate through all commits
  while (true) {
    const response: GraphQLResponse = await input.octokit.graphql(QUERY, {
      owner: input.owner,
      repo: input.repo,
      pr: input.pullRequestNumber,
      endCursor: endCursor,
    });

    const commits = response.repository.pullRequest.commits;

    for (const node of commits.nodes) {
      const commit = node.commit;
      const oid = commit.oid;
      lastSha = oid;

      // Check signature
      if (!commit.signature || !commit.signature.isValid) {
        core.warning(`skip approval as commit signature is invalid: ${oid}`);
        approved = false;
        continue;
      }

      // Check committer/author is allowed
      const committer = commit.committer.user;
      const author = commit.author.user;

      if (committer) {
        if (!allowedSet.has(committer.login)) {
          core.warning(
            `skip approval as the committer isn't allowed: committer=${committer.login} sha=${oid}`,
          );
          approved = false;
        }
        continue;
      }

      if (!author) {
        core.warning(
          `skip approval as both committer and author are null: ${oid}`,
        );
        approved = false;
        continue;
      }

      if (!allowedSet.has(author.login)) {
        core.warning(
          `skip approval as the commit author isn't allowed: author=${author.login} sha=${oid}`,
        );
        approved = false;
      }
    }

    // Check if there are more pages
    if (!commits.pageInfo.hasNextPage) {
      break;
    }
    endCursor = commits.pageInfo.endCursor;
  }

  return { approved, lastSha };
};
