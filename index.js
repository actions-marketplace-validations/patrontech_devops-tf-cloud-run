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
        await axios.post(terraformRunEndpoint, request, options)
            .then((response) => {
                console.log("run/apply success:"+ JSON.stringify(response.data));
                runId = response.data.data.id
            }, (error) => {
                console.error("run error:"+JSON.stringify(error.response.data));
                core.setFailed(error.message);
            });

        // Abort early if the startRun is set to false.
        if (startRun !== 'true'){
            core.setOutput("runId", runId);
        } else {
            const terraformGetRunDetailsEndpoint = "https://" + terraformHost + "/api/v2/runs/" + runId;
            let checkRunStatus = true;
            let checkCounter = 0
            while (checkRunStatus === true){
                const response = await axios.get(terraformGetRunDetailsEndpoint,options);
                const runStatus = response.data.data.attributes.status;
                if(runStatus === 'planned' || runStatus === 'planned_and_finished'){
                    checkRunStatus = false;
                }
                if(runStatus === 'errored'){
                    throw ("Error with Plan - Aborting Run");
                }
                console.log("DEBUG : Checking Job Status of Job: "+runId+" Status: "+runStatus)
                await wait(10000);
                checkCounter++;
                if(checkCounter > 60){
                    core.setFailed("Unable To Execute Terraform Plan - Most Likely Due To Queued Plans");
                    throw ("Unable To Execute Terraform Plan - Most Likely Due To Queued Plans (1)");
                    process.exit(1);
                }
            }
            console.log("DEBUG : Attempting To Execute Run ID: "+runId);
            const terraformApplyRunEndpoint = "https://" + terraformHost + "/api/v2/runs/" + runId + "/actions/apply";
            // Invoking Terraform Run API

            const runApplyResponse = await axios.post(terraformApplyRunEndpoint, null, options)
                .then((response) => {
                    console.log('DEBUG : Plan Apply Success!');
                    core.setOutput("runId", runId);
                }, (error) => {
                    console.error("ERROR : Apply Error:" + JSON.stringify(error.response.data));
                    core.setFailed(error.message+" - It's likely this is being blocked by another plan.");
                    throw ("Apply Error - It's likely this is being blocked by another plan.");
                    process.exit(1);
                });
        }

    } catch(error){
        core.setFailed(error.message);
        process.exit(1)
    }
}

// Little wait function so terraform cloud api isn't hammered with requests.
async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
main();
