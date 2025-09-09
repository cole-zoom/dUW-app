"use client"

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Shield, Eye, ChartBar, ArrowRight, Sparkles, LineChart, PieChart } from 'lucide-react'
import { ThemeToggle } from '@/components/Theme/theme-toggle'
import { useStackApp } from "@stackframe/stack"

export default function LandingPage() {
  const { theme } = useTheme()
  const app = useStackApp()

  const handleAuth = async (mode: 'signin' | 'signup') => {
    if (!app) {
      alert("Authentication not configured. Check console for details.")
      return
    }

    try {
      if (mode === 'signin') {
        await app.redirectToSignIn()
      } else {
        await app.redirectToSignUp()
      }
    } catch (error) {
      console.error("❌ Authentication redirect failed:", error)
      alert(`Authentication failed: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">Duwiligence</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => handleAuth('signin')}
                className="text-foreground hover:bg-muted"
              >
                Log In
              </Button>
              <Button 
                onClick={() => handleAuth('signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            Do Ur oWn Diligence
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Provide your portfolio, and Duwiligence will generate clear, actionable insights.
            Analyze, track, and understand your investments — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => handleAuth('signup')}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center gap-2 px-8 py-6 text-lg"
            >
              Start your due diligence
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Portfolio Insights */}
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <ChartBar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Portfolio Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  Re-Create your existing portfolio and receive a comprehensive newsletter of the previous day's news.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Condensed Analysis */}
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Condensed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  Get a streamlined view of your holdings and track them all in one place.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Dashboard Overview */}
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">Dashboard Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-base">
                  Track portfolio performance in real-time with a clean, easy-to-read dashboard.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">What is Duwiligence?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Real-Time Tracking</h4>
              <p className="text-sm text-muted-foreground">Monitor your investments with live market data</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-secondary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Dashboard Building</h4>
              <p className="text-sm text-muted-foreground">Build your own dashboard to track your investments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Daily News</h4>
              <p className="text-sm text-muted-foreground">Recieve a daily newsletter of the previous day's news</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Portfolio Management</h4>
              <p className="text-sm text-muted-foreground">Manage your portfolio and track your investments</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-4xl font-bold mb-6 text-foreground">Want to get started?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Sign up for easy portfolio management and due diligence.
          </p>
          <Button 
            size="lg"
            onClick={() => handleAuth('signup')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg"
          >
            Create An Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">© 2025 Duwiligence</p>
        </div>
      </footer>
    </div>
  )
}
