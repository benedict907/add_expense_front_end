import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { DuesProvider } from "../context/DuesContext";
import { BudgetProvider } from "../context/BudgetContext";
import { useDues } from "../context/DuesContext";
import { useBudget } from "../context/BudgetContext";
import { useAuth } from "../context/AuthContext";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseTable from "../components/ExpenseTable";
import SummaryCard from "../components/SummaryCard";
import NextMonthDues from "../components/NextMonthDues";
import SpendChart from "../components/SpendChart";
import Reveal from "../components/Reveal";
import AnimatedNumber from "../components/AnimatedNumber";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDueData } from "../store/dueSlice";
import {
  Logout,
  Plus,
  Bell,
  Receipt,
  Chart,
  TrendDown,
  Alert,
} from "../components/Icons";

const currency0 = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/* ---------- small data-bound widgets (must live inside the providers) ---------- */

const UpcomingDuesCount = () => {
  const { dues } = useDues();
  const pending = dues.filter((d) => d.status !== "paid");
  return <>{pending.length}</>;
};

const PulseStrip = () => {
  const { expenses, totalSpent, categorySpending } = useBudget();
  const { dues } = useDues();

  const pending = dues.filter((d) => d.status !== "paid");
  const pendingTotal = pending.reduce((s, d) => s + (d.amount || 0), 0);

  const now = new Date();
  const txCount = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const topCategory = Object.entries(categorySpending).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const stats = [
    {
      label: "Spent",
      value: totalSpent,
      format: currency0,
      Icon: TrendDown,
      hue: "var(--color-coral)",
      sub: "this month",
    },
    {
      label: "Entries",
      value: txCount,
      format: (n) => String(Math.round(n)),
      Icon: Receipt,
      hue: "var(--color-violet)",
      sub: "recorded",
    },
    {
      label: "Dues left",
      value: pendingTotal,
      format: currency0,
      Icon: Bell,
      hue: "var(--color-amber)",
      sub: `${pending.length} pending`,
    },
    {
      label: "Top spend",
      value: topCategory ? topCategory[1] : 0,
      format: currency0,
      Icon: Chart,
      hue: "var(--color-iris)",
      sub: topCategory ? topCategory[0] : "no data",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, format, Icon, hue, sub }, i) => (
        <Reveal key={label} delay={i * 70}>
          <div className="card card-hover h-full p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${hue} 15%, transparent)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: hue }} />
              </span>
              <span className="eyebrow truncate">{label}</span>
            </div>
            <p className="tnum mt-2.5 text-xl font-medium text-hi sm:text-2xl">
              <AnimatedNumber value={value} format={format} />
            </p>
            <p className="mt-0.5 truncate text-[11px] text-low">{sub}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
};

const FlowCard = () => {
  const { expenses } = useBudget();
  return (
    <section className="card card-hover p-5 sm:p-6">
      <SpendChart expenses={expenses} />
    </section>
  );
};

/* ---------- shell ---------- */

const BudgetDashboard = () => {
  const dispatch = useAppDispatch();
  const { signOut, authAvailable } = useAuth();
  const {
    items: dueItems,
    loading,
    error,
  } = useAppSelector((state) => state.due);

  useEffect(() => {
    dispatch(fetchDueData());
  }, [dispatch]);

  const today = new Date();
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DuesProvider>
      <BudgetProvider>
        <div className="min-h-dvh pb-28 lg:pb-16">
          {/* ---------- sticky glass chrome ---------- */}
          <header className="glass sticky top-0 z-40 border-x-0 border-t-0 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{
                    background:
                      "linear-gradient(140deg,#e2ff8a,var(--color-lime) 55%,#9ad70c)",
                    boxShadow: "0 6px 18px -8px rgba(204,251,79,0.6)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="#0b1000"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m4 16 5-6 3 3 8-9" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-tight text-hi">
                    Vault
                  </p>
                  <p className="truncate text-[11px] leading-tight text-low">
                    {today.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="chip hidden cursor-default sm:inline-flex">
                  <Bell className="h-3.5 w-3.5" />
                  <UpcomingDuesCount /> due
                </span>
                <Link to="/add" className="btn btn-accent px-3.5 py-2 text-[13px]">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick add</span>
                </Link>
                {authAvailable && (
                  <button
                    onClick={signOut}
                    className="btn-icon"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <Logout className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
            {/* ---------- greeting ---------- */}
            <Reveal className="mb-6">
              <p className="text-[13px] text-low">{greeting}</p>
              <h1 className="mt-0.5 text-[1.75rem] font-semibold leading-tight text-hi sm:text-4xl">
                Here's your{" "}
                <span className="text-gradient-lime">
                  {today.toLocaleDateString("en-IN", { month: "long" })}
                </span>
              </h1>
              {error && (
                <p className="mt-3 flex items-center gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
                  <Alert className="h-4 w-4 shrink-0" />
                  {String(error)}
                </p>
              )}
              {loading && !error && (
                <p className="mt-3 flex items-center gap-2 text-[12px] text-low">
                  <span className="live-dot" />
                  Syncing {dueItems?.length ? `${dueItems.length} records` : "data"}…
                </p>
              )}
            </Reveal>

            {/* ---------- stat strip ---------- */}
            <PulseStrip />

            {/* ---------- main grid ---------- */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <Reveal>
                  <SummaryCard />
                </Reveal>

                     <Reveal delay={80}>
                  <ExpenseForm />
                </Reveal>
                <Reveal delay={60}>
                  <ExpenseTable />
                </Reveal>
              </div>

              <div className="space-y-4 lg:col-span-5">
                <Reveal delay={40}>
                  <FlowCard />
                </Reveal>
           
                <Reveal delay={120}>
                  <NextMonthDues />
                </Reveal>
              </div>
            </div>

            <footer className="mt-10 pb-4 text-center text-[11px] text-low">
              Vault · every figure recalculated live
            </footer>
          </div>


        </div>
      </BudgetProvider>
    </DuesProvider>
  );
};

export default BudgetDashboard;
