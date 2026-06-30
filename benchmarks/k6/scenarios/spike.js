import { sleep } from 'k6';

import { THINK_TIME_SECONDS, exploratoryThresholds } from '../config.js';
import { randomInt } from '../helpers/data.js';
import { login } from '../helpers/auth.js';
import {
  createIncident,
  filterIncidents,
  getIncident,
  getIncidentHistory,
  listIncidents,
} from '../helpers/incidents.js';
import { buildSummary } from '../helpers/summary.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: __ENV.K6_SPIKE_WARMUP || '30s', target: 10 },
        { duration: __ENV.K6_SPIKE_DURATION || '30s', target: 150 },
        { duration: __ENV.K6_SPIKE_RECOVERY || '30s', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: exploratoryThresholds,
};

export function setup() {
  return login();
}

export default function (auth) {
  const operation = randomInt(1, 100);

  if (operation <= 45) {
    listIncidents(auth.accessToken);
  } else if (operation <= 70) {
    filterIncidents(auth.accessToken);
  } else if (operation <= 85) {
    getIncident(auth.accessToken);
  } else if (operation <= 96) {
    getIncidentHistory(auth.accessToken);
  } else {
    createIncident(auth.accessToken);
  }

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('spike', data);
}
