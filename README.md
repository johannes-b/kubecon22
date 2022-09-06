# Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry - KubeCon 2022, Detroit, US

This repository contains the content and artifacts to perform the demo as shown by the KubeCon talk: *Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry*. 

**Abstract:** *Releasing a new feature into production always comes with an inherent risk of introducing issues. The code may have been thoroughly tested in lower environments but differences like environment-specific configurations can cause unexpected behaviour. Feature flagging helps reduce this risk by allowing a subset of users to verify a new feature in production before exposing it to all. But how can we achieve hands-off feature release automation?*

*This session will demonstrate how feature flagging and life-cycle orchestration work together to automate feature releases. Keptn will be the orchestration layer to automate feature validation. It works with OpenFeature to control access to the feature itself, allowing automated tests to verify a feature before it's generally available to users. Keptn will then react on the test results by either progressively enabling the feature for all users or initiating a troubleshooting workflow using OpenTelemetry.* 

**Goal:** *The goal of this talk is to inspire community consideration of various methods of end-to-end production testing and to demonstrate the power of integrating multiple CNCF projects to solve real-world problems. We will be utilizing several projects including OpenFeature, Keptn, and OpenTelemetry.*


# Speakers

*[Johannes Bräuer](https://github.com/johannes-b)* - In his role as Product Manager, Johannes drives the roadmap of the Keptn project and supports the Keptn community. He is passionate about approaches for microservice architectures, process automation, and sharing his findings with others. Before joining Dynatrace, he earned a PhD in Business Informatics by conducting research in measuring source code and software design quality. When Johannes is not in front of a computer, you can find him on a mountain bike and hiking trails. (August 2022)

*[Michael Beemer](https://github.com/beeme1mr)* – Michael is a Product Manager at Dynatrace. He has years of experience in the observability space working as a Consultant, DevOps Engineer, Software Developer, and Product Manager. Michael enjoys pushing the boundary of what’s possible with observability, in an effort to unlock hidden potential. He also co-founded OpenFeature, an effort to bring standardization to the feature flagging community. (August 2022)


# Table of content

* OpenFeature Intro
* Keptn Intro 
* How can they work together?
* Step-by-step guide of the demo
* Summary

# OpenFeature

> ToDo: Intro and explanation of [OpenFeature](https://openfeature.dev/)

# Keptn

> ToDo: Intro and explanation of [Keptn](https://keptn.sh/)

# Feature flagging and life-cycle orchestration together

> ToDo: Explanation of how OpenFeature and Keptn work together including an architectural diagram and explanation of the use case

# Step-by-step guide

> ToDo: "How to" - to re-produce the demo

## 1) Keptn setup

### 1.1) Initial setup

* This demo builds on [Keptn v0.18.1](https://github.com/keptn/keptn/releases/tag/0.18.1)
* Install Keptn on your Kubernetes cluster using Helm. The installation details are provided [here](https://keptn.sh/docs/install/helm-install/#control-plane-installation-options).
* Install two execution services; one for deployment, one for testing purpose: 
    * helm-serivce:
    ```
    helm upgrade helm-service https://github.com/keptn/keptn/releases/download/0.18.1/helm-service-0.18.1.tgz -n keptn --create-namespace --wait
    ```
    * job-executor-service for executing K6 tests
    ```
    JES_VERSION=0.2.4

    KEPTN_API_PROTOCOL=http
    KEPTN_API_HOST=<YOUR_KEPTN_HOST_NAME>
    KEPTN_API_TOKEN=<YOUR_KEPTN_API_TOKEN>

    TASK_SUBSCRIPTION=sh.keptn.event.test.triggered

    NAMESPACE=keptn-jes

    helm upgrade --install --create-namespace -n ${NAMESPACE} job-executor-service \
        https://github.com/keptn-contrib/job-executor-service/releases/download/${JES_VERSION}/job-executor-service-${JES_VERSION}.tgz \
        --set remoteControlPlane.topicSubscription=${TASK_SUBSCRIPTION} \
        --set remoteControlPlane.api.protocol=${KEPTN_API_PROTOCOL} \
        --set remoteControlPlane.api.hostname=${KEPTN_API_HOST} \
        --set remoteControlPlane.api.token=${KEPTN_API_TOKEN}
    ```

* Install Keptn CLI locally in order to communicate with your Keptn installation. The installation guide is provided [here](https://keptn.sh/docs/install/cli-install/) 
* To authenticate the Keptn CLI against Keptn, 
    * Open the Keptn bridge in a browser: `https://<your-keptn-host-name>/bridge` and log in with user `keptn` and password `****`
    * After logging in, open the user profile in the top right corner and copy the *keptn auth command*. 
    * Paste the command in your shell to authenticate the Keptn CLI:
    ```
    keptn auth --endpoint=https://<your-keptn-host-name>/api --api-token=****
    Starting to authenticate
    Successfully authenticated against https://<your-keptn-host-name>/api
    Bridge URL: https://<your-keptn-host-name>/bridge
    Using a file-based storage for the key because the password-store seems to be not set up.
    ```
    * :tada: Congrates, Keptn is working and you are ready to move on creating a project and service.

### 1.2) Configure Slack integration

#### Create Slack webhook

* Create Slack webhook: In Slack, please follow the guidelines to enable [Incomming Webhooks](https://api.slack.com/messaging/webhooks).

* Store Slack webhook as a Keptn secret: To secure the Slack hook, a Keptn secret must be created. To do this, go to the Keptn project `Settings` > `Secrets` and click the `Add Secret` button. On that form fill the following values:
    * Name: Name such as `slack-secret`
    * Scope: `keptn-webhook-service`
    * Key-value pairs: Click the new key-value pair button and add these values:
        * Key = Name such as `HOOK`
        * Value = The Slack webhook from the previous step starting after `services/`. (e.g, `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

#### Notify on failure

In order to link to: http://localhost:8080/search?lookback=1h&service=fibonacci-production&tags=%7B%22feature_flag.flag_key%22%3A%22use-remote-fib-service%22%7D


* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button, to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `notify`
    * Task suffix: `triggered`
* In the Webhook configuration form section fill out the following:
    * Request Method: `POST`
    * URL: https://hooks.slack.com/services/{{.secret.slack-webhook.HOOK}}
    * Payload:
    ```
    {
        "text": "Delivery failed.",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Delivery failed."
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Open Jaeger",
                        "emoji": true
                    },
                    "value": "click_me_123",
                    "url": "http://localhost:8080/search",
                    "action_id": "button-action"
                }
            }
        ]
    }
    ```
    * Finally, click **Create subscription** to save and enable the webhook for your Slack integration.

#### Notify on successful release

* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button, to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `release`
    * Task suffix: `finished`
* In the Webhook configuration form section fill out the following:
    * Request Method: `POST`
    * URL: https://hooks.slack.com/services/{{.secret.slack-webhook.token}}
    * Payload:
    ```
    { 
        "text":"Release in {{.data.stage}} finished, with feature enabled"
    }
    ```
    * Finally, click **Create subscription** to save and enable the webhook for your Slack integration.

### 1.3 ) Configure GitHub integration

#### Get GitHub access token

* Get GitHub Access Token: A GitHub personal access token (PAT) is required to pass within the Keptn webhook authorization header in order for the GitHub API to authenticate the request. Follow these instructions in the [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) to create your token and be sure that you have given the token access to the `repo` scope.

* Store GitHub token as a Keptn secret: To secure the GitHub Access Token, a Keptn secret must be created. To do this, go to the Keptn project `Settings` > `Secrets` and click the `Add Secret` button. On that form fill the following values:
    * Name: Name such as `github-secret`
    * Scope: `keptn-webhook-service`
    * Key-value pairs: Click the new key-value pair button and add these values:
        * Key = Name such as `GITHUBTOKEN`
        * Value = The GitHub Access Token from the step from previous section

#### Create workflow in your GitHub repository

In the upstream repository of your Keptn project, you need to create two GitHub actions for two tasks: 
1. Updating a feature flag in a configmap to enable a feature for all users
2. Notifying Keptn about the configuraiton change. 


* In the upstream repository on the master branch create the folder: `./github/workflows`
* 
> TODO: Create GitHub action to file a PR for chancing the configmap on `sh.keptn.event.enable-feature.triggered`

> TODO: Create GitHub action to send: `sh.keptn.event.enable-feature.finished`

#### Trigger workflow to enable feature

* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button, to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `enable-feature`
    * Task suffix: `triggered`
* In the Webhook configuration form section fill out the following:
    * Request Method: `POST`
    * URL: https://api.github.com/repos/{GIT_ORG}/{GIT_REPO}/dispatches
    * Custom header: `Authorization` `token {{.secret.github-secret.GITHUBTOKEN}}`
    * Payload:
    ```
    {
    "event_type": "enable-feature",
    "client_payload": {
        "type": "{{.type}}",
        "project": "{{.data.project}}",
        "service": "{{.data.service}}",
        "stage": "{{.data.stage}}",
        "shkeptncontext": "{{.shkeptncontext}}",
        "id": "{{.id}}",
        "default_variant": "on",
        "flag_key": "use-remote-fib-service"
    }
    }
    ```
    * Finally, click **Create subscription** to save and enable the webhook for your Slack integration.

## 2) Keptn project and service setup

### Create Keptn project

* To create a Keptn project, first create an empty Git repository and have your Git user name as well as a personal access token by hand. (see: [Create a project](https://keptn.sh/docs/0.18.x/manage/project/) for more details) 
* After creating a Git repository, run the following command: 
    ```
    keptn create project fibonacci --shipyard=./shipyard.yaml --git-user=*** --git-token=*** --git-remote-url=***
    ```
* :sparkles: Awesome, continue with creating a service. 

### Create Keptn service and upload artifacts

* Run the following command to create a service in your Keptn project: 
    ```
    keptn create service fibonacci --project=fibonacci

    keptn create service fib3r --project=fibonacci
    ```

* To upload its Helm Chart for deployment, execute:
    ```
    cd ./fibonacci/helm
    tar -czvf fibonacci.tgz fibonacci
    keptn add-resource --project=fibonacci --service=fibonacci --all-stages --resource=fibonacci.tgz --resourceUri=helm/fibonacci.tgz
    cd ../..

    cd ./fib3r/helm
    tar -czvf fib3r.tgz fib3r
    keptn add-resource --project=fibonacci --service=fib3r --all-stages --resource=fib3r.tgz --resourceUri=helm/fib3r.tgz
    cd ../..
    ```

* To upload its test and to configure the job executore service, execute:
    ```
    cd ./fibonacci/k6
    keptn add-resource --project=fibonacci --service=fibonacci --all-stages --resource=calculate.js --resourceUri=k6/calculate.js

    keptn add-resource --project=fibonacci --service=fibonacci --stage=staging --resource=jobconfig_staging.yaml --resourceUri=job/config.yaml
    keptn add-resource --project=fibonacci --service=fibonacci --stage=production --resource=jobconfig_production.yaml --resourceUri=job/config.yaml
    cd ../..
    ```

* :+1: Great, now you are ready to trigger the first deployment:
    ```
    keptn trigger delivery --sequence=deployment --project=fibonacci --service=fib3r --image=ghcr.io/beeme1mr/fib3r-kubecon-demo:latest

    keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
    ```

## 3) Jaeger

* Install Jaeger using its Helm Chart: https://jaegertracing.github.io/helm-charts/

```
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm upgrade -i jaeger jaegertracing/jaeger -n jaeger --create-namespace --set collector.service.otlp.http.port=4318,collector.service.otlp.grpc.port=4317
```

* Access Jaeger UI using

```
export POD_NAME=$(kubectl get pods --namespace jaeger -l "app.kubernetes.io/instance=jaeger,app.kubernetes.io/component=query" -o jsonpath="{.items[0].metadata.name}")
echo http://127.0.0.1:8080/
kubectl port-forward --namespace jaeger $POD_NAME 8080:16686
```


## 4) Demo flow


### Prerequisite

* On the `production` branch in your upstream repository, set `FIB3R_PASS` to a value other than `my-fib3r-password`. You will find this setting in: `/fibonacci/helm/fibonacci/templates/deployment.yaml`


### Starting a progressive delivery of the fibonacci service (main service)

```
keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
```

* In Keptn, the delivery of the new version in staging was successful and shows a green state: 

![Delivery in staging](./img/staging_finished.png)


* After the delivery in staging, Keptn starts a progressive delivery in production. This process will:  
    * Update the version of the fibonacci service
    * Deploy the new version using Helm
    * Start an end-to-end test using K6

* However, the end-to-end tests will fail. 
    * Consequently, Keptn sends out a Slack message with a link to Jaeger helping the user to trouble shoot the problem. 

* In Jaeger, it will be obvious that the authentication was not working due to the wrong password.
 
* To continue the demo, the variable `FIB3R_PASS` has to be set to `my-fib3r-password`.


### Re-running the delivery

```
keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
```

* Like in the first run, the delivery in staging will be successfull and shows a green state. 

* After the delivery in staging, Keptn starts a progressive delivery in production.This process will:  
    * Update the version of the fibonacci service
    * Deploy the new version using Helm
    * Start an end-to-end test using K6

* This time, the end-to-end test will pass. 
    * Consequently, Keptn will trigger an config change in production in order to enable the new feature for all users. 

# Summary