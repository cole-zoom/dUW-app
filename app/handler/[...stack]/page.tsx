"use client";

import { StackHandler } from "@stackframe/stack";
import { useStackApp } from "@stackframe/stack";

export default function Handler(props: any) {
  const app = useStackApp();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md auth-container">
        <StackHandler app={app} routeProps={props} fullPage />
      </div>
    </div>
  );
}
