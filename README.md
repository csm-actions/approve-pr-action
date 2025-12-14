# Approve PR Action

[![DeepWiki](https://img.shields.io/badge/DeepWiki-csm--actions%2Fapprove--pr--action-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/csm-actions/approve-pr-action) [![License](http://img.shields.io/badge/license-mit-blue.svg?style=flat-square)](https://raw.githubusercontent.com/csm-actions/approve-pr-action/main/LICENSE) | [Versioning Policy](https://github.com/suzuki-shunsuke/versioning-policy/blob/main/POLICY.md)

`Approve PR Action` is a set of GitHub Actions to approve pull requests securely by [the Client/Server Model](https://github.com/csm-actions/docs).

Approve PR Action allows you to approve pull requests by Machine Users securely without sharing Machine Users' Personal Access Tokens (PAT) across GitHub Actions workflows.
It elevates the security of your workflows to the next level.

## Features

- 💪 Approve pull requests to merge pull requests automatically
- 🛡 Secure
  - You don't need to pass PAT of machine users to GitHub Actions workflows on the client side
- 😊 Easy to use
  - You don't need to host a server application
- 😉 [OSS (MIT License)](LICENSE)

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
- Create the server workflow: [Example](https://github.com/csm-actions/demo-server/blob/main/.github/workflows/approve.yaml)
- Create a client GitHub App:
  - Required Permissions: `issues:write` To create GitHub Issue labels
  - Installed Repositories: client and server repositories
- Run the client action in client workflows: [Example](https://github.com/csm-actions/demo-client/blob/c46ce73ffdaa83af182d733a382d5dc051d3b994/.github/workflows/approve.yaml#L11-L20)

## Actions

Approve PR Action composes of following actions:

- [csm-actions/approve-pr-action](action.yaml): Client action
- [csm-actions/approve-pr-action/server](server/action.yaml): Server action
