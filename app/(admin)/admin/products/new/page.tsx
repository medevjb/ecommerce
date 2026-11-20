import { Suspense } from "react";
import AdminModule from "@/components/admin/admin-module";

export default function WorkspacePage() {
  return <Suspense fallback={<p role="status">Loading workspace…</p>}><AdminModule /></Suspense>;
}
