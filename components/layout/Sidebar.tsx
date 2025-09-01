"use client"

import { Button } from "@/components/ui/button"
import { LayoutDashboard, Home, Wallet, LogOut } from "lucide-react"
import Link from "next/link"
import { useUser } from "@stackframe/stack"

export function Sidebar() {
  const user = useUser()

  const handleSignOut = async () => {
    try {
      await user?.signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <aside className="border-r bg-card h-screen flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Wallet className="h-6 w-6" />
        <span className="font-bold">Duwiligence</span>
      </div>
      <nav className="space-y-2 px-2 mt-4 flex-1">
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
      <div className="p-2 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
