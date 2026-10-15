import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Unauthorized"));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      await authApi.login(payload);
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Login failed"));
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      await authApi.register(payload);
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Registration failed"));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Logout failed"));
    }
  }
);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload || null;
        s.loading = false;
      })
      .addCase(fetchMe.rejected, (s, { payload }) => {
        s.user = null;
        s.loading = false;
        s.error = payload;
      })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.user = payload || null;
        s.error = null;
      })
      .addCase(login.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(register.fulfilled, (s, { payload }) => {
        s.user = payload || null;
        s.error = null;
      })
      .addCase(register.rejected, (s, { payload }) => {
        s.error = payload;
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.error = null;
      });
  },
});

export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";

export default authSlice.reducer;
