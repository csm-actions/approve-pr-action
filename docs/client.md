# Client Action

[action.yaml](../action.yaml)

Client Action creates and deletes a GitHub Issue label to request approving a pull request to a server workflow.

## Example

Coming soon.

## Inputs

### Required Inputs

- `app_id`: A GitHub App ID
- `app_private_key`: A GitHub App Private Key
- `server_repository`: A GitHub Repository name where a server workflow works

### Optional Inputs

- `repository`: A repository name of the approved pull request. By default, the repository where the client workflow is run
- `pull_request_number`: A pull request number of the approved pull request. By default, it's `${{github.event.pull_request.number}}`

## Outputs

Nothing.
