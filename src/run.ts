import * as core from "@actions/core";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";
import * as client from "./client";
import * as server from "./server";

const revoke = async (token: string, expiresAt: string) => {
  if (!token) {
    return;
  }
  if (expiresAt && githubAppToken.hasExpired(expiresAt)) {
    core.info("GitHub App token has already expired");
    return;
  }
  core.info("Revoking GitHub App token");
  return githubAppToken.revoke(token);
};

export const main = async () => {
  // Post phase: revoke token if already ran
  if (core.getState("post")) {
    await revoke(core.getState("token"), core.getState("expires_at"));
    return;
  }
  core.saveState("post", "true");

  // Route based on server_repository_name and server_workflow_ref inputs
  // If either is present: client mode (validate and send a request)
  // Otherwise: server mode (read the request, validate, approve)
  if (
    core.getInput("server_repository_name") ||
    core.getInput("server_workflow_ref")
  ) {
    await client.action();
  } else {
    await server.action();
  }
};
