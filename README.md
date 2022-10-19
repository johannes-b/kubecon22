# Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry - KubeCon 2022, Detroit, US

This repository contains the content and artifacts to perform the demo as shown by the KubeCon talk: *Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry*. 

**Abstract:** *Releasing a new feature into production always comes with an inherent risk of introducing issues. The code may have been thoroughly tested in lower environments, but differences like environment-specific configurations can cause unexpected behaviour. Feature flagging helps reduce this risk by allowing a subset of users to verify a new feature in production before exposing it to all. But how can we achieve hands-off feature release automation?*

*This session will demonstrate how feature flagging and lifecycle orchestration work together to automate feature releases. Keptn will be the orchestration layer to automate feature validation. It works with OpenFeature to control access to the feature itself, allowing automated tests to verify a feature before it's generally available to users. Keptn will then react on the test results by either progressively enabling the feature for all users or initiating a troubleshooting workflow using OpenTelemetry.* 

**Goal:** *This talk aims to inspire community consideration of various methods of end-to-end production testing and to demonstrate the power of integrating multiple CNCF projects to solve real-world problems. We will be utilizing several projects, including OpenFeature, Keptn, and OpenTelemetry.*


# Speakers

*[Johannes Bräuer](https://github.com/johannes-b)* - In his role as Product Manager, Johannes drives the roadmap of the Keptn project and supports the Keptn community. He is passionate about approaches for microservice architectures, process automation, and sharing his findings with others. Before joining Dynatrace, he earned a PhD in Business Informatics by conducting research in measuring source code and software design quality. When Johannes is not in front of a computer, you can find him on a mountain bike and hiking trails. (August 2022)

*[Michael Beemer](https://github.com/beeme1mr)* – Michael is a Product Manager at Dynatrace. He has years of experience in the observability space, working as a Consultant, DevOps Engineer, Software Developer, and Product Manager. Michael enjoys pushing the boundary of what's possible with observability in an effort to unlock hidden potential. He also co-founded OpenFeature, an effort to bring standardization to the feature flagging community. (August 2022)

# OpenFeature Introduction

> [OpenFeature website](https://openfeature.dev/)

# Keptn Introduction

> [Keptn website](https://keptn.sh/)

Keptn is an open-source control plane for orchestrating **continuous delivery (CD)** and **operational processes** of cloud-based applications. It started in January 2019 by the company Dynatrace and then donated to the Cloud-Native Computing Foundation (CNCF) in 2020. For more information in general, please visit: [keptn.sh](https://keptn.sh/why-keptn/)

Keptn supports a declarative approach to building scalable automation routines for continuous delivery and operations. Keptn
can invoke services from external DevOps tools and consumes the generated events while executing continuous delivery. Currently, the integrated tools support testing, observability, deployment activities, and web-hooks to web applications. A list of those integrations is managed on the [ArtifactHub](https://artifacthub.io/packages/search?ts_query_web=keptn).

To configure the provisioning of services, Keptn relies on declarative artifacts or specifications.

* *[Shipyard](https://github.com/keptn/spec/blob/master/shipyard.md)*: The Shipyard specification declares a multi-stage delivery workflow by defining what needs to be done. A delivery workflow is based on multiple stages, each with different task sequences. A task sequence is a set of actions for a specific delivery or operational process. Following this declarative approach, there is no need to write imperative pipeline code.

* *[Keptn Events](https://github.com/keptn/spec/blob/master/cloudevents.md)*: Keptn will send out events for tool integrations. All Keptn events conform to the CloudEvents spec in [version 1.0](https://github.com/cloudevents/spec/blob/v1.0/spec.md). The CloudEvents specification is a vendor-neutral specification for defining event data format.

* *[SLI](https://github.com/keptn/spec/blob/master/service_level_indicator.md) and [SLO](https://github.com/keptn/spec/blob/master/service_level_objective.md)*: (**Out of scope for this demo**) A service-level indicator (SLI) is a carefully defined quantitative measure of some aspect of the level of service that is provided. A service-level objective (SLO) is a target value or range of values for a service level that an SLI measures. Together, the SLI/SLO specifications declare a quality gate for a given service. This quality gate can be leveraged in the delivery or operational process to measure the defined quality criteria.

* *[Remediation](https://github.com/keptn/spec/blob/master/remediation.md)*: (**Out of scope for this demo**) The Remediation defines remediation actions to execute in response to a problem. Keptn interprets this configuration to trigger the proper remediation actions.

In this demo, Keptn will be used to manage the lifecycle of the Fibonacci service. Therefore, a multi-stage delivery process is set up to have a staged rollout from a staging to a production environment. The delivery process in production contains the tasks of artifact deployment, test, config change, and release. Besides, Keptn will inform about failed tests or successfully released artifacts in production.   

# Feature flagging and lifecycle orchestration together

> ToDo: Explanation of how OpenFeature and Keptn work together, including an architectural diagram and explanation of the use case - Link to the slide deck / PDF.

# Step-by-step guide

This section will provide a step-by-step guide to: 
* Set up Keptn and its integration points
* Create a Keptn project and service
* Install Jaeger for trace observability
* Run the demo

## Keptn setup

### Initial Keptn setup

* This demo builds on [Keptn v0.18.1](https://github.com/keptn/keptn/releases/tag/0.18.1)

* Install Keptn on your Kubernetes cluster using Helm. The installation guide is provided [here](https://keptn.sh/docs/install/helm-install/#control-plane-installation-options).

* Install two execution services on your Kubernetes cluster; one for deploying, and one for testing purposes: 

    * *helm-serivce*: This service will act on the Keptn events `sh.keptn.event.deployment.triggered` and `sh.keptn.event.release.triggered` to deploy a Helm Chart as part of a software delivery. 
    ```
    helm upgrade helm-service https://github.com/keptn/keptn/releases/download/0.18.1/helm-service-0.18.1.tgz -n keptn --create-namespace --wait
    ```

    * *job-executor-service*: This service will act on the Keptn event `sh.keptn.event.test.triggered` to run a K6 test against the newly deployed version.
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

* Install Keptn CLI locally to communicate with your Keptn installation. The installation guide is provided [here](https://keptn.sh/docs/install/cli-install/) 

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

    * :tada: Congrates, Keptn is working and you're ready to move on creating a project and service.

### Configure Slack integration

#### Create Slack webhook

* Create Slack webhook: In Slack, please follow the guidelines to enable [Incomming Webhooks](https://api.slack.com/messaging/webhooks).

* *Store Slack webhook as a Keptn secret*: To secure the Slack hook, a Keptn secret must be created. To do this, go to the Keptn project `Settings` > `Secrets` and click the `Add Secret` button. On that form, fill the following values:
    * Name: Name such as `slack-secret`
    * Scope: `keptn-webhook-service`
    * Key-value pairs: Click the new key-value pair button and add these values:
        * Key = Name such as `HOOK`
        * Value = The Slack webhook from the previous step starting after `services/`. (e.g, `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

#### Notify on failure

To link to: http://localhost:8080/search?lookback=1h&service=fibonacci-production&tags=%7B%22feature_flag.flag_key%22%3A%22use-remote-fib-service%22%7D

* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button, to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `notify`
    * Task suffix: `triggered`
* In the Webhook configuration form section, fill out the following:
    * Request Method: `POST`
    * URL: https://hooks.slack.com/services/{{.secret.slack-webhook.HOOK}}
    * Payload:
    ```
    {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": ":x: Delivery of *{{.data.service}}* failed in *{{.data.stage}}*"
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "See Traces in Jaeger",
              "emoji": true
            },
            "value": "click_me_123",
            "url": "http://jaeger-query.jaeger.<YOUR-INGRESS-GW>.nip.io/search",
            "action_id": "button-action"
          }
        }
      ]
    }
    ```
    * Finally, click **Create subscription** to save and enable the webhook for your Slack integration.

#### Notify on successful release

* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `release`
    * Task suffix: `finished`
* Set filter to: `Stage: production`
* In the Webhook configuration form section fill out the following:
    * Request Method: `POST`
    * URL: https://hooks.slack.com/services/{{.secret.slack-webhook.token}}
    * Payload:
    ```
    {
      "text": ":white_check_mark: Delivery of *{{.data.service}}* in *{{.data.stage}}* finished with the new feature enabled"
    }
    ```
    * Finally, click **Create subscription** to save and enable the webhook for your Slack integration.

### Configure GitHub integration

#### Get GitHub access token

* *Get GitHub Access Token*: A GitHub personal access token (PAT) is required to pass within the Keptn webhook authorization header for the GitHub API to authenticate the request. Follow these instructions in the [GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) to create your token and be sure that you have given the token access to the `repo` scope.

* *Store GitHub token as a Keptn secret*: To secure the GitHub Access Token, a Keptn secret must be created. To do this, go to the Keptn project `Settings` > `Secrets` and click the `Add Secret` button. On that form, fill the following values:
    * Name: Name such as `github-secret`
    * Scope: `keptn-webhook-service`
    * Key-value pairs: Click the new key-value pair button and add these values:
        * Key = Name such as `GITHUBTOKEN`
        * Value = The GitHub Access Token from the step from the previous section

#### Create workflow in your GitHub repository

In the upstream repository of your Keptn project, you need to create two GitHub actions for two tasks: 
1. Updating a feature flag in a configmap to enable a feature for all users. The Keptn event: `sh.keptn.event.enable-feature.triggered` will trigger this action.
2. Notifying Keptn about the configuration change. This action will send the event `sh.keptn.event.enable-feature.finished` to Keptn.

* In the upstream repository on the master branch, create the folder: `./github/workflows`

* Add the two files `enable-feature.yaml` and  `notify-keptn.yaml` to this folder and commit your changes. 

#### Configure webhook to enable the feature

* In Keptn, navigate to `Settings` and select the webhook-service
* Click the `Add subscription` button to create a new event subscription on the currently selected project
* In this form, fill out the following fields:
    * Task: `enable-feature`
    * Task suffix: `triggered`
* In the Webhook configuration form section, fill out the following:
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

## Keptn project and service setup

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

* To upload its test and to configure the job executor service, execute:
    ```
    cd ./fibonacci/k6
    keptn add-resource --project=fibonacci --service=fibonacci --all-stages --resource=calculate.js --resourceUri=k6/calculate.js

    keptn add-resource --project=fibonacci --service=fibonacci --stage=staging --resource=jobconfig_staging.yaml --resourceUri=job/config.yaml
    keptn add-resource --project=fibonacci --service=fibonacci --stage=production --resource=jobconfig_production.yaml --resourceUri=job/config.yaml
    cd ../..
    ```

* :+1: Great, now you're ready to trigger the first deployment:
    ```
    keptn trigger delivery --sequence=deployment --project=fibonacci --service=fib3r --image=ghcr.io/beeme1mr/fib3r-kubecon-demo:latest

    keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
    ```

## Install and access Jaeger

* Install Jaeger using its Helm Chart: https://jaegertracing.github.io/helm-charts/

```
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm upgrade -i jaeger jaegertracing/jaeger -n jaeger --create-namespace --set collector.service.otlp.http.port=4318,collector.service.otlp.grpc.port=4317
```

* Access Jaeger UI using:

```
export POD_NAME=$(kubectl get pods --namespace jaeger -l "app.kubernetes.io/instance=jaeger,app.kubernetes.io/component=query" -o jsonpath="{.items[0].metadata.name}")
echo http://127.0.0.1:8080/
kubectl port-forward --namespace jaeger $POD_NAME 8080:16686
```

## Demo flow

### Prerequisite

* On the `production` branch in your upstream repository, set `FIB3R_PASS` to a value other than `my-fib3r-password`. You will find this setting in: `/fibonacci/helm/fibonacci/templates/deployment.yaml`

* Reseting the feature flag: 

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: feature-flags
data:
  config.json: |-
    {
      "flags": {
        "new-welcome-message": {
          "state": "ENABLED",
          "variants": {
            "on": true,
            "off": false
          },
          "defaultVariant": "on"
        },
        "hex-color": {
          "returnType": "string",
          "variants": {
            "red": "CC0000",
            "green": "00CC00",
            "blue": "0000CC",
            "yellow": "yellow"
          },
          "defaultVariant": "red",
          "state": "ENABLED"
        },
        "use-remote-fib-service": {
          "state": "ENABLED",
          "variants": {
            "on": true,
            "off": false
          },
          "defaultVariant": "off",
          "targeting": {
            "if": [
              {
                "in": [
                  "k6",
                  {
                    "var": "userAgent"
                  }
                ]
              },
              "on",
              null
            ]
          }
        },
        "fib-algo": {
          "returnType": "string",
          "variants": {
            "recursive": "recursive",
            "memo": "memo",
            "loop": "loop",
            "binet": "binet"
          },
          "defaultVariant": "recursive",
          "state": "ENABLED",
          "targeting": {
            "if": [
              {
                "in": [
                  "@faas.com",
                  {
                    "var": [
                      "email"
                    ]
                  }
                ]
              },
              "binet",
              null
            ]
          }
        }
      }
    }
```

### Starting a progressive delivery of the fibonacci service (main service)

```
keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
```

* In Keptn, the delivery of the new version in staging was successful and shows a green state: 

    <details>
    <summary>See delivery in staging</summary>

    ![Delivery in staging](./img/staging_finished.png)

    </details>

* After the delivery in staging, Keptn starts a progressive delivery in production. This process will:  
    * Update the version of the fibonacci service
    * Deploy the new version using Helm
    * Start an end-to-end test using K6

* However, the end-to-end tests will fail. 
    * Consequently, Keptn sends out a Slack message with a link to Jaeger, helping the user to troubleshoot the problem. 

* In Jaeger, it will be evident that the authentication was not working due to the wrong password.
 
* To continue the demo, the variable `FIB3R_PASS` has to be set to `my-fib3r-password`.


### Re-running the delivery

```
keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibonacci --image=ghcr.io/beeme1mr/kubecon-demo:latest
```

* Like in the first run, the delivery in staging will be successful and shows a green state. 

* After the delivery in staging, Keptn starts a progressive delivery in production. This process will:  
    * Update the version of the fibonacci service
    * Deploy the new version using Helm
    * Start an end-to-end test using K6

* This time, the end-to-end test will pass. 
    * Consequently, Keptn will trigger a config change in production to enable the new feature for all users. 

# Summary