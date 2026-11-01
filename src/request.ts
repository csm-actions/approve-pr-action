export type Request = {
  owner: string;
  repo: string;
  prNumber: number;
};

// GitHub owner and repository names consist of alphanumerics, "-", "_", and ".".
const validateName = (key: string, value: string): string => {
  if (!/^[A-Za-z0-9_.-]+$/.test(value) || /^\.+$/.test(value)) {
    throw new Error(`${key} is invalid: ${value}`);
  }
  return value;
};

/**
 * Parses a pull request number strictly.
 * Number() and parseInt() accept values such as "0x1A", "1e3", " 42 ",
 * and "123abc", so the format is checked first.
 */
export const parsePRNumber = (key: string, value: string): number => {
  const n = Number(value);
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(n)) {
    throw new Error(`${key} must be a positive integer, got ${value}`);
  }
  return n;
};

/**
 * Parses a label description in the format <owner>/<repo>/<pull request number>.
 */
export const parseLabelDescription = (description: string): Request => {
  const parts = description.split("/");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid label description format: ${description}. Expected format: owner/repo/pr_number`,
    );
  }
  return {
    owner: validateName(
      "the repository owner of the label description",
      parts[0],
    ),
    repo: validateName(
      "the repository name of the label description",
      parts[1],
    ),
    prNumber: parsePRNumber(
      "the pull request number of the label description",
      parts[2],
    ),
  };
};

const dispatchInputNames = [
  "repository_owner",
  "repository_name",
  "pull_request_number",
] as const;

/**
 * Reads the pull request from the inputs of a workflow_dispatch event, which
 * the client action sets.
 */
export const readDispatchInputs = (
  inputs: Record<string, unknown> | undefined,
): Request => {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of dispatchInputNames) {
    const value = inputs?.[name];
    if (typeof value !== "string" || !value) {
      missing.push(name);
      continue;
    }
    values[name] = value;
  }
  if (missing.length > 0) {
    throw new Error(
      `The workflow_dispatch event must have the inputs ${dispatchInputNames.join(", ")}. Missing: ${missing.join(", ")}`,
    );
  }
  return {
    owner: validateName("repository_owner", values.repository_owner),
    repo: validateName("repository_name", values.repository_name),
    prNumber: parsePRNumber("pull_request_number", values.pull_request_number),
  };
};

/**
 * Fails unless a workflow_dispatch event runs on the default branch.
 *
 * Unlike a label event, which always runs the workflow on the default branch,
 * workflow_dispatch lets the client choose any branch or tag of the server
 * repository, where an old and vulnerable server workflow may remain.
 * The default branch is read from the event payload, so no API call is needed.
 */
export const validateRef = (
  ref: string,
  defaultBranch: string | undefined,
): void => {
  if (!defaultBranch) {
    throw new Error(
      "The default branch of the server repository isn't found in the event payload",
    );
  }
  if (ref !== `refs/heads/${defaultBranch}`) {
    throw new Error(
      `The server workflow must run on the default branch ${defaultBranch}, but got ${ref}`,
    );
  }
};
