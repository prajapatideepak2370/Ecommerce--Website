import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  selectAuthLoading,
  selectIsAuthenticated,
} from "./store/authSlice.js";
import { fetchCart } from "./store/cartSlice.js";
import { completePendingBuyNow } from "./utils/buyNow.js";

export default function App({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const handledGoogleCallback = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get("google_error");
    const succeeded = params.get("google_success") === "1";
    if (!errorCode && !succeeded) return;
    if (succeeded && authLoading) return;

    const callbackKey = `${location.pathname}${location.search}`;
    if (handledGoogleCallback.current === callbackKey) return;
    handledGoogleCallback.current = callbackKey;

    const messages = {
      access_denied: "Google sign-in was cancelled.",
      account_blocked: "This account is blocked. Please contact support.",
      account_conflict:
        "This Google account cannot be linked to the existing account.",
      email_not_verified: "Use a Google account with a verified email address.",
      not_configured: "Google sign-in is not configured yet.",
      authentication_failed: "Google sign-in failed. Please try again.",
    };
    params.delete("google_error");
    params.delete("google_success");
    const remainingQuery = params.toString();
    const cleanUrl = `${location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${location.hash}`;

    const completeCallback = async () => {
      let hasPendingPurchase = false;
      if (succeeded && isAuthenticated) {
        try {
          await dispatch(fetchCart()).unwrap();
          hasPendingPurchase = await completePendingBuyNow(dispatch);
          toast.success("Signed in with Google.");
        } catch {
          toast.error(
            "Signed in with Google, but we couldn't restore your cart. Please try again.",
          );
        }
      } else if (succeeded) {
        toast.error(
          "Google sign-in completed, but your session couldn't be loaded. Please try again.",
        );
      } else {
        toast.error(messages[errorCode] || messages.authentication_failed);
      }

      navigate(hasPendingPurchase ? "/checkout" : cleanUrl, {
        replace: true,
      });
    };

    completeCallback();
  }, [
    authLoading,
    dispatch,
    isAuthenticated,
    location.hash,
    location.pathname,
    location.search,
    navigate,
  ]);

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
