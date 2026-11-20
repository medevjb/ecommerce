import { Preloader } from "@/components/shared/preloader";
import { Suspense } from "react";
import AdminModule from "@/components/admin/admin-module";

export default function WorkspacePage() {
  return <Suspense fallback={<Preloader label="Loading workspace" compact />}><AdminModule /></Suspense>;
}
