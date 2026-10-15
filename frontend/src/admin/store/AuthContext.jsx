import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { adminAuthApi } from "../api/endpoints.js";
import { getErrorMessage, setAdminLogoutCallback } from "../api/client.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const IDLE_LOGOUT_MS = 1000 * 60 * 60 * 2;

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const lastActivity = useRef(Date.now());
  const sessionRequest = useRef(null);

  const logout = useCallback(async (message) => {
    if (message) {
      setAdmin(null);
      setLoading(false);
      toast.error(message);
      navigate("/login", { replace: true });
      try {
        await adminAuthApi.logout();
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.error(
            "Failed to invalidate the expired admin session:",
            err?.message || err,
          );
        }
      }
      return;
    }

    await adminAuthApi.logout();
    setAdmin(null);
    setLoading(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setAdminLogoutCallback(() => logout("Your session has expired."));
  }, [logout]);

  const fetchMe = useCallback(async () => {
    if (sessionRequest.current) return sessionRequest.current;

    const request = adminAuthApi
      .me()
      .then((me) => {
        setAdmin(me || null);
        setAuthError("");
        setLoading(false);
        return me || null;
      })
      .catch((err) => {
        setAdmin(null);
        setAuthError(
          err?.response?.status === 401
            ? ""
            : getErrorMessage(err, "Unable to verify the admin session."),
        );
        setLoading(false);
        return null;
      })
      .finally(() => {
        sessionRequest.current = null;
      });

    sessionRequest.current = request;
    return request;
  }, []);

  const login = useCallback(async (payload) => {
    setAuthError("");
    try {
      const res = await adminAuthApi.login(payload);
      const me = res || (await adminAuthApi.me());
      setAdmin(me || null);
      return me || res || true;
    } catch (err) {
      const msg = getErrorMessage(err, "Invalid credentials.");
      throw new Error(msg);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const markActivity = () => {
      lastActivity.current = Date.now();
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));
    const id = setInterval(() => {
      if (!admin) return;
      if (Date.now() - lastActivity.current > IDLE_LOGOUT_MS) {
        logout("Signed out due to inactivity.");
      }
    }, 30_000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActivity));
      clearInterval(id);
    };
  }, [admin, logout]);

  const value = useMemo(
    () => ({ admin, loading, authError, login, logout, fetchMe }),
    [admin, loading, authError, login, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AuthProvider.");
  return ctx;
}

export default AuthContext;
