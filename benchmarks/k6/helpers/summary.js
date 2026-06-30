import { BASE_URL } from '../config.js';

export function buildSummary(name, data) {
  return {
    stdout: buildConsoleSummary(name, data),
    [`/results/${name}-summary.json`]: JSON.stringify(data, null, 2),
    [`/results/${name}-summary.md`]: buildMarkdownSummary(name, data),
  };
}

function buildConsoleSummary(name, data) {
  return [
    '',
    `Benchmark scenario: ${name}`,
    `Base URL: ${BASE_URL}`,
    `Requests: ${metricValue(data, 'http_reqs', 'count')}`,
    `Failures: ${formatPercent(metricValue(data, 'http_req_failed', 'rate'))}`,
    `p50: ${formatMs(metricValue(data, 'http_req_duration', 'p(50)'))}`,
    `p90: ${formatMs(metricValue(data, 'http_req_duration', 'p(90)'))}`,
    `p95: ${formatMs(metricValue(data, 'http_req_duration', 'p(95)'))}`,
    `p99: ${formatMs(metricValue(data, 'http_req_duration', 'p(99)'))}`,
    '',
  ].join('\n');
}

function buildMarkdownSummary(name, data) {
  return `# k6 Benchmark Result - ${name}

Generated at: ${new Date().toISOString()}

Base URL: \`${BASE_URL}\`

## Metrics

| Metric | Value |
| --- | ---: |
| Requests | ${metricValue(data, 'http_reqs', 'count')} |
| Iterations | ${metricValue(data, 'iterations', 'count')} |
| Failure rate | ${formatPercent(metricValue(data, 'http_req_failed', 'rate'))} |
| Checks rate | ${formatPercent(metricValue(data, 'checks', 'rate'))} |
| Duration avg | ${formatMs(metricValue(data, 'http_req_duration', 'avg'))} |
| Duration p50 | ${formatMs(metricValue(data, 'http_req_duration', 'p(50)'))} |
| Duration p90 | ${formatMs(metricValue(data, 'http_req_duration', 'p(90)'))} |
| Duration p95 | ${formatMs(metricValue(data, 'http_req_duration', 'p(95)'))} |
| Duration p99 | ${formatMs(metricValue(data, 'http_req_duration', 'p(99)'))} |
| VUs max | ${metricValue(data, 'vus_max', 'max')} |

## Notes

- Results are a local baseline, not a production capacity promise.
- Record machine specs, commit hash, API execution mode and dataset size before using this number in documentation.
`;
}

function metricValue(data, metricName, valueName) {
  const value = data.metrics[metricName] && data.metrics[metricName].values[valueName];

  if (value === undefined || value === null) {
    return 'n/a';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatMs(value) {
  if (value === 'n/a') {
    return value;
  }

  return `${value} ms`;
}

function formatPercent(value) {
  if (value === 'n/a') {
    return value;
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
}
