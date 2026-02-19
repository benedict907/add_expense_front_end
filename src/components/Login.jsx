import React, { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { firebaseAuth } from "../firebase";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { signInWithPhone } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "code"
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);
  const initAttemptsRef = useRef(0);

  useEffect(() => {
    if (!firebaseAuth || step !== "phone") return;

    // Initialize reCAPTCHA after button exists in DOM
    const initRecaptcha = () => {
      const button = document.getElementById("send-code-button");
      if (!button) {
        // Retry if button doesn't exist yet (max 10 attempts)
        if (initAttemptsRef.current < 10) {
          initAttemptsRef.current += 1;
          setTimeout(initRecaptcha, 50);
        }
        return;
      }

      initAttemptsRef.current = 0; // Reset on success

      try {
        // Clear any existing verifier
        if (recaptchaVerifierRef.current?.clear) {
          recaptchaVerifierRef.current.clear();
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(
          firebaseAuth,
          "send-code-button",
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () =>
              setError("reCAPTCHA expired. Please try again."),
          }
        );
      } catch (err) {
        console.error("RecaptchaVerifier error:", err);
        setError("Failed to initialize reCAPTCHA. Please refresh the page.");
      }
    };

    // Wait for DOM to be ready
    setTimeout(initRecaptcha, 100);

    return () => {
      try {
        if (recaptchaVerifierRef.current?.clear) {
          recaptchaVerifierRef.current.clear();
        }
      } catch (err) {
        console.error("Error clearing reCAPTCHA:", err);
      }
    };
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    const raw = phone.replace(/\D/g, "");
    if (!raw || raw.length < 10) {
      setError("Enter a valid phone number (e.g. +91 9876543210)");
      return;
    }
    // If 10 digits and starts with 6-9, assume India (+91)
    const phoneNumber =
      raw.length === 10 && /^[6-9]/.test(raw) ? `+91${raw}` : `+${raw}`;
    setSending(true);
    try {
      const result = await signInWithPhone(
        phoneNumber,
        recaptchaVerifierRef.current
      );
      confirmationResultRef.current = result;
      setStep("code");
    } catch (err) {
      setError(err?.message ?? "Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!confirmationResultRef.current || !code.trim()) return;
    setError("");
    setVerifying(true);
    try {
      await confirmationResultRef.current.confirm(code.trim());
    } catch (err) {
      setError(err?.message ?? "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setCode("");
    setError("");
    confirmationResultRef.current = null;
  };

  if (!firebaseAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-gray-600">
          Firebase is not configured. Add credentials to .env to use login.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          💰 Expense Tracker
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Sign in with your phone number
        </p>
        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              id="send-code-button"
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {sending ? "Sending…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
        )}
        <p className="mt-6 text-xs text-gray-500 text-center">
          By signing in, you may receive an SMS for verification. Standard rates
          apply.
        </p>
      </div>
    </div>
  );
};

export default Login;
