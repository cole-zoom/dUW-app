"use client"

import type React from "react"
import { AuthProvider } from "@/lib/AuthContext"
import { SecuritiesProvider } from "@/lib/SecuritiesContext"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SecuritiesProvider>
        {children}
      </SecuritiesProvider>
    </AuthProvider>
  )
}
