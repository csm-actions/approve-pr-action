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

## Example

```yaml
---
name: Approve a pull request
run-name: Approve a pull request (${{ github.event.label.name }})
on:
  label:
    types:
      - created
  approve:
    if: startsWith(github.event.label.name, 'approve-pr-')
    name: Approve a Pull Request (${{ github.event.label.description }})
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    environment: main
    permissions: {}
    steps:
      - uses: securefix-action/approve-pr-action/server@2cdfc193f1817713909314429fd7a073c6f700ac # v0.0.1
        with:
          github_token: ${{ secrets.PR_APPROVE_GITHUB_ACCESS_TOKEN }}
```

## Validation

This action validates pull requests.
This action doesn't approve pull requests unless they don't meet the following conditions:

1. All commits are linked to GitHub Users
1. All commits are signed
1. All committers or authors must are included in `allowed_committers`

## Inputs

### Required Inputs

- `github_token`: A GitHub Access Token to approve pull requests
  - The permission `pull_requests:write` is required

### Optional Inputs

- `allowed_committers`: Allowed committers. By default, `renovate[bot]` and `dependabot[bot]` are allowed
  - You can specify multiple committers by multiple lines

e.g.

```yaml
allowed_committers: |
  renovate[bot]
  dependabot[bot]
```

## Outputs

Nothing.
