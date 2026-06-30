import { INCIDENT_ID } from '../config.js';
import { createIncidentPayload, updateIncidentPayload } from './data.js';
import { apiDelete, apiGet, apiPatch, apiPost, safeJson } from './http.js';

export function listIncidents(token) {
  return apiGet('/incidents?page=1&limit=10', token, {
    name: 'GET /incidents',
    operation: 'incident.list',
  });
}

export function filterIncidents(token) {
  return apiGet('/incidents?status=OPEN&priority=HIGH', token, {
    name: 'GET /incidents filters',
    operation: 'incident.list.filtered',
  });
}

export function getIncident(token, incidentId = INCIDENT_ID) {
  return apiGet(`/incidents/${incidentId}`, token, {
    name: 'GET /incidents/:id',
    operation: 'incident.get',
  });
}

export function getIncidentHistory(token, incidentId = INCIDENT_ID) {
  return apiGet(`/incidents/${incidentId}/history`, token, {
    name: 'GET /incidents/:id/history',
    operation: 'incident.history.list',
  });
}

export function createIncident(token) {
  const response = apiPost('/incidents', createIncidentPayload(), token, {
    name: 'POST /incidents',
    operation: 'incident.create',
  });

  return safeJson(response);
}

export function createAndUpdateIncident(token) {
  const incident = createIncident(token);

  if (!incident || !incident.id) {
    return;
  }

  apiPatch(`/incidents/${incident.id}`, updateIncidentPayload(), token, {
    name: 'PATCH /incidents/:id',
    operation: 'incident.update',
  });
}

export function createAndResolveIncident(token) {
  const incident = createIncident(token);

  if (!incident || !incident.id) {
    return;
  }

  apiPatch(`/incidents/${incident.id}/resolve`, {}, token, {
    name: 'PATCH /incidents/:id/resolve',
    operation: 'incident.resolve',
  });
}

export function createAndDeleteIncident(token) {
  const incident = createIncident(token);

  if (!incident || !incident.id) {
    return;
  }

  apiDelete(`/incidents/${incident.id}`, token, {
    name: 'DELETE /incidents/:id',
    operation: 'incident.softDelete',
  });
}
