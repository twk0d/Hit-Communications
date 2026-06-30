import { sleep } from 'k6';

import { THINK_TIME_SECONDS, baselineThresholds } from '../config.js';
import { randomInt } from '../helpers/data.js';
import {
  createIncident,
  filterIncidents,
  getIncident,
  getIncidentHistory,
  listIncidents,
} from '../helpers/incidents.js';
import { login } from '../helpers/auth.js';
import { buildSummary } from '../helpers/summary.js';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: Number(__ENV.K6_BASELINE_VUS || '10'),
      duration: __ENV.K6_BASELINE_DURATION || '1m',
    },
  },
  thresholds: baselineThresholds,
};

export function setup() {
  return login();
}

export default function (auth) {
  const operation = randomInt(1, 100);

  if (operation <= 45) {
    listIncidents(auth.accessToken);
  } else if (operation <= 65) {
    filterIncidents(auth.accessToken);
  } else if (operation <= 82) {
    getIncident(auth.accessToken);
  } else if (operation <= 95) {
    getIncidentHistory(auth.accessToken);
  } else {
    createIncident(auth.accessToken);
  }

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('baseline', data);
}
