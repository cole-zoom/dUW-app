"use client"

import { Button } from "@/components/ui/button"
import { LayoutDashboard, Home, Wallet } from "lucide-react"
import Link from "next/link"

export function Sidebar() {
  return (
    <aside className="border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Wallet className="h-6 w-6" />
        <span className="font-bold">dUWiligence</span>
      </div>
      <nav className="space-y-2 px-2 mt-4">
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link href="/home">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link href="/portfolio">
            <Wallet className="h-4 w-4" />
            Portfolios
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </nav>
    </aside>
  )
}
