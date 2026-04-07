import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  createIdempotencyKey,
  createSessionHeaders,
  ensurePerfUser,
  fetchCsrfToken,
  getApiOrigin,
  loginPerfUser,
  withExpectedStatuses
} from './shared.js';

let cachedSessionCookie;
let cachedCsrfToken;

export const options = {
  scenarios: {
    idempotent_writes: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    'http_req_duration{name:evaluations_create}': ['p(95)<900']
  }
};

export default function () {
  if (!cachedSessionCookie) {
    ensurePerfUser('idempotent-evaluation-create');
    cachedSessionCookie = loginPerfUser('idempotent-evaluation-create');
    cachedCsrfToken = fetchCsrfToken(cachedSessionCookie);
  }

  const sessionCookie = cachedSessionCookie;
  const csrfToken = cachedCsrfToken;
  const idempotencyKey = createIdempotencyKey('evaluation-create');
  const headers = createSessionHeaders(sessionCookie, csrfToken, {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey
  });
  const payload = JSON.stringify({
    name: `Perf evaluation ${__VU}-${__ITER}`,
    country: 'South Africa',
    naceDivision: '10 Manufacture of food products',
    offeringType: 'product',
    launched: true,
    currentStage: 'validation',
    innovationApproach: 'disruptive'
  });

  const firstResponse = http.post(`${getApiOrigin()}/api/evaluations`, payload, {
    headers,
    ...withExpectedStatuses(201),
    tags: {
      name: 'evaluations_create'
    }
  });
  const replayResponse = http.post(`${getApiOrigin()}/api/evaluations`, payload, {
    headers,
    ...withExpectedStatuses(201),
    tags: {
      name: 'evaluations_create'
    }
  });

  check(firstResponse, {
    'first create accepted': (response) => response.status === 201
  });
  check(replayResponse, {
    'replay create accepted': (response) =>
      response.status === 201 && response.json('id') === firstResponse.json('id')
  });

  sleep(1);
}
