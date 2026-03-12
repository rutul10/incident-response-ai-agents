export interface Runbook {
  id: string
  title: string
  tags: string[]
  content: string
}

export const RUNBOOKS: Runbook[] = [
  {
    id: 'rb-001',
    title: 'Database Connection Pool Exhaustion',
    tags: ['database', 'connection-pool', 'postgres', 'pgbouncer'],
    content: `# Database Connection Pool Exhaustion

## Symptoms
- High error rates on services connecting to PostgreSQL
- "cannot assign connection" errors in logs
- Query timeouts increasing

## Diagnosis
1. Check PgBouncer stats: \`SHOW POOLS\` and \`SHOW STATS\`
2. Verify max_connections in PostgreSQL config
3. Check for long-running queries: \`SELECT * FROM pg_stat_activity WHERE state != 'idle'\`
4. Review recent deploys that may have changed pool settings

## Remediation
1. **Immediate:** Roll back recent config changes to pool settings
2. **Short-term:** Kill long-running queries if identified
3. **Long-term:** Right-size connection pool based on actual workload
   - Rule of thumb: max_connections = (num_cores * 2) + effective_spindle_count
   - Never exceed PostgreSQL max_connections (default: 100)

## Estimated MTTR
- Rollback: 5-10 minutes
- Manual fix: 15-30 minutes`,
  },
  {
    id: 'rb-002',
    title: 'High Latency — Redis Bottleneck',
    tags: ['redis', 'latency', 'rate-limiting', 'session'],
    content: `# High Latency — Redis Bottleneck

## Symptoms
- P99 latency exceeding SLA thresholds
- Redis SLOWLOG showing blocking commands
- CPU usage on Redis nodes > 80%

## Diagnosis
1. Check Redis SLOWLOG: \`SLOWLOG GET 10\`
2. Look for expensive LUA scripts or large key scans
3. Verify rate limiter configuration (sliding window size, key expiry)
4. Check Redis memory usage and eviction policy

## Remediation
1. **Immediate:** Disable or bypass the offending LUA script / rate limiter
2. **Short-term:** Optimize the rate limiter — use fixed window instead of sliding window
3. **Long-term:** Move rate limiting to a dedicated Redis instance

## Estimated MTTR
- Config change: 5-15 minutes
- Code fix: 30-60 minutes`,
  },
  {
    id: 'rb-003',
    title: 'Pod Restart / CrashLoopBackOff',
    tags: ['kubernetes', 'pod', 'restart', 'crashloop', 'oom'],
    content: `# Pod Restart / CrashLoopBackOff

## Symptoms
- Pod restart count increasing
- CrashLoopBackOff status in kubectl
- OOMKilled events in pod describe

## Diagnosis
1. Check pod events: \`kubectl describe pod <name>\`
2. Check logs from previous container: \`kubectl logs <pod> --previous\`
3. Check resource limits vs actual usage
4. Look for memory leaks in application metrics

## Remediation
1. **Immediate:** If single pod, usually self-heals — monitor for 10 minutes
2. **If recurring:** Increase memory limits in deployment spec
3. **If OOM:** Profile application memory, fix leaks

## Estimated MTTR
- Self-heal: 2-5 minutes
- Resource adjustment: 10-15 minutes`,
  },
  {
    id: 'rb-004',
    title: 'Payment Processor Timeout',
    tags: ['payment', 'timeout', 'external-dependency', 'circuit-breaker'],
    content: `# Payment Processor Timeout

## Symptoms
- Checkout failures with 504 errors
- Payment processor health check failing
- Circuit breaker in OPEN state

## Diagnosis
1. Check payment processor status page
2. Verify network connectivity to payment endpoints
3. Review circuit breaker configuration and state
4. Check if issue is on our side (high load) or theirs (outage)

## Remediation
1. **Immediate:** Check if payment processor has a status page incident
2. **If our side:** Reduce request rate, enable request queuing
3. **If their side:** Switch to backup processor if available, enable graceful degradation
4. **Long-term:** Implement retry with exponential backoff, add backup payment provider

## Estimated MTTR
- Their outage: depends on provider (track their status page)
- Our side: 15-30 minutes`,
  },
]
