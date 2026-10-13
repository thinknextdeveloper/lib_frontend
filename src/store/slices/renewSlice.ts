import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { reduxApiClient } from "@/services/apiClient";
import { logout } from "./authSlice";

export interface RenewIssue {
  collegeName: string;
  accessionNo: string;
  name: string;
  idNo: string;
  title: string;
  issueDate: string | null;
  lastReturnDate: string | null;
  position: string;
  type: string;
}

export interface RenewDetail {
  issue: RenewIssue;
  person: { isStaff: boolean; course: string; batch: string };
  photo: string | null;
}

interface Msg {
  text: string;
  ok: boolean;
}

interface RenewState {
  colleges: string[];
  renewDays: number;
  accessionLength: number;
  detail: RenewDetail | null;
  renewed: boolean;
  loading: boolean;
  message: Msg;
}

const emptyMsg: Msg = { text: "", ok: false };

const initialState: RenewState = {
  colleges: [],
  renewDays: 15,
  accessionLength: 0,
  detail: null,
  renewed: false,
  loading: false,
  message: emptyMsg,
};

// colleges, renew days and accession length
export const fetchRenewInit = createAsyncThunk<
  { colleges: string[]; renewDays: number; accessionLength: number },
  void,
  { rejectValue: string }
>("renew/init", async (_, { rejectWithValue }) => {
  const res = await reduxApiClient.get("renew/init");
  if (!res.success) return rejectWithValue(res.error?.message ?? "Failed to load");
  return res.data.data;
});

// find the issued book by accession no.
export const lookupBook = createAsyncThunk<
  RenewDetail,
  { collegeName: string; accessionNo: string },
  { rejectValue: string }
>("renew/lookup", async (params, { rejectWithValue }) => {
  const res = await reduxApiClient.get("renew/lookup", params);
  if (!res.success) return rejectWithValue(res.error?.message ?? "Not found");
  return res.data.data;
});

// renew the book
export const renewBook = createAsyncThunk<
  { lastReturnDate: string },
  { collegeName: string; accessionNo: string; signature: string; renewDate: string },
  { rejectValue: string }
>("renew/renew", async (body, { rejectWithValue }) => {
  const res = await reduxApiClient.post("renew", body);
  if (!res.success) return rejectWithValue(res.error?.message ?? "Renew failed");
  return res.data.data;
});

const renewSlice = createSlice({
  name: "renew",
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<Msg>) {
      state.message = action.payload;
    },
    // accession no. changed -> clear the details shown
    clearDetail(state) {
      state.detail = null;
      state.renewed = false;
      state.message = emptyMsg;
    },
    // "New Entry" button
    resetRenew(state) {
      state.detail = null;
      state.renewed = false;
      state.message = emptyMsg;
    },
  },
  extraReducers: (builder) => {
    builder
      // init
      .addCase(fetchRenewInit.fulfilled, (state, action) => {
        state.colleges = action.payload.colleges;
        state.renewDays = action.payload.renewDays;
        state.accessionLength = action.payload.accessionLength;
      })
      .addCase(fetchRenewInit.rejected, (state, action) => {
        state.message = { text: action.payload ?? action.error.message ?? "Failed to load", ok: false };
      })

      // lookup
      .addCase(lookupBook.pending, (state) => {
        state.loading = true;
      })
      .addCase(lookupBook.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
        state.renewed = false;
        state.message = emptyMsg;
      })
      .addCase(lookupBook.rejected, (state, action) => {
        state.loading = false;
        state.detail = null;
        state.message = { text: action.payload ?? action.error.message ?? "Not found", ok: false };
      })

      // renew
      .addCase(renewBook.pending, (state) => {
        state.loading = true;
      })
      .addCase(renewBook.fulfilled, (state, action) => {
        state.loading = false;
        state.renewed = true;
        state.message = { text: "Renewed Successfully", ok: true };
        if (state.detail) state.detail.issue.lastReturnDate = action.payload.lastReturnDate;
      })
      .addCase(renewBook.rejected, (state, action) => {
        state.loading = false;
        state.message = { text: action.payload ?? action.error.message ?? "Renew failed", ok: false };
      })

      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { setMessage, clearDetail, resetRenew } = renewSlice.actions;
export default renewSlice.reducer;