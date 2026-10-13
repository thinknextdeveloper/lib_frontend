import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { reduxApiClient } from "../../services/apiClient";

export interface GateBook {
  AccessionNo: number | string;
  CollegeName: string;
  Title: string;
  Author: string | null;
  Category: string | null;
  Location: string | null;
}

export interface GateIssue {
  IssueDate: string;
  WhomIssued: string;
  IDNo: string | number;
  Discipline: string | null;
  LastReturnDate: string;
}

export interface ScanResult {
  found: boolean;
  book?: GateBook;
  issue?: GateIssue | null;
  image?: string | null;
  saved?: boolean;
}

export interface GateEntry {
  DateEntry: string;
  Time: string;
  IDNo: string | number;
  PersonName: string;
  AccessionNo: string | number;
  Purpose: string;
  GateEntry: string;
}

export const scanAccession = createAsyncThunk(
  "gate/scan",
  async (accessionNo: string, { rejectWithValue }) => {
    try {
      const res: any = await reduxApiClient.post("/gate/scan", { accessionNo });
      const data = res?.data ?? res;
      if (!data || typeof data.found !== "boolean") {
        return rejectWithValue(data?.message || res?.error || "Request failed");
      }
      return data as ScanResult;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || "Something went wrong");
    }
  }
);

export const fetchGateEntries = createAsyncThunk(
  "gate/entries",
  async (
    p: { from?: string; to?: string; idNo?: string; accessionNo?: string },
    { rejectWithValue }
  ) => {
    try {
      // send only the filters that have a value
      const query: Record<string, string> = {};
      if (p.from) query.from = p.from;
      if (p.to) query.to = p.to;
      if (p.idNo?.trim()) query.idNo = p.idNo.trim();
      if (p.accessionNo?.trim()) query.accessionNo = p.accessionNo.trim();

      const res: any = await reduxApiClient.get("/gate/entries", query);
      const data = res?.data ?? res;
      if (!data || !Array.isArray(data.rows)) {
        return rejectWithValue(data?.message || res?.error || "Request failed");
      }
      return data.rows as GateEntry[];
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || "Something went wrong");
    }
  }
);

interface State {
  scanning: boolean;
  scan: ScanResult | null;
  entries: GateEntry[];
  loadingEntries: boolean;
  entriesError: string | null;
}

const initialState: State = {
  scanning: false,
  scan: null,
  entries: [],
  loadingEntries: false,
  entriesError: null,
};

const slice = createSlice({
  name: "gate",
  initialState,
  reducers: {
    clearScan(s) {
      s.scan = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(scanAccession.pending, (s) => {
      s.scanning = true;
    });
    b.addCase(scanAccession.fulfilled, (s, a) => {
      s.scanning = false;
      s.scan = a.payload;
    });
    b.addCase(scanAccession.rejected, (s) => {
      s.scanning = false;
    });

    b.addCase(fetchGateEntries.pending, (s) => {
      s.loadingEntries = true;
      s.entriesError = null;
    });
    b.addCase(fetchGateEntries.fulfilled, (s, a) => {
      s.loadingEntries = false;
      s.entries = a.payload;
    });
    b.addCase(fetchGateEntries.rejected, (s, a) => {
      s.loadingEntries = false;
      s.entriesError = (a.payload as string) || "Request failed";
    });
  },
});

export const { clearScan } = slice.actions;
export default slice.reducer;