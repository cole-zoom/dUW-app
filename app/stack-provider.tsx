"use client"

import { StackProvider, StackClientApp } from "@stackframe/stack"

// Client-side Stack configuration
const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    home: "/portfolio",
    afterSignIn: "/portfolio",
    afterSignUp: "/portfolio", 
    afterSignOut: "/landing",
  },
})

export default function StackAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      {children}
    </StackProvider>
  )
}
