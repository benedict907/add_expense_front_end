import React, { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { firebaseAuth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Phone, Shield, Alert, ArrowUpRight, Sparkle } from "./Icons";

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
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="card max-w-sm p-6 text-center">
          <span className="tile mx-auto h-11 w-11 text-amber">
            <Alert className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-hi">
            Firebase isn't configured
          </p>
          <p className="mt-1.5 text-[13px] text-mid">
            Add your credentials to <code className="tnum text-lime">.env</code>{" "}
            to enable sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="anim-pop w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-7 text-center">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-[20px]"
            style={{
              background:
                "linear-gradient(140deg,#e2ff8a,var(--color-lime) 55%,#9ad70c)",
              boxShadow: "0 16px 40px -14px rgba(204,251,79,0.6)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="#0b1000"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 16 5-6 3 3 8-9" />
            </svg>
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hi">
            Vault
          </h1>
          <p className="mt-1.5 text-[13px] text-mid">
            {step === "phone"
              ? "Sign in with your phone number"
              : `Code sent to ${phone}`}
          </p>
        </div>

        <div className="card overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(204,251,79,0.16), transparent 68%)",
            }}
          />

          <div className="relative">
            {step === "phone" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="eyebrow mb-2 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone number
                  </label>
                  <div className="flex gap-2">
                    <span className="tnum grid shrink-0 place-items-center rounded-[14px] border border-white/[0.07] bg-black/30 px-3.5 text-[15px] text-mid">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="field tnum py-3.5 text-[15px]"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {error && (
                  <p className="anim-fade flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
                    <Alert className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  id="send-code-button"
                  type="submit"
                  disabled={sending}
                  className="btn btn-accent w-full py-3.5 text-[15px]"
                >
                  {sending ? (
                    "Sending…"
                  ) : (
                    <>
                      Send verification code
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="eyebrow mb-2 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="------"
                    maxLength={6}
                    autoFocus
                    className="field tnum py-4 text-center text-2xl font-medium tracking-[0.4em]"
                  />
                </div>

                {error && (
                  <p className="anim-fade flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
                    <Alert className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-soft px-5 py-3.5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || code.length < 6}
                    className="btn btn-accent flex-1 py-3.5 text-[15px]"
                  >
                    {verifying ? "Verifying…" : "Verify & continue"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-low">
          <Sparkle className="h-3.5 w-3.5" />
          You may receive an SMS. Standard rates apply.
        </p>
      </div>
    </div>
  );
};

export default Login;
