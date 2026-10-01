import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { reduxApiClient } from "@/services/apiClient";
import { removeStorage, setStorage } from "@/utils/storage";

export interface User {
  userName: string;
  collegeId: number | null;
  collegeName: string | null;
  applicationName: string | null;
  rightsLevel: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean; // true once localStorage has been read on the client
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  hydrated: false,
};

export const login = createAsyncThunk<
  { user: User; token: string },
  { userName: string; password: string },
  { rejectValue: string }
>("auth/login", async (body, { rejectWithValue }) => {
  const res = await reduxApiClient.post("user/login", body, false);

  if (!res.success) {
    return rejectWithValue(res.error?.message ?? "Login failed");
  }

  const { user, accessToken, refreshToken } = res.data.data;

  setStorage("token", accessToken);
  setStorage("refreshToken", refreshToken);
  setStorage("user", JSON.stringify(user));

  return { user, token: accessToken };
});

export const logout = createAsyncThunk("auth/logout", async () => {
  removeStorage("token");
  removeStorage("refreshToken");
  removeStorage("user");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(
      state,
      action: PayloadAction<{ token: string | null; user: User | null }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Something went wrong";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { hydrateAuth } = authSlice.actions;
export default authSlice.reducer;