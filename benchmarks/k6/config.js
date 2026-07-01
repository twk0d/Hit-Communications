export const BASE_URL = (__ENV.K6_BASE_URL || 'http://localhost:3000/api/v1').replace(
  /\/$/,
  '',
);

export const EMAIL = __ENV.K6_EMAIL || 'admin@hit.local';
export const PASSWORD = __ENV.K6_PASSWORD || 'Admin123!';
export const ASSIGNEE_ID =
  __ENV.K6_ASSIGNEE_ID || '356b57c6-9b8a-4576-8df6-cbd9799d8295';
export const INCIDENT_ID =
  __ENV.K6_INCIDENT_ID || '10000000-0000-4000-8000-000000000001';
export const THINK_TIME_SECONDS = Number(__ENV.K6_THINK_TIME_SECONDS || '1');
export const REQUEST_TIMEOUT = __ENV.K6_REQUEST_TIMEOUT || '30s';
export const MAX_VUS = positiveInteger(__ENV.K6_MAX_VUS, 425);

export function cappedVus(value, fallback) {
  return Math.min(positiveInteger(value, fallback), MAX_VUS);
}

export const smokeThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<1000'],
  checks: ['rate>0.99'],
};

export const baselineThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  checks: ['rate>0.99'],
};

export const loadThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<750', 'p(99)<1500'],
  checks: ['rate>0.99'],
};

export const exploratoryThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<2000', 'p(99)<4000'],
  checks: ['rate>0.95'],
};

function positiveInteger(value, fallback) {
  const parsed = Number(value || fallback);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
