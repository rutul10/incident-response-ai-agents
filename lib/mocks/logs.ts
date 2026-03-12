export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'fatal'
  service: string
  message: string
}

export const MOCK_LOGS: Record<string, LogEntry[]> = {
  'checkout-api': [
    { timestamp: '2024-01-15T14:14:00Z', level: 'info', service: 'checkout-api', message: 'Deploying v2.34.1 — config change: DB pool max_connections 20 → 100' },
    { timestamp: '2024-01-15T14:15:02Z', level: 'info', service: 'checkout-api', message: 'Deploy v2.34.1 complete, rolling restart finished' },
    { timestamp: '2024-01-15T14:18:30Z', level: 'warn', service: 'checkout-api', message: 'Connection pool utilization at 85% (68/80 active)' },
    { timestamp: '2024-01-15T14:20:15Z', level: 'error', service: 'checkout-api', message: 'PgBouncer: cannot assign connection, all server connections in use' },
    { timestamp: '2024-01-15T14:20:45Z', level: 'error', service: 'checkout-api', message: 'Query timeout after 30s: SELECT * FROM orders WHERE user_id = $1' },
    { timestamp: '2024-01-15T14:22:10Z', level: 'error', service: 'checkout-api', message: 'POST /api/checkout — 503 Service Unavailable (database connection timeout)' },
    { timestamp: '2024-01-15T14:25:00Z', level: 'fatal', service: 'checkout-api', message: 'Circuit breaker OPEN for postgres-primary — 50 consecutive failures' },
    { timestamp: '2024-01-15T14:25:30Z', level: 'error', service: 'checkout-api', message: 'Downstream health check failed: payment-processor returning 504' },
    { timestamp: '2024-01-15T14:30:00Z', level: 'error', service: 'checkout-api', message: 'Error rate at 42.3% — PagerDuty alert triggered (threshold: 5%)' },
    { timestamp: '2024-01-15T14:32:00Z', level: 'warn', service: 'checkout-api', message: 'Auto-scaling triggered: 3 → 6 pods (CPU > 80%)' },
  ],
  'auth-service': [
    { timestamp: '2024-01-15T15:44:00Z', level: 'info', service: 'auth-service', message: 'Deploying v1.12.0 — adding rate limiting to /token endpoint' },
    { timestamp: '2024-01-15T15:45:10Z', level: 'info', service: 'auth-service', message: 'Deploy v1.12.0 complete, all pods healthy' },
    { timestamp: '2024-01-15T15:55:00Z', level: 'warn', service: 'auth-service', message: 'Redis session store latency elevated: p99 = 450ms (baseline: 50ms)' },
    { timestamp: '2024-01-15T16:00:30Z', level: 'error', service: 'auth-service', message: 'Token validation timeout — Redis SLOWLOG shows rate limiter LUA script blocking' },
    { timestamp: '2024-01-15T16:02:00Z', level: 'warn', service: 'auth-service', message: 'Rate limiter consuming 90% of Redis CPU — misconfigured sliding window' },
    { timestamp: '2024-01-15T16:05:15Z', level: 'error', service: 'auth-service', message: 'GET /auth/validate — 504 Gateway Timeout (upstream: redis-session)' },
    { timestamp: '2024-01-15T16:10:00Z', level: 'error', service: 'auth-service', message: 'P99 latency at 3200ms — PagerDuty alert triggered (threshold: 1000ms)' },
    { timestamp: '2024-01-15T16:12:00Z', level: 'warn', service: 'auth-service', message: 'Dependent services reporting auth failures: checkout-api, admin-portal' },
  ],
}
