import { Suspense } from "react";
import PasswordRecovery from "@/components/admin/password-recovery";

export default function PasswordRecoveryPage() {
  return <Suspense fallback={<p role="status">Loading form…</p>}><PasswordRecovery reset /></Suspense>;
}
