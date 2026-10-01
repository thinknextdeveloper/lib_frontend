"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { buildMenuTree, MenuNode } from "@/lib/menuTree";

export const funcToHref = (func: string) => `/dashboard/${func.toLowerCase()}`;

type ListProps = {
  nodes: MenuNode[];
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  pathname: string;
  depth: number;
};

function MenuList({ nodes, openKey, setOpenKey, pathname, depth }: ListProps) {
  return (
    <ul className={depth === 0 ? "nav-bar" : "nav-drop"}>
      {nodes.map((n) => {
        const hasKids = n.children.length > 0;
        const isOpen =
          openKey !== null &&
          (openKey === n.hierar || openKey.startsWith(n.hierar + "."));

        // Parent item: toggles its dropdown
        if (hasKids) {
          return (
            <li key={n.id} className={`nav-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="nav-link"
                onClick={() => {
                  if (openKey === n.hierar) {
                    const i = n.hierar.lastIndexOf(".");
                    setOpenKey(i > 0 ? n.hierar.slice(0, i) : null);
                  } else {
                    setOpenKey(n.hierar);
                  }
                }}
              >
                {n.text}
                {depth > 0 && <span className="caret">▸</span>}
              </button>

              {isOpen && (
                <MenuList
                  nodes={n.children}
                  openKey={openKey}
                  setOpenKey={setOpenKey}
                  pathname={pathname}
                  depth={depth + 1}
                />
              )}
            </li>
          );
        }

        // Leaf with no function, or no rights: shown but not clickable
        if (!n.func || !n.allowed) {
          return (
            <li key={n.id} className="nav-item">
              <span
                className="nav-link disabled"
                title={n.allowed ? "" : "You do not have access"}
              >
                {n.text}
              </span>
            </li>
          );
        }

        // Leaf: opens its page in the content area
        const href = funcToHref(n.func);
        return (
          <li key={n.id} className="nav-item">
            <Link
              href={href}
              className={`nav-link ${pathname === href ? "active" : ""}`}
              onClick={() => setOpenKey(null)}
            >
              {n.text}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Navbar() {
  const { items, status, error } = useAppSelector((s) => s.menu);
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  const tree = useMemo(() => buildMenuTree(items), [items]);

  // close dropdowns when clicking outside the navbar
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (status === "idle" || status === "loading") {
    return <nav className="navbar muted">Loading menu...</nav>;
  }
  if (status === "error") {
    return <nav className="navbar muted">{error ?? "Could not load menu"}</nav>;
  }

  return (
    <nav className="navbar" ref={ref}>
      <MenuList
        nodes={tree}
        openKey={openKey}
        setOpenKey={setOpenKey}
        pathname={pathname}
        depth={0}
      />
    </nav>
  );
}