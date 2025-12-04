import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        errors: ['rate<0.1'],
    },
};

const BASE_URL = 'https://pr.avidusinteractive.com/api/web';

export default function () {
    const locationResponse = http.get(`${BASE_URL}/location`, {
        headers: {
            'Accept': 'application/json',
        },
    });

    const locationCheck = check(locationResponse, {
        'location status is 200 or 304': (r) => r.status === 200 || r.status === 304,
        'location response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!locationCheck);

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}