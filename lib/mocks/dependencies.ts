export interface ServiceDeps {
  upstreamCallers: string[]
  downstreamDeps: string[]
  estimatedUsersAffected: number
  featuresDown: string[]
}

export const SERVICE_GRAPH: Record<string, ServiceDeps> = {
  'checkout-api': {
    upstreamCallers: ['web-frontend', 'mobile-app', 'order-service'],
    downstreamDeps: ['postgres-primary', 'payment-processor', 'fraud-detection'],
    estimatedUsersAffected: 12000,
    featuresDown: ['checkout', 'order-confirmation'],
  },
  'auth-service': {
    upstreamCallers: ['web-frontend', 'mobile-app', 'checkout-api', 'admin-portal'],
    downstreamDeps: ['postgres-primary', 'redis-session'],
    estimatedUsersAffected: 45000,
    featuresDown: ['login', 'session-refresh', 'all-authenticated-features'],
  },
  'background-worker': {
    upstreamCallers: ['job-scheduler'],
    downstreamDeps: ['postgres-replica', 'email-service'],
    estimatedUsersAffected: 0,
    featuresDown: [],
  },
}
