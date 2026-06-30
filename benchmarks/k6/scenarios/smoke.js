import { sleep } from 'k6';

import { THINK_TIME_SECONDS, smokeThresholds } from '../config.js';
import { login } from '../helpers/auth.js';
import {
  createAndResolveIncident,
  createIncident,
  filterIncidents,
  getIncident,
  getIncidentHistory,
  listIncidents,
} from '../helpers/incidents.js';
import { buildSummary } from '../helpers/summary.js';

export const options = {
  vus: 1,
  duration: __ENV.K6_SMOKE_DURATION || '30s',
  thresholds: smokeThresholds,
};

export function setup() {
  return login();
}

export default function (auth) {
  listIncidents(auth.accessToken);
  filterIncidents(auth.accessToken);
  getIncident(auth.accessToken);
  getIncidentHistory(auth.accessToken);
  createIncident(auth.accessToken);
  createAndResolveIncident(auth.accessToken);

  sleep(THINK_TIME_SECONDS);
}

export function handleSummary(data) {
  return buildSummary('smoke', data);
}
