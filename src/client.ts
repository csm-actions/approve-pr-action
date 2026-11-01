import * as core from "@actions/core";
import * as github from "@actions/github";
import * as dispatch from "@csm-actions/dispatch";
import * as label from "@csm-actions/label";
import { parseAllowedCommitters, validate } from "./validate";
import { newAppOctokit } from "./app_octokit";
import { parsePRNumber } from "./request";

export const action = async () => {
  const serverRepositoryName = core.getInput("server_repository_name");
  const serverWorkflowRef = core.getInput("server_workflow_ref");
  if (!serverRepositoryName && !serverWorkflowRef) {
    throw new Error(
      "Either server_repository_name or server_workflow_ref is required",
    );
  }
  const serverRepositoryOwner =
    core.getInput("server_repository_owner") || github.context.repo.owner;
  const owner = core.getInput("repository_owner") || github.context.repo.owner;
  const repo = core.getInput("repository_name") || github.context.repo.repo;
  const pullRequestNumber = parsePRNumber(
    "pull_request_number",
    core.getInput("pull_request_number", { required: true }),
  );
  // Validate the workflow ref before validating the pull request.
  const workflowRef = serverWorkflowRef
    ? parseServerWorkflowRef(
        serverWorkflowRef,
        serverRepositoryOwner,
        serverRepositoryName,
      )
    : undefined;
  const githubToken = core.getInput("github_token", { required: true });

  const allowedCommitters = parseAllowedCommitters(
    core.getInput("allowed_committers"),
  );

  // Validate PR using the provided github_token
  const octokit = github.getOctokit(githubToken);
  const result = await validate({
    octokit,
    owner,
    repo,
    pullRequestNumber,
    allowedCommitters,
  });

  if (!result.approved) {
    core.info(
      "PR validation failed, skipping the request to the server workflow",
    );
    return;
  }

  if (workflowRef) {
    // Run the server workflow by a workflow_dispatch event
    await dispatch.dispatch({
      appOctokit: newAppOctokit(),
      workflowRef,
      inputs: {
        repository_owner: owner,
        repository_name: repo,
        pull_request_number: `${pullRequestNumber}`,
      },
    });
    core.notice(
      `PR will be approved: ${github.context.serverUrl}/${owner}/${repo}/pull/${pullRequestNumber}`,
    );
    return;
  }

  // Create label in server repository to trigger server workflow
  const labelName = label.newName("approve-pr-");
  const description = `${owner}/${repo}/${pullRequestNumber}`;

  core.info(
    `creating a label: ${JSON.stringify({
      owner: serverRepositoryOwner,
      repo: serverRepositoryName,
      label: {
        name: labelName,
        description: description,
      },
    })}`,
  );

  await label.create({
    appOctokit: newAppOctokit(),
    owner: serverRepositoryOwner,
    repo: serverRepositoryName,
    name: labelName,
    description: description,
  });

  core.notice(
    `PR will be approved. Please check the server workflow: ${github.context.serverUrl}/${serverRepositoryOwner}/${serverRepositoryName}/actions`,
  );
};

/**
 * Parses server_workflow_ref, and checks that it points to the same repository
 * as server_repository_owner and server_repository_name if
 * server_repository_name is set.
 */
export const parseServerWorkflowRef = (
  serverWorkflowRef: string,
  serverRepositoryOwner: string,
  serverRepositoryName: string,
): dispatch.WorkflowRef => {
  // Add the input names to the errors of the library, which doesn't know them.
  let workflowRef: dispatch.WorkflowRef;
  try {
    workflowRef = dispatch.parseWorkflowRef(serverWorkflowRef);
  } catch (error) {
    throw new Error(`server_workflow_ref is invalid: ${message(error)}`, {
      cause: error,
    });
  }
  if (serverRepositoryName) {
    try {
      dispatch.validateRepository(
        workflowRef,
        serverRepositoryOwner,
        serverRepositoryName,
      );
    } catch (error) {
      throw new Error(
        `server_repository_owner, server_repository_name, and server_workflow_ref must point to the same repository: ${message(error)}`,
        { cause: error },
      );
    }
  }
  return workflowRef;
};

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
