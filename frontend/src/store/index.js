import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import cartReducer from "./cartSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
  devTools: import.meta.env.MODE !== "production",
});
