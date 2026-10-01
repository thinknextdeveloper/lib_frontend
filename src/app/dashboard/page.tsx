"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { funcToHref } from "@/components/Navbar";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const user = useAppSelector((s) => s.auth.user);
  const toolbar = useAppSelector((s) => s.menu.toolbar);

  return (
    <div className="home">
      <section className="hero">
        <p className="hero-eyebrow">{greeting()}</p>
        <h2>Welcome back, {user?.userName}</h2>
        <p className="hero-sub">{user?.collegeName ?? "-"}</p>
      </section>

      <section className="stat-grid">
        <div className="stat">
          <span className="stat-label">College</span>
          <span className="stat-value">{user?.collegeName ?? "-"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Application</span>
          <span className="stat-value">{user?.applicationName ?? "-"}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Login type</span>
          <span className="stat-value">{user?.loginType ?? "-"}</span>
        </div>
      </section>

      {/* {toolbar.length > 0 && (
        <section>
          <h3 className="section-title">Quick actions</h3>
          <div className="action-grid">
            {toolbar.map((t) => (
              <Link key={t.key} href={funcToHref(t.func)} className="action-card">
                <span className="action-icon">{t.emoji}</span>
                <span className="action-label">{t.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )} */}
    </div>
  );
}