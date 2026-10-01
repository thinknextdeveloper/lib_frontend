"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

export default function NotFound() {
  const { token, hydrated } = useAppSelector((s) => s.auth);

  return (
    <div className="nf-wrap">
      <div className="nf-card">
        <div className="nf-icon">📚</div>
        <p className="nf-code">404</p>
        <h1>Page not found</h1>
        <p className="nf-text">
          The page you are looking for doesn&apos;t exist, was moved, or you
          don&apos;t have access to it.
        </p>

        <div className="nf-actions">
          {!hydrated ? null : token ? (
            <Link href="/dashboard" className="nf-btn primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/login" className="nf-btn primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}