import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ref, push, onValue } from "firebase/database";
import { firebaseDb } from "./firebase";
import { useAuth } from "./context/AuthContext";
import Loader from "./Loader";
import MoneyInput, { toNumber } from "./components/MoneyInput";
import {
  ArrowDownLeft,
  Calendar,
  Note,
  Check,
  Alert,
  Card,
  Basket,
  Layers,
} from "./components/Icons";

type Expense = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

const EXPENSES_REF_KEY = "expenses";

/** Quick-add uses its own bank-account list, distinct from the budget categories. */
const QUICK_CATEGORIES = [
  { value: "Kotak", label: "Kotak Card", hue: "var(--color-coral)", Icon: Card },
  { value: "ICICI", label: "ICICI", hue: "var(--color-amber)", Icon: Card },
  { value: "SBI", label: "SBI", hue: "var(--color-violet)", Icon: Card },
  { value: "HDFC", label: "HDFC", hue: "var(--color-iris)", Icon: Card },
  { value: "GROCERY", label: "Grocery", hue: "var(--color-mint)", Icon: Basket },
  { value: "MISC", label: "Misc", hue: "var(--color-mid)", Icon: Layers },
];

export default function App() {
  const { dataRoot } = useAuth();
  const [form, setForm] = useState<Expense>({
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: 0,
  });
  const [amountRaw, setAmountRaw] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  // Use Firebase Realtime Database .info/connected to show online status (only when configured)
  useEffect(() => {
    if (!firebaseDb) return;
    const connectedRef = ref(firebaseDb, ".info/connected");
    const unsub = onValue(connectedRef, (snap) => {
      setConnected(snap.val() === true);
    });
    return () => unsub();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
    if (message) setMessage(null);
  };

  const handleAmount = (raw: string) => {
    setAmountRaw(raw);
    setForm((prev) => ({ ...prev, amount: toNumber(raw) }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.date ||
      !form.description ||
      form.amount <= 0 ||
      form.category === ""
    ) {
      setMessage({ kind: "err", text: "Fill every field before saving." });
      return;
    }
    if (!firebaseDb || !dataRoot) {
      setMessage({
        kind: "err",
        text: "Firebase is not configured, or you are not signed in.",
      });
      return;
    }
    setLoading(true);
    try {
      const expensesRef = ref(firebaseDb, `${dataRoot}/${EXPENSES_REF_KEY}`);
      await push(expensesRef, {
        ...form,
        createdAt: Date.now(),
      });
      setForm({
        date: new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        amount: 0,
      });
      setAmountRaw("");
      setMessage({ kind: "ok", text: "Expense added." });
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Failed to add expense",
      });
      console.error("Firebase error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader label="Saving" />;

  return (
    <div className="min-h-dvh px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="tile h-9 w-9 rounded-xl text-coral">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-hi">
                Quick add
              </h1>
              <p className="flex items-center gap-1.5 text-[11px] text-low">
                {connected ? (
                  <>
                    <span className="live-dot" />
                    Synced live
                  </>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
          </div>
          <Link to="/" className="btn btn-soft px-3.5 py-2 text-[13px]">
            Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block">Amount</label>
              <MoneyInput
                value={amountRaw}
                onValueChange={handleAmount}
                quickAdjust={[100, 500, 1000]}
                accent="var(--color-coral)"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="eyebrow mb-2 flex items-center gap-1.5"
              >
                <Note className="h-3.5 w-3.5" />
                Description
              </label>
              <input
                id="description"
                type="text"
                name="description"
                placeholder="What was this for?"
                value={form.description}
                onChange={handleChange}
                className="field"
              />
            </div>

            <div>
              <label className="eyebrow mb-2 block">Account</label>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_CATEGORIES.map(({ value, label, hue, Icon }) => {
                  const active = form.category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, category: value }));
                        if (message) setMessage(null);
                      }}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-semibold transition-all duration-200 active:scale-[0.96]"
                      style={{
                        color: active ? hue : "var(--color-mid)",
                        borderColor: active
                          ? `color-mix(in srgb, ${hue} 42%, transparent)`
                          : "rgba(255,255,255,0.07)",
                        background: active
                          ? `color-mix(in srgb, ${hue} 12%, transparent)`
                          : "rgba(0,0,0,0.24)",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="date"
                className="eyebrow mb-2 flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                Date
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="field tnum"
              />
            </div>

            {message && (
              <p
                className={`anim-fade flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] ${
                  message.kind === "ok"
                    ? "border-mint/25 bg-mint/10 text-mint"
                    : "border-coral/25 bg-coral/10 text-coral"
                }`}
              >
                {message.kind === "ok" ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Alert className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {message.text}
              </p>
            )}

            <button type="submit" className="btn btn-accent w-full py-3.5 text-[15px]">
              Add expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
