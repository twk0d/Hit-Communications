import { sleep } from 'k6';

import { THINK_TIME_SECONDS, cappedVus, exploratoryThresholds } from '../config.js';
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
    soak: {
      executor: 'constant-vus',
      vus: cappedVus(__ENV.K6_SOAK_VUS, 125),
      duration: __ENV.K6_SOAK_DURATION || '10m',
    },
  },
  thresholds: exploratoryThresholds,
};

export function setup() {
  return login();
}

export default function (auth) {
  const operation = randomInt(1, 100);

  if (operation <= 55) {
    listIncidents(auth.accessToken);
  } else if (operation <= 78) {
    filterIncidents(auth.accessToken);
  } else if (operation <= 90) {
    getIncident(auth.accessToken);
  } else if (operation <= 98) {
    getIncidentHistory(auth.accessToken);
  } else {
    createIncident(auth.accessToken);
  }

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('soak', data);
}
