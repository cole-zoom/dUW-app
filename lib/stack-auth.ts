import { StackServerApp } from "@stackframe/stack"

// Stack Auth configuration - lazy initialization for server side only
let stackAppInstance: StackServerApp | null = null

export function getStackApp(): StackServerApp {
  if (typeof window !== 'undefined') {
    throw new Error('StackServerApp should only be used on the server side')
  }
  
  if (!stackAppInstance) {
    if (!process.env.STACK_SECRET_SERVER_KEY) {
      throw new Error('No secret server key provided. Please copy your key from the Stack dashboard and put it in the STACK_SECRET_SERVER_KEY environment variable.')
    }
    
    stackAppInstance = new StackServerApp({
      tokenStore: "nextjs-cookie",
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
      secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
      urls: {
        home: "/portfolio",
        afterSignIn: "/portfolio",
        afterSignUp: "/portfolio",
        afterSignOut: "/landing",
      },
    })
  }
  
  return stackAppInstance
}

// For backward compatibility - use the lazy getter
export const stackApp = new Proxy({} as StackServerApp, {
  get(target, prop) {
    const app = getStackApp()
    const value = (app as any)[prop]
    return typeof value === 'function' ? value.bind(app) : value
  }
})
