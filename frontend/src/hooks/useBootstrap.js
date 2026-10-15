import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, selectAuthLoading, selectIsAuthenticated } from "../store/authSlice.js";
import { fetchCart } from "../store/cartSlice.js";

export function useBootstrap() {
  const dispatch = useDispatch();
  const authLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const p = dispatch(fetchMe());
    return () => p.abort && p.abort();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  return { authLoading, isAuthenticated };
}
