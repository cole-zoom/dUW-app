"use client"

import React from "react"
import type { TickerDetails, PreviousCloseResponse } from "@/lib/types"

interface StockDetailsCardProps {
  details: TickerDetails | null
  previousClose: PreviousCloseResponse | null
  loading: boolean
}

export function StockDetailsCard({ details, previousClose, loading }: StockDetailsCardProps) {
  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-card h-full relative overflow-hidden">
        <div className="absolute inset-0 pixel-grid-overlay opacity-20" />
        <div className="flex items-center justify-center h-full relative z-10">
          <span className="font-mono animate-pulse">LOADING...</span>
        </div>
      </div>
    )
  }

  const prevClose = previousClose?.results?.[0]

  return (
    <div className="border rounded-lg p-6 bg-card h-full relative overflow-hidden">
      {/* Pixel grid background */}
      <div className="absolute inset-0 pixel-grid-overlay opacity-20" />

      <div className="relative z-10 h-full flex flex-col">
        {/* Company Name */}
        <h3 className="font-mono text-lg font-bold mb-4 line-clamp-2 uppercase tracking-wide">
          {details?.name || 'COMPANY DETAILS'}
        </h3>

        {/* Previous Close Summary */}
        {prevClose && (
          <div className="mb-6 p-4 bg-muted/30 relative">
            {/* Pixel corners */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-muted" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-muted" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-muted" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-muted" />

            <h4 className="font-mono text-[10px] uppercase text-muted-foreground mb-3 tracking-widest">
              PREV CLOSE
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              <DetailRow label="O" value={`$${prevClose.o.toFixed(2)}`} />
              <DetailRow label="C" value={`$${prevClose.c.toFixed(2)}`} />
              <DetailRow label="H" value={`$${prevClose.h.toFixed(2)}`} />
              <DetailRow label="L" value={`$${prevClose.l.toFixed(2)}`} />
              <div className="col-span-2">
                <DetailRow label="VOL" value={formatNumber(prevClose.v)} />
              </div>
            </div>
          </div>
        )}

        {/* Company Details */}
        {details && (
          <div className="space-y-3 font-mono text-sm flex-1">
            <DetailLine label="EXCHANGE" value={details.primary_exchange || 'N/A'} />
            <DetailLine label="TYPE" value={details.type?.toUpperCase() || 'N/A'} />
            <DetailLine label="MKT CAP" value={formatMarketCap(details.market_cap)} />
            <DetailLine label="EMPLOYEES" value={formatNumber(details.total_employees)} />
            <DetailLine label="CURRENCY" value={details.currency_name?.toUpperCase() || 'N/A'} />
            {details.list_date && (
              <DetailLine label="IPO" value={details.list_date} />
            )}

            {/* Description */}
            {details.description && (
              <div className="pt-3 border-t border-muted mt-auto">
                <p className="text-[11px] text-muted-foreground line-clamp-4 leading-relaxed">
                  {details.description}
                </p>
              </div>
            )}

            {/* Website Link */}
            {details.homepage_url && (
              <a
                href={details.homepage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#5A7A60] hover:underline font-bold uppercase tracking-wider"
              >
                &gt; VISIT WEBSITE
              </a>
            )}
          </div>
        )}

        {!details && !loading && (
          <div className="flex items-center justify-center flex-1">
            <span className="font-mono text-muted-foreground text-sm">
              SELECT A STOCK
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground text-[10px]">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-muted/30">
      <span className="text-muted-foreground text-[10px] tracking-wider">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  )
}

function formatMarketCap(value: number | undefined): string {
  if (!value) return 'N/A'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toFixed(0)}`
}

function formatNumber(value: number | undefined): string {
  if (!value) return 'N/A'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toLocaleString()
}
