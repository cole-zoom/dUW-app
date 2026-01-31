"use client"

import React, { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import type { AggregatesResponse } from "@/lib/types"

interface StockPriceChartProps {
  data: AggregatesResponse | null
  loading: boolean
  ticker: string
}

// 8-bit color palette
const COLORS = {
  positive: '#5A7A60',  // Green
  negative: '#A05050',  // Red
  line: '#A7C2D5',      // Muted blue
  grid: 'rgba(255, 255, 255, 0.1)',
  text: 'rgba(255, 255, 255, 0.7)',
}

export function StockPriceChart({ data, loading, ticker }: StockPriceChartProps) {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data?.results || data.results.length === 0) return []

    return data.results.map(bar => ({
      date: new Date(bar.t).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      timestamp: bar.t,
      close: bar.c,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      volume: bar.v,
      vwap: bar.vw,
    }))
  }, [data])

  // Calculate price change and OHLC summary
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentPrice: 0,
        priceChange: 0,
        percentChange: 0,
        isPositive: true,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
        vwap: 0,
      }
    }

    const first = chartData[0]
    const last = chartData[chartData.length - 1]
    const priceChange = last.close - first.open
    const percentChange = (priceChange / first.open) * 100

    // Calculate high/low across the period
    const high = Math.max(...chartData.map(d => d.high))
    const low = Math.min(...chartData.map(d => d.low))
    const totalVolume = chartData.reduce((sum, d) => sum + d.volume, 0)
    const avgVwap = chartData.reduce((sum, d) => sum + d.vwap, 0) / chartData.length

    return {
      currentPrice: last.close,
      priceChange,
      percentChange,
      isPositive: priceChange >= 0,
      open: first.open,
      high,
      low,
      close: last.close,
      volume: totalVolume,
      vwap: avgVwap,
    }
  }, [chartData])

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-card relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid-overlay opacity-30" />
        <div className="h-[400px] flex items-center justify-center relative z-10">
          <span className="font-mono animate-pulse text-lg">LOADING...</span>
        </div>
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid-overlay opacity-30" />
        <div className="h-[400px] flex items-center justify-center relative z-10">
          <span className="font-mono text-muted-foreground">NO DATA AVAILABLE</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 bg-card relative overflow-hidden">
      {/* Pixel grid background */}
      <div className="absolute inset-0 pixel-grid-overlay opacity-20" />

      {/* Scanline effect */}
      <div className="absolute inset-0 scanlines opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4">
          <h2 className="font-mono text-2xl font-bold tracking-wider">{ticker}</h2>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-3xl font-bold">
              ${stats.currentPrice.toFixed(2)}
            </span>
            <span
              className={`font-mono text-sm font-bold ${
                stats.isPositive ? 'text-[#5A7A60]' : 'text-[#A05050]'
              }`}
            >
              {stats.isPositive ? '+' : ''}
              {stats.priceChange.toFixed(2)} ({stats.percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={stats.isPositive ? COLORS.positive : COLORS.negative}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={stats.isPositive ? COLORS.positive : COLORS.negative}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.grid }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.grid }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(213, 11%, 13%)',
                  border: '2px solid hsl(214, 11%, 27%)',
                  borderRadius: '0',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                labelStyle={{ color: COLORS.text }}
                formatter={(value: number | undefined) => value !== undefined ? [`$${value.toFixed(2)}`, 'Price'] : ['N/A', 'Price']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={stats.isPositive ? COLORS.positive : COLORS.negative}
                strokeWidth={2}
                fill="url(#colorClose)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: stats.isPositive ? COLORS.positive : COLORS.negative,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* OHLC Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <StatBox label="OPEN" value={`$${stats.open.toFixed(2)}`} />
          <StatBox label="HIGH" value={`$${stats.high.toFixed(2)}`} color="positive" />
          <StatBox label="LOW" value={`$${stats.low.toFixed(2)}`} color="negative" />
          <StatBox label="CLOSE" value={`$${stats.close.toFixed(2)}`} />
          <StatBox label="VOLUME" value={formatVolume(stats.volume)} />
          <StatBox label="VWAP" value={`$${stats.vwap.toFixed(2)}`} />
        </div>
      </div>
    </div>
  )
}

interface StatBoxProps {
  label: string
  value: string
  color?: 'positive' | 'negative'
}

function StatBox({ label, value, color }: StatBoxProps) {
  const colorClass = color === 'positive'
    ? 'text-[#5A7A60]'
    : color === 'negative'
    ? 'text-[#A05050]'
    : 'text-foreground'

  return (
    <div className="bg-muted/30 p-3 relative overflow-hidden">
      {/* Pixel border effect */}
      <div className="absolute inset-0 border-2 border-muted" />
      <div className="absolute top-0 left-0 w-2 h-2 bg-muted" />
      <div className="absolute top-0 right-0 w-2 h-2 bg-muted" />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-muted" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-muted" />

      <div className="relative z-10">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className={`font-mono text-sm font-bold ${colorClass}`}>
          {value}
        </div>
      </div>
    </div>
  )
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
  return volume.toFixed(0)
}
