import { useState, useEffect, useRef, Fragment } from "react";
import { Chart } from "chart.js/auto";
import "./App.css";
import { supabase } from "./supabase";

const CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "#2a78d6", weekly: 80, keywords: ["tesco","supervalu","lidl","aldi","dunnes","spar","centra","co-op"] },
  { name: "Eating out", icon: "🍽️", color: "#1baf7a", weekly: 40, keywords: ["restaurant","cafe","coffee","mcdonalds","kfc","pizza","nando","subway","five guys","supermac"] },
  { name: "Takeaway", icon: "🛵", color: "#eda100", weekly: 30, keywords: ["deliveroo","just eat","uber eats","takeaway"] },
  { name: "Drinks / nights out", icon: "🍺", color: "#4a3aa7", weekly: 40, keywords: ["pub","bar","nightclub","off licence","o'briens"] },
  { name: "Transport", icon: "🚌", color: "#e34948", weekly: 25, keywords: ["leap","dublin bus","luas","dart","irish rail","taxi","uber","free now","bolt"] },
  { name: "Petrol", icon: "⛽", color: "#eb6834", weekly: 30, keywords: ["applegreen","circle k","maxol","topaz","texaco","esso","fuel","petrol"] },
  { name: "Shopping", icon: "🛍️", color: "#e87ba4", weekly: 50, keywords: ["amazon","penneys","primark","zara","h&m","asos","next","marks"] },
  { name: "Subscriptions", icon: "🔄", color: "#52514e", weekly: 15, keywords: ["netflix","spotify","disney","apple","google","microsoft","gym"] },
  { name: "Health", icon: "❤️", color: "#0ca30c", weekly: 20, keywords: ["pharmacy","boots","lloyds","gp","dentist","physio","chemist"] },
  { name: "Transfers", icon: "↔️", color: "#52514e", weekly: 0, keywords: ["transfer to", "transfer from"] },
  { name: "Other", icon: "•••", color: "#898781", weekly: 30, keywords: [] },
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

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("weekly");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(CATEGORIES.map((c) => ({ ...c })));
  const [savings, setSavings] = useState([]);
  const [importMsg, setImportMsg] = useState(null);
  const [merchantRules, setMerchantRules] = useState([]);
  const [pendingRule, setPendingRule] = useState(null);
  const saveTimers = useRef({});

  function debounceSave(key, fn, delay = 600) {
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(fn, delay);
  }

  useEffect(() => {
    async function load() {
      try {
        const [{ data: dbBudgets }, { data: dbTxns }, { data: dbSavings }, { data: dbRules }] = await Promise.all([
          supabase.from("budgets").select("*"),
          supabase.from("transactions").select("*").order("date", { ascending: false }),
          supabase.from("savings").select("*"),
          supabase.from("merchant_rules").select("*").order("merchant"),
        ]);

        if (dbBudgets?.length) {
          setBudgets(CATEGORIES.map((c) => {
            const db = dbBudgets.find((b) => b.name === c.name);
            return db ? { ...c, weekly: db.weekly } : c;
          }));
        }
        if (dbTxns?.length) setTransactions(dbTxns.map((t) => ({ ...t, date: new Date(t.date) })));
        if (dbSavings?.length) setSavings(dbSavings);
        if (dbRules?.length) setMerchantRules(dbRules);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  // Over budget categories (used in weekly view banner)
  const overBudgetCats = budgets.filter((b) =>
    b.name !== "Transfers" && b.weekly > 0 && (bycat[b.name] || 0) > b.weekly
  );

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const parsed = parseRevolutCSV(ev.target.result);
      if (!parsed) {
        setImportMsg({ ok: false, text: "Could not read this file. Make sure it's a Revolut CSV export." });
        return;
      }

      // Fetch fresh rules so this import benefits from any rules added during the session
      const { data: freshRules } = await supabase.from("merchant_rules").select("*");
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
      const { data: existing } = await supabase.from("transactions").select("id, category").in("id", ids);
      const savedCats = Object.fromEntries((existing || []).map((t) => [t.id, t.category]));

      const rows = parsedWithRules.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        amount: t.amount,
        category: savedCats[t.id] ?? t.category,
        account: t.account,
        balance: t.balance ?? null,
      }));

      await supabase.from("transactions").upsert(rows, { onConflict: "id" });

      const { data: dbTxns } = await supabase.from("transactions").select("*").order("date", { ascending: false });
      if (dbTxns) setTransactions(dbTxns.map((t) => ({ ...t, date: new Date(t.date) })));

      setImportMsg({ ok: true, text: `${parsed.length} transactions imported from ${file.name}.` });
    };
    reader.readAsText(file);
  }

  async function recategorise(id, cat) {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, category: cat } : t));
    await supabase.from("transactions").update({ category: cat }).eq("id", id);
    const txn = transactions.find((t) => t.id === id);
    const merchant = txn ? extractMerchant(txn.description) : "";
    if (merchant) setPendingRule({ txnId: id, merchant, category: cat });
  }

  async function saveRule() {
    if (!pendingRule) return;
    const { merchant, category } = pendingRule;
    const { data } = await supabase
      .from("merchant_rules")
      .upsert({ merchant, category }, { onConflict: "merchant" })
      .select()
      .single();
    if (data) {
      setMerchantRules((prev) => {
        const idx = prev.findIndex((r) => r.merchant === merchant);
        return idx >= 0 ? prev.map((r) => r.merchant === merchant ? data : r) : [...prev, data];
      });
    }
    // Retroactively apply the new category to every transaction whose description matches
    await supabase.from("transactions").update({ category }).ilike("description", `%${merchant}%`);
    setTransactions((prev) => prev.map((t) =>
      t.description.toLowerCase().includes(merchant) ? { ...t, category } : t
    ));
    setPendingRule(null);
  }

  async function addVault() {
    const name = prompt("Vault name:");
    if (!name) return;
    const target = parseFloat(prompt("Target amount (€):")) || 1000;
    const { data } = await supabase.from("savings").insert({ name, balance: 0, target }).select().single();
    if (data) setSavings((prev) => [...prev, data]);
  }

  async function removeVault(id) {
    await supabase.from("savings").delete().eq("id", id);
    setSavings((prev) => prev.filter((s) => s.id !== id));
  }

  async function deleteMerchantRule(id) {
    await supabase.from("merchant_rules").delete().eq("id", id);
    setMerchantRules((prev) => prev.filter((r) => r.id !== id));
  }

  const activeCats = budgets.filter((b) => bycat[b.name] > 0 && b.name !== "Transfers");
  const dashDatasets = activeCats.length ? [
    { label: "Spent", data: activeCats.map((b) => parseFloat(Math.abs(bycat[b.name]).toFixed(2))), backgroundColor: activeCats.map((b) => b.color + "cc"), borderRadius: 4, borderSkipped: false },
    { label: "Budget", data: activeCats.map((b) => b.weekly), backgroundColor: activeCats.map((b) => b.color + "33"), borderRadius: 4, borderSkipped: false },
  ] : [];

  const savingsDatasets = [
    { label: "Balance", data: savings.map((v) => v.balance), backgroundColor: "#2a78d6cc", borderRadius: 4, borderSkipped: false },
    { label: "Target", data: savings.map((v) => v.target), backgroundColor: "#2a78d622", borderRadius: 4, borderSkipped: false },
  ];

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  const txnRowProps = { pendingRule, onRecategorise: recategorise, onSaveRule: saveRule, onDismissRule: () => setPendingRule(null) };

  return (
    <div className="app">
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
        </div>
      </header>

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
                        <div className="budget-label">{b.icon} {b.name}</div>
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
                    <div className="empty-state">No transactions yet — import a Revolut CSV to get started.</div>
                  ) : (
                    <>
                      {weekSpendTxns.slice(0, 10).map((t) => (
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
                    <div className="empty-state">No spending recorded for {monthLabel}.</div>
                  ) : monthCatsSorted.map((c) => {
                    const pct = totalMonthSpent > 0 ? (c.spent / totalMonthSpent) * 100 : 0;
                    return (
                      <div className="budget-row" key={c.name}>
                        <div className="budget-label">{c.icon} {c.name}</div>
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
              <div className="budget-row" key={b.name}>
                <div className="budget-label">{b.icon} {b.name}</div>
                <div />
                <div className="budget-limit-label">weekly €</div>
                <input
                  type="number" min="0" step="5" value={b.weekly}
                  className="budget-input"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const { name, color, icon } = b;
                    setBudgets((prev) => prev.map((p, j) => j === i ? { ...p, weekly: val } : p));
                    debounceSave(`budget-${name}`, () => {
                      supabase.from("budgets").upsert({ name, weekly: val, color, icon }, { onConflict: "name" });
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
                          const val = parseFloat(e.target.value) || 0;
                          setSavings((prev) => prev.map((s) => s.id === v.id ? { ...s, balance: val } : s));
                          debounceSave(`savings-${v.id}`, () => {
                            supabase.from("savings").update({ balance: val }).eq("id", v.id);
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
    </div>
  );
}
