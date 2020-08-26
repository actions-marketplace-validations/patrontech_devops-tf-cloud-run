# Invoke Terraform Runs API 

This action invoke Terraform Runs API  
https://www.terraform.io/docs/cloud/api/run.html

## Inputs

### `workSpaceName`

**Required** The name of the workspace.

### `organizationName`

**Required** Your Organization.

### `terraformToken`

**Required** Your Terraform token. Please use secret to store your Terraform token.

 ### `terraformHost`

**Required** This is the Terraform Host Name. For Tarraform cloud its app.terraform.io.

### `isDestroy`

**Required** Specifies if this plan is a destroy plan, which will destroy all provisioned resources.

### `startRun`

**Required** Specifies if the run/plan should be executed.

### `message`

**Required** Specifies the message to be associated with this run.

## Outputs

### `runId`

 The run ID.

## Example usage

```
uses: patrontech/devops-tf-cloud-run@v1.0.0   
with:  
  workSpaceName: MyTestWorkspace  
  organizationName: {{env.organization}}  
  terraformToken: {{secrets.Terraform_Token}}
  terraformHost: 'app.terraform.io'
  isDestroy: false
  startRun: false
  message: 'GitHub Actions'

```