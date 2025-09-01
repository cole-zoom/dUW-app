import { StackHandler } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-auth";

export default function Handler(props: any) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md auth-container">
        <StackHandler app={stackApp} routeProps={props} fullPage />
      </div>
    </div>
  );
}
