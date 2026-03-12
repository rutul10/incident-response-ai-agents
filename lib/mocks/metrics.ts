export interface MetricDataPoint {
  timestamp: string
  value: number
}

export interface DeployEvent {
  timestamp: string
  version: string
  author: string
  description: string
}

export interface ServiceMetrics {
  errorRate: MetricDataPoint[]
  latencyP99: MetricDataPoint[]
  recentDeploys: DeployEvent[]
}

export const MOCK_METRICS: Record<string, ServiceMetrics> = {
  'checkout-api': {
    errorRate: [
      { timestamp: '2024-01-15T14:00:00Z', value: 0.8 },
      { timestamp: '2024-01-15T14:10:00Z', value: 1.2 },
      { timestamp: '2024-01-15T14:20:00Z', value: 5.4 },
      { timestamp: '2024-01-15T14:25:00Z', value: 18.7 },
      { timestamp: '2024-01-15T14:30:00Z', value: 42.3 },
      { timestamp: '2024-01-15T14:35:00Z', value: 41.8 },
      { timestamp: '2024-01-15T14:40:00Z', value: 43.1 },
    ],
    latencyP99: [
      { timestamp: '2024-01-15T14:00:00Z', value: 120 },
      { timestamp: '2024-01-15T14:10:00Z', value: 145 },
      { timestamp: '2024-01-15T14:20:00Z', value: 890 },
      { timestamp: '2024-01-15T14:25:00Z', value: 2300 },
      { timestamp: '2024-01-15T14:30:00Z', value: 4500 },
      { timestamp: '2024-01-15T14:35:00Z', value: 4800 },
      { timestamp: '2024-01-15T14:40:00Z', value: 5100 },
    ],
    recentDeploys: [
      {
        timestamp: '2024-01-15T14:15:00Z',
        version: 'v2.34.1',
        author: 'jsmith',
        description: 'Increase max DB pool connections from 20 to 100',
      },
    ],
  },
  'auth-service': {
    errorRate: [
      { timestamp: '2024-01-15T15:40:00Z', value: 0.3 },
      { timestamp: '2024-01-15T15:50:00Z', value: 0.5 },
      { timestamp: '2024-01-15T16:00:00Z', value: 1.8 },
      { timestamp: '2024-01-15T16:05:00Z', value: 2.4 },
      { timestamp: '2024-01-15T16:10:00Z', value: 3.1 },
      { timestamp: '2024-01-15T16:15:00Z', value: 3.4 },
      { timestamp: '2024-01-15T16:20:00Z', value: 3.2 },
    ],
    latencyP99: [
      { timestamp: '2024-01-15T15:40:00Z', value: 200 },
      { timestamp: '2024-01-15T15:50:00Z', value: 450 },
      { timestamp: '2024-01-15T16:00:00Z', value: 1800 },
      { timestamp: '2024-01-15T16:05:00Z', value: 2600 },
      { timestamp: '2024-01-15T16:10:00Z', value: 3200 },
      { timestamp: '2024-01-15T16:15:00Z', value: 3500 },
      { timestamp: '2024-01-15T16:20:00Z', value: 3300 },
    ],
    recentDeploys: [
      {
        timestamp: '2024-01-15T15:45:00Z',
        version: 'v1.12.0',
        author: 'alee',
        description: 'Add rate limiting to /token endpoint',
      },
    ],
  },
}
