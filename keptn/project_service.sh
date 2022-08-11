# Create Keptn project
keptn create project fibonacci --shipyard=./shipyard.yaml --git-user=*** --git-token=*** --git-remote-url=***


# Create service and upload artifacts
keptn create service fibo --project=fibonacci


## Helm chart
cd ./fibo/helm
tar -czvf fibo.tgz ./fibo/
keptn add-resource --project=fibonacci --service=fibo --all-stages --resource=fibo.tgz --resourceUri=helm/fibo.tgz

# Tests
keptn add-resource --project=fibonacci --service=fibo --all-stages --resource=test.xxx --resourceUri=selenium/test.xxx


# Trigger delivery of the service
keptn trigger delivery --sequence=delivery --project=fibonacci --service=fibo --image=<image of the service>
