import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { reduxApiClient } from "../../services/apiClient"; // <- adjust to your file path
import type { MenuItem, ToolbarItem } from "@/lib/menuTree";

export const fetchMenu = createAsyncThunk<
  { items: MenuItem[]; toolbar: ToolbarItem[] },
  void,
  { rejectValue: string }
>("menu/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await reduxApiClient.get("menu");

    if (!res.success) {
      return rejectWithValue(res.error?.message || "Failed to load menu");
    }

    // backend replies { data: [...menu items], toolbar: [...buttons] }
    return {
      items: (res.data?.data ?? []) as MenuItem[],
      toolbar: (res.data?.toolbar ?? []) as ToolbarItem[],
    };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Network error"
    );
  }
});

type MenuState = {
  items: MenuItem[];
  toolbar: ToolbarItem[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const initialState: MenuState = {
  items: [],
  toolbar: [],
  status: "idle",
  error: null,
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    resetMenu: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (s) => {
        s.status = "loading";
        s.error = null;
      })
      .addCase(fetchMenu.fulfilled, (s, a) => {
        s.items = a.payload.items;
        s.toolbar = a.payload.toolbar;
        s.status = "ready";
      })
      .addCase(fetchMenu.rejected, (s, a) => {
        s.status = "error";
        s.error = a.payload ?? "Failed to load menu";
      });
  },
});

export const { resetMenu } = menuSlice.actions;
export default menuSlice.reducer;