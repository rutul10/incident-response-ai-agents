import { MockAlert } from '../types'

export const MOCK_SCENARIOS: Record<string, MockAlert> = {
  'checkout-db-pool': {
    id: 'INC-001',
    scenarioId: 'checkout-db-pool',
    service: 'checkout-api',
    summary: 'High error rate detected — 42% of requests failing',
    severity: 'critical',
    triggeredAt: '2024-01-15T14:32:00Z',
    details: { errorRate: 42.3, threshold: 5.0, environment: 'production' }
  },
  'auth-latency': {
    id: 'INC-002',
    scenarioId: 'auth-latency',
    service: 'auth-service',
    summary: 'P99 latency exceeding 3s threshold',
    severity: 'warning',
    triggeredAt: '2024-01-15T16:10:00Z',
    details: { errorRate: 3.1, threshold: 1.0, environment: 'production' }
  },
  'noise-alert': {
    id: 'INC-003',
    scenarioId: 'noise-alert',
    service: 'background-worker',
    summary: 'Single pod restart detected',
    severity: 'info',
    triggeredAt: '2024-01-15T18:45:00Z',
    details: { errorRate: 0.2, threshold: 1.0, environment: 'production' }
  }
}
