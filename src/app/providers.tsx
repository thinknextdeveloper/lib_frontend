"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateAuth, User } from "@/store/slices/authSlice";
import { getStorage } from "@/utils/storage";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = getStorage("token");
    const raw = getStorage("user");
    let user: User | null = null;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }
    store.dispatch(hydrateAuth({ token, user }));
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
