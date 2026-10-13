import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { reduxApiClient } from "../../services/apiClient"; // your axios instance (token interceptor, baseURL = /api)

export type BookPayload = Record<string, unknown>;

const msg = (e: any) => e?.response?.data?.message || e?.message || "Something went wrong";

export const fetchColleges = createAsyncThunk("stock/colleges", async (_, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.get("/stock/colleges")).data as string[];
  } catch (e) {
    return rejectWithValue(msg(e));
  }
});

export const fetchLookups = createAsyncThunk(
  "stock/lookups",
  async (college: string, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.get("/stock/lookups", { params: { college } })).data as {
        publishers: string[];
        sources: string[];
        categories: string[];
      };
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const fetchNextAccession = createAsyncThunk(
  "stock/nextAccession",
  async (college: string, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.get("/stock/next-accession", { params: { college } })).data.next as number;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const loadByAccession = createAsyncThunk(
  "stock/loadByAccession",
  async (p: { college: string; accessionNo: string }, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.get("/stock/by-accession", { params: p })).data as Record<string, any>;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const addBooks = createAsyncThunk(
  "stock/add",
  async (payload: BookPayload, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.post("/stock", payload)).data as { message: string };
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const updateBook = createAsyncThunk(
  "stock/update",
  async (payload: BookPayload, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.put(`/stock/${payload.accessionNo}`, payload)).data as { message: string };
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const addWriteOff = createAsyncThunk(
  "stock/writeOff",
  async (payload: BookPayload, { rejectWithValue }) => {
    try {
      return (await reduxApiClient.post("/stock/write-off", payload)).data as { message: string };
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const addMaster = createAsyncThunk(
  "stock/addMaster",
  async (
    p: { type: "publisher" | "source" | "category"; value: string; collegeName: string },
    { rejectWithValue }
  ) => {
    try {
      return (await reduxApiClient.post("/stock/master", p)).data as { message: string };
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

interface StockState {
  colleges: string[];
  publishers: string[];
  sources: string[];
  categories: string[];
  nextAccession: number | null;
  loaded: Record<string, any> | null;
  saving: boolean;
  notice: { type: "success" | "error"; text: string } | null;
}

const initialState: StockState = {
  colleges: [],
  publishers: [],
  sources: [],
  categories: [],
  nextAccession: null,
  loaded: null,
  saving: false,
  notice: null,
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    clearNotice(s) {
      s.notice = null;
    },
    clearLoaded(s) {
      s.loaded = null;
    },
    clearLookups(s) {
      s.publishers = [];
      s.sources = [];
      s.categories = [];
      s.nextAccession = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchColleges.fulfilled, (s, a) => {
      s.colleges = a.payload;
    });
    b.addCase(fetchLookups.fulfilled, (s, a) => {
      s.publishers = a.payload.publishers;
      s.sources = a.payload.sources;
      s.categories = a.payload.categories;
    });
    b.addCase(fetchNextAccession.fulfilled, (s, a) => {
      s.nextAccession = a.payload;
    });
    b.addCase(loadByAccession.pending, (s) => {
      s.loaded = null;
    });
    b.addCase(loadByAccession.fulfilled, (s, a) => {
      s.loaded = a.payload;
    });

    for (const t of [addBooks, updateBook, addWriteOff, addMaster]) {
      b.addCase(t.pending, (s) => {
        s.saving = true;
        s.notice = null;
      });
      b.addCase(t.fulfilled, (s, a: any) => {
        s.saving = false;
        s.notice = { type: "success", text: a.payload.message };
      });
      b.addCase(t.rejected, (s, a) => {
        s.saving = false;
        s.notice = { type: "error", text: (a.payload as string) || "Request failed" };
      });
    }
    for (const t of [fetchColleges, fetchLookups, fetchNextAccession, loadByAccession]) {
      b.addCase(t.rejected, (s, a) => {
        s.notice = { type: "error", text: (a.payload as string) || "Request failed" };
      });
    }
  },
});

export const { clearNotice, clearLoaded, clearLookups } = stockSlice.actions;
export default stockSlice.reducer;