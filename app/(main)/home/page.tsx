"use client"

import React from "react"
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout"
import { PixelText } from "@/components/8bit/PixelLetter"

export default function HomePage() {
  return (
    <AuthenticatedLayout>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <PixelText text="DUWILIGENCE" size={36} className="mb-6" />
        <p className="font-mono text-muted-foreground text-center">
          Your Portfolio-Specific Newsletter
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
