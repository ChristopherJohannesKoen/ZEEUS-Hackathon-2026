import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  createSessionHeaders,
  ensurePerfUser,
  getAppUrl,
  loginPerfUser,
  withExpectedStatuses
} from './shared.js';

let cachedSessionCookie;

export const options = {
  scenarios: {
    dashboard_reads: {
      executor: 'constant-vus',
      vus: 10,
      duration: '45s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<900']
  }
};

export default function () {
  if (!cachedSessionCookie) {
    ensurePerfUser('dashboard-read');
    cachedSessionCookie = loginPerfUser('dashboard-read');
  }

  const sessionCookie = cachedSessionCookie;
  const headers = createSessionHeaders(sessionCookie);

  const dashboardResponse = http.get(`${getAppUrl()}/app`, {
    headers,
    ...withExpectedStatuses(200)
  });
  check(dashboardResponse, {
    'dashboard page loads': (response) => response.status === 200
  });

  const evaluationsResponse = http.get(`${getAppUrl()}/app/evaluations`, {
    headers,
    ...withExpectedStatuses(200)
  });
  check(evaluationsResponse, {
    'evaluations page loads': (response) => response.status === 200
  });

  sleep(1);
}
