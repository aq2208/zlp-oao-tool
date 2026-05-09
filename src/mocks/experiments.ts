import type { Experiment, ExperimentMetrics } from '../types'

export const mockExperiments: Experiment[] = [
  {
    id: 'exp-001',
    name: 'Cathay: Which segment converts better?',
    flow_id: 2,
    flow_name: 'TNC_CATHAY',
    status: 'running',
    start_time: '2025-03-01T00:00:00Z',
    end_time: '2025-04-01T00:00:00Z',
    created_at: '2025-02-25T09:00:00Z',
    variants: [
      {
        id: 'var-001',
        experiment_id: 'exp-001',
        name: 'Segment A: eKYC + age 18-30',
        rule_group_id: 'rg-005',
        rule_group_name: 'User đủ điều kiện (18-30)',
        rule_group_snapshot: {
          id: 'rg-005', order: 1, name: 'User đủ điều kiện (18-30)', logic: 'ALL',
          conditions: [
            { id: 'c-010', fact_name: 'User ekyc status', operator: '=', value: 'completed', enabled: true },
            { id: 'c-011', fact_name: 'User age', operator: '>=', value: '18', enabled: true },
            { id: 'c-012', fact_name: 'User age', operator: '<=', value: '30', enabled: true },
          ],
          local_facts: {},
          actions: [{ type: 'response', value: 'CONFIRM_CONDITION' }],
        },
      },
      {
        id: 'var-002',
        experiment_id: 'exp-001',
        name: 'Segment B: eKYC + age 31-45',
        rule_group_id: 'rg-006',
        rule_group_name: 'User đủ điều kiện (31-45)',
        rule_group_snapshot: {
          id: 'rg-006', order: 2, name: 'User đủ điều kiện (31-45)', logic: 'ALL',
          conditions: [
            { id: 'c-013', fact_name: 'User ekyc status', operator: '=', value: 'completed', enabled: true },
            { id: 'c-014', fact_name: 'User age', operator: '>=', value: '31', enabled: true },
            { id: 'c-015', fact_name: 'User age', operator: '<=', value: '45', enabled: true },
          ],
          local_facts: {},
          actions: [{ type: 'response', value: 'CONFIRM_CONDITION' }],
        },
      },
    ],
  },
]

export const mockMetrics: Record<string, ExperimentMetrics[]> = {
  'exp-001': [
    { variant_id: 'var-001', variant_name: 'Segment A: eKYC + age 18-30', impressions: 45200, clicks: 8136, conversions: 1220, ctr: 0.18, cvr: 0.15, revenue: 610000000 },
    { variant_id: 'var-002', variant_name: 'Segment B: eKYC + age 31-45', impressions: 38900, clicks: 6224, conversions: 1090, ctr: 0.16, cvr: 0.175, revenue: 545000000 },
  ],
}
