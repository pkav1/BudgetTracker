import { useState, useEffect, useRef, Fragment } from "react";
import { Chart } from "chart.js/auto";
import "./App.css";
import { supabase } from "./supabase";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

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
  { name: "Health / Personal Care", color: "#0ca30c", weekly: 20, keywords: ["pharmacy","boots","lloyds","gp","dentist","physio","chemist","haircut","barber","grooming","toiletries","salon","hairdresser","superdrug","beauty"],
    icon: I(<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>)},
  { name: "Sport", color: "#0f6e56", weekly: 15, keywords: ["decathlon","life style sports","intersport","elverys","gaa","ticketmaster","underdogs"],
    icon: I(<><line x1="6" y1="8" x2="6" y2="10"/><line x1="18" y1="14" x2="18" y2="16"/><line x1="4" y1="9" x2="8" y2="9"/><line x1="16" y1="15" x2="20" y2="15"/><line x1="8" y1="9" x2="16" y2="15"/></>)},
  { name: "IOUs & Splits", color: "#8b5cf6", weekly: 0, keywords: ["transfer to ", "transfer from "],
    icon: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>)},
  { name: "Transfers", color: "#52514e", weekly: 0, keywords: ["revolut**"],
    icon: I(<><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></>)},
  { name: "Other", color: "#898781", weekly: 30, keywords: [],
    icon: I(<><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>)},
];

const ACCOUNTS = [
  { id: "revolut", name: "Revolut", color: "#191c33" },
  { id: "boi", name: "Bank of Ireland", color: "#2a5fa5" },
];

const CHART_COLORS = [
  "#2a78d6","#1baf7a","#e34948","#eda100","#4a3aa7",
  "#854f0b","#0f6e56","#185fa5","#e87ba4","#639922",
  "#eb6834","#0ca30c","#898781","#52514e","#a32d2d",
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

// ── PIN lock helpers ──────────────────────────────────────────────────────────
// The PIN is hashed with a random salt via SHA-256 before storage.
// The plaintext PIN never leaves the browser and is never sent anywhere.

async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function getPinStore() {
  try { return JSON.parse(localStorage.getItem("pin_store") || "null"); } catch { return null; }
}
function setPinStore(hash, salt) {
  localStorage.setItem("pin_store", JSON.stringify({ hash, salt }));
}
function clearPinStore() {
  localStorage.removeItem("pin_store");
}

// Deterministic ID so re-importing the same CSV skips existing rows rather than duplicating them.
// Requires the transactions table's `id` column to be type TEXT.
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function parseRevolutCSV(text) {
  // Consolidated multi-section format (new export style)
  if (text.includes("Current Accounts Transaction Statements") ||
      text.includes("Current Accounts Summaries")) {
    return parseConsolidatedRevolutCSV(text);
  }

  // Legacy flat-CSV format
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
    const desc = row[descIdx] || "";
    // "Transfer" type catches Revolut-to-savings and similar; description check catches
    // Revolut-to-Revolut peer payments that Revolut labels as CARD_PAYMENT in the CSV.
    const isTransfer = (typeIdx >= 0 && row[typeIdx] === "Transfer") || /^revolut\*\*/i.test(desc);
    const category = isTransfer ? "Transfers" : catForDesc(desc);
    const id = `r-${hashStr(`${row[dateIdx]}|${row[descIdx]}|${row[amtIdx]}`)}`;
    const balance = balIdx >= 0 ? (parseFloat(row[balIdx]) ?? null) : null;
    txns.push({ id, date, description: row[descIdx] || "Unknown", amount: amt, category, account: "Revolut", balance });
  }
  return { txns, vaultDeposits: [] };
}

function parseConsolidatedRevolutCSV(text) {
  const MONTH = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

  // Guard against encoding artifact: UTF-8 € bytes read as Latin-1 produce â¬
  const src = text.replace(/â¬/g, "€");

  function csvRow(line) {
    const cells = [];
    let inQ = false, cell = "";
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cells.push(cell.trim()); cell = ""; }
      else { cell += ch; }
    }
    cells.push(cell.trim());
    return cells;
  }

  function parseAmt(s) {
    const n = parseFloat((s ?? "").replace(/[^\d.\-]/g, ""));
    return isNaN(n) ? NaN : n;
  }

  function parseDate(s) {
    const p = (s ?? "").trim().split(/\s+/);
    if (p.length !== 3) return null;
    const d = parseInt(p[0]), m = MONTH[p[1].toLowerCase()], y = parseInt(p[2]);
    return (isNaN(d) || m === undefined || isNaN(y)) ? null : new Date(y, m, d);
  }

  const txns = [];
  const vaultDeposits = [];  // { txnId, amount } — only for new-to-DB rows, checked in importTransactions
  let state = "seek_current";
  let dI = -1, descI = -1, amtI = -1, revCatI = -1;
  let sdI = -1, sdescI = -1, snetI = -1;

  for (const raw of src.split("\n")) {
    const cells = csvRow(raw);
    const f = cells[0] ?? "";

    if (state === "seek_current") {
      if (f === "Current Accounts Transaction Statements") state = "seek_eur";

    } else if (state === "seek_eur") {
      if (f === "Personal Account (EUR)") state = "seek_txn_label";

    } else if (state === "seek_txn_label") {
      if (f === "Transaction statement") state = "seek_txn_header";

    } else if (state === "seek_txn_header") {
      const low = cells.map(c => c.toLowerCase());
      if (low[0] === "date" && low.some(c => c.includes("money"))) {
        dI      = low.indexOf("date");
        descI   = low.indexOf("description");
        revCatI = low.indexOf("category");
        amtI    = low.findIndex(c => c.includes("money"));
        state = "parse_eur";
      }

    } else if (state === "parse_eur") {
      if (f === "Total" || f.startsWith("---")) { state = "seek_savings"; continue; }
      if (!f) continue;
      const revCat = revCatI >= 0 ? (cells[revCatI] ?? "") : "";
      if (revCat === "Top up") continue;
      const date = parseDate(cells[dI]);
      const desc = cells[descI] ?? "";
      const amt  = parseAmt(cells[amtI]);
      if (!date || isNaN(amt) || amt === 0 || !desc) continue;
      const isSavingsTransfer = /^to instant access savings$/i.test(desc);
      const pocketMatch = !isSavingsTransfer && desc.match(/^to pocket eur (.+?) from eur$/i);
      const category = (isSavingsTransfer || pocketMatch) ? "Transfers" : catForDesc(desc);
      const id = `r-${hashStr(`${date.toISOString().slice(0,10)}|${desc}|${amt}`)}`;
      txns.push({ id, date, description: desc, amount: amt, category, account: "Revolut", balance: null });
      if (isSavingsTransfer) vaultDeposits.push({ txnId: id, amount: Math.abs(amt), vaultName: "Emergency Fund" });
      else if (pocketMatch) vaultDeposits.push({ txnId: id, amount: Math.abs(amt), vaultName: pocketMatch[1].trim() });

    } else if (state === "seek_savings") {
      if (f === "Savings Accounts Transaction Statements") state = "seek_savings_eur";

    } else if (state === "seek_savings_eur") {
      if (f.startsWith("Savings") && f.includes("EUR")) state = "seek_savings_header";

    } else if (state === "seek_savings_header") {
      const low = cells.map(c => c.toLowerCase().trim());
      if (low.some(c => c.includes("net interest"))) {
        sdI    = low.indexOf("date");
        sdescI = low.indexOf("description");
        snetI  = low.findIndex(c => c.includes("net interest"));
        state = "parse_savings";
      }

    } else if (state === "parse_savings") {
      if (!f || f.startsWith("---")) continue;
      const date = parseDate(cells[sdI]);
      const desc = cells[sdescI] ?? "";
      const amt  = parseAmt(cells[snetI]);
      if (!date || isNaN(amt) || amt === 0 || !desc) continue;
      const id = `r-${hashStr(`${date.toISOString().slice(0,10)}|${desc}|${amt}`)}`;
      txns.push({ id, date, description: desc, amount: amt, category: "Other", account: "Revolut", balance: null });
      vaultDeposits.push({ txnId: id, amount: amt, vaultName: "Emergency Fund" });
    }
  }

  return { txns, vaultDeposits };
}

// ── BOI PDF parser ────────────────────────────────────────────────────────────

const BOI_MONTH = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
const BOI_DATE_RE = /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i;
const BOI_SKIP_RE = /BALANCE FORWARD|SUBTOTAL|^Page\s|\bBank of Ireland\b|Statement date|Your Current Account/i;
const BOI_NUM_RE = /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g;

function parseBOIAmt(s) { return parseFloat(s.replace(/,/g, "")); }

function catForBOI(desc) {
  const d = desc.trim();
  if (/^revolut\*\*/i.test(d)) return { category: "Transfers", isIncome: false };
  if (/^paypal europe sepa dd/i.test(d)) return { category: "Subscriptions", isIncome: false };
  if (/^ip\s/i.test(d)) return { category: "Other", isIncome: true };
  return { category: catForDesc(d), isIncome: false };
}

async function parseBOIPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const txns = [];
  let currentDate = null;
  let prevBalance = null;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group text items into rows by y-coordinate (±3px tolerance)
    const rows = [];
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const x = item.transform[4];
      let row = rows.find(r => Math.abs(r.y - y) <= 3);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ text: item.str, x });
    }
    rows.sort((a, b) => b.y - a.y); // top-to-bottom (PDF y origin = bottom)

    for (const { items } of rows) {
      const line = items.sort((a, b) => a.x - b.x).map(i => i.text).join(" ").trim();
      if (!line || BOI_SKIP_RE.test(line)) continue;

      const dm = line.match(BOI_DATE_RE);
      let rest = line;
      if (dm) {
        currentDate = new Date(parseInt(dm[3]), BOI_MONTH[dm[2].toLowerCase()], parseInt(dm[1]));
        rest = line.slice(dm[0].length).trim();
      }
      if (!currentDate || !rest) continue;

      // Extract all currency-format numbers (e.g. 1,234.56 or 3.49)
      const nums = [...rest.matchAll(BOI_NUM_RE)];
      if (!nums.length) continue;

      let amount, balance = null, desc;
      if (nums.length >= 2) {
        // Last number = balance, second-to-last = payment amount
        const last = nums[nums.length - 1];
        const prev = nums[nums.length - 2];
        balance = parseBOIAmt(last[1]);
        amount = parseBOIAmt(prev[1]);
        desc = rest.slice(0, prev.index).trim();
      } else {
        amount = parseBOIAmt(nums[0][1]);
        desc = rest.slice(0, nums[0].index).trim();
      }

      if (!desc || isNaN(amount) || amount <= 0) continue;

      let { category, isIncome } = catForBOI(desc);

      // Balance delta is the most reliable sign indicator
      if (balance !== null && prevBalance !== null) {
        isIncome = balance > prevBalance;
      }
      if (balance !== null) prevBalance = balance;

      const finalAmt = isIncome ? amount : -amount;
      const dateStr = currentDate.toISOString().slice(0, 10);
      txns.push({
        id: `b-${hashStr(`${dateStr}|${desc}|${finalAmt}`)}`,
        date: new Date(currentDate),
        description: desc,
        amount: finalAmt,
        category,
        account: "BOI",
        balance,
      });
    }
  }
  return txns;
}

// Strips BOI POS/date prefix (e.g. "POSC02JUN", "POS01JUN") then normalises to
// a stable 3-word key used for merchant rule matching.
function extractMerchant(description) {
  return description
    .trim()
    .replace(/^[A-Z]*\d{1,2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+/i, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function monthsUntil(yearMonth) {
  if (!yearMonth) return null;
  const [y, m] = yearMonth.split("-").map(Number);
  const now = new Date();
  const diff = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return diff > 0 ? diff : null;
}

const PLANNER_DEFAULT = {
  id: null,
  monthly_income: 0,
  investment_amount: 0,
  investment_mode: "amount",
  fixed_costs: [],
  savings_dates: {},
};

const NAV_ITEMS = [
  { id: "dashboard",    icon: "⊞", label: "Dashboard"    },
  { id: "transactions", icon: "≡", label: "Transactions"  },
  { id: "budget",       icon: "◑", label: "Budget"        },
  { id: "savings",      icon: "⬡", label: "Savings"       },
  { id: "investments",  icon: "↗", label: "Investments"   },
  { id: "planner",      icon: "▦", label: "Planner"       },
  { id: "statements",   icon: "↑", label: "Statements"    },
  { id: "settings",     icon: "⚙", label: "Settings"      },
];

function BarChart({ labels, datasets, yPrefix = "€", tickColor = "#6b7280", gridColor = "#e8ebee" }) {
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
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 }, maxRotation: 30 } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: (v) => yPrefix + v } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets, tickColor, gridColor]);
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

function DoughnutChart({ labels, data, colors, textColor = "#52514e" }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, font: { size: 12 }, padding: 16, boxWidth: 12 },
          },
          tooltip: {
            callbacks: { label: (ctx) => ` €${ctx.parsed.toFixed(0)}` },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data, colors, textColor]);
  return <canvas ref={ref} />;
}

function VaultRing({ pct }) {
  const SIZE = 44;
  const STROKE = 4.5;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const noTarget = pct === null;
  const fillPct = noTarget ? 100 : Math.min(100, pct);
  const offset = animated ? circ * (1 - fillPct / 100) : circ;

  let stroke;
  if (noTarget) {
    stroke = "var(--accent)";
  } else if (fillPct >= 100) {
    stroke = "#16a34a";
  } else if (fillPct >= 50) {
    const t = (fillPct - 50) / 50;
    stroke = `rgb(${Math.round(245 + t * (34 - 245))},${Math.round(158 + t * (197 - 158))},${Math.round(11 + t * (94 - 11))})`;
  } else {
    stroke = "#f59e0b";
  }

  return (
    <div className="vault-ring-wrap">
      <svg width={SIZE} height={SIZE} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke="var(--border-light)" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke={stroke} strokeWidth={STROKE}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s" }} />
      </svg>
      <span className="vault-ring-label" style={{ color: noTarget ? "var(--accent)" : stroke }}>
        {noTarget ? "—" : `${Math.round(fillPct)}%`}
      </span>
    </div>
  );
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
        <div className="auth-logo">
          <span className="auth-logo-mark">B</span>
          <span className="auth-logo-wordmark">Budget</span>
        </div>
        <p className="auth-tagline">Track your spending.</p>
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

const PIN_MAX_ATTEMPTS = 5;

function PinScreen({ onUnlock, onBypass }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  async function submit() {
    const store = getPinStore();
    if (!store) { onBypass(); return; }
    const h = await hashPin(pin, store.salt);
    if (h === store.hash) {
      onUnlock();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      if (next >= PIN_MAX_ATTEMPTS) {
        onBypass(true); // true = was locked out, sign out
      } else {
        setError(`Incorrect PIN — ${PIN_MAX_ATTEMPTS - next} attempt${PIN_MAX_ATTEMPTS - next !== 1 ? "s" : ""} remaining`);
      }
    }
  }

  const filledDots = Math.max(pin.length, 4);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">B</span>
          <span className="auth-logo-wordmark">Budget</span>
        </div>
        <div className="pin-dots">
          {Array.from({ length: filledDots }, (_, i) => (
            <div key={i} className={`pin-dot${i < pin.length ? " filled" : ""}`} />
          ))}
        </div>
        <input
          className="auth-input pin-input"
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter PIN"
          value={pin}
          autoFocus
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) submit(); }}
        />
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-btn-primary" onClick={submit} disabled={pin.length < 4}>
          Unlock
        </button>
        <button className="pin-bypass-btn" onClick={() => onBypass(false)}>
          Use email &amp; password instead
        </button>
      </div>
    </div>
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
  const [pwResetMsg, setPwResetMsg] = useState(null);
  const [planner, setPlanner] = useState(PLANNER_DEFAULT);
  const [portfolio, setPortfolio] = useState(null);   // null=never fetched, []=empty, [{…}]=loaded
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState(null);
  const [merchantRules, setMerchantRules] = useState([]);
  const [pendingRule, setPendingRule] = useState(null);
  const [importAccount, setImportAccount] = useState("revolut");
  const [importDateFrom, setImportDateFrom] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [importDateTo, setImportDateTo] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [importAllDates, setImportAllDates] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [pinExists, setPinExists] = useState(() => !!getPinStore());
  const [pinSetupMode, setPinSetupMode] = useState(null); // null | "set" | "change"
  const [pinSetupNew, setPinSetupNew] = useState("");
  const [pinSetupConfirm, setPinSetupConfirm] = useState("");
  const [pinSetupError, setPinSetupError] = useState(null);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnAccounts, setTxnAccounts] = useState([]);
  const [txnCategories, setTxnCategories] = useState([]);
  const [txnDateFrom, setTxnDateFrom] = useState("");
  const [txnDateTo, setTxnDateTo] = useState("");
  const saveTimers = useRef({});
  const [revVaultMeta, setRevVaultMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem("revolut_vaults") || "{}"); } catch { return {}; }
  });

  // ── Transaction search / filter ───────────────────────────────────────────

  function toggleTxnAccount(a) {
    setTxnAccounts(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }
  function toggleTxnCategory(c) {
    setTxnCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }
  function clearTxnFilters() {
    setTxnSearch(""); setTxnAccounts([]); setTxnCategories([]); setTxnDateFrom(""); setTxnDateTo("");
  }

  // ── PIN management ────────────────────────────────────────────────────────

  async function savePin() {
    if (pinSetupNew.length < 4) { setPinSetupError("PIN must be at least 4 digits."); return; }
    if (pinSetupNew !== pinSetupConfirm) { setPinSetupError("PINs don't match."); return; }
    const salt = crypto.randomUUID();
    const hash = await hashPin(pinSetupNew, salt);
    setPinStore(hash, salt);
    setPinExists(true);
    setPinSetupMode(null);
    setPinSetupNew("");
    setPinSetupConfirm("");
    setPinSetupError(null);
  }

  function removePin() {
    clearPinStore();
    setPinExists(false);
    setPinSetupMode(null);
  }

  function toggleDark() {
    setDarkMode((d) => {
      const next = !d;
      localStorage.setItem("darkMode", next);
      return next;
    });
  }

  useEffect(() => {
    document.body.style.background = darkMode ? "#0d1117" : "";
  }, [darkMode]);

  useEffect(() => {
    const names = { dashboard: "Dashboard", transactions: "Transactions", budget: "Budget", statements: "Statements", savings: "Savings", investments: "Investments", planner: "Planner", settings: "Settings" };
    document.title = `${names[tab] ?? tab} — Budget Tracker`;
  }, [tab]);

  async function loadPortfolio() {
    setPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const r = await fetch("/api/trading212?endpoint=equity/portfolio");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setPortfolio(Array.isArray(data) ? data : (data.items ?? []));
    } catch (err) {
      setPortfolioError(err.message);
    } finally {
      setPortfolioLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "investments" && portfolio === null && !portfolioLoading && !portfolioError) {
      loadPortfolio();
    }
  }, [tab]);

  function debounceSave(key, fn, delay = 600) {
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(fn, delay);
  }

  // Auth: check existing session on mount and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { setLoading(false); return; }
      // Existing session: show PIN screen if one is configured
      if (getPinStore()) setPinLocked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && getPinStore()) {
        // Returning via fresh email/password login while a PIN is set — lock immediately
        setPinLocked(true);
      }
      if (event === "SIGNED_OUT") {
        setPinLocked(false);
        setTransactions([]);
        setBudgets(CATEGORIES.map((c) => ({ ...c })));
        setSavings([]);
        setMerchantRules([]);
        setPlanner(PLANNER_DEFAULT);
        setPortfolio(null);
        setPortfolioError(null);
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
      supabase.from("planner").select("*").eq("user_id", uid).limit(1),
    ]).then(([{ data: dbBudgets }, { data: dbTxns }, { data: dbSavings }, { data: dbRules }, { data: dbPlanner }]) => {
      if (dbBudgets?.length) {
        setBudgets(CATEGORIES.map((c) => {
          const db = dbBudgets.find((b) => b.name === c.name)
            || (c.name === "Health / Personal Care" ? dbBudgets.find((b) => b.name === "Health") : null);
          return db ? { ...c, weekly: db.weekly } : c;
        }));
      }
      if (dbTxns?.length) {
        const txns = dbTxns.map((t) => ({ ...t, date: new Date(t.date) }));
        setTransactions(txns);
        // One-time migration: fix Revolut** rows imported before transfer detection was added
        const toFix = txns.filter(t => /^revolut\*\*/i.test(t.description) && t.category !== "Transfers");
        if (toFix.length > 0) {
          const fixIds = toFix.map(t => t.id);
          supabase.from("transactions")
            .update({ category: "Transfers" })
            .eq("user_id", uid)
            .in("id", fixIds)
            .then(() => {
              setTransactions(prev => prev.map(t =>
                fixIds.includes(t.id) ? { ...t, category: "Transfers" } : t
              ));
            });
        }
        // One-time migration: rename "Health" category to "Health / Personal Care"
        const healthIds = txns.filter(t => t.category === "Health").map(t => t.id);
        if (healthIds.length > 0) {
          supabase.from("transactions")
            .update({ category: "Health / Personal Care" })
            .eq("user_id", uid)
            .in("id", healthIds)
            .then(() => {
              setTransactions(prev => prev.map(t =>
                healthIds.includes(t.id) ? { ...t, category: "Health / Personal Care" } : t
              ));
            });
        }
        // One-time migration: person-payment transactions (e.g. "Transfer from JOHN PATRICK TARPEY")
        // should be "IOUs & Splits", not "Transfers" or "Other".
        // Catches rows previously mislabelled as "Transfers" (keyword era) and any already moved to
        // "Other" by an earlier migration pass.
        const iouIds = txns
          .filter(t =>
            (t.category === "Transfers" || t.category === "Other") &&
            /^transfer (?:from|to) /i.test(t.description) &&
            !/^revolut\*\*/i.test(t.description)
          )
          .map(t => t.id);
        if (iouIds.length > 0) {
          supabase.from("transactions")
            .update({ category: "IOUs & Splits" })
            .eq("user_id", uid)
            .in("id", iouIds)
            .then(() => {
              setTransactions(prev => prev.map(t =>
                iouIds.includes(t.id) ? { ...t, category: "IOUs & Splits" } : t
              ));
            });
        }
      }
      if (dbSavings?.length) setSavings(dbSavings);
      if (dbRules?.length) {
        setMerchantRules(dbRules);
        // One-time migration: strip POS date prefixes baked into saved merchant keys
        // e.g. "posc jun sugar" (old format) → "sugar" (clean format)
        const posPrefix = /^pos[a-z]?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+/i;
        const toFixRules = dbRules.filter(r => posPrefix.test(r.merchant));
        if (toFixRules.length > 0) {
          (async () => {
            for (const r of toFixRules) {
              const clean = r.merchant.replace(posPrefix, "").trim();
              const { error } = await supabase.from("merchant_rules")
                .update({ merchant: clean }).eq("id", r.id).eq("user_id", uid);
              if (error) {
                // Unique constraint conflict — a clean version of this rule already exists; remove the corrupt duplicate
                await supabase.from("merchant_rules").delete().eq("id", r.id).eq("user_id", uid);
              }
            }
            const { data } = await supabase.from("merchant_rules").select("*").eq("user_id", uid).order("merchant");
            if (data) setMerchantRules(data);
          })();
        }
      }
      if (dbPlanner?.length) {
        const p = dbPlanner[0];
        setPlanner({
          id: p.id,
          monthly_income: p.monthly_income ?? 0,
          investment_amount: p.investment_amount ?? 0,
          investment_mode: p.investment_mode ?? "amount",
          fixed_costs: p.fixed_costs ?? [],
          savings_dates: p.savings_dates ?? {},
        });
      }
      setLoading(false);
    });
  }, [session?.user?.id]);

  // ── Derived state ─────────────────────────────────────────────────────────

  // Transactions tab filter
  const filteredTxns = transactions.filter(t => {
    if (txnSearch && !t.description.toLowerCase().includes(txnSearch.toLowerCase())) return false;
    if (txnAccounts.length > 0 && !txnAccounts.includes(t.account)) return false;
    if (txnCategories.length > 0 && !txnCategories.includes(t.category)) return false;
    if (txnDateFrom && t.date < new Date(txnDateFrom + "T00:00:00")) return false;
    if (txnDateTo && t.date > new Date(txnDateTo + "T23:59:59")) return false;
    return true;
  });
  const filteredSpend  = filteredTxns.filter(t => t.amount < 0 && t.category !== "Transfers").reduce((s, t) => s + Math.abs(t.amount), 0);
  const filteredIncome = filteredTxns.filter(t => t.amount > 0 && t.category !== "Transfers").reduce((s, t) => s + t.amount, 0);
  const hasActiveTxnFilters = txnSearch || txnAccounts.length > 0 || txnCategories.length > 0 || txnDateFrom || txnDateTo;

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
  const monthIncomeTxns = monthTxns.filter((t) => t.amount > 0 && t.category !== "Transfers");
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

  async function importTransactions(parsed, accountLabel, vaultDeposits) {
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

    // Filter by selected date range (skipped when importAllDates is on)
    const from = new Date(importDateFrom + "T00:00:00");
    const to = new Date(importDateTo + "T23:59:59");
    const inRange = importAllDates ? parsed : parsed.filter(t => t.date >= from && t.date <= to);
    if (inRange.length === 0) {
      setImportMsg({ ok: false, text: importAllDates
        ? "No transactions found in this file."
        : "No transactions found in the selected date range." });
      return;
    }

    // Fetch fresh merchant rules and apply to non-transfer rows
    const { data: freshRules } = await supabase.from("merchant_rules").select("*").eq("user_id", uid);
    const rules = freshRules ?? merchantRules;
    const withRules = inRange.map(t => {
      if (t.category === "Transfers") return t;
      const desc = t.description.toLowerCase();
      const rule = rules.find(r => desc.includes(r.merchant));
      return rule ? { ...t, category: rule.category } : t;
    });

    // Duplicate detection: same account + date + description + amount (not ID-based).
    // When importing all dates, fetch all existing rows for this account (no date window).
    const dupQuery = supabase
      .from("transactions")
      .select("date, description, amount")
      .eq("user_id", uid)
      .eq("account", accountLabel);
    const { data: existingForAcct } = await (importAllDates
      ? dupQuery
      : dupQuery.gte("date", from.toISOString()).lte("date", to.toISOString()));
    const existingKeys = new Set(
      (existingForAcct || []).map(t =>
        `${t.date.slice(0, 10)}|${t.description}|${Math.round(parseFloat(t.amount) * 100)}`
      )
    );
    const toInsert = withRules.filter(t => {
      const key = `${t.date.toISOString().slice(0, 10)}|${t.description}|${Math.round(t.amount * 100)}`;
      return !existingKeys.has(key);
    });
    const skipped = inRange.length - toInsert.length;

    // === Vault processing ===
    // Runs BEFORE the duplicate-skip early return so it fires even when all regular
    // transactions are already in the DB. Uses a direct ID lookup instead of toInsert
    // so vault transactions outside the selected date range are still processed.
    let vaultNote = "";
    if (vaultDeposits?.length > 0) {
      const vaultTxnIds = [...new Set(vaultDeposits.map(d => d.txnId))];

      // Which vault transactions are already in the DB? (deterministic IDs, no date filter)
      const { data: existingVaultTxns } = await supabase
        .from("transactions").select("id").in("id", vaultTxnIds).eq("user_id", uid);
      const alreadyDbIds = new Set((existingVaultTxns || []).map(t => t.id));

      const newDeposits = vaultDeposits.filter(d => !alreadyDbIds.has(d.txnId));
      const importDate = new Date().toISOString().slice(0, 10);

      if (newDeposits.length > 0) {
        // Insert vault transactions that aren't in the DB yet.
        // These may be outside the user's chosen date range, but we always want them recorded.
        const newVaultTxnIds = new Set(newDeposits.map(d => d.txnId));
        const vaultTxnRows = parsed
          .filter(t => newVaultTxnIds.has(t.id))
          .map(t => ({
            id: t.id, date: t.date.toISOString(), description: t.description,
            amount: t.amount, category: t.category, account: accountLabel,
            balance: t.balance ?? null, user_id: uid,
          }));
        if (vaultTxnRows.length > 0) {
          await supabase.from("transactions").upsert(vaultTxnRows, { onConflict: "id" });
        }

        const byVault = {};
        for (const d of newDeposits) byVault[d.vaultName] = (byVault[d.vaultName] || 0) + d.amount;
        const vaultNotes = [];
        let localSavings = savings;

        for (const [vaultName, total] of Object.entries(byVault)) {
          const depositTotal = parseFloat(total.toFixed(2));
          if (depositTotal <= 0) continue;

          let vault = localSavings.find(v => v.name === vaultName);
          if (!vault) {
            const { data: newVault } = await supabase
              .from("savings")
              .insert({ name: vaultName, balance: 0, target: 0, user_id: uid })
              .select().single();
            if (newVault) {
              vault = newVault;
              setSavings(prev => [...prev, newVault]);
              localSavings = [...localSavings, newVault];
            }
          }
          if (vault) {
            const newBal = parseFloat((vault.balance + depositTotal).toFixed(2));
            await supabase.from("savings").update({ balance: newBal }).eq("id", vault.id).eq("user_id", uid);
            setSavings(prev => prev.map(v => v.id === vault.id ? { ...v, balance: newBal } : v));
            localSavings = localSavings.map(v => v.id === vault.id ? { ...v, balance: newBal } : v);
            vaultNotes.push(`+€${depositTotal.toFixed(2)} → ${vaultName}`);
          }
        }

        if (vaultNotes.length > 0) {
          vaultNote = ` · ${vaultNotes.join(", ")}`;
        }
      }

      // Always refresh sync metadata for every vault that appears in this CSV — including
      // on re-imports where all deposits are already in the DB. Without this, revVaultMeta
      // stays empty if the file was previously imported before meta tracking was added, or
      // if localStorage was cleared, and the sync badges / last-imported dates never appear.
      const updatedMeta = { ...JSON.parse(localStorage.getItem("revolut_vaults") || "{}") };
      const allVaultNames = [...new Set(vaultDeposits.map(d => d.vaultName))];
      let metaChanged = false;
      for (const vaultName of allVaultNames) {
        const vault = savings.find(v => v.name === vaultName);
        if (vault) {
          updatedMeta[vault.id] = { source: "revolut", lastImported: importDate };
          metaChanged = true;
        }
      }
      if (metaChanged) {
        localStorage.setItem("revolut_vaults", JSON.stringify(updatedMeta));
        setRevVaultMeta(updatedMeta);
      }
    }

    if (toInsert.length === 0) {
      setImportMsg({ ok: true, text: `All ${inRange.length} transactions already imported${skipped > 0 ? ` — ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped` : ""}${vaultNote}.` });
      return;
    }

    // Preserve existing manual recategorisations for rows that already exist in DB
    const ids = toInsert.map(t => t.id);
    const { data: existingCats } = await supabase
      .from("transactions").select("id, category").in("id", ids).eq("user_id", uid);
    const savedCats = Object.fromEntries((existingCats || []).map(t => [t.id, t.category]));

    const rows = toInsert.map(t => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount,
      category: savedCats[t.id] ?? t.category,
      account: accountLabel,
      balance: t.balance ?? null,
      user_id: uid,
    }));

    const { error: upsertError } = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
    if (upsertError) {
      setImportMsg({ ok: false, text: `Import failed: ${upsertError.message}` });
      return;
    }

    const { data: dbTxns } = await supabase
      .from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false });
    if (dbTxns) setTransactions(dbTxns.map(t => ({ ...t, date: new Date(t.date) })));

    const dupNote = skipped > 0 ? ` (${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped)` : "";
    setImportMsg({ ok: true, text: `${toInsert.length} transaction${toInsert.length !== 1 ? "s" : ""} imported${dupNote}${vaultNote}.` });
  }

  function processCSVFile(file) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = parseRevolutCSV(ev.target.result);
      if (!result) {
        setImportMsg({ ok: false, text: "Could not read this file. Make sure it's a Revolut CSV export." });
        return;
      }
      await importTransactions(result.txns, "Revolut", result.vaultDeposits);
    };
    reader.readAsText(file);
  }

  async function processPDFFile(file) {
    setImportMsg({ ok: null, text: "Parsing PDF, please wait…" });
    try {
      const parsed = await parseBOIPDF(file);
      if (!parsed.length) {
        setImportMsg({ ok: false, text: "No transactions found in this PDF. Make sure it's a Bank of Ireland statement." });
        return;
      }
      await importTransactions(parsed, "BOI");
    } catch (err) {
      setImportMsg({ ok: false, text: `Failed to parse PDF: ${err.message}` });
    }
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    processCSVFile(file);
  }

  function handlePDF(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    processPDFFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (importAccount === "revolut") processCSVFile(file);
    else processPDFFile(file);
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

  async function sendPasswordReset() {
    setPwResetMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email);
    if (error) setPwResetMsg({ ok: false, text: error.message });
    else setPwResetMsg({ ok: true, text: `Reset link sent to ${session.user.email}` });
  }

  async function deleteAllData() {
    const ok = window.confirm(
      "This will permanently delete all your transactions, savings, budgets and merchant rules. This cannot be undone.\n\nAre you sure?"
    );
    if (!ok) return;
    const uid = session.user.id;
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", uid),
      supabase.from("savings").delete().eq("user_id", uid),
      supabase.from("budgets").delete().eq("user_id", uid),
      supabase.from("merchant_rules").delete().eq("user_id", uid),
    ]);
    setTransactions([]);
    setSavings([]);
    setBudgets(CATEGORIES.map((c) => ({ ...c })));
    setMerchantRules([]);
  }

  // ── Planner ────────────────────────────────────────────────────────────────

  async function persistPlanner(p) {
    const uid = session.user.id;
    const payload = {
      user_id: uid,
      monthly_income: p.monthly_income,
      investment_amount: p.investment_amount,
      investment_mode: p.investment_mode,
      fixed_costs: p.fixed_costs,
      savings_dates: p.savings_dates,
    };
    if (p.id) {
      await supabase.from("planner").update(payload).eq("id", p.id);
    } else {
      const { data } = await supabase.from("planner").insert(payload).select().single();
      if (data) setPlanner((prev) => ({ ...prev, id: data.id }));
    }
  }

  function updatePlanner(updates) {
    setPlanner((prev) => {
      const next = { ...prev, ...updates };
      debounceSave("planner", () => persistPlanner(next));
      return next;
    });
  }

  function addFixedCost() {
    updatePlanner({ fixed_costs: [...planner.fixed_costs, { id: Date.now().toString(), name: "", amount: 0 }] });
  }
  function updateFixedCost(id, field, value) {
    updatePlanner({ fixed_costs: planner.fixed_costs.map((c) => c.id === id ? { ...c, [field]: value } : c) });
  }
  function removeFixedCost(id) {
    updatePlanner({ fixed_costs: planner.fixed_costs.filter((c) => c.id !== id) });
  }
  function toggleInvestMode(newMode) {
    if (newMode === planner.investment_mode) return;
    let newAmount = planner.investment_amount;
    if (newMode === "pct" && planner.monthly_income > 0)
      newAmount = parseFloat(((planner.investment_amount / planner.monthly_income) * 100).toFixed(1));
    else if (newMode === "amount" && planner.monthly_income > 0)
      newAmount = parseFloat(((planner.investment_amount / 100) * planner.monthly_income).toFixed(0));
    updatePlanner({ investment_mode: newMode, investment_amount: newAmount });
  }

  // ── Chart datasets ─────────────────────────────────────────────────────────

  const activeCats = budgets.filter((b) => bycat[b.name] > 0 && b.name !== "Transfers");
  const dashDatasets = activeCats.length ? [
    { label: "Spent", data: activeCats.map((b) => parseFloat(Math.abs(bycat[b.name]).toFixed(2))), backgroundColor: activeCats.map((b) => b.color + "cc"), borderRadius: 4, borderSkipped: false },
    { label: "Budget", data: activeCats.map((b) => b.weekly), backgroundColor: activeCats.map((b) => b.color + "33"), borderRadius: 4, borderSkipped: false },
  ] : [];

  const savingsDatasets = [
    { label: "Balance", data: savings.map((v) => v.balance), backgroundColor: darkMode ? "#3b82f6cc" : "#2563ebcc", borderRadius: 6, borderSkipped: false },
    { label: "Target", data: savings.map((v) => v.target), backgroundColor: darkMode ? "#3b82f622" : "#2563eb22", borderRadius: 6, borderSkipped: false },
  ];

  // ── Portfolio derived ──────────────────────────────────────────────────────

  const sortedPortfolio = portfolio
    ? [...portfolio].sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice))
    : [];
  const pfTotalValue    = sortedPortfolio.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const pfTotalInvested = sortedPortfolio.reduce((s, p) => s + p.quantity * (p.averagePrice ?? p.averageBuyPrice ?? 0), 0);
  const pfTotalPnL      = sortedPortfolio.reduce((s, p) => s + (p.ppl ?? 0), 0);
  const pfPnLPct        = pfTotalInvested > 0 ? (pfTotalPnL / pfTotalInvested) * 100 : 0;

  // ── Planner derived ────────────────────────────────────────────────────────

  const investEur = planner.investment_mode === "pct"
    ? (planner.monthly_income * planner.investment_amount) / 100
    : planner.investment_amount;
  const fixedTotal = planner.fixed_costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const savingsContribTotal = savings.reduce((sum, v) => {
    const needed = Math.max(0, v.target - v.balance);
    const months = monthsUntil(planner.savings_dates[v.id]);
    return sum + (months && needed > 0 ? needed / months : 0);
  }, 0);
  const plannerAvailable = planner.monthly_income - fixedTotal - savingsContribTotal - investEur;
  const weeklyBudgetMonthly = budgets.filter((b) => b.name !== "Transfers").reduce((s, b) => s + b.weekly, 0) * 4;
  const plannerChartData = [fixedTotal, savingsContribTotal, investEur, Math.max(0, plannerAvailable)].map((v) => parseFloat(v.toFixed(2)));
  const plannerChartLabels = ["Fixed costs", "Savings", "Investments", "Spending"];
  const plannerChartColors = ["#e34948", "#2a78d6", "#0f6e56", "#1baf7a"];
  const plannerChartFiltered = plannerChartLabels
    .map((l, i) => ({ l, v: plannerChartData[i], c: plannerChartColors[i] }))
    .filter((x) => x.v > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading && !session) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  if (pinLocked) {
    return (
      <PinScreen
        onUnlock={() => setPinLocked(false)}
        onBypass={async (lockedOut) => {
          if (lockedOut) {
            // Too many wrong attempts — sign out so they must re-authenticate properly
            await supabase.auth.signOut();
          } else {
            // Voluntary bypass (forgot PIN, wants to use email & password to get in and fix it)
            setPinLocked(false);
          }
        }}
      />
    );
  }

  const txnRowProps = { pendingRule, onRecategorise: recategorise, onSaveRule: saveRule, onDismissRule: () => setPendingRule(null) };

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">B</span>
          <span className="sidebar-logo-text">Budget</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`sidebar-item${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-action" onClick={toggleDark}>
            <span className="sidebar-icon">{darkMode ? "☀️" : "🌙"}</span>
            <span className="sidebar-label">{darkMode ? "Light" : "Dark"} mode</span>
          </button>
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">{session.user.email[0].toUpperCase()}</span>
            <span className="sidebar-user-email">{session.user.email}</span>
          </div>
          <button className="sidebar-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </aside>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ id, icon }) => (
          <button
            key={id}
            className={`bottom-nav-item${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="bottom-nav-icon">{icon}</span>
          </button>
        ))}
      </nav>

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
                    if (!b.weekly && !spent) return null;
                    const pct = b.weekly > 0 ? Math.min(100, (spent / b.weekly) * 100) : 0;
                    const color = b.weekly > 0 ? (pct > 100 ? "#e24b4a" : pct > 80 ? "#ba7517" : b.color) : b.color;
                    return (
                      <div className="budget-row" key={b.name}>
                        <div className="budget-label">{b.icon}<span>{b.name}</span></div>
                        <div className="progress-wrap">{b.weekly > 0 && <div className="progress-bar" style={{ width: pct + "%", background: color }} />}</div>
                        <div className="budget-spent" style={{ color }}>{`€${spent.toFixed(0)}`}</div>
                        <div className="budget-limit">{b.weekly > 0 ? `/ €${b.weekly}` : ""}</div>
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

        {/* TRANSACTIONS */}
        {tab === "transactions" && (
          <>
            {/* Filters card */}
            <div className="card">
              <input
                type="search"
                className="txn-search-input"
                placeholder="Search by merchant or description…"
                value={txnSearch}
                onChange={e => setTxnSearch(e.target.value)}
              />

              {/* Account filter */}
              <div className="filter-section">
                <div className="filter-label">Account</div>
                <div className="filter-chips">
                  {["Revolut", "BOI"].map(a => (
                    <button
                      key={a}
                      className={`filter-chip${txnAccounts.includes(a) ? " active" : ""}`}
                      onClick={() => toggleTxnAccount(a)}
                    >{a}</button>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div className="filter-section">
                <div className="filter-label">Category</div>
                <div className="filter-chips">
                  {CATEGORIES.map(c => {
                    const on = txnCategories.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        className={`filter-chip${on ? " active" : ""}`}
                        style={on ? { background: c.color + "22", borderColor: c.color } : {}}
                        onClick={() => toggleTxnCategory(c.name)}
                      >
                        <span className="filter-chip-dot" style={on ? { background: c.color } : {}} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date range */}
              <div className="filter-section">
                <div className="filter-label">Date range</div>
                <div className="import-date-range" style={{ alignItems: "center" }}>
                  <div className="import-date-field">
                    <label>From</label>
                    <input type="date" className="import-date-input" value={txnDateFrom} onChange={e => setTxnDateFrom(e.target.value)} />
                  </div>
                  <div className="import-date-field">
                    <label>To</label>
                    <input type="date" className="import-date-input" value={txnDateTo} onChange={e => setTxnDateTo(e.target.value)} />
                  </div>
                  {(txnDateFrom || txnDateTo) && (
                    <button className="filter-clear-btn" style={{ alignSelf: "flex-end", marginBottom: 2 }} onClick={() => { setTxnDateFrom(""); setTxnDateTo(""); }}>
                      Clear dates
                    </button>
                  )}
                </div>
              </div>

              {hasActiveTxnFilters && (
                <button className="filter-clear-btn" style={{ marginTop: 4 }} onClick={clearTxnFilters}>
                  Clear all filters
                </button>
              )}
            </div>

            {/* Results card */}
            <div className="card">
              {/* Summary row */}
              <div className="filter-summary">
                <span className="filter-count">
                  {filteredTxns.length} transaction{filteredTxns.length !== 1 ? "s" : ""}
                </span>
                <div className="filter-totals">
                  {filteredIncome > 0 && (
                    <span className="filter-total in">+€{filteredIncome.toFixed(2)}</span>
                  )}
                  {filteredSpend > 0 && (
                    <span className="filter-total out">−€{filteredSpend.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {filteredTxns.length === 0 ? (
                <EmptyState
                  emoji="🔍"
                  headline={transactions.length === 0 ? "No transactions yet" : "No matches"}
                  sub={transactions.length === 0 ? "Import a statement to get started" : "Try adjusting your search or filters"}
                />
              ) : (
                filteredTxns.map(t => <TxnRow key={t.id} t={t} {...txnRowProps} />)
              )}
            </div>
          </>
        )}

        {/* BUDGET */}
        {tab === "budget" && (
          <div className="card">
            <div className="card-title">Weekly budget limits</div>
            {planner.monthly_income > 0 && (
              <div style={{
                background: weeklyBudgetMonthly > plannerAvailable ? "var(--red-bg)"
                  : weeklyBudgetMonthly >= plannerAvailable * 0.9 ? "var(--amber-bg)"
                  : "var(--green-bg)",
                color: weeklyBudgetMonthly > plannerAvailable ? "var(--red)"
                  : weeklyBudgetMonthly >= plannerAvailable * 0.9 ? "var(--amber)"
                  : "var(--green)",
                borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500, marginBottom: "1rem",
              }}>
                <div>Planner: €{plannerAvailable.toFixed(0)}/mo available · Limits total: €{weeklyBudgetMonthly.toFixed(0)}/mo</div>
                <div style={{ fontWeight: 400, fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                  {weeklyBudgetMonthly > plannerAvailable
                    ? `€${(weeklyBudgetMonthly - plannerAvailable).toFixed(0)} over — reduce limits or update your Planner`
                    : weeklyBudgetMonthly >= plannerAvailable * 0.9
                    ? `€${(plannerAvailable - weeklyBudgetMonthly).toFixed(0)} to spare — limits are close to the maximum`
                    : `€${(plannerAvailable - weeklyBudgetMonthly).toFixed(0)} buffer — limits fit comfortably`}
                </div>
              </div>
            )}
            {budgets.filter((b) => b.name !== "IOUs & Splits").map((b, i) => (
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

        {/* STATEMENTS */}
        {tab === "statements" && (
          <>
            <div className="card">
              <div className="card-title">Select account</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCOUNTS.map((a) => (
                  <button
                    key={a.id}
                    className={`account-chip${importAccount === a.id ? " selected" : ""}`}
                    style={importAccount === a.id ? { background: a.color, borderColor: a.color, color: "#fff" } : {}}
                    onClick={() => { setImportAccount(a.id); setImportMsg(null); }}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="import-date-header">
                <div className="card-title" style={{ marginBottom: 0 }}>Date range</div>
                <label className="import-all-toggle">
                  <input
                    type="checkbox"
                    checked={importAllDates}
                    onChange={(e) => setImportAllDates(e.target.checked)}
                  />
                  Import all dates
                </label>
              </div>
              {!importAllDates && (
                <div className="import-date-range" style={{ marginTop: "0.75rem" }}>
                  <div className="import-date-field">
                    <label>From</label>
                    <input type="date" className="import-date-input" value={importDateFrom} onChange={(e) => setImportDateFrom(e.target.value)} />
                  </div>
                  <div className="import-date-field">
                    <label>To</label>
                    <input type="date" className="import-date-input" value={importDateTo} onChange={(e) => setImportDateTo(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {importAccount === "revolut" && (
              <div
                className={`upload-zone${dragOver ? " drag-over" : ""}`}
                onClick={() => document.getElementById("csvFile").click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                onDrop={handleDrop}
              >
                <div className="upload-icon">{dragOver ? "📥" : "📂"}</div>
                <p>{dragOver ? "Drop to import" : "Click to upload your Revolut CSV"}</p>
                <small>Or drag and drop a file here · Revolut app → Account → Statement → CSV</small>
              </div>
            )}
            {importAccount === "boi" && (
              <div
                className={`upload-zone${dragOver ? " drag-over" : ""}`}
                onClick={() => document.getElementById("pdfFile").click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
                onDrop={handleDrop}
              >
                <div className="upload-icon">{dragOver ? "📥" : "📄"}</div>
                <p>{dragOver ? "Drop to import" : "Click to upload your Bank of Ireland PDF statement"}</p>
                <small>Or drag and drop a file here · BOI Online Banking → Statements → PDF</small>
              </div>
            )}

            <input type="file" id="csvFile" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
            <input type="file" id="pdfFile" accept=".pdf" style={{ display: "none" }} onChange={handlePDF} />
            {importMsg && (
              <div className={`import-msg ${importMsg.ok === true ? "ok" : importMsg.ok === false ? "err" : "info"}`}>
                {importMsg.text}
              </div>
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
                const pct = v.target > 0 ? Math.min(100, (v.balance / v.target) * 100) : null;
                const autoMeta = revVaultMeta[v.id];
                return (
                  <div className="savings-row" key={v.id}>
                    <div className="savings-info">
                      <div className="savings-name-row">
                        <span className="savings-name">{v.name}</span>
                        {autoMeta && <span className="vault-sync-badge">↻ Revolut</span>}
                      </div>
                      <div className="savings-target">Target: €{v.target.toLocaleString()}</div>
                      {autoMeta && (
                        <div className="vault-last-imported">Last imported: {autoMeta.lastImported}</div>
                      )}
                    </div>
                    <div className="savings-controls">
                      {autoMeta ? (
                        <span className="savings-balance-static">€{v.balance.toFixed(2)}</span>
                      ) : (
                        <>
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
                          <button className="remove-btn" onClick={() => removeVault(v.id)}>✕</button>
                        </>
                      )}
                      <VaultRing pct={pct} />
                    </div>
                    {autoMeta && (
                      <div className="vault-auto-note">Balance overwritten on next Revolut import</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-title">Savings vs targets</div>
              <div className="chart-wrap">
                <BarChart
                  labels={savings.map((v) => v.name)}
                  datasets={savingsDatasets}
                  tickColor={darkMode ? "#8b949e" : "#6b7280"}
                  gridColor={darkMode ? "#21262d" : "#e8ebee"}
                />
              </div>
            </div>
          </>
        )}

        {/* INVESTMENTS */}
        {tab === "investments" && (
          <>
            {portfolioLoading && (
              <div className="card">
                <div className="skel" style={{ height: 14, width: 160, marginBottom: 20 }} />
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "0.5px solid #f1efe8" }}>
                    <div className="skel" style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
                    <div className="skel" style={{ height: 13, width: 60 }} />
                    <div style={{ flex: 1 }} />
                    <div className="skel" style={{ height: 13, width: 70 }} />
                    <div className="skel" style={{ height: 13, width: 60 }} />
                  </div>
                ))}
              </div>
            )}

            {portfolioError && (
              <div className="card">
                <EmptyState emoji="⚠️" headline="Could not load portfolio" sub={portfolioError} />
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button className="settings-btn" onClick={() => { setPortfolioError(null); loadPortfolio(); }}>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {portfolio !== null && !portfolioLoading && !portfolioError && (
              <>
                <div className="metric-row">
                  {[
                    { label: "Portfolio value", value: `€${pfTotalValue.toFixed(2)}` },
                    { label: "Total invested",  value: `€${pfTotalInvested.toFixed(2)}` },
                    { label: "Profit / Loss",   value: `${pfTotalPnL >= 0 ? "+" : ""}€${pfTotalPnL.toFixed(2)}`,
                      sub: `${pfPnLPct >= 0 ? "+" : ""}${pfPnLPct.toFixed(2)}%`, warn: pfTotalPnL < 0 },
                  ].map((m) => (
                    <div className="metric" key={m.label}>
                      <div className="metric-label">{m.label}</div>
                      <div className={`metric-value${m.warn ? " over" : ""}`}>{m.value}</div>
                      {m.sub && <div className="metric-sub">{m.sub}</div>}
                    </div>
                  ))}
                </div>

                {sortedPortfolio.length === 0 ? (
                  <div className="card">
                    <EmptyState emoji="📈" headline="No positions yet" sub="Your Trading 212 portfolio is empty — positions will appear here once you invest" />
                  </div>
                ) : (
                  <>
                    <div className="card">
                      <div className="card-title inv-title-row">
                        <span>Holdings</span>
                        <button className="settings-btn" style={{ fontSize: 12 }} onClick={() => { setPortfolio(null); setPortfolioError(null); loadPortfolio(); }}>↺ Refresh</button>
                      </div>
                      <div className="inv-header">
                        <span>Ticker</span>
                        <span className="inv-right">Qty</span>
                        <span className="inv-right">Value</span>
                        <span className="inv-right">P&amp;L</span>
                      </div>
                      {sortedPortfolio.map((p, i) => {
                        const value   = p.quantity * p.currentPrice;
                        const pnl     = p.ppl ?? 0;
                        const ticker  = p.ticker.split("_")[0];
                        const qty     = p.quantity % 1 === 0 ? p.quantity : p.quantity.toFixed(4);
                        return (
                          <div key={p.ticker} className="inv-row">
                            <div className="inv-ticker">
                              <span className="inv-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="inv-ticker-text">{ticker}</span>
                            </div>
                            <span className="inv-right inv-qty">{qty}</span>
                            <span className="inv-right inv-value">€{value.toFixed(2)}</span>
                            <span className={`inv-right inv-pnl ${pnl >= 0 ? "pos" : "neg"}`}>
                              {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="card">
                      <div className="card-title">Allocation</div>
                      <div className="chart-wrap" style={{ height: 320 }}>
                        <DoughnutChart
                          labels={sortedPortfolio.map((p) => p.ticker.split("_")[0])}
                          data={sortedPortfolio.map((p) => parseFloat((p.quantity * p.currentPrice).toFixed(2)))}
                          colors={sortedPortfolio.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])}
                          textColor={darkMode ? "#a0a0a0" : "#52514e"}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* PLANNER */}
        {tab === "planner" && (
          <>
            {/* Monthly income */}
            <div className="card">
              <div className="card-title">Monthly take-home pay</div>
              <div className="planner-income-row">
                <span className="planner-currency">€</span>
                <input
                  type="number" min="0" step="100" placeholder="0"
                  className="planner-income-input"
                  value={planner.monthly_income || ""}
                  onChange={(e) => updatePlanner({ monthly_income: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Fixed costs */}
            <div className="card">
              <div className="card-title">Fixed costs</div>
              {planner.fixed_costs.map((cost) => (
                <div key={cost.id} className="planner-row">
                  <input
                    className="planner-name-input"
                    placeholder="e.g. Rent"
                    value={cost.name}
                    onChange={(e) => updateFixedCost(cost.id, "name", e.target.value)}
                  />
                  <div className="planner-amount-wrap">
                    <span className="planner-currency">€</span>
                    <input
                      type="number" min="0" step="10" placeholder="0"
                      className="planner-amount-input"
                      value={cost.amount || ""}
                      onChange={(e) => updateFixedCost(cost.id, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button className="remove-btn" onClick={() => removeFixedCost(cost.id)}>✕</button>
                </div>
              ))}
              <button className="add-btn" onClick={addFixedCost}>+ Add fixed cost</button>
              {planner.fixed_costs.length > 0 && (
                <div className="planner-subtotal">Fixed total: <strong>€{fixedTotal.toFixed(0)}</strong> / mo</div>
              )}
            </div>

            {/* Savings contributions */}
            <div className="card">
              <div className="card-title">Savings contributions</div>
              {savings.length === 0 ? (
                <EmptyState emoji="🏦" headline="No vaults yet" sub="Add savings vaults in the Savings tab to plan contributions here" />
              ) : savings.map((v) => {
                const needed = Math.max(0, v.target - v.balance);
                const months = monthsUntil(planner.savings_dates[v.id]);
                const monthly = months && needed > 0 ? needed / months : 0;
                const pctDone = Math.min(100, v.target > 0 ? (v.balance / v.target) * 100 : 0);
                return (
                  <div key={v.id} className="planner-savings-row">
                    <div className="planner-savings-info">
                      <div className="planner-savings-name">{v.name}</div>
                      <div className="planner-savings-meta">
                        €{v.balance.toLocaleString()} of €{v.target.toLocaleString()} ({pctDone.toFixed(0)}%)
                      </div>
                    </div>
                    <div className="planner-savings-controls">
                      <input
                        type="month"
                        className="planner-month-input"
                        value={planner.savings_dates[v.id] || ""}
                        onChange={(e) => updatePlanner({
                          savings_dates: { ...planner.savings_dates, [v.id]: e.target.value }
                        })}
                      />
                      <div className={`planner-contrib${monthly > 0 ? " active" : ""}`}>
                        {needed <= 0 ? "✓ Met" : monthly > 0 ? `€${monthly.toFixed(0)}/mo` : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
              {savings.length > 0 && savingsContribTotal > 0 && (
                <div className="planner-subtotal">Savings total: <strong>€{savingsContribTotal.toFixed(0)}</strong> / mo</div>
              )}
            </div>

            {/* Investments */}
            <div className="card">
              <div className="card-title">Investments</div>
              <div className="planner-row">
                <div className="planner-mode-toggle">
                  <button className={planner.investment_mode === "amount" ? "active" : ""} onClick={() => toggleInvestMode("amount")}>€</button>
                  <button className={planner.investment_mode === "pct" ? "active" : ""} onClick={() => toggleInvestMode("pct")}>%</button>
                </div>
                <div className="planner-amount-wrap">
                  <span className="planner-currency">{planner.investment_mode === "pct" ? "%" : "€"}</span>
                  <input
                    type="number" min="0" step={planner.investment_mode === "pct" ? "1" : "50"} placeholder="0"
                    className="planner-amount-input"
                    value={planner.investment_amount || ""}
                    onChange={(e) => updatePlanner({ investment_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {planner.investment_amount > 0 && planner.monthly_income > 0 && (
                  <div className="planner-derived">
                    {planner.investment_mode === "pct"
                      ? `= €${investEur.toFixed(0)} / mo`
                      : `= ${((investEur / planner.monthly_income) * 100).toFixed(1)}% of income`}
                  </div>
                )}
              </div>
            </div>

            {/* Spending budget summary */}
            <div className="card">
              <div className="card-title">Spending budget</div>
              <div className="planner-summary">
                <div className="planner-summary-row">
                  <span>Monthly income</span>
                  <span className="planner-summary-val">€{planner.monthly_income.toFixed(0)}</span>
                </div>
                <div className="planner-summary-row">
                  <span>Fixed costs</span>
                  <span className="planner-summary-deduct">− €{fixedTotal.toFixed(0)}</span>
                </div>
                <div className="planner-summary-row">
                  <span>Savings contributions</span>
                  <span className="planner-summary-deduct">− €{savingsContribTotal.toFixed(0)}</span>
                </div>
                <div className="planner-summary-row">
                  <span>Investments</span>
                  <span className="planner-summary-deduct">− €{investEur.toFixed(0)}</span>
                </div>
                <div className="planner-summary-divider" />
                <div className="planner-summary-row planner-summary-result">
                  <span>Available for spending</span>
                  <strong className={plannerAvailable < 0 ? "over" : ""}>
                    {plannerAvailable < 0 ? "-" : ""}€{Math.abs(plannerAvailable).toFixed(0)}
                  </strong>
                </div>
                <div className="planner-summary-row planner-summary-compare">
                  <span>Weekly budgets × 4</span>
                  <span>€{weeklyBudgetMonthly.toFixed(0)}</span>
                </div>
                {planner.monthly_income > 0 && (
                  <div className={`planner-compare-banner ${plannerAvailable >= weeklyBudgetMonthly ? "ok" : "warn"}`}>
                    {plannerAvailable >= weeklyBudgetMonthly
                      ? `€${(plannerAvailable - weeklyBudgetMonthly).toFixed(0)} buffer above your weekly budgets`
                      : `€${(weeklyBudgetMonthly - plannerAvailable).toFixed(0)} short of your weekly budgets`}
                  </div>
                )}
              </div>
            </div>

            {/* Doughnut chart */}
            {planner.monthly_income > 0 && plannerChartFiltered.length > 0 && (
              <div className="card">
                <div className="card-title">Breakdown</div>
                <div className="chart-wrap" style={{ height: 300 }}>
                  <DoughnutChart
                    labels={plannerChartFiltered.map((x) => x.l)}
                    data={plannerChartFiltered.map((x) => x.v)}
                    colors={plannerChartFiltered.map((x) => x.c)}
                    textColor={darkMode ? "#a0a0a0" : "#52514e"}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <>
            <div className="card">
              <div className="card-title">Account</div>
              <div className="settings-row">
                <div className="settings-label">Signed in as</div>
                <div className="settings-value">{session.user.email}</div>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Password</div>
                  <div className="settings-hint">Send a reset link to your email address</div>
                </div>
                <button className="settings-btn" onClick={sendPasswordReset}>Send reset email</button>
              </div>
              {pwResetMsg && (
                <div className={`import-msg ${pwResetMsg.ok ? "ok" : "err"}`} style={{ marginTop: 8 }}>{pwResetMsg.text}</div>
              )}
            </div>

            <div className="card">
              <div className="card-title">PIN Lock</div>
              {pinExists ? (
                <>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">PIN is enabled</div>
                      <div className="settings-hint">You'll be asked for your PIN when returning to the app</div>
                    </div>
                    <button className="settings-btn" onClick={() => { setPinSetupMode("change"); setPinSetupNew(""); setPinSetupConfirm(""); setPinSetupError(null); }}>
                      Change
                    </button>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Remove PIN</div>
                      <div className="settings-hint">Disables the lock screen — email and password only</div>
                    </div>
                    <button className="danger-btn" onClick={removePin}>Remove</button>
                  </div>
                </>
              ) : (
                <div className="settings-row">
                  <div>
                    <div className="settings-label">PIN lock</div>
                    <div className="settings-hint">Set a 4–6 digit PIN to quickly unlock the app</div>
                  </div>
                  <button className="settings-btn" onClick={() => { setPinSetupMode("set"); setPinSetupNew(""); setPinSetupConfirm(""); setPinSetupError(null); }}>
                    Set PIN
                  </button>
                </div>
              )}
              {pinSetupMode && (
                <div className="pin-setup-form">
                  <div className="pin-setup-row">
                    <label className="pin-setup-label">New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="4–6 digits"
                      className="pin-setup-input"
                      value={pinSetupNew}
                      onChange={(e) => { setPinSetupNew(e.target.value.replace(/\D/g, "")); setPinSetupError(null); }}
                    />
                  </div>
                  <div className="pin-setup-row">
                    <label className="pin-setup-label">Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Repeat PIN"
                      className="pin-setup-input"
                      value={pinSetupConfirm}
                      onChange={(e) => { setPinSetupConfirm(e.target.value.replace(/\D/g, "")); setPinSetupError(null); }}
                    />
                  </div>
                  {pinSetupError && <div className="pin-setup-error">{pinSetupError}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="auth-btn-primary" style={{ flex: 1, padding: "7px" }} onClick={savePin}>
                      Save PIN
                    </button>
                    <button className="auth-btn-secondary" style={{ flex: 1, padding: "7px" }} onClick={() => { setPinSetupMode(null); setPinSetupError(null); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Merchant rules</div>
              {merchantRules.length === 0 ? (
                <div className="empty-state">No rules yet — recategorise a transaction and click "Yes" to save one.</div>
              ) : merchantRules.map((r) => (
                <div key={r.id} className="settings-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="settings-value" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.merchant}</div>
                    <div className="settings-hint">→ {r.category}</div>
                  </div>
                  <button className="remove-btn" onClick={() => deleteMerchantRule(r.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Appearance</div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Dark mode</div>
                  <div className="settings-hint">Switch between light and dark theme</div>
                </div>
                <button className="toggle-btn" onClick={toggleDark} aria-pressed={darkMode}>
                  {darkMode ? "☀️ Light" : "🌙 Dark"}
                </button>
              </div>
            </div>

            <div className="card danger-zone">
              <div className="card-title">Danger zone</div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Delete all my data</div>
                  <div className="settings-hint">Permanently removes all transactions, savings, budgets and rules</div>
                </div>
                <button className="danger-btn" onClick={deleteAllData}>Delete</button>
              </div>
            </div>
          </>
        )}
      </main>
      )}
    </div>
  );
}
