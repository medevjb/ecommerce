import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        404 error
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
        Page not found
      </h1>
      <p className="mt-4 text-base text-zinc-500">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Go back home
        </Link>
      </div>
    </div>
  );
}
