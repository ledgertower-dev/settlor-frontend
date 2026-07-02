'use client'

import { useState } from 'react'

import { DashboardDateFilter, resolvePreset, type DateFilterValue } from './DashboardDateFilter'
import { DashboardPayoutCards } from './PayoutMetricCards'
import { StatusSplitBarChart, StatusSplitDonutChart } from './StatusSplitSection'
import { AccountDetailsCard } from './AccountDetailsCard'
import { DashboardVolumeRateCards } from './TodayVsYesterdayCards'
import { RecentTransactionsTable } from './RecentTransactionsTable'

export function MerchantDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => ({
    preset: 'today',
    ...resolvePreset('today'),
  }))

  return (
    <div className="flex flex-col gap-3.5">
      {/* Welcome + date filter */}
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-2xl md:text-5xl leading-none text-normal">Welcome Back</p>
          <p className="text-lg text-muted-foreground">
            {"Here's your financial overview for today."}
          </p>
        </div>
        <DashboardDateFilter className="w-fit max-w-full" onChange={setDateFilter} />
      </div>

      {/* Payout metric cards */}
      <DashboardPayoutCards dateFilter={dateFilter} />

      {/* Status split (bar) + Account details */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)]">
        <StatusSplitBarChart />
        <AccountDetailsCard />
      </div>

      {/* Status split breakdown + Total Volume + Success Rate */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <StatusSplitDonutChart />
        <DashboardVolumeRateCards />
      </div>

      {/* Recent transactions */}
      <RecentTransactionsTable />
    </div>
  )
}
