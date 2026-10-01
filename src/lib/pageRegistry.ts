import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// key = FUNC from MenuItems, in lowercase
export const pageRegistry: Record<string, ComponentType> = {
  // frmissuebook: dynamic(() => import("@/features/library/IssueBook")),
  // frmreturnbook: dynamic(() => import("@/features/library/ReturnBook")),
  // frmstatusstockbooks: dynamic(() => import("@/features/library/StockBooks")),
  // frmstatusissueregister: dynamic(() => import("@/features/library/IssueRegister")),
  // frmsearchreferencebooks: dynamic(() => import("@/features/library/ReferenceBooks")),
};