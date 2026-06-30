import http from 'k6/http';
import { check } from 'k6';

import { BASE_URL, REQUEST_TIMEOUT } from '../config.js';

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

export function requestParams(headers, tags = {}) {
  return {
    headers,
    timeout: REQUEST_TIMEOUT,
    tags,
  };
}

export function apiGet(path, token, tags = {}, expectedStatuses = [200]) {
  const response = http.get(`${BASE_URL}${path}`, requestParams(authHeaders(token), tags));
  checkExpectedStatus(response, tags.name || `GET ${path}`, expectedStatuses);
  return response;
}

export function apiPost(path, body, token, tags = {}, expectedStatuses = [201]) {
  const response = http.post(
    `${BASE_URL}${path}`,
    JSON.stringify(body),
    requestParams(token ? authHeaders(token) : jsonHeaders(), tags),
  );
  checkExpectedStatus(response, tags.name || `POST ${path}`, expectedStatuses);
  return response;
}

export function apiPatch(path, body, token, tags = {}, expectedStatuses = [200]) {
  const response = http.patch(
    `${BASE_URL}${path}`,
    JSON.stringify(body),
    requestParams(authHeaders(token), tags),
  );
  checkExpectedStatus(response, tags.name || `PATCH ${path}`, expectedStatuses);
  return response;
}

export function apiDelete(path, token, tags = {}, expectedStatuses = [204]) {
  const response = http.del(`${BASE_URL}${path}`, null, requestParams(authHeaders(token), tags));
  checkExpectedStatus(response, tags.name || `DELETE ${path}`, expectedStatuses);
  return response;
}

export function safeJson(response) {
  try {
    return response.json();
  } catch (_error) {
    return undefined;
  }
}

export function checkExpectedStatus(response, name, expectedStatuses) {
  check(response, {
    [`${name} returned expected status`]: (res) => expectedStatuses.includes(res.status),
  });
}
