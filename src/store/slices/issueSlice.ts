import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { reduxApiClient } from "@/services/apiClient";

export type PersonType = "Student" | "Staff";

export interface Person {
  type: PersonType;
  collegeName: string;
  name: string;
  course: string;
  batch: string;
  univRollNo: string;
  photo: string | null;
}

export interface BookInfo {
  collegeName: string;
  accessionNo: string;
  title: string;
  author: string;
  category: string;
}

export interface IssuedRow {
  collegeName: string;
  issueDate: string;
  idNo: string;
  title: string;
  author: string;
  accessionNo: string;
  lastReturnDate: string;
  course: string;
  remarks: string;
  whomIssued: string;
  type: string;
  days: number;
  fine: number;
}

interface Msg {
  text: string;
  ok: boolean;
}

interface IssueState {
  colleges: string[];
  studentDays: number;
  staffDays: number;
  person: Person | null;
  book: BookInfo | null;
  issued: IssuedRow[];
  totalFine: number;
  loading: boolean;
  message: Msg;
}

const initialState: IssueState = {
  colleges: [],
  studentDays: 15,
  staffDays: 30,
  person: null,
  book: null,
  issued: [],
  totalFine: 0,
  loading: false,
  message: { text: "", ok: true },
};

type Rej = { message: string; code?: string };
const fail = (e: any): Rej => ({
  message: e?.response?.data?.message || e?.message || "Something went wrong",
  code: e?.response?.data?.code,
});

interface ListResult {
  issued: IssuedRow[];
  totalFine: number;
}

export const fetchIssueInit = createAsyncThunk<
  { colleges: string[]; studentDays: number; staffDays: number },
  void,
  { rejectValue: Rej }
>("issue/init", async (_, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.get("/issue-book/init")).data;
  } catch (e) {
    return rejectWithValue(fail(e));
  }
});

export const lookupPerson = createAsyncThunk<
  ListResult & { person: Person },
  { type: PersonType; idNo: string },
  { rejectValue: Rej }
>("issue/person", async (params, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.get("/issue-book/person", { params })).data;
  } catch (e) {
    return rejectWithValue(fail(e));
  }
});

export const lookupBook = createAsyncThunk<
  BookInfo,
  { accessionNo: string },
  { rejectValue: Rej }
>("issue/book", async (params, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.get("/issue-book/book", { params })).data;
  } catch (e) {
    return rejectWithValue(fail(e));
  }
});

export const issueBook = createAsyncThunk<
  ListResult & { message: string },
  {
    type: PersonType;
    idNo: string;
    accessionNo: string;
    lastReturnDate: string;
    remarks: string;
    signature: string;
    force?: boolean;
  },
  { rejectValue: Rej }
>("issue/issue", async (body, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.post("/issue-book/issue", body)).data;
  } catch (e) {
    return rejectWithValue(fail(e));
  }
});

export const returnBook = createAsyncThunk<
  ListResult & { message: string },
  { idNo: string; accessionNo: string; collegeName: string },
  { rejectValue: Rej }
>("issue/return", async (body, { rejectWithValue }) => {
  try {
    return (await reduxApiClient.post("/issue-book/return", body)).data;
  } catch (e) {
    return rejectWithValue(fail(e));
  }
});

const issueSlice = createSlice({
  name: "issue",
  initialState,
  reducers: {
    setMessage(s, a: PayloadAction<Msg>) {
      s.message = a.payload;
    },
    clearMessage(s) {
      s.message = { text: "", ok: true };
    },
    clearBook(s) {
      s.book = null;
    },
    clearPerson(s) {
      s.person = null;
      s.book = null;
      s.issued = [];
      s.totalFine = 0;
    },
    // keeps the init data (colleges / days), clears everything else
    resetIssue(s) {
      s.person = null;
      s.book = null;
      s.issued = [];
      s.totalFine = 0;
      s.loading = false;
      s.message = { text: "", ok: true };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchIssueInit.fulfilled, (s, a) => {
      s.colleges = a.payload.colleges;
      s.studentDays = a.payload.studentDays;
      s.staffDays = a.payload.staffDays;
    });
    b.addCase(fetchIssueInit.rejected, (s, a) => {
      s.message = { text: a.payload?.message ?? "Could not load page data", ok: false };
    });

    b.addCase(lookupPerson.pending, (s) => {
      s.loading = true;
    });
    b.addCase(lookupPerson.fulfilled, (s, a) => {
      s.loading = false;
      s.person = a.payload.person;
      s.issued = a.payload.issued;
      s.totalFine = a.payload.totalFine;
      s.message = { text: "", ok: true };
    });
    b.addCase(lookupPerson.rejected, (s, a) => {
      s.loading = false;
      s.person = null;
      s.book = null;
      s.issued = [];
      s.totalFine = 0;
      s.message = { text: a.payload?.message ?? "Invalid ID No.", ok: false };
    });

    b.addCase(lookupBook.fulfilled, (s, a) => {
      s.book = a.payload;
      s.message = { text: "", ok: true };
    });
    b.addCase(lookupBook.rejected, (s, a) => {
      s.book = null;
      s.message = { text: a.payload?.message ?? "Invalid Accession No.", ok: false };
    });

    b.addCase(issueBook.pending, (s) => {
      s.loading = true;
    });
    b.addCase(issueBook.fulfilled, (s, a) => {
      s.loading = false;
      s.issued = a.payload.issued;
      s.totalFine = a.payload.totalFine;
      s.message = { text: a.payload.message, ok: true };
    });
    b.addCase(issueBook.rejected, (s, a) => {
      s.loading = false;
      // the page asks "issue anyway?" for this one, so no error banner
      if (a.payload?.code === "LIMIT_REACHED") return;
      s.message = { text: a.payload?.message ?? "Could not issue book", ok: false };
    });

    b.addCase(returnBook.pending, (s) => {
      s.loading = true;
    });
    b.addCase(returnBook.fulfilled, (s, a) => {
      s.loading = false;
      s.issued = a.payload.issued;
      s.totalFine = a.payload.totalFine;
      s.message = { text: a.payload.message, ok: true };
    });
    b.addCase(returnBook.rejected, (s, a) => {
      s.loading = false;
      s.message = { text: a.payload?.message ?? "Could not return book", ok: false };
    });
  },
});

export const { setMessage, clearMessage, clearBook, clearPerson, resetIssue } = issueSlice.actions;
export default issueSlice.reducer;

// store.ts  ->  reducer: { ..., issue: issueReducer }