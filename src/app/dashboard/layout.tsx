"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchMenu, resetMenu } from "@/store/slices/menuSlice";
import Navbar from "@/components/Navbar";
// import Toolbar from "@/components/Toolbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { token, user, hydrated } = useAppSelector((s) => s.auth);
  const menuStatus = useAppSelector((s) => s.menu.status);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      if (menuStatus === "idle") dispatch(fetchMenu());
    } else {
      dispatch(resetMenu());
    }
  }, [hydrated, token, menuStatus, dispatch]);

  if (!hydrated || !token) {
    return <div className="container muted">Loading...</div>;
  }

  const initials = (user?.userName ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">📚</span>
          <span className="brand-name">Library</span>
        </div>

        <Navbar />

        <div className="topbar-right">
          <div className="user-chip" title={user?.collegeName ?? ""}>
            <span className="avatar">{initials}</span>
            <span className="user-name">{user?.userName}</span>
          </div>
          <button className="btn-ghost" onClick={() => dispatch(logout())}>
            Logout
          </button>
        </div>
      </header>

      {/* <Toolbar /> */}

      <main className="app-content">{children}</main>
    </div>
  );
}