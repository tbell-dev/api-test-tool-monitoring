import http from 'k6/http';
import { check, sleep, group } from 'k6';

const VUS = __ENV.VUS ? parseInt(__ENV.VUS) : 100;
const DURATION = __ENV.DURATION || '10s';

export const options = {
  stages: [
    { duration: "20s", target: 1000 },  // 사용자 증가
    { duration: "1m", target: 300 },  // 사용자 감소
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],       // 실패율 < 1%
    http_req_duration: ['p(95)<4000'],     // 95% 요청이 400ms 이하
  },
  tags: {
    project: 'MyK6Project',
    environment: 'local',
  }
};

export default function () {

  group('Meeting API Test Group', function () {
    const res1 = http.get('http://172.17.0.1:8080/api/meeting/2', {
      tags: {
        my_tag: "test1-meeting-2",
        scenario: "meeting-scenario",
        service: "meeting-service"
      },
    });

    check(res1, {
      'Meeting API status is OK': (r) => r.status < 400,
    });

    sleep(1);
  });

//  group('Error Test Group', function () {
//    const res2 = http.get('http://172.17.0.1:8080/api/error/2', {
//      tags: {
//	name: "Test - not found API",
//        error_tag: "error-2",
//        scenario: "error-scenario",
//        service: "error-service"
//      },
//    });
//
//    check(res2, {
//      'Error API status is OK': (r) => r.status < 400,
//    });
//
    sleep(1);
  });
}

