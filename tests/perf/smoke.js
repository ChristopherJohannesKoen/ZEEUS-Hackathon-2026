import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  createSessionHeaders,
  fetchCsrfToken,
  getApiOrigin,
  login,
  withExpectedStatuses
} from './shared.js';

export const options = {
  vus: 1,
  iterations: 3,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750']
  }
};

export default function () {
  const sessionCookie = login({
    tags: {
      name: 'auth_login'
    }
  });
  const csrfToken = fetchCsrfToken(sessionCookie);

  const healthResponse = http.get(`${getApiOrigin()}/api/health`, withExpectedStatuses(200));
  check(healthResponse, {
    'health is healthy': (response) => response.status === 200
  });

  const meResponse = http.get(`${getApiOrigin()}/api/auth/me`, {
    headers: createSessionHeaders(sessionCookie),
    ...withExpectedStatuses(200),
    tags: {
      name: 'auth_me'
    }
  });
  check(meResponse, {
    'me endpoint works': (response) => response.status === 200
  });

  const sessionsResponse = http.get(`${getApiOrigin()}/api/auth/sessions`, {
    headers: createSessionHeaders(sessionCookie),
    ...withExpectedStatuses(200),
    tags: {
      name: 'auth_sessions'
    }
  });
  check(sessionsResponse, {
    'sessions endpoint works': (response) => response.status === 200
  });

  const evaluationsResponse = http.get(`${getApiOrigin()}/api/evaluations`, {
    headers: createSessionHeaders(sessionCookie),
    ...withExpectedStatuses(200),
    tags: {
      name: 'evaluations_list'
    }
  });
  check(evaluationsResponse, {
    'evaluations list works': (response) => response.status === 200
  });

  const evaluationId = evaluationsResponse.json('items.0.id');

  if (evaluationId) {
    const evaluationResponse = http.get(`${getApiOrigin()}/api/evaluations/${evaluationId}`, {
      headers: createSessionHeaders(sessionCookie),
      ...withExpectedStatuses(200),
      tags: {
        name: 'evaluations_get'
      }
    });
    check(evaluationResponse, {
      'evaluations get works': (response) => response.status === 200
    });
  }

  const logoutResponse = http.post(`${getApiOrigin()}/api/auth/logout`, null, {
    headers: createSessionHeaders(sessionCookie, csrfToken),
    ...withExpectedStatuses(200),
    tags: {
      name: 'auth_logout'
    }
  });
  check(logoutResponse, {
    'logout works': (response) => response.status === 200
  });

  sleep(1);
}
