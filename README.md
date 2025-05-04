# Approve PR Action

[![License](http://img.shields.io/badge/license-mit-blue.svg?style=flat-square)](https://raw.githubusercontent.com/securefix-action/approve-pr-action/main/LICENSE) | [Versioning Policy](https://github.com/suzuki-shunsuke/versioning-policy/blob/main/POLICY.md)

`Approve PR Action` is a set of GitHub Actions to approve pull requests securely by [the Client/Server Model](https://github.com/securefix-action/client-server-model-docs).

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

You want to merge some pull requests created by GitHub Apps like Renovate automatically.

But if approvals from codeowners are required by Branch Rulesets, you need to approve pull requests automatically.
GitHub Apps can't be codeowners, so you need to approve pull requests using machine user's PAT.
But if the PAT is abused, people can approve any pull requests using it and merge them without pull request reviews.
It's so dangerous.
So you must protect machine user's PAT securely.
You shouldn't pass it to workflows widely.

This action allows you to protect PAT by [the Client/Server Model](https://github.com/securefix-action/client-server-model-docs).

## Example

- [Client Workflow](https://github.com/securefix-action/demo-client/blob/d1cfe0d6a24b6b62b4269ea9744b92f4a337b193/.github/workflows/approve.yaml#L10-L14)
- [Server Workflow](https://github.com/securefix-action/demo-server/blob/b7b4368e855352e236fee2b9508ccd738704d225/.github/workflows/securefix.yaml#L42-L52)

## Actions

Approve PR Action composes of following actions:

- [securefix-action/approve-pr-action](docs/client.md) ([action.yaml](action.yaml)): Client action
- [securefix-action/approve-pr-action/server](server) ([action.yaml](server/action.yaml)): Server action
