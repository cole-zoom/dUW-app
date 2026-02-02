import { StackHandler } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-auth";

export default function Handler(props: { params: Promise<{ stack: string[] }>; searchParams: Promise<Record<string, string>> }) {
  return (
    <StackHandler
      app={stackApp}
      routeProps={props}
      fullPage={true}
    />
  );
}
