import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function App({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get("google_error");
    const succeeded = params.get("google_success") === "1";
    if (!errorCode && !succeeded) return;

    const messages = {
      access_denied: "Google sign-in was cancelled.",
      account_blocked: "This account is blocked. Please contact support.",
      account_conflict:
        "This Google account cannot be linked to the existing account.",
      email_not_verified: "Use a Google account with a verified email address.",
      not_configured: "Google sign-in is not configured yet.",
      authentication_failed: "Google sign-in failed. Please try again.",
    };
    if (succeeded) toast.success("Signed in with Google.");
    else toast.error(messages[errorCode] || messages.authentication_failed);

    params.delete("google_error");
    params.delete("google_success");
    const remainingQuery = params.toString();
    navigate(
      `${location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${location.hash}`,
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
