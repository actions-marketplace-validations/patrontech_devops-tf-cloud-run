const core = require('@actions/core');
const axios = require('axios');

async function main() {

    try{

        const workSpaceName = core.getInput('workSpaceName');
        const organizationName = core.getInput('organizationName');
        const token = core.getInput('terraformToken');
        const terraformHost = core.getInput('terraformHost');
        const isDestroy = core.getInput('isDestroy');
        const message = core.getInput('message');
        const startRun = core.getInput('startRun');

        const options = {
            headers: {'Content-Type': 'application/vnd.api+json',
                'Authorization': 'Bearer '+ token
            }
        };

        // Fetching WorkSpaceId
        const terraformWorkSpaceEndpoint = "https://"+terraformHost+"/api/v2/organizations/"+organizationName+"/workspaces/"+workSpaceName;
        const response = await axios.get(terraformWorkSpaceEndpoint,options);
        const workSpaceId = response.data.data.id;
        console.log("workSpaceId:"+workSpaceId)

        const terraformRunEndpoint = "https://"+terraformHost+"/api/v2/runs";
        let request = { data : {
                attributes: { "is-destroy" : isDestroy, "message" : message },
                type: "runs",
                relationships: {
                    workspace: {
                        data: {
                            type: "workspaces",
                            id: workSpaceId
                        }
                    }
                }
            }};
        console.log("DEBUG : run request:" + JSON.stringify(request));

        // Invoking Terraform Run API
        let runId = ''
        const runResponse = await axios.post(terraformRunEndpoint, request, options)
            .then((response) => {
                console.log("run/apply success:"+ JSON.stringify(response.data));
            }, (error) => {
                console.error("run error:"+JSON.stringify(error.response.data));
                core.setFailed(error.message);
            });
        runId = runResponse.data.data.id
        // Abort early if the startRun is set to false.
        if (startRun !== 'true'){
            core.setOutput("runId", runId);
        } else {
            console.log("Attempting To Execute Run ID: "+runId);
            const terraformApplyRunEndpoint = "https://" + terraformHost + "/api/v2/runs/" + runId + "/actions/apply";
            // Invoking Terraform Run API
            const runApplyResponse = await axios.post(terraformApplyRunEndpoint, null, options)
                .then((response) => {
                    console.log('Apply Success!');
                    core.setOutput("runId", runId);
                }, (error) => {
                    console.error("ERROR : Apply Error:" + JSON.stringify(error.response.data));
                    core.setFailed(error.message+" - It's likely this is being blocked by another plan.");
                });
        }

    } catch(error){
        core.setFailed(error.message);
    }
}

main();