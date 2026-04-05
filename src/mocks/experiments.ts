import type { Experiment, ExperimentMetrics } from '../types'

// Experiments now link to Decision Flows and compare Rule Groups within a flow.
// flow_id → DecisionFlow.id | rule_group_id → RuleGroupObject.id inside that flow

export const mockExperiments: Experiment[] = [
  {
    // Comparing two eligibility rule groups inside TNC_CATHAY (flow id 2)
    id: 'exp-001',
    name: 'Cathay — Which segment converts better?',
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
        name: 'Segment A — Core eligible',
        rule_group_id: 'rg-005',
        rule_group_name: 'User đủ điều kiện',
        rule_group_snapshot: {
          id: 'rg-005', order: 3, name: 'User đủ điều kiện', logic: 'ALL',
          conditions: [
            { id: 'c-010', fact_name: 'User ekyc status', operator: '=', value: 'completed', enabled: true },
            { id: 'c-011', fact_name: 'Platform', operator: '=', value: 'ZPA', enabled: true },
          ],
          local_facts: {},
          actions: [{ type: 'response', value: 'CONFIRM_CONDITION' }],
        },
      },
      {
        id: 'var-002',
        experiment_id: 'exp-001',
        name: 'Segment B — City-excluded users',
        rule_group_id: 'rg-004',
        rule_group_name: 'Loại user thuộc tỉnh rủi ro cao',
        rule_group_snapshot: {
          id: 'rg-004', order: 2, name: 'Loại user thuộc tỉnh rủi ro cao', logic: 'ALL',
          conditions: [
            { id: 'c-009', fact_name: 'User current city', operator: 'in', value: ['Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa'], enabled: true },
          ],
          local_facts: {},
          actions: [{ type: 'response', value: 'NOT_ELIGIBLE' }],
        },
      },
    ],
  },
  {
    // Comparing two rule groups inside OAO_HUB (flow id 1) — which targeting rule drives more clicks?
    id: 'exp-002',
    name: 'OAO Hub — Cathay vs MSB targeting priority',
    flow_id: 1,
    flow_name: 'OAO_HUB',
    status: 'draft',
    start_time: '2025-04-01T00:00:00Z',
    end_time: '2025-05-01T00:00:00Z',
    created_at: '2025-03-20T10:00:00Z',
    variants: [
      {
        id: 'var-003',
        experiment_id: 'exp-002',
        name: 'Targeting — Cathay priority rule',
        rule_group_id: 'rg-001',
        rule_group_name: 'Cathay Priority Rule',
        rule_group_snapshot: {
          id: 'rg-001', order: 1, name: 'Cathay Priority Rule', logic: 'ALL',
          conditions: [
            { id: 'c-001', fact_name: 'User age', operator: '>=', value: '22', enabled: true },
            { id: 'c-002', fact_name: 'User age', operator: '<=', value: '55', enabled: true },
            { id: 'c-003', fact_name: 'Platform', operator: '=', value: 'ZPA', enabled: true },
            { id: 'c-004', fact_name: 'Bank OAO status active', operator: '=', value: 'true', enabled: true },
          ],
          local_facts: { bank_code: 'CATHAY' },
          actions: [{ type: 'response', value: 'Cathay United Bank' }],
        },
      },
      {
        id: 'var-004',
        experiment_id: 'exp-002',
        name: 'Targeting — MSB priority rule',
        rule_group_id: 'rg-002',
        rule_group_name: 'MSB Priority Rule',
        rule_group_snapshot: {
          id: 'rg-002', order: 2, name: 'MSB Priority Rule', logic: 'ALL',
          conditions: [
            { id: 'c-005', fact_name: 'User age', operator: '>=', value: '22', enabled: true },
            { id: 'c-006', fact_name: 'Has existing loan', operator: '=', value: 'false', enabled: true },
          ],
          local_facts: { bank_code: 'MSB' },
          actions: [{ type: 'response', value: 'Maritime Bank' }],
        },
      },
    ],
  },
  {
    // Stopped experiment — MSB eligibility rule groups
    id: 'exp-003',
    name: 'MSB — Loan eligibility segments Q4 2024',
    flow_id: 3,
    flow_name: 'TNC_MSB',
    status: 'draft',
    start_time: '2024-10-01T00:00:00Z',
    end_time: '2024-12-31T00:00:00Z',
    created_at: '2024-09-25T00:00:00Z',
    variants: [
      {
        id: 'var-005',
        experiment_id: 'exp-003',
        name: 'Segment — Has existing loan (blocked)',
        rule_group_id: 'rg-006',
        rule_group_name: 'Loại user đang có loan',
        rule_group_snapshot: {
          id: 'rg-006', order: 1, name: 'Loại user đang có loan', logic: 'ALL',
          conditions: [
            { id: 'c-012', fact_name: 'Has existing loan', operator: '=', value: 'true', enabled: true },
          ],
          local_facts: {},
          actions: [{ type: 'response', value: 'NOT_ELIGIBLE' }],
        },
      },
      {
        id: 'var-006',
        experiment_id: 'exp-003',
        name: 'Segment — Qualified loan applicants',
        rule_group_id: 'rg-007',
        rule_group_name: 'User đủ điều kiện vay',
        rule_group_snapshot: {
          id: 'rg-007', order: 2, name: 'User đủ điều kiện vay', logic: 'ALL',
          conditions: [
            { id: 'c-013', fact_name: 'User age', operator: '>=', value: '22', enabled: true },
            { id: 'c-014', fact_name: 'User ekyc status', operator: '=', value: 'completed', enabled: true },
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
    { variant_id: 'var-001', variant_name: 'Segment A — Core eligible', impressions: 45200, clicks: 8136, conversions: 1220, ctr: 0.18, cvr: 0.15, revenue: 610000000 },
    { variant_id: 'var-002', variant_name: 'Segment B — City-excluded users', impressions: 12400, clicks: 1116, conversions: 89, ctr: 0.09, cvr: 0.08, revenue: 44500000 },
  ],
  'exp-003': [
    { variant_id: 'var-005', variant_name: 'Segment — Has existing loan (blocked)', impressions: 38000, clicks: 1520, conversions: 0, ctr: 0.04, cvr: 0, revenue: 0 },
    { variant_id: 'var-006', variant_name: 'Segment — Qualified loan applicants', impressions: 94000, clicks: 18800, conversions: 3008, ctr: 0.20, cvr: 0.16, revenue: 1504000000 },
  ],
}
