"use client"

import React from "react"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"

export default function HomePage() {
  return (
    <AuthenticatedLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">dUWiligence</h1>
        <p className="text-muted-foreground">This is your home page. Add widgets or quick links here.</p>
      </div>
    </AuthenticatedLayout>
  )
} 