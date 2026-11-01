# Approve PR Action

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/csm-actions/approve-pr-action)
[Versioning Policy](https://github.com/suzuki-shunsuke/versioning-policy/blob/main/POLICY.md) | [action.yaml](action.yaml)

`Approve PR Action` is a GitHub Action to approve pull requests securely by [the Client/Server Model](https://github.com/csm-actions/docs).

Approve PR Action allows you to approve pull requests by Machine Users securely without sharing Machine Users' Personal Access Tokens (PAT) across GitHub Actions workflows.
It elevates the security of your workflows to the next level.

## Features

- 💪 Approve pull requests to merge pull requests automatically
- 🛡 Secure
  - You don't need to pass PAT of machine users to GitHub Actions workflows on the client side
- 😊 Easy to use
  - You don't need to host a server application

## Overview

It would be convenient to automatically merge pull requests created by apps like Renovate.
Manually reviewing and merging all of them can be time-consuming and labor-intensive.
Tedious reviews can sometimes become mere formalities.
This can lead to delayed updates and potentially troublesome issues.

Of course, automatic merging comes with its own risks, but if the benefits of automation outweigh those risks, it’s a good idea to automatically merge at least some updates—excluding major updates, for example.

But if approvals from codeowners are required by Branch Rulesets, you need to approve pull requests automatically.
GitHub Apps can't be codeowners, so you need to approve pull requests using machine user's PAT.
But if the PAT is abused, people can approve any pull requests using it and merge them without pull request reviews.
It's so dangerous.
So you must protect machine user's PAT securely.
You shouldn't pass it to workflows widely.

This action allows you to protect PAT by [the Client/Server Model](https://github.com/csm-actions/docs).

This action intends to approve only pull requests created by reliable Apps automatically.
This action doesn't approve pull requests unless they don't meet the following conditions:

1. All commits are linked to GitHub Users
1. All commits are signed
1. All committers or authors are allowed in the input `allowed_committers` (By default, `allowed_committers` are `renovate[bot]` and `dependabot[bot]`)

## How To Set Up

- Create a server repository
- Create a server GitHub App:
  - Required Permissions: `pull_requests:read` and `contents:read` To validate pull requests
  - Installed Repositories: client and server repositories
- Create a fine-grained PAT of a machine user
  - Required Permissions:
    - `pull_requests:write`: To approve pull requests
  - Repositories: client repositories
- [Allow the server workflow to access the PAT securely](https://github.com/csm-actions/docs?tab=readme-ov-file#secret-management)
- Create the server workflow: [Example](https://github.com/csm-actions/demo-server/blob/main/.github/workflows/approve_dispatch.yaml)
- Create a client GitHub App:
  - Required Permissions: `actions:write` To run the server workflow by `workflow_dispatch`
  - Installed Repositories: only the server repository
    - You don't need to install it into client repositories, because client workflows run the server workflow only in the server repository
- Run the client action in client workflows with `server_workflow_ref`: [Example](https://github.com/csm-actions/demo-client/blob/main/.github/workflows/approve.yaml)

## How to trigger the server workflow

There are two ways to trigger the server workflow:

- `workflow_dispatch` (v1.1.0): The client workflow runs the server workflow by [the workflow_dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event). The Client GitHub App requires `actions:write`. Set the input `server_workflow_ref` to use this
- label: The client workflow creates an issue label in the server repository, and the server workflow is triggered by the `label:created` event. The Client GitHub App requires `issues:write`. Set the input `server_repository_name` to use this

We recommend `workflow_dispatch`:

- No label needs to be created just to trigger the server workflow
- The client action outputs a link to the server workflow run
- Parameters are passed as workflow inputs instead of a label description

The Client GitHub App is installed into only the server repository, so `actions:write` is limited to the server repository.
[But `actions:write` allows more than running workflows, and the server workflow must run only on the default branch.](#workflow_dispatch-and-actionswrite)

If you use labels now, see [the migration guide](docs/migrate-to-workflow-dispatch.md).

> [!NOTE]
> We don't use `repository_dispatch` because creating a repository_dispatch event requires `contents:write`.
> `contents:write` of the server repository would let clients rewrite the server workflow.

## Security

### workflow_dispatch and actions:write

`actions:write` of the server repository doesn't allow clients to change the server repository's code or read secrets, so the risk is much lower than granting `contents:write` to clients.
But it allows more than running workflows:

- Disable and enable workflows (DoS of the server workflow)
- Cancel and re-run workflow runs
- Delete workflow runs and logs
- Delete artifacts and caches

The private key of the Client GitHub App is shared widely, so anyone who can write to a client repository should be assumed to be able to do these.
We consider these acceptable as long as secrets, especially the PAT to approve pull requests, are available only on the default branch of the server repository and the default branch is protected properly.

#### Run the server workflow only on the default branch

A label event always runs the workflow on the default branch, but `workflow_dispatch` lets clients choose any branch or tag of the server repository.
If an old branch or tag has a vulnerable server workflow, it could be run.

- The server action fails if the event is `workflow_dispatch` and `github.ref` isn't the default branch. Note that this check runs in the workflow on the dispatched ref, so it doesn't protect a branch or tag whose workflow uses an older action or doesn't use the action at all. The following measures are enforced outside the workflow, so use them too
- Restrict the deployment branches of the environment to the default branch
- If secrets are managed in AWS (e.g. the private key in AWS KMS), restrict the access by OIDC claims. When the job uses an environment, the `sub` claim doesn't include the ref, so customize the subject claim to include `job_workflow_ref`, for instance

#### Re-run

`actions:write` allows re-running server workflow runs.
A re-run uses the workflow at the same commit as the original run, and both the deployment branch policy of the environment and `job_workflow_ref` see only the branch name.
So even after a vulnerability of the server workflow is fixed, re-running a run from before the fix runs the old workflow (re-runs are allowed within 30 days).
When you fix a vulnerability of the server workflow, delete the server workflow runs from before the fix.

Re-running an old server run also approves the pull request again only if it still passes the validation, because the server action validates the pull request every time.

## Private keys in AWS KMS

A GitHub App private key in GitHub Secrets never expires, so anyone who obtains
it can generate installation access tokens indefinitely. Importing the key into
AWS KMS removes that path: the key can never be exported, and only the JSON Web
Token signing is delegated to it.

Set `aws_kms_key_id` instead of `app_private_key`. Passing it as a key ARN is
enough, since an ARN carries its region; for an alias or a bare key id, set
`aws_region`, or set `AWS_REGION`.

Set `aws_role_to_assume` and this action assumes the IAM role itself with the
GitHub OIDC token. The AWS credentials then stay inside the action and are never
exported, so later steps of the job can't see them.

Leaving `aws_role_to_assume` unset reads the credentials from
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`, which is
what `aws-actions/configure-aws-credentials` exports, so running that action
first works as well. Those environment variables are the only other source: a
profile in `~/.aws/credentials`, IMDS on a self-hosted EC2 runner and the
credentials of an ECS or EKS task are not read, so reach for
`aws-actions/configure-aws-credentials` to use any of them.

```yaml
permissions:
  id-token: write # Required to assume the AWS IAM role via OIDC
  contents: read

steps:
  - uses: csm-actions/approve-pr-action@a8fdc60ab4d9b446694140534bbcc71c29fb499c # v1.0.0
    with:
      client_id: ${{vars.APP_CLIENT_ID}}
      aws_kms_key_id: ${{vars.KMS_KEY_ID}}
      aws_role_to_assume: ${{vars.ROLE_TO_ASSUME}}
```

The app can be identified by either `client_id` or `app_id`. `client_id` takes
precedence when both are set.
