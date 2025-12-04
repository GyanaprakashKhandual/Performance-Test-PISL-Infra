import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const baseUrl = 'https://pr.avidusinteractive.com/api/web';

const errorRate = new Rate('errors');
const projectsResponseTime = new Trend('projects_response_time');
const usersResponseTime = new Trend('users_response_time');
const projectsRequests = new Counter('projects_requests');
const usersRequests = new Counter('users_requests');
const activeConnections = new Gauge('active_connections');

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m30s', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m30s', target: 50 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
        'errors': ['rate<0.1'],
        'http_req_failed': ['rate<0.05'],
    },
    ext: {
        loadimpact: {
            projectID: 3356623,
            name: 'Avidus Interactive API Load Test',
        },
    },
};

export default function () {
    activeConnections.add(1);

    group('Projects API', () => {
        const projectsRes = http.get(`${baseUrl}/projects`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'k6-load-test/1.0',
            },
            timeout: '30s',
        });

        projectsRequests.add(1);
        projectsResponseTime.add(projectsRes.timings.duration);

        check(projectsRes, {
            'projects status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'projects response time < 1000ms': (r) => r.timings.duration < 1000,
            'projects has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(1);

    group('Users API', () => {
        const usersRes = http.get(`${baseUrl}/users/663a083316b02d57048c6eac`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'k6-load-test/1.0',
            },
            timeout: '30s',
        });

        usersRequests.add(1);
        usersResponseTime.add(usersRes.timings.duration);

        check(usersRes, {
            'users status is 200 or 304': (r) => r.status === 200 || r.status === 304,
            'users response time < 1000ms': (r) => r.timings.duration < 1000,
            'users has content': (r) => r.body && r.body.length > 0,
        }) || errorRate.add(1);
    });

    sleep(2);
    activeConnections.add(-1);
}