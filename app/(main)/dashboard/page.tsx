"use client"

import React from "react"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-muted-foreground">Your dashboard overview will appear here.</p>
      </div>
    </AuthenticatedLayout>
  )
} 