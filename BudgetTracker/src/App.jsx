import { useState, useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import "./App.css";

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

function catForDesc(desc) {
  const d = desc.toLowerCase();
  for (const c of CATEGORIES.slice(0, -1)) {
    if (c.keywords.some((k) => d.includes(k))) return c.name;
  }
  return "Other";
}

function parseRevolutCSV(text) {
  const lines = text.trim().split("\n");
  const cols = lines[0].split(",").map((c) => c.replace(/"/g, "").trim().toLowerCase());
  const dateIdx = cols.findIndex((c) => c.includes("completed date") || c.includes("started date"));
  const descIdx = cols.findIndex((c) => c.includes("description"));
  const amtIdx = cols.findIndex((c) => c === "amount");
  if (dateIdx < 0 || descIdx < 0 || amtIdx < 0) return null;
  const txns = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    if (row.length < 3) continue;
    const date = new Date(row[dateIdx]);
    const amt = parseFloat(row[amtIdx]);
    if (isNaN(date.getTime()) || isNaN(amt) || amt === 0) continue;
    txns.push({ id: `r-${i}`, date, description: row[descIdx] || "Unknown", amount: amt, category: catForDesc(row[descIdx] || ""), account: "Revolut" });
  }
  return txns;
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

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [weekOffset, setWeekOffset] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(CATEGORIES.map((c) => ({ ...c })));
  const [savings, setSavings] = useState([
    { id: 1, name: "Emergency fund", balance: 500, target: 2000 },
    { id: 2, name: "Holiday", balance: 200, target: 1500 },
  ]);
  const [importMsg, setImportMsg] = useState(null);

  const { start, end } = getWeekRange(weekOffset);
  const weekTxns = transactions.filter((t) => t.date >= start && t.date <= end && t.amount < 0);
  const totalSpent = weekTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + b.weekly, 0);
  const remaining = totalBudget - totalSpent;
  const totalSavings = savings.reduce((s, v) => s + v.balance, 0);

  const bycat = {};
  budgets.forEach((b) => (bycat[b.name] = 0));
  weekTxns.forEach((t) => { bycat[t.category] = (bycat[t.category] || 0) + Math.abs(t.amount); });

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imported = parseRevolutCSV(ev.target.result);
      if (!imported) { setImportMsg({ ok: false, text: "Could not read this file. Make sure it's a Revolut CSV export." }); return; }
      setTransactions((prev) => [...prev.filter((t) => t.account !== "Revolut"), ...imported].sort((a, b) => b.date - a.date));
      setImportMsg({ ok: true, text: `${imported.length} transactions imported from ${file.name}.` });
    };
    reader.readAsText(file);
  }

  function recategorise(id, cat) {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, category: cat } : t));
  }

  function addVault() {
    const name = prompt("Vault name:");
    if (!name) return;
    const target = parseFloat(prompt("Target amount (€):")) || 1000;
    setSavings((prev) => [...prev, { id: Date.now(), name, balance: 0, target }]);
  }

  const activeCats = budgets.filter((b) => bycat[b.name] > 0);
  const dashDatasets = activeCats.length ? [
    { label: "Spent", data: activeCats.map((b) => parseFloat(Math.abs(bycat[b.name]).toFixed(2))), backgroundColor: activeCats.map((b) => b.color + "cc"), borderRadius: 4, borderSkipped: false },
    { label: "Budget", data: activeCats.map((b) => b.weekly), backgroundColor: activeCats.map((b) => b.color + "33"), borderRadius: 4, borderSkipped: false },
  ] : [];

  const savingsDatasets = [
    { label: "Balance", data: savings.map((v) => v.balance), backgroundColor: "#2a78d6cc", borderRadius: 4, borderSkipped: false },
    { label: "Target", data: savings.map((v) => v.target), backgroundColor: "#2a78d622", borderRadius: 4, borderSkipped: false },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="logo">💶 Budget</span>
          <nav className="tabs">
            {["dashboard","budget","import","savings"].map((t) => (
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
              <button className="nav-btn" onClick={() => setWeekOffset((w) => w - 1)}>‹</button>
              <span className="week-label">{fmtWeekLabel(weekOffset)}</span>
              <button className="nav-btn" onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}>›</button>
            </div>
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
              {budgets.map((b) => {
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
              ) : weekTxns.slice(0, 10).map((t) => {
                const cat = CATEGORIES.find((c) => c.name === t.category) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <div className="txn-row" key={t.id}>
                    <div className="txn-icon" style={{ background: cat.color + "22", color: cat.color }}>{cat.icon}</div>
                    <div className="txn-meta">
                      <div className="txn-desc">{t.description}</div>
                      <div className="txn-date">{t.date.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}</div>
                    </div>
                    <select className="cat-select" value={t.category} onChange={(e) => recategorise(t.id, e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
                    </select>
                    <div className={`txn-amount ${t.amount < 0 ? "out" : "in"}`}>
                      {t.amount < 0 ? "-" : "+"}€{Math.abs(t.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })}
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
                  onChange={(e) => setBudgets((prev) => prev.map((p, j) => j === i ? { ...p, weekly: parseFloat(e.target.value) || 0 } : p))}
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
                        onChange={(e) => setSavings((prev) => prev.map((s) => s.id === v.id ? { ...s, balance: parseFloat(e.target.value) || 0 } : s))}
                      />
                      <span className={`badge ${pct >= 100 ? "badge-green" : pct >= 50 ? "badge-warn" : "badge-red"}`}>{pct.toFixed(0)}%</span>
                      <button className="remove-btn" onClick={() => setSavings((prev) => prev.filter((s) => s.id !== v.id))}>✕</button>
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
      </main>
    </div>
  );
}
