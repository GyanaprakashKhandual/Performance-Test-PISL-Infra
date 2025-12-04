import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const baseUrl = 'https://pr.avidusinteractive.com/api/web';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCounter = new Counter('requests');
const activeConnections = new Gauge('active_connections');

export const options = {
    stages: [
        { duration: '15s', target: 10 },
        { duration: '45s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '45s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
        'errors': ['rate<0.1'],
        'http_req_failed': ['rate<0.05'],
    },
};

const endpoints = [
    '/users/663a083316b02d57048c6eac',
    '/uom',
    '/brand',
    '/site',
    '/category',
];

export default function () {
    activeConnections.add(1);

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    const response = http.get(`${baseUrl}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'k6-load-test/1.0',
        },
        timeout: '30s',
    });

    requestCounter.add(1);
    responseTime.add(response.timings.duration);

    check(response, {
        'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
        'has content': (r) => r.body && r.body.length > 0,
    }) || errorRate.add(1);

    sleep(1);
    activeConnections.add(-1);
}