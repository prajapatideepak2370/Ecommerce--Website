import { useState } from "react";
import { LoaderCircle } from "lucide-react";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}

export default function GoogleAuthButton() {
  const [redirecting, setRedirecting] = useState(false);

  const startGoogleAuth = () => {
    setRedirecting(true);
    const apiBase = new URL(
      import.meta.env.VITE_API_BASE || "/api/v1",
      window.location.origin,
    );
    const authUrl = new URL(
      `${apiBase.pathname.replace(/\/$/, "")}/users/auth/google`,
      apiBase.origin,
    );
    window.location.assign(authUrl);
  };

  return (
    <button
      type="button"
      onClick={startGoogleAuth}
      disabled={redirecting}
      aria-busy={redirecting}
      className="btn w-full !py-3 border border-[#dadce0] !bg-white !text-[#202124] hover:!bg-[#f8faff] focus:ring-brand-500 disabled:opacity-70"
    >
      {redirecting ? (
        <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
      ) : (
        <GoogleMark />
      )}
      {redirecting ? "Connecting to Google…" : "Continue with Google"}
    </button>
  );
}
