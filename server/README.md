# Server Action

[action.yaml](action.yaml)

Server Action approves pull requests.

This action gets a pull request repository and a pull request number and

This actions does the following things:

1. Get the pull request repository and the pull request number from the label description
1. Get the pull request committers and authors by GitHub GraphQL API
1. Validate if the pull request can be allowed
1. Approve the pull request
1. Post a comment to the pull request if it fails to approve the pull request

## Validation

This action validates pull requests.
This action doesn't approve pull requests unless they don't meet the following conditions:

1. All commits are linked to GitHub Users
1. All commits are signed
1. All committers or authors must are included in `allowed_committers`
