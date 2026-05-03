'use client'

import { useState } from 'react'
import { ApiCallHistoryTab } from '@/components/admin/ApiCallHistoryTab'
import { ApiUsageCostsTab } from '@/components/admin/ApiUsageCostsTab'
import { ApiConfigTab } from '@/components/admin/ApiConfigTab'

interface ApiCall {
  id: string
  created_at: string
  provider: string
  endpoint: string
  is_success: boolean
  latency_ms: number | null
  tokens_used: number | null
  cost_usd: number | null
  metadata: Record<string, unknown> | null
}

interface ChartDataPoint {
  date: string
  cost: number
}

interface ProviderBreakdown {
  provider: string
  calls: number
  cost: number
  errors: number
}

interface ApiConfig {
  id: string
  provider: string
  display_name: string
  is_active: boolean
  has_key: boolean
  api_key_last4: string
  env_var: string | null
  model: string | null
  test_status: string | null
  last_tested_at: string | null
  cost_per_1k_input: number | null
  cost_per_1k_output: number | null
}

interface ApiManagementTabsProps {
  calls: ApiCall[]
  chartData: ChartDataPoint[]
  providerBreakdown: ProviderBreakdown[]
  configs: ApiConfig[]
}

const TABS = ['CALL HISTORY', 'USAGE & COSTS', 'API CONFIGURATION'] as const

export function ApiManagementTabs({
  calls,
  chartData,
  providerBreakdown,
  configs,
}: ApiManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0])

  return (
    <>
      <div className="admin-chip-row" style={{ marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`admin-chip${activeTab === tab ? ' on' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'CALL HISTORY' && <ApiCallHistoryTab calls={calls} />}
      {activeTab === 'USAGE & COSTS' && (
        <ApiUsageCostsTab
          chartData={chartData}
          providerBreakdown={providerBreakdown}
        />
      )}
      {activeTab === 'API CONFIGURATION' && (
        <ApiConfigTab configs={configs} />
      )}
    </>
  )
}
