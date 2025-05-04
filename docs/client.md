# Client Action

[action.yaml](../action.yaml)

Client Action creates and deletes a GitHub Issue label to request approving a pull request to a server workflow.

## Example

```yaml
- uses: securefix-action/approve-pr-action@2cdfc193f1817713909314429fd7a073c6f700ac # v0.0.1
  with:
    app_id: ${{vars.DEMO_CLIENT_APP_ID}}
    app_private_key: ${{secrets.DEMO_CLIENT_PRIVATE_KEY}}
    server_repository: demo-server
```

## Inputs

### Required Inputs

- `app_id`: A GitHub App ID
- `app_private_key`: A GitHub App Private Key
- `server_repository`: A GitHub Repository name where a server workflow works

### Optional Inputs

Nothing.

## Outputs

Nothing.
