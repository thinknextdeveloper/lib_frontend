import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { reduxApiClient } from "../../services/apiClient";

export interface IssueRow {
  CollegeName: string;
  IDNo: string;
  RollNo?: string | null; // students only
  WhomIssued: string;
  Title: string;
  AccessionNo: string | number;
  IssueDate: string;
  LastReturnDate: string;
}

export interface StudentIssueReport {
  college: string;
  type: "Book" | "CD";
  address1: string;
  address2: string;
  rows: IssueRow[];
}
export type IssueReport = StudentIssueReport; // same shape for staff

type Args = { college: string; type: "Book" | "CD" };

// shared by both thunks
async function loadReport(path: string, p: Args): Promise<IssueReport> {
  // pass the query object directly (no { params: ... } wrapper)
  const res: any = await reduxApiClient.get(path, {
    college: p.college,
    type: p.type,
  });
  const data = res?.data ?? res;
  if (!data || !Array.isArray(data.rows)) {
    throw new Error(data?.message || res?.error || "No data returned");
  }
  return data as IssueReport;
}

const errMsg = (e: any) =>
  e?.response?.data?.message || e?.message || "Something went wrong";

export const fetchStudentIssue = createAsyncThunk(
  "studentIssue/fetch",
  async (p: Args, { rejectWithValue }) => {
    try {
      return await loadReport("/reports/student-issue", p);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  }
);

export const fetchStaffIssue = createAsyncThunk(
  "staffIssue/fetch",
  async (p: Args, { rejectWithValue }) => {
    try {
      return await loadReport("/reports/staff-issue", p);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  }
);

interface State {
  loading: boolean;
  report: IssueReport | null;
  error: string | null;
}

const initialState: State = { loading: false, report: null, error: null };

const slice = createSlice({
  name: "studentIssue",
  initialState,
  reducers: {
    clearReport(s) {
      s.report = null;
      s.error = null;
    },
  },
  extraReducers: (b) => {
    for (const t of [fetchStudentIssue, fetchStaffIssue]) {
      b.addCase(t.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.report = null;
      });
      b.addCase(t.fulfilled, (s, a) => {
        s.loading = false;
        s.report = a.payload;
      });
      b.addCase(t.rejected, (s, a) => {
        s.loading = false;
        s.error = (a.payload as string) || "Request failed";
      });
    }
  },
});

export const { clearReport } = slice.actions;
export default slice.reducer;