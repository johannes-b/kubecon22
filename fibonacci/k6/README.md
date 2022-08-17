# K6 Tests

Find resources here: https://github.com/beeme1mr/kubecon-demo/tree/main/k6

Run a simple smoke test with:

```shell
k6 run -e BASE_URL=http://localhost:30000 --duration 10s --vus 1 calculate.js
```