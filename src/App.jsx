import { useState, useEffect, useRef, Fragment } from "react";
import { Chart } from "chart.js/auto";
import "./App.css";
import { supabase } from "./supabase";

function I(d) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">{d}</svg>
  );
}

const CATEGORIES = [
  { name: "Groceries", color: "#2a78d6", weekly: 80, keywords: ["tesco","supervalu","lidl","aldi","dunnes","spar","centra","co-op"],
    icon: I(<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></>)},
  { name: "Eating out", color: "#1baf7a", weekly: 40, keywords: ["restaurant","mcdonalds","kfc","pizza","nando","subway","five guys","supermac"],
    icon: I(<><path d="M3 2v7a3 3 0 006 0V2"/><line x1="6" y1="11" x2="6" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></>)},
  { name: "Coffee", color: "#854f0b", weekly: 20, keywords: ["blue bird","ucd nova","gather and gather","poolside cafe","starbucks","insomnia","butlers","paulig","coffeeangel"],
    icon: I(<><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/></>)},
  { name: "Takeaway", color: "#eda100", weekly: 30, keywords: ["deliveroo","just eat","uber eats","takeaway"],
    icon: I(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>)},
  { name: "Drinks / nights out", color: "#4a3aa7", weekly: 40, keywords: ["pub","bar","nightclub","off licence","o'briens"],
    icon: I(<><path d="M8 22h8"/><line x1="12" y1="11" x2="12" y2="22"/><path d="M6 2h12l-2 7a4 4 0 01-8 0L6 2z"/></>)},
  { name: "Transport", color: "#e34948", weekly: 25, keywords: ["leap","dublin bus","luas","dart","irish rail","taxi","uber","free now","bolt"],
    icon: I(<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 5V2"/><path d="M17 5V2"/><circle cx="7" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="16" r="1" fill="currentColor" stroke="none"/></>)},
  { name: "Petrol", color: "#eb6834", weekly: 30, keywords: ["applegreen","circle k","maxol","topaz","texaco","esso","fuel","petrol"],
    icon: I(<><path d="M3 22V7a2 2 0 012-2h8a2 2 0 012 2v15"/><line x1="3" y1="22" x2="15" y2="22"/><rect x="5" y="9" width="6" height="4" rx="1"/><path d="M15 6h2a2 2 0 012 2v3a2 2 0 002 2"/></>)},
  { name: "Travel", color: "#185fa5", weekly: 0, keywords: ["booking.com","hostelworld","airbnb","ryanair","aer lingus","skyscanner","hotels.com","expedia","bus eireann","wexford bus","eurolines"],
    icon: I(<><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2h0A1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></>)},
  { name: "Shopping", color: "#e87ba4", weekly: 50, keywords: ["amazon","penneys","primark","asos"],
    icon: I(<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>)},
  { name: "Clothes", color: "#e87ba4", weekly: 30, keywords: ["penneys","primark","zara","h&m","asos","next","marks","tkmaxx","tk maxx","river island","pull&bear","stradivarius"],
    icon: I(<><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></>)},
  { name: "Subscriptions", color: "#52514e", weekly: 15, keywords: ["netflix","spotify","disney","apple","google","microsoft","gym"],
    icon: I(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>)},
  { name: "Utilities", color: "#639922", weekly: 0, keywords: ["eir","virgin media","three","vodafone","electric ireland","bord gais","gas networks","upc","sky","broadband"],
    icon: I(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>)},
  { name: "Health", color: "#0ca30c", weekly: 20, keywords: ["pharmacy","boots","lloyds","gp","dentist","physio","chemist"],
    icon: I(<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>)},
  { name: "Sport", color: "#0f6e56", weekly: 15, keywords: ["decathlon","life style sports","intersport","elverys","gaa","ticketmaster","underdogs"],
    icon: I(<><line x1="6" y1="8" x2="6" y2="10"/><line x1="18" y1="14" x2="18" y2="16"/><line x1="4" y1="9" x2="8" y2="9"/><line x1="16" y1="15" x2="20" y2="15"/><line x1="8" y1="9" x2="16" y2="15"/></>)},
  { name: "Transfers", color: "#52514e", weekly: 0, keywords: ["transfer to", "transfer from"],
    icon: I(<><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></>)},
  { name: "Other", color: "#898781", weekly: 30, keywords: [],
    icon: I(<><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>)},
];

const ACCOUNTS = [
  { id: "revolut", name: "Revolut", color: "#191c33" },
];

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function fmtWeekLabel(offset) {
  if (offset === 0) return "This week";
  if (offset === -1) return "Last week";
  const { start, end } = getWeekRange(offset);
  return `${start.getDate()} ${start.toLocaleString("en-IE", { month: "short" })} – ${end.getDate()} ${end.toLocaleString("en-IE", { month: "short" })}`;
}

function getMonthRange(weekOffset) {
  const { start } = getWeekRange(weekOffset);
  const y = start.getFullYear(), m = start.getMonth();
  return { from: new Date(y, m, 1, 0, 0, 0, 0), to: new Date(y, m + 1, 0, 23, 59, 59, 999) };
}

function catForDesc(desc) {
  const d = desc.toLowerCase();
  for (const c of CATEGORIES.slice(0, -1)) {
    if (c.keywords.some((k) => d.includes(k))) return c.name;
  }
  return "Other";
}

// Deterministic ID so re-importing the same CSV skips existing rows rather than duplicating them.
// Requires the transactions table's `id` column to be type TEXT.
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function parseRevolutCSV(text) {
  const lines = text.trim().split("\n");
  const cols = lines[0].split(",").map((c) => c.replace(/"/g, "").trim().toLowerCase());
  const typeIdx    = cols.findIndex((c) => c === "type");
  const productIdx = cols.findIndex((c) => c === "product");
  const dateIdx    = cols.findIndex((c) => c === "completed date");
  const descIdx    = cols.findIndex((c) => c === "description");
  const amtIdx     = cols.findIndex((c) => c === "amount");
  const stateIdx   = cols.findIndex((c) => c === "state");
  const balIdx     = cols.findIndex((c) => c === "balance");
  if (dateIdx < 0 || descIdx < 0 || amtIdx < 0) return null;
  const txns = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    if (row.length < 3) continue;
    if (stateIdx >= 0 && row[stateIdx] !== "COMPLETED") continue;
    if (typeIdx >= 0 && row[typeIdx] === "Topup") continue;
    if (typeIdx >= 0 && productIdx >= 0 && row[typeIdx] === "Transfer" && row[productIdx] === "Savings") continue;
    const date = new Date(row[dateIdx]);
    const amt = parseFloat(row[amtIdx]);
    if (isNaN(date.getTime()) || isNaN(amt) || amt === 0) continue;
    const isTransfer = typeIdx >= 0 && row[typeIdx] === "Transfer";
    const category = isTransfer ? "Transfers" : catForDesc(row[descIdx] || "");
    const id = `r-${hashStr(`${row[dateIdx]}|${row[descIdx]}|${row[amtIdx]}`)}`;
    const balance = balIdx >= 0 ? (parseFloat(row[balIdx]) ?? null) : null;
    txns.push({ id, date, description: row[descIdx] || "Unknown", amount: amt, category, account: "Revolut", balance });
  }
  return txns;
}

// Strips numbers/punctuation and takes the first 3 words as a stable merchant key
function extractMerchant(description) {
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function BarChart({ labels, datasets, yPrefix = "€" }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#898781", font: { size: 11 }, maxRotation: 30 } },
          y: { grid: { color: "#e1e0d9" }, ticks: { color: "#898781", callback: (v) => yPrefix + v } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets]);
  return <canvas ref={ref} />;
}

function LineChart({ labels, data, yPrefix = "€" }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data,
          borderColor: "#2a78d6",
          backgroundColor: "#2a78d610",
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#898781", font: { size: 11 }, maxRotation: 30, maxTicksLimit: 10 } },
          y: { grid: { color: "#e1e0d9" }, ticks: { color: "#898781", callback: (v) => yPrefix + v } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data]);
  return <canvas ref={ref} />;
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  async function handleSignUp() {
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setInfo("Account created! Check your email to confirm, then log in.");
    setBusy(false);
  }

  function onKey(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">💶 Budget</div>
        <input
          className="auth-input" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey}
          autoComplete="email"
        />
        <input
          className="auth-input" type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey}
          autoComplete="current-password"
        />
        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}
        <div className="auth-actions">
          <button className="auth-btn-primary" onClick={handleLogin} disabled={busy}>Log in</button>
          <button className="auth-btn-secondary" onClick={handleSignUp} disabled={busy}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

function TxnRow({ t, muted, pendingRule, onRecategorise, onSaveRule, onDismissRule }) {
  const cat = CATEGORIES.find((c) => c.name === t.category) || CATEGORIES[CATEGORIES.length - 1];
  return (
    <Fragment>
      <div className="txn-row" style={muted ? { opacity: 0.6 } : undefined}>
        <div className="txn-icon" style={{ background: cat.color + "22", color: cat.color }}>{cat.icon}</div>
        <div className="txn-meta">
          <div className="txn-desc">{t.description}</div>
          <div className="txn-date">{t.date.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>
        <select className="cat-select" value={t.category} onChange={(e) => onRecategorise(t.id, e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        <div className={`txn-amount ${t.amount < 0 ? "out" : "in"}`}>
          {t.amount < 0 ? "-" : "+"}€{Math.abs(t.amount).toFixed(2)}
        </div>
      </div>
      {pendingRule?.txnId === t.id && (
        <div style={{
          background: "#eef3fd", border: "0.5px solid #b8ccf0", borderRadius: 8,
          padding: "7px 12px", margin: "2px 0 4px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: "#1c3a80",
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            Always categorise <strong style={{ wordBreak: "break-all" }}>"{pendingRule.merchant}"</strong> as <strong>{pendingRule.category}</strong>?
          </span>
          <button onClick={onSaveRule} style={{
            background: "#2a78d6", color: "#fff", border: "none", borderRadius: 5,
            padding: "3px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>Yes</button>
          <button onClick={onDismissRule} style={{
            background: "none", border: "0.5px solid #b8ccf0", borderRadius: 5,
            padding: "3px 10px", fontSize: 12, cursor: "pointer", color: "#4a6da7",
            fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
          }}>No</button>
        </div>
      )}
    </Fragment>
  );
}

function EmptyState({ emoji = "📭", headline, sub }) {
  return (
    <div className="empty-illustration">
      <div className="empty-emoji">{emoji}</div>
      <div className="empty-headline">{headline}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main className="main">
      <div className="metric-row">
        {[0, 1, 2, 3].map((i) => (
          <div className="metric" key={i}>
            <div className="skel" style={{ height: 11, width: "55%", marginBottom: 10 }} />
            <div className="skel" style={{ height: 24, width: "75%" }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skel" style={{ height: 14, width: 150, marginBottom: 18 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div className="skel" style={{ height: 13, width: 100 }} />
            <div className="skel" style={{ flex: 1, height: 5 }} />
            <div className="skel" style={{ height: 13, width: 36 }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skel" style={{ height: 14, width: 170, marginBottom: 18 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f1efe8" }}>
            <div className="skel" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skel" style={{ height: 13, width: "60%", marginBottom: 5 }} />
              <div className="skel" style={{ height: 11, width: "35%" }} />
            </div>
            <div className="skel" style={{ height: 13, width: 50 }} />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("weekly");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(CATEGORIES.map((c) => ({ ...c })));
  const [savings, setSavings] = useState([]);
  const [importMsg, setImportMsg] = useState(null);
  const [merchantRules, setMerchantRules] = useState([]);
  const [pendingRule, setPendingRule] = useState(null);
  const saveTimers = useRef({});

  function toggleDark() {
    setDarkMode((d) => {
      const next = !d;
      localStorage.setItem("darkMode", next);
      return next;
    });
  }

  useEffect(() => {
    document.body.style.background = darkMode ? "#0f0f0f" : "";
  }, [darkMode]);

  useEffect(() => {
    const names = { dashboard: "Dashboard", budget: "Budget", import: "Import", savings: "Savings", settings: "Settings" };
    document.title = `${names[tab] ?? tab} — Budget Tracker`;
  }, [tab]);

  function debounceSave(key, fn, delay = 600) {
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(fn, delay);
  }

  // Auth: check existing session on mount and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_OUT") {
        setTransactions([]);
        setBudgets(CATEGORIES.map((c) => ({ ...c })));
        setSavings([]);
        setMerchantRules([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data: reload whenever the logged-in user changes
  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    setLoading(true);
    Promise.all([
      supabase.from("budgets").select("*").eq("user_id", uid),
      supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
      supabase.from("savings").select("*").eq("user_id", uid),
      supabase.from("merchant_rules").select("*").eq("user_id", uid).order("merchant"),
    ]).then(([{ data: dbBudgets }, { data: dbTxns }, { data: dbSavings }, { data: dbRules }]) => {
      if (dbBudgets?.length) {
        setBudgets(CATEGORIES.map((c) => {
          const db = dbBudgets.find((b) => b.name === c.name);
          return db ? { ...c, weekly: db.weekly } : c;
        }));
      }
      if (dbTxns?.length) setTransactions(dbTxns.map((t) => ({ ...t, date: new Date(t.date) })));
      if (dbSavings?.length) setSavings(dbSavings);
      if (dbRules?.length) setMerchantRules(dbRules);
      setLoading(false);
    });
  }, [session?.user?.id]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const { start, end } = getWeekRange(weekOffset);
  const weekTxns = transactions.filter((t) => t.date >= start && t.date <= end && t.amount < 0);
  const weekSpendTxns = weekTxns.filter((t) => t.category !== "Transfers");
  const weekTransferTxns = transactions.filter((t) => t.date >= start && t.date <= end && t.category === "Transfers");
  const totalSpent = weekSpendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalBudget = budgets.filter((b) => b.name !== "Transfers").reduce((s, b) => s + b.weekly, 0);
  const remaining = totalBudget - totalSpent;
  const totalSavings = savings.reduce((s, v) => s + v.balance, 0);

  const bycat = {};
  budgets.filter((b) => b.name !== "Transfers").forEach((b) => (bycat[b.name] = 0));
  weekSpendTxns.forEach((t) => { bycat[t.category] = (bycat[t.category] || 0) + Math.abs(t.amount); });

  const { from: monthFrom, to: monthTo } = getMonthRange(weekOffset);
  const monthLabel = monthFrom.toLocaleString("en-IE", { month: "long", year: "numeric" });
  const balanceDayMap = {};
  transactions
    .filter((t) => t.date >= monthFrom && t.date <= monthTo && t.balance != null)
    .sort((a, b) => a.date - b.date)
    .forEach((t) => { balanceDayMap[t.date.toISOString().slice(0, 10)] = t.balance; });
  const balanceDays = Object.keys(balanceDayMap).sort();
  const balanceData = balanceDays.map((d) => balanceDayMap[d]);

  // Monthly view
  const monthTxns = transactions.filter((t) => t.date >= monthFrom && t.date <= monthTo);
  const monthSpendTxns = monthTxns.filter((t) => t.amount < 0 && t.category !== "Transfers");
  const monthIncomeTxns = monthTxns.filter((t) => t.amount > 0);
  const totalMonthSpent = monthSpendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalMonthIncome = monthIncomeTxns.reduce((s, t) => s + t.amount, 0);
  const netSaved = totalMonthIncome - totalMonthSpent;
  const monthBycat = {};
  monthSpendTxns.forEach((t) => { monthBycat[t.category] = (monthBycat[t.category] || 0) + Math.abs(t.amount); });
  const monthCatsSorted = CATEGORIES
    .map((c) => ({ ...c, spent: monthBycat[c.name] || 0 }))
    .filter((c) => c.spent > 0 && c.name !== "Transfers")
    .sort((a, b) => b.spent - a.spent);

  // Spending trends: last 8 weeks ending at weekOffset
  const trendWeeks = Array.from({ length: 8 }, (_, i) => {
    const offset = weekOffset - 7 + i;
    const { start: ws, end: we } = getWeekRange(offset);
    const spent = transactions
      .filter((t) => t.date >= ws && t.date <= we && t.amount < 0 && t.category !== "Transfers")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return {
      label: `${ws.getDate()} ${ws.toLocaleString("en-IE", { month: "short" })}`,
      spent: parseFloat(spent.toFixed(2)),
      isCurrent: i === 7,
    };
  });
  const trendDatasets = [{
    label: "Spent",
    data: trendWeeks.map((w) => w.spent),
    backgroundColor: trendWeeks.map((w) => w.isCurrent ? "#2a78d6cc" : "#2a78d633"),
    borderRadius: 4,
    borderSkipped: false,
  }];

  // Over budget categories (weekly view only)
  const overBudgetCats = budgets.filter((b) =>
    b.name !== "Transfers" && b.weekly > 0 && (bycat[b.name] || 0) > b.weekly
  );

  // ── Data functions ─────────────────────────────────────────────────────────

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Re-read the session inside the async callback so we never use a stale closure value,
      // then explicitly set it so the client attaches the JWT to every subsequent request.
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) {
        setImportMsg({ ok: false, text: "Session expired — please log out and log back in, then try again." });
        return;
      }
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      });
      const uid = currentSession.user.id;

      const parsed = parseRevolutCSV(ev.target.result);
      if (!parsed) {
        setImportMsg({ ok: false, text: "Could not read this file. Make sure it's a Revolut CSV export." });
        return;
      }

      // Fetch fresh rules so this import benefits from any rules added during the session
      const { data: freshRules } = await supabase.from("merchant_rules").select("*").eq("user_id", uid);
      const rules = freshRules ?? merchantRules;

      // Apply merchant rules to non-transfer rows before falling back to keyword defaults
      const parsedWithRules = parsed.map((t) => {
        if (t.category === "Transfers") return t;
        const desc = t.description.toLowerCase();
        const rule = rules.find((r) => desc.includes(r.merchant));
        return rule ? { ...t, category: rule.category } : t;
      });

      // Fetch existing categories so re-imports don't overwrite manual recategorisations,
      // while still updating the balance column for rows that already exist.
      const ids = parsedWithRules.map((t) => t.id);
      const { data: existing } = await supabase
        .from("transactions").select("id, category").in("id", ids).eq("user_id", uid);
      const savedCats = Object.fromEntries((existing || []).map((t) => [t.id, t.category]));

      const rows = parsedWithRules.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        amount: t.amount,
        category: savedCats[t.id] ?? t.category,
        account: t.account,
        balance: t.balance ?? null,
        user_id: uid,
      }));

      console.log("transactions upsert payload — first row:", rows[0], "| total rows:", rows.length, "| all have user_id:", rows.every((r) => !!r.user_id));
      const { error: upsertError } = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
      if (upsertError) {
        console.error("transactions upsert error:", upsertError);
        setImportMsg({ ok: false, text: `Import failed: ${upsertError.message}` });
        return;
      }

      const { data: dbTxns } = await supabase
        .from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false });
      if (dbTxns) setTransactions(dbTxns.map((t) => ({ ...t, date: new Date(t.date) })));

      setImportMsg({ ok: true, text: `${parsed.length} transactions imported from ${file.name}.` });
    };
    reader.readAsText(file);
  }

  async function recategorise(id, cat) {
    const uid = session.user.id;
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, category: cat } : t));
    await supabase.from("transactions").update({ category: cat }).eq("id", id).eq("user_id", uid);
    const txn = transactions.find((t) => t.id === id);
    const merchant = txn ? extractMerchant(txn.description) : "";
    if (merchant) setPendingRule({ txnId: id, merchant, category: cat });
  }

  async function saveRule() {
    if (!pendingRule) return;
    const uid = session.user.id;
    const { merchant, category } = pendingRule;
    const { data } = await supabase
      .from("merchant_rules")
      .upsert({ merchant, category, user_id: uid }, { onConflict: "merchant,user_id" })
      .select()
      .single();
    if (data) {
      setMerchantRules((prev) => {
        const idx = prev.findIndex((r) => r.merchant === merchant);
        return idx >= 0 ? prev.map((r) => r.merchant === merchant ? data : r) : [...prev, data];
      });
    }
    // Retroactively apply the new category to every transaction whose description matches
    await supabase.from("transactions").update({ category }).eq("user_id", uid).ilike("description", `%${merchant}%`);
    setTransactions((prev) => prev.map((t) =>
      t.description.toLowerCase().includes(merchant) ? { ...t, category } : t
    ));
    setPendingRule(null);
  }

  async function addVault() {
    const uid = session.user.id;
    const name = prompt("Vault name:");
    if (!name) return;
    const target = parseFloat(prompt("Target amount (€):")) || 1000;
    const { data } = await supabase
      .from("savings").insert({ name, balance: 0, target, user_id: uid }).select().single();
    if (data) setSavings((prev) => [...prev, data]);
  }

  async function removeVault(id) {
    const uid = session.user.id;
    await supabase.from("savings").delete().eq("id", id).eq("user_id", uid);
    setSavings((prev) => prev.filter((s) => s.id !== id));
  }

  async function deleteMerchantRule(id) {
    const uid = session.user.id;
    await supabase.from("merchant_rules").delete().eq("id", id).eq("user_id", uid);
    setMerchantRules((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Chart datasets ─────────────────────────────────────────────────────────

  const activeCats = budgets.filter((b) => bycat[b.name] > 0 && b.name !== "Transfers");
  const dashDatasets = activeCats.length ? [
    { label: "Spent", data: activeCats.map((b) => parseFloat(Math.abs(bycat[b.name]).toFixed(2))), backgroundColor: activeCats.map((b) => b.color + "cc"), borderRadius: 4, borderSkipped: false },
    { label: "Budget", data: activeCats.map((b) => b.weekly), backgroundColor: activeCats.map((b) => b.color + "33"), borderRadius: 4, borderSkipped: false },
  ] : [];

  const savingsDatasets = [
    { label: "Balance", data: savings.map((v) => v.balance), backgroundColor: "#2a78d6cc", borderRadius: 4, borderSkipped: false },
    { label: "Target", data: savings.map((v) => v.target), backgroundColor: "#2a78d622", borderRadius: 4, borderSkipped: false },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading && !session) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  const txnRowProps = { pendingRule, onRecategorise: recategorise, onSaveRule: saveRule, onDismissRule: () => setPendingRule(null) };

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <header className="header">
        <div className="header-inner">
          <span className="logo">💶 Budget</span>
          <nav className="tabs">
            {["dashboard","budget","import","savings","settings"].map((t) => (
              <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleDark} title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Log out</button>
          </div>
        </div>
      </header>

      {loading ? <DashboardSkeleton /> : (
      <main className="main">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="week-nav">
              <button className="nav-btn" onClick={() => setWeekOffset((w) => viewMode === "monthly" ? w - 4 : w - 1)}>‹</button>
              <span className="week-label">{viewMode === "monthly" ? monthLabel : fmtWeekLabel(weekOffset)}</span>
              <button className="nav-btn" onClick={() => setWeekOffset((w) => Math.min(0, viewMode === "monthly" ? w + 4 : w + 1))}>›</button>
            </div>

            <div className="view-toggle">
              <button className={viewMode === "weekly" ? "active" : ""} onClick={() => setViewMode("weekly")}>Weekly</button>
              <button className={viewMode === "monthly" ? "active" : ""} onClick={() => setViewMode("monthly")}>Monthly</button>
            </div>

            {viewMode === "weekly" && overBudgetCats.length > 0 && (
              <div className="over-budget-banner">
                Over budget in {overBudgetCats.length === 1 ? "1 category" : `${overBudgetCats.length} categories`}: {overBudgetCats.map((b) => b.name).join(", ")}
              </div>
            )}

            {viewMode === "weekly" ? (
              <>
                <div className="metric-row">
                  {[
                    { label: "Spent this week", value: `€${totalSpent.toFixed(0)}`, sub: `of €${totalBudget} budget` },
                    { label: "Remaining", value: `${remaining < 0 ? "-" : ""}€${Math.abs(remaining).toFixed(0)}`, sub: remaining < 0 ? "over budget" : "left this week", warn: remaining < 0 },
                    { label: "Transactions", value: weekTxns.length, sub: "this week" },
                    { label: "Savings total", value: `€${totalSavings.toLocaleString()}`, sub: "across all vaults" },
                  ].map((m) => (
                    <div className="metric" key={m.label}>
                      <div className="metric-label">{m.label}</div>
                      <div className={`metric-value${m.warn ? " over" : ""}`}>{m.value}</div>
                      <div className="metric-sub">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">Spending by category</div>
                  {budgets.filter((b) => b.name !== "Transfers").map((b) => {
                    const spent = bycat[b.name] || 0;
                    const pct = Math.min(100, (spent / b.weekly) * 100);
                    const color = pct > 100 ? "#e24b4a" : pct > 80 ? "#ba7517" : b.color;
                    return (
                      <div className="budget-row" key={b.name}>
                        <div className="budget-label">{b.icon}<span>{b.name}</span></div>
                        <div className="progress-wrap"><div className="progress-bar" style={{ width: pct + "%", background: color }} /></div>
                        <div className="budget-spent" style={{ color }}>{`€${spent.toFixed(0)}`}</div>
                        <div className="budget-limit">/ €{b.weekly}</div>
                      </div>
                    );
                  })}
                  {activeCats.length > 0 && (
                    <div className="chart-wrap">
                      <BarChart labels={activeCats.map((b) => b.name)} datasets={dashDatasets} />
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-title">Recent transactions</div>
                  {weekTxns.length === 0 ? (
                    <EmptyState headline="Nothing here yet" sub="Import a Revolut CSV to see your spending" />
                  ) : (
                    <>
                      {weekSpendTxns.map((t) => (
                        <TxnRow key={t.id} t={t} {...txnRowProps} />
                      ))}
                      {weekTransferTxns.length > 0 && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 4px" }}>
                            <div style={{ flex: 1, height: 1, background: "#e1e0d9" }} />
                            <span style={{ fontSize: 11, color: "#b4b2a9", whiteSpace: "nowrap" }}>Transfers & settlements</span>
                            <div style={{ flex: 1, height: 1, background: "#e1e0d9" }} />
                          </div>
                          {weekTransferTxns.map((t) => (
                            <TxnRow key={t.id} t={t} muted {...txnRowProps} />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="metric-row">
                  {[
                    { label: "Spent", value: `€${totalMonthSpent.toFixed(0)}`, sub: monthLabel },
                    { label: "Income", value: `€${totalMonthIncome.toFixed(0)}`, sub: "received this month" },
                    { label: "Net saved", value: `${netSaved < 0 ? "-" : ""}€${Math.abs(netSaved).toFixed(0)}`, sub: netSaved < 0 ? "deficit" : "surplus", warn: netSaved < 0 },
                    { label: "Savings total", value: `€${totalSavings.toLocaleString()}`, sub: "across all vaults" },
                  ].map((m) => (
                    <div className="metric" key={m.label}>
                      <div className="metric-label">{m.label}</div>
                      <div className={`metric-value${m.warn ? " over" : ""}`}>{m.value}</div>
                      <div className="metric-sub">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">Spending breakdown — {monthLabel}</div>
                  {monthCatsSorted.length === 0 ? (
                    <EmptyState headline="Nothing here yet" sub={`No spending recorded for ${monthLabel}`} />
                  ) : monthCatsSorted.map((c) => {
                    const pct = totalMonthSpent > 0 ? (c.spent / totalMonthSpent) * 100 : 0;
                    return (
                      <div className="budget-row" key={c.name}>
                        <div className="budget-label">{c.icon}<span>{c.name}</span></div>
                        <div className="progress-wrap"><div className="progress-bar" style={{ width: pct + "%", background: c.color }} /></div>
                        <div className="budget-spent" style={{ color: c.color }}>{`€${c.spent.toFixed(0)}`}</div>
                        <div className="budget-limit">{pct.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {balanceDays.length > 0 && (
              <div className="card">
                <div className="card-title">Account balance — {monthLabel}</div>
                <div className="chart-wrap" style={{ height: 200 }}>
                  <LineChart
                    labels={balanceDays.map((d) => {
                      const dt = new Date(d + "T12:00:00");
                      return `${dt.getDate()} ${dt.toLocaleString("en-IE", { month: "short" })}`;
                    })}
                    data={balanceData}
                  />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title">Spending trends — last 8 weeks</div>
              <div className="chart-wrap">
                <BarChart labels={trendWeeks.map((w) => w.label)} datasets={trendDatasets} />
              </div>
            </div>
          </>
        )}

        {/* BUDGET */}
        {tab === "budget" && (
          <div className="card">
            <div className="card-title">Weekly budget limits</div>
            {budgets.map((b, i) => (
              <div className="budget-row budget-edit-row" key={b.name}>
                <div className="budget-label">{b.icon}<span>{b.name}</span></div>
                <div />
                <div className="budget-limit-label">weekly €</div>
                <input
                  type="number" min="0" step="5" value={b.weekly}
                  className="budget-input"
                  onChange={(e) => {
                    const uid = session.user.id;
                    const val = parseFloat(e.target.value) || 0;
                    const { name, color } = b;
                    setBudgets((prev) => prev.map((p, j) => j === i ? { ...p, weekly: val } : p));
                    debounceSave(`budget-${name}`, () => {
                      supabase.from("budgets").upsert({ name, weekly: val, color, user_id: uid }, { onConflict: "name,user_id" });
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* IMPORT */}
        {tab === "import" && (
          <>
            <div className="card">
              <div className="card-title">Select account</div>
              {ACCOUNTS.map((a) => (
                <span key={a.id} className="account-chip selected" style={{ borderColor: a.color }}>{a.name}</span>
              ))}
              <span className="account-chip muted">+ AIB (coming soon)</span>
              <span className="account-chip muted">+ BOI (coming soon)</span>
            </div>
            <div className="upload-zone" onClick={() => document.getElementById("csvFile").click()}>
              <div className="upload-icon">📂</div>
              <p>Click to upload your Revolut CSV</p>
              <small>Revolut app → Account → Statement → Download → CSV</small>
            </div>
            <input type="file" id="csvFile" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
            {importMsg && (
              <div className={`import-msg ${importMsg.ok ? "ok" : "err"}`}>{importMsg.text}</div>
            )}
          </>
        )}

        {/* SAVINGS */}
        {tab === "savings" && (
          <>
            <div className="card">
              <div className="card-title">Vaults & savings</div>
              {savings.length === 0 && (
                <EmptyState emoji="📭" headline="Nothing here yet" sub="Add a vault below to start tracking your savings" />
              )}
              {savings.map((v) => {
                const pct = Math.min(100, (v.balance / v.target) * 100);
                return (
                  <div className="savings-row" key={v.id}>
                    <div className="savings-info">
                      <div className="savings-name">{v.name}</div>
                      <div className="savings-target">Target: €{v.target.toLocaleString()}</div>
                    </div>
                    <div className="savings-controls">
                      <span className="savings-prefix">€</span>
                      <input
                        type="number" min="0" step="50" value={v.balance}
                        className="savings-input"
                        onChange={(e) => {
                          const uid = session.user.id;
                          const val = parseFloat(e.target.value) || 0;
                          setSavings((prev) => prev.map((s) => s.id === v.id ? { ...s, balance: val } : s));
                          debounceSave(`savings-${v.id}`, () => {
                            supabase.from("savings").update({ balance: val }).eq("id", v.id).eq("user_id", uid);
                          });
                        }}
                      />
                      <span className={`badge ${pct >= 100 ? "badge-green" : pct >= 50 ? "badge-warn" : "badge-red"}`}>{pct.toFixed(0)}%</span>
                      <button className="remove-btn" onClick={() => removeVault(v.id)}>✕</button>
                    </div>
                  </div>
                );
              })}
              <button className="add-btn" onClick={addVault}>+ Add vault</button>
            </div>
            <div className="card">
              <div className="card-title">Savings vs targets</div>
              <div className="chart-wrap">
                <BarChart labels={savings.map((v) => v.name)} datasets={savingsDatasets} />
              </div>
            </div>
          </>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="card">
            <div className="card-title">Merchant rules</div>
            {merchantRules.length === 0 ? (
              <div className="empty-state">No rules yet — recategorise a transaction and click "Yes" to save one.</div>
            ) : merchantRules.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f1efe8" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#0b0b0b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.merchant}</div>
                  <div style={{ fontSize: 11, color: "#898781", marginTop: 2 }}>→ {r.category}</div>
                </div>
                <button className="remove-btn" onClick={() => deleteMerchantRule(r.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </main>
      )}
    </div>
  );
}
