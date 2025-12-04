import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const baseUrl = 'https://pr.avidusinteractive.com/api/web';
const userId = '663a083316b02d57048c6eac';

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

export default function () {
    activeConnections.add(1);

    group('Purchase Request Status', () => {
        const statusRes = http.get(
            `${baseUrl}/purchase-request-status?userId=${userId}&site=&title=&itemId=&startDate=&endDate=&prType=&purchase_request_number=`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'k6-load-test/1.0',
                },
                timeout: '30s',
            }
        );

        requestCounter.add(1);
        responseTime.add(statusRes.timings.duration);

        check(statusRes, {
            'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'response time < 1000ms': (r) => r.timings.duration < 1000,
            'has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(1);

    group('Category', () => {
        const catRes = http.get(`${baseUrl}/category`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'k6-load-test/1.0',
            },
            timeout: '30s',
        });

        requestCounter.add(1);
        responseTime.add(catRes.timings.duration);

        check(catRes, {
            'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'response time < 1000ms': (r) => r.timings.duration < 1000,
            'has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(1);

    group('Site', () => {
        const siteRes = http.get(`${baseUrl}/site`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'k6-load-test/1.0',
            },
            timeout: '30s',
        });

        requestCounter.add(1);
        responseTime.add(siteRes.timings.duration);

        check(siteRes, {
            'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'response time < 1000ms': (r) => r.timings.duration < 1000,
            'has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(1);

    group('Purchase Request Filtered', () => {
        const prFilterRes = http.get(
            `${baseUrl}/purchase-request?page=1&per_page=20&filter_by=status&filter_value=pending&userId=${userId}&PM_approvedBy=true&site=&title=`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'k6-load-test/1.0',
                },
                timeout: '30s',
            }
        );

        requestCounter.add(1);
        responseTime.add(prFilterRes.timings.duration);

        check(prFilterRes, {
            'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'response time < 1000ms': (r) => r.timings.duration < 1000,
            'has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(1);

    group('Users', () => {
        const usersRes = http.get(`${baseUrl}/users/${userId}`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'k6-load-test/1.0',
            },
            timeout: '30s',
        });

        requestCounter.add(1);
        responseTime.add(usersRes.timings.duration);

        check(usersRes, {
            'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'response time < 1000ms': (r) => r.timings.duration < 1000,
            'has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(2);
    activeConnections.add(-1);
}