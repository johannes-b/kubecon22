import http from 'k6/http';
import { check, fail, sleep } from 'k6';


export const options = {
  thresholds: {
    http_req_failed: ['rate<0.1'], // http errors should be less than 10%
    // http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
};

export default () => {
  const BASE_URL = __ENV.BASE_URL || 'fib3r.fibonacci-staging.svc.cluster.local:80';
  const res = http.get(`http://${BASE_URL}/calculate?num=40`);
  sleep(1);
  console.log(res.status)
  if (
    !check(res, {
      'status code MUST be 200': (res) => res.status == 200,
    })
  ) {
    fail('status code was *not* 200');
  }
};