import { z } from 'zod';

export type ServiceStatus = 'operational' | 'degraded' | 'outage';
export type DependencyStatus = 'connected' | 'disconnected' | 'unconfigured';

export interface HealthDependencies {
  database: DependencyStatus;
  storage: DependencyStatus;
}

export const HealthDependenciesSchema = z.object({
  database: z.enum(['connected', 'disconnected', 'unconfigured']),
  storage: z.enum(['connected', 'disconnected', 'unconfigured']),
});

export interface HealthData {
  application: string;
  status: ServiceStatus;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  dependencies: HealthDependencies;
}

export const HealthDataSchema = z.object({
  application: z.string(),
  status: z.enum(['operational', 'degraded', 'outage']),
  timestamp: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  version: z.string(),
  dependencies: HealthDependenciesSchema,
});

export interface LivenessData {
  status: 'up';
  timestamp: string;
}

export const LivenessDataSchema = z.object({
  status: z.literal('up'),
  timestamp: z.string(),
});
