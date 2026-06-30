import { sleep } from 'k6';

import { THINK_TIME_SECONDS, exploratoryThresholds } from '../config.js';
import { randomInt } from '../helpers/data.js';
import { login } from '../helpers/auth.js';
import {
  createAndResolveIncident,
  createIncident,
  filterIncidents,
  getIncident,
  listIncidents,
} from '../helpers/incidents.js';
import { buildSummary } from '../helpers/summary.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: __ENV.K6_STRESS_STAGE_DURATION || '1m', target: 25 },
        { duration: __ENV.K6_STRESS_STAGE_DURATION || '1m', target: 50 },
        { duration: __ENV.K6_STRESS_STAGE_DURATION || '1m', target: 100 },
        { duration: __ENV.K6_STRESS_STAGE_DURATION || '1m', target: 150 },
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

  if (operation <= 50) {
    listIncidents(auth.accessToken);
  } else if (operation <= 72) {
    filterIncidents(auth.accessToken);
  } else if (operation <= 87) {
    getIncident(auth.accessToken);
  } else if (operation <= 96) {
    createIncident(auth.accessToken);
  } else {
    createAndResolveIncident(auth.accessToken);
  }

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('stress', data);
}
