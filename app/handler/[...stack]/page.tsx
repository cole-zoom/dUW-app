import { StackHandler } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-auth";

export default function Handler(props: any) {
  return <StackHandler fullPage app={stackApp} {...props} />;
}
