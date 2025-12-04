import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '1m', target: 100 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        errors: ['rate<0.1'],
    },
};

const CONFIG = {
    baseUrl: 'https://pr.avidusinteractive.com/api/web',
    endpoints: [
        {
            method: 'GET', path: 'inventory-transfer?', name: 'Inventory transfer' },
    ],
    headers: {
        'Accept': 'application/json',
    },
    acceptableStatus: [200, 304],
    sleepDuration: 1,
};

export default function () {
    const requests = CONFIG.endpoints.map(endpoint => {
        return [
            endpoint.method,
            `${CONFIG.baseUrl}${endpoint.path}`,
            endpoint.body || null,
            { headers: CONFIG.headers }
        ];
    });

    const responses = http.batch(requests);

    responses.forEach((response, index) => {
        const endpoint = CONFIG.endpoints[index];

        const responseCheck = check(response, {
            [`${endpoint.name} status is acceptable`]: (r) => CONFIG.acceptableStatus.includes(r.status),
            [`${endpoint.name} response time < 2000ms`]: (r) => r.timings.duration < 2000,
        });

        errorRate.add(!responseCheck);
    });

    sleep(CONFIG.sleepDuration);
}