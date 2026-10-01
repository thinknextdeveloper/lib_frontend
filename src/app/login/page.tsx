"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";

const LEVELS = ["Admin", "Staff"];

const FEATURES = [
  { icon: "📕", title: "Issue & Return", text: "Issue, renew and return books in a few clicks." },
  { icon: "📚", title: "Stock Register", text: "Keep every book and CD in stock up to date." },
  { icon: "🔍", title: "Instant Search", text: "Find any title, author or member quickly." },
];

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
  </svg>
);
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { token, loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ userName: "", password: "", type: "Admin" });
  const [showPassword, setShowPassword] = useState(false);

  // login success (or already logged in) -> dashboard
  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      login({
        userName: form.userName.trim(),
        password: form.password,
        type: form.type,
      })
    );
  };

  return (
    <div className="lg-page">
      <div className="lg-shell">
        {/* ---------- left: form ---------- */}
        <section className="lg-left">
          <div className="lg-brand">
            <span className="lg-brand-logo">📚</span>
            <span className="lg-brand-name">Library</span>
          </div>

          <div className="lg-formbox">
            <h1>Welcome Back!</h1>
            <p className="lg-sub">
              Sign in to access your dashboard and continue managing your library.
            </p>

            <form onSubmit={onSubmit} className="lg-form">
              <div className="lg-field">
                <label htmlFor="userName">User name</label>
                <div className="lg-input">
                  <UserIcon />
                  <input
                    id="userName"
                    autoComplete="username"
                    placeholder="Enter your user name"
                    value={form.userName}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="password">Password</label>
                <div className="lg-input">
                  <LockIcon />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon off={!showPassword} />
                  </button>
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="type">Login as</label>
                <div className="lg-input">
                  <ShieldIcon />
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="lg-error">{error}</div>}

              <button type="submit" disabled={loading} className="lg-submit">
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>
          </div>

          <p className="lg-foot">© {new Date().getFullYear()} Library Management</p>
        </section>

        {/* ---------- right: showcase ---------- */}
        <aside className="lg-right">
          <div className="lg-right-inner">
            <h2>
              Manage your library with <span>smarter tools</span>
            </h2>
            <p className="lg-right-sub">
              One place for stock, issue and return, search and reports.
            </p>

            <ul className="lg-features">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <span className="lg-feature-icon">{f.icon}</span>
                  <div>
                    <strong>{f.title}</strong>
                    <p>{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg-right-foot">
            <span>SECURE LOGIN</span>
            <i />
          </div>
        </aside>
      </div>
    </div>
  );
}