import { sleep } from 'k6';

import { THINK_TIME_SECONDS, loadThresholds } from '../config.js';
import { randomInt } from '../helpers/data.js';
import { login } from '../helpers/auth.js';
import {
  createAndResolveIncident,
  createAndUpdateIncident,
  createIncident,
  filterIncidents,
  getIncident,
  listIncidents,
} from '../helpers/incidents.js';
import { buildSummary } from '../helpers/summary.js';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: __ENV.K6_LOAD_RAMP_UP || '30s', target: Number(__ENV.K6_LOAD_VUS || '50') },
        { duration: __ENV.K6_LOAD_DURATION || '2m', target: Number(__ENV.K6_LOAD_VUS || '50') },
        { duration: __ENV.K6_LOAD_RAMP_DOWN || '30s', target: 0 },
      ],
    },
  },
  thresholds: loadThresholds,
};

export function setup() {
  return login();
}

export default function (auth) {
  const operation = randomInt(1, 100);

  if (operation <= 40) {
    listIncidents(auth.accessToken);
  } else if (operation <= 60) {
    filterIncidents(auth.accessToken);
  } else if (operation <= 75) {
    getIncident(auth.accessToken);
  } else if (operation <= 88) {
    createIncident(auth.accessToken);
  } else if (operation <= 96) {
    createAndUpdateIncident(auth.accessToken);
  } else {
    createAndResolveIncident(auth.accessToken);
  }

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('load', data);
}
