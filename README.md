# Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry - KubeCon 2022, Detroit, US

This repository contains the content and artifacts to perform the demo as shown by the KubeCon talk: *Hands-off features releases with Keptn, OpenFeature, and OpenTelemetry*. 

**Abstract:** *Releasing a new feature into production always comes with an inherent risk of introducing issues. The code may have been thoroughly tested in lower environments but differences like environment-specific configurations can cause unexpected behaviour. Feature flagging helps reduce this risk by allowing a subset of users to verify a new feature in production before exposing it to all. But how can we achieve hands-off feature release automation?*

*This session will demonstrate how feature flagging and life-cycle orchestration work together to automate feature releases. Keptn will be the orchestration layer to automate feature validation. It works with OpenFeature to control access to the feature itself, allowing automated tests to verify a feature before it's generally available to users. Keptn will then react on the test results by either progressively enabling the feature for all users or initiating a troubleshooting workflow using OpenTelemetry.* 

**Goal:** *The goal of this talk is to inspire community consideration of various methods of end-to-end production testing and to demonstrate the power of integrating multiple CNCF projects to solve real-world problems. We will be utilizing several projects including OpenFeature, Keptn, and OpenTelemetry.*


## Speakers

*[Johannes Bräuer](https://github.com/johannes-b)* - In his role as Product Manager, Johannes drives the roadmap of the Keptn project and supports the Keptn community. He is passionate about approaches for microservice architectures, process automation, and sharing his findings with others. Before joining Dynatrace, he earned a PhD in Business Informatics by conducting research in measuring source code and software design quality. When Johannes is not in front of a computer, you can find him on a mountain bike and hiking trails. (August 2022)

*[Michael Beemer](https://github.com/beeme1mr)* – Michael is a Product Manager at Dynatrace. He has years of experience in the observability space working as a Consultant, DevOps Engineer, Software Developer, and Product Manager. Michael enjoys pushing the boundary of what’s possible with observability, in an effort to unlock hidden potential. He also co-founded OpenFeature, an effort to bring standardization to the feature flagging community. (August 2022)


## Table of content

* OpenFeature Intro
* Keptn Intro 
* How can they work together?
* Step-by-step guide of the demo
* Summary

## OpenFeature

> ToDo: Intro and explanation of [OpenFeature](https://openfeature.dev/)

## Keptn

> ToDo: Intro and explanation of [Keptn](https://keptn.sh/)

## Feature flagging and life-cycle orchestration together

> ToDo: Explanation of how OpenFeature and Keptn work together including an architectural diagram and explanation of the use case

## Step-by-step guide

> ToDo: "How to" - to re-produce the demo

### 1) Initial Keptn setup

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

### 2) Keptn project and service setup

#### Create Keptn project

* To create a Keptn project, first create an empty Git repository and have your Git user name as well as a personal access token by hand. (see: [Create a project](https://keptn.sh/docs/0.18.x/manage/project/) for more details) 
* After creating a Git repository, run the following command: 
    ```
    keptn create project fibonacci --shipyard=./shipyard.yaml --git-user=*** --git-token=*** --git-remote-url=***
    ```
* :sparkles: Awesome, continue with creating a service. 

#### Create service and upload artifacts

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

### 3) Jaeger

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

### 4) Running the demo

Proposal:

1. Keptn - Staging is green
2. Keptn - Start prod deployment (progressive delivery)
    * Update new version of demo app
    * Start E2E test on new feature
    * E2E test fails
    * Send Slack message
        * Screenshot (Optional)
        * Link to Jaeger
    * Troubleshoot auth issue
3. Demo Config update with correct auth token
4. Keptn - Rerun production deployment
    * Update new version of demo app
    * Start E2E test on new feature
    * E2E test passes
    * Update feature flag to be enabled for all users
    * Send slack success message (Optional)


## Summary