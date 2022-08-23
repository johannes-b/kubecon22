import http from 'k6/http';
import { check, fail, sleep } from 'k6';

export default () => {
  const BASE_URL = __ENV.BASE_URL || 'fibonacci.fibonacci-staging.svc.cluster.local:80';
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