import { useState, useEffect, useRef, useMemo, Fragment } from "react";
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
  { name: "Groceries", color: "#2a78d6", limit_amount:80, keywords: ["tesco","supervalu","lidl","aldi","dunnes","spar","centra","co-op"],
    icon: I(<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></>)},
  { name: "Eating out", color: "#1baf7a", limit_amount:40, keywords: ["restaurant","mcdonalds","kfc","pizza","nando","subway","five guys","supermac"],
    icon: I(<><path d="M3 2v7a3 3 0 006 0V2"/><line x1="6" y1="11" x2="6" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></>)},
  { name: "Coffee", color: "#854f0b", limit_amount:20, keywords: ["blue bird","ucd nova","gather and gather","poolside cafe","starbucks","insomnia","butlers","paulig","coffeeangel"],
    icon: I(<><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/></>)},
  { name: "Takeaway", color: "#eda100", limit_amount:30, keywords: ["deliveroo","just eat","uber eats","takeaway"],
    icon: I(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>)},
  { name: "Drinks / nights out", color: "#4a3aa7", limit_amount:40, keywords: ["pub","bar","nightclub","off licence","o'briens"],
    icon: I(<><path d="M8 22h8"/><line x1="12" y1="11" x2="12" y2="22"/><path d="M6 2h12l-2 7a4 4 0 01-8 0L6 2z"/></>)},
  { name: "Transport", color: "#e34948", limit_amount:25, keywords: ["leap","dublin bus","luas","dart","irish rail","taxi","uber","free now","bolt"],
    icon: I(<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 5V2"/><path d="M17 5V2"/><circle cx="7" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="16" r="1" fill="currentColor" stroke="none"/></>)},
  { name: "Petrol", color: "#eb6834", limit_amount:30, keywords: ["applegreen","circle k","maxol","topaz","texaco","esso","fuel","petrol"],
    icon: I(<><path d="M3 22V7a2 2 0 012-2h8a2 2 0 012 2v15"/><line x1="3" y1="22" x2="15" y2="22"/><rect x="5" y="9" width="6" height="4" rx="1"/><path d="M15 6h2a2 2 0 012 2v3a2 2 0 002 2"/></>)},
  { name: "Travel", color: "#185fa5", limit_amount: 0, keywords: ["booking.com","hostelworld","airbnb","ryanair","aer lingus","skyscanner","hotels.com","expedia","bus eireann","wexford bus","eurolines"],
    icon: I(<><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2h0A1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></>)},
  { name: "Shopping", color: "#e87ba4", limit_amount: 50, keywords: ["amazon","penneys","primark","asos"],
    icon: I(<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>)},
  { name: "Clothes", color: "#e87ba4", limit_amount: 30, keywords: ["penneys","primark","zara","h&m","asos","next","marks","tkmaxx","tk maxx","river island","pull&bear","stradivarius"],
    icon: I(<><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></>)},
  { name: "Subscriptions", color: "#52514e", limit_amount: 15, keywords: ["netflix","spotify","disney","apple","google","microsoft","gym"],
    icon: I(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>)},
  { name: "Utilities", color: "#639922", limit_amount:0, keywords: ["eir","virgin media","three","vodafone","electric ireland","bord gais","gas networks","upc","sky","broadband"],
    icon: I(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>)},
  { name: "Health / Personal Care", color: "#0ca30c", limit_amount: 20, keywords: ["pharmacy","boots","lloyds","gp","dentist","physio","chemist","haircut","barber","grooming","toiletries","salon","hairdresser","superdrug","beauty"],
    icon: I(<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>)},
  { name: "Sport", color: "#0f6e56", limit_amount: 15, keywords: ["decathlon","life style sports","intersport","elverys","gaa","ticketmaster","underdogs"],
    icon: I(<><line x1="6" y1="8" x2="6" y2="10"/><line x1="18" y1="14" x2="18" y2="16"/><line x1="4" y1="9" x2="8" y2="9"/><line x1="16" y1="15" x2="20" y2="15"/><line x1="8" y1="9" x2="16" y2="15"/></>)},
  { name: "IOUs & Splits", color: "#8b5cf6", limit_amount:0, keywords: ["transfer to ", "transfer from "],
    icon: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>)},
  { name: "Transfers", color: "#52514e", limit_amount:0, keywords: ["revolut**"],
    icon: I(<><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></>)},
  { name: "Other", color: "#898781", limit_amount:30, keywords: [],
    icon: I(<><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>)},
];

const ACCOUNTS = [
  { id: "revolut", name: "Revolut", color: "var(--rev)" },
  { id: "boi", name: "Bank of Ireland", color: "var(--boi)" },
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

// Calendar-month range anchored directly to the current month (offset 0 = this
// month, -1 = last month, …). Unlike getMonthRange, this does NOT go via a week's
// Monday, so offset 0 always resolves to the in-progress current month even when
// today falls in a week whose Monday is still in the previous month.
function getMonthRangeByOffset(monthOffset = 0) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + monthOffset;
  return { from: new Date(y, m, 1, 0, 0, 0, 0), to: new Date(y, m + 1, 0, 23, 59, 59, 999) };
}

// Hybrid work-time label: hours (+ minutes) while under one workday; "X days Y hours"
// once it crosses a workday. hoursPerDay defines a workday (= hours/week ÷ 5).
const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;
function fmtWorkTime(totalHours, hoursPerDay) {
  if (!isFinite(totalHours) || totalHours <= 0) return "—";
  if (totalHours < hoursPerDay) {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    if (m === 60) return plural(h + 1, "hour");
    if (h === 0) return plural(m, "min");
    if (m === 0) return plural(h, "hour");
    return `${plural(h, "hour")} ${plural(m, "min")}`;
  }
  const days = Math.floor(totalHours / hoursPerDay);
  const remH = Math.round(totalHours - days * hoursPerDay);
  if (remH === 0) return plural(days, "day");
  if (remH >= hoursPerDay) return plural(days + 1, "day"); // rounding spilled into next day
  return `${plural(days, "day")} ${plural(remH, "hour")}`;
}
// Compact variant for tight list rows: "5h 19m" / "1d 7h".
function fmtWorkTimeShort(totalHours, hoursPerDay) {
  if (!isFinite(totalHours) || totalHours <= 0) return "—";
  if (totalHours < hoursPerDay) {
    const h = Math.floor(totalHours), m = Math.round((totalHours - h) * 60);
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const days = Math.floor(totalHours / hoursPerDay), remH = Math.round(totalHours - days * hoursPerDay);
  return remH === 0 ? `${days}d` : `${days}d ${remH}h`;
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

// Deterministic per-file transaction id factory. The 1st occurrence of an identical
// date|desc|amount tuple keeps the original hash (so existing rows and re-import
// idempotency are unaffected); 2nd+ same-tuple rows in the same file get a suffixed,
// unique id so genuinely distinct same-day/same-amount transactions never collide.
function makeTxnId(prefix) {
  const seen = new Map();
  return (keyStr) => {
    const n = seen.get(keyStr) || 0;
    seen.set(keyStr, n + 1);
    return `${prefix}-${hashStr(n === 0 ? keyStr : `${keyStr}#${n}`)}`;
  };
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
  const nextId = makeTxnId("r");
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
    const id = nextId(`${row[dateIdx]}|${row[descIdx]}|${row[amtIdx]}`);
    const balance = balIdx >= 0 ? (parseFloat(row[balIdx]) ?? null) : null;
    txns.push({ id, date, description: row[descIdx] || "Unknown", amount: amt, category, account: "Revolut", balance });
  }
  return { txns, vaultDeposits: [] };
}

function parseConsolidatedRevolutCSV(text) {
  const MONTH = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const nextId = makeTxnId("r");

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
  let dI = -1, descI = -1, amtI = -1, revCatI = -1, balI = -1;
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
        balI    = low.indexOf("balance");   // real running balance, same as BOI
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
      const id = nextId(`${date.toISOString().slice(0,10)}|${desc}|${amt}`);
      const balRaw = balI >= 0 ? parseAmt(cells[balI]) : NaN;
      const balance = isNaN(balRaw) ? null : balRaw;
      txns.push({ id, date, description: desc, amount: amt, category, account: "Revolut", balance });
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
      const id = nextId(`${date.toISOString().slice(0,10)}|${desc}|${amt}`);
      // subaccount:"savings" — a Revolut savings-pot row, NOT the current account.
      // Excluded from current-account balance reconstruction on the Dashboard.
      txns.push({ id, date, description: desc, amount: amt, category: "Other", account: "Revolut", balance: null, subaccount: "savings" });
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
  const nextId = makeTxnId("b");
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
        id: nextId(`${dateStr}|${desc}|${finalAmt}`),
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

// Strips BOI POS/date prefix (e.g. "POSC02JUN", "POS01JUN") then keeps the leading
// merchant tokens — real characters (incl. dots like "www.gathera") preserved — so the
// key is a contiguous substring of the description that rule matching can find. Stops at
// any standalone numeric ref (variable transaction numbers), capped at 3 tokens.
function extractMerchant(description) {
  const cleaned = description
    .trim()
    .replace(/^[A-Z]*\d{1,2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+/i, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const out = [];
  for (const w of cleaned.split(" ")) {
    if (!w) continue;
    if (/^\d+$/.test(w)) break;
    out.push(w);
    if (out.length === 3) break;
  }
  return out.join(" ");
}

// ── Recurring / subscription detection ──────────────────────────────────────
const RECURRING_PERIODS = [
  { label: "Weekly",      min: 6,   max: 8,   days: 7,   monthly: 52 / 12 },
  { label: "Fortnightly", min: 12,  max: 16,  days: 14,  monthly: 26 / 12 },
  { label: "Monthly",     min: 26,  max: 35,  days: 30,  monthly: 1 },
  { label: "Quarterly",   min: 80,  max: 100, days: 91,  monthly: 1 / 3 },
  { label: "Yearly",      min: 340, max: 400, days: 365, monthly: 1 / 12 },
];
const DAY_MS = 86400000;

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function modeAmount(nums) {
  const counts = {};
  let best = null, bestN = 0;
  for (const n of nums) {
    const k = n.toFixed(2);
    counts[k] = (counts[k] || 0) + 1;
    if (counts[k] > bestN) { bestN = counts[k]; best = parseFloat(k); }
  }
  return best;
}
function titleCaseMerchant(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Detect recurring spending from transaction history. Groups by merchant key,
// then keeps groups with a regular cadence + stable-ish amount (one price step allowed).
// Excludes income, Transfers and IOUs & Splits. Pure — no persistence.
function detectRecurring(transactions) {
  const spend = transactions.filter(
    (t) => t.amount < 0 && t.category !== "Transfers" && t.category !== "IOUs & Splits"
  );
  const groups = {};
  for (const t of spend) {
    const key = extractMerchant(t.description);
    if (!key) continue;
    (groups[key] ||= []).push(t);
  }

  const now = new Date();
  const results = [];
  for (const key of Object.keys(groups)) {
    const occ = groups[key].slice().sort((a, b) => a.date - b.date);
    if (occ.length < 3) continue;

    const gaps = [];
    for (let i = 1; i < occ.length; i++) gaps.push((occ[i].date - occ[i - 1].date) / DAY_MS);
    const med = median(gaps);
    const period = RECURRING_PERIODS.find((p) => med >= p.min && med <= p.max);
    if (!period) continue;

    // Regularity: ≥70% of gaps close to the period length.
    const tol = Math.max(period.days * 0.25, 4);
    const within = gaps.filter((g) => Math.abs(g - period.days) <= tol).length;
    if (within / gaps.length < 0.7) continue;

    const amounts = occ.map((t) => Math.abs(t.amount));
    const latest = amounts[amounts.length - 1];
    const prior = amounts.slice(0, -1);
    const baseline = modeAmount(prior.length ? prior : amounts);

    // Price change: latest differs from the earlier baseline by >5% and >€0.50.
    let priceChange = null;
    if (baseline && Math.abs(latest - baseline) / baseline > 0.05 && Math.abs(latest - baseline) > 0.5) {
      const idx = occ.findIndex((t) => Math.abs(Math.abs(t.amount) - latest) / latest <= 0.02);
      priceChange = { old: baseline, new: latest, since: idx > 0 ? occ[idx].date : null };
    }

    // Amount stability: nearly all amounts near either the baseline or the latest (one step allowed).
    const scattered = amounts.filter(
      (a) => Math.abs(a - baseline) / baseline > 0.05 && Math.abs(a - latest) / latest > 0.05
    ).length;
    if (scattered > Math.max(1, amounts.length * 0.2)) continue;

    const lastSeen = occ[occ.length - 1].date;
    results.push({
      key,
      name: titleCaseMerchant(key),
      amount: latest,
      period: period.label,
      monthly: latest * period.monthly,
      count: occ.length,
      lastSeen,
      nextDue: new Date(lastSeen.getTime() + period.days * DAY_MS),
      active: (now - lastSeen) / DAY_MS <= period.days * 1.5,
      priceChange,
      category: occ[occ.length - 1].category,
    });
  }
  results.sort((a, b) => b.monthly - a.monthly);
  return results;
}

function monthsUntil(yearMonth) {
  if (!yearMonth) return null;
  const [y, m] = yearMonth.split("-").map(Number);
  const now = new Date();
  const diff = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return diff > 0 ? diff : null;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

const PLANNER_DEFAULT = {
  id: null,
  monthly_income: 0,
  investment_amount: 0,
  investment_mode: "amount",
  fixed_costs: [],
  savings_dates: {},
  cash_balance: 0,
  hours_per_week: 37.5,
  hourly_wage_override: null,
};

const NAV_ITEMS = [
  { id: "dashboard",    icon: "⊞", label: "Dashboard"    },
  { id: "transactions", icon: "≡", label: "Transactions"  },
  { id: "budget",       icon: "◑", label: "Budget"        },
  { id: "savings",      icon: "⬡", label: "Savings"       },
  { id: "investments",  icon: "↗", label: "Investments"   },
  { id: "planner",      icon: "▦", label: "Planner"       },
  { id: "worthit",      icon: "◔", label: "Worth It?"     },
  { id: "statements",   icon: "↑", label: "Statements"    },
  { id: "settings",     icon: "⚙", label: "Settings"      },
];

// Sidebar grouping — same items, organised into labelled sections
const NAV_GROUPS = [
  { label: "Overview", ids: ["dashboard"] },
  { label: "Money",    ids: ["transactions", "statements"] },
  { label: "Plan",     ids: ["budget", "planner", "worthit"] },
  { label: "Grow",     ids: ["savings", "investments"] },
  { label: "System",   ids: ["settings"] },
];

// One consistent inline-SVG stroke-icon set, matching the Ledger rising-line mark.
const ICON_SHAPES = {
  dashboard: (<>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>),
  transactions: (<>
    <circle cx="5" cy="6.5" r="1.1" /><path d="M9 6.5h11" />
    <circle cx="5" cy="12" r="1.1" /><path d="M9 12h11" />
    <circle cx="5" cy="17.5" r="1.1" /><path d="M9 17.5h11" />
  </>),
  statements: (<>
    <path d="M6 3.5h7l4.5 4.5V19.5A1.5 1.5 0 0 1 16 21H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5z" />
    <path d="M13 3.5V8.5h4.5" />
    <path d="M8 13h8M8 16.5h5" />
  </>),
  budget: (<>
    <path d="M4 16a8 8 0 0 1 16 0" />
    <path d="M12 16l4.5-3.5" />
    <circle cx="12" cy="16" r="1" />
  </>),
  planner: (<>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3" />
    <circle cx="12" cy="14" r="1.2" />
  </>),
  savings: (<>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="12" cy="12" r="3.3" />
    <path d="M12 12v-1.3" />
    <path d="M6.5 19v1.5M17.5 19v1.5" />
  </>),
  investments: (<>
    <path d="M3.5 16.5l5-5 4 3 7.5-8" />
    <path d="M15.5 6.5h5V11.5" />
  </>),
  worthit: (<>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.5 2" />
  </>),
  settings: (<>
    <path d="M4 7h3M11 7h9" /><circle cx="9" cy="7" r="2" />
    <path d="M4 12h9M17 12h3" /><circle cx="15" cy="12" r="2" />
    <path d="M4 17h5M13 17h7" /><circle cx="11" cy="17" r="2" />
  </>),
  search: (<>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </>),
  alert: (<>
    <path d="M12 4L2.5 20h19L12 4z" />
    <path d="M12 10.5v4" />
    <circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
  </>),
  recurring: (<>
    <path d="M4.5 10a7.5 7.5 0 0 1 12.5-3l3 2.5" />
    <path d="M20 4.5V9.5h-5" />
    <path d="M19.5 14a7.5 7.5 0 0 1-12.5 3l-3-2.5" />
    <path d="M4 19.5V14.5h5" />
  </>),
};

function Icon({ name, size = 18, className }) {
  const shape = ICON_SHAPES[name];
  if (!shape) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {shape}
    </svg>
  );
}

// Resolve a CSS token (e.g. "--text-2") to its concrete value for the element's
// current theme, so Chart.js canvas colours track light/dark mode.
function readToken(el, name, fallback) {
  const v = el && getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function BarChart({ labels, datasets, yPrefix = "€", darkMode }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const tickColor = readToken(ref.current, "--text-2", "#6b7280");
    const gridColor = readToken(ref.current, "--border-light", "#e8ebee");
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
  }, [labels, datasets, darkMode]);
  return <canvas ref={ref} />;
}

function LineChart({ labels, data, datasets, yPrefix = "€", darkMode }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const tickColor = readToken(ref.current, "--text-2", "#6b7280");
    const gridColor = readToken(ref.current, "--border-light", "#e8ebee");
    // Accept either a single `data` array (legacy) or a `datasets` list of
    // { data, color, dashed, fill, width } for multi-line charts.
    const src = (datasets && datasets.length) ? datasets : [{ data, colorToken: "--accent", color: "#9c7636", fill: true }];
    const chartDatasets = src.map((d) => {
      // Resolve a CSS token (e.g. "--boi") to its concrete theme value so canvas lines
      // track light/dark mode; fall back to the literal `color`.
      const lineColor = d.colorToken ? readToken(ref.current, d.colorToken, d.color || "#9c7636") : (d.color || "#9c7636");
      return {
      data: d.data,
      borderColor: lineColor,
      backgroundColor: d.fill ? lineColor + "1c" : "transparent",
      borderWidth: d.width ?? 2,
      borderDash: d.dashed ? [5, 4] : [],
      pointRadius: 2,
      pointHoverRadius: 4,
      fill: !!d.fill,
      tension: 0.35,
      spanGaps: true,
      };
    });
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: { labels, datasets: chartDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 }, maxRotation: 30, maxTicksLimit: 10 } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: (v) => yPrefix + v } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data, datasets, darkMode]);
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

// Animated number that eases from its previous value to the new one on change.
// Honours prefers-reduced-motion and formats with en-IE grouping.
function CountUp({ value, prefix = "", suffix = "", decimals = 0, duration = 900 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (reduce || from === to) { setDisplay(to); fromRef.current = to; return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  const formatted = display.toLocaleString("en-IE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <>{prefix}{formatted}{suffix}</>;
}

// Consistent page header for every tab: eyebrow (tab name) + headline stat + context.
function TabHeader({ eyebrow, children, sub, action }) {
  return (
    <div className="tab-header">
      <div className="tab-header-top">
        <span className="tab-header-eyebrow">{eyebrow}</span>
        {action && <div className="tab-header-action">{action}</div>}
      </div>
      <div className="tab-header-headline">{children}</div>
      {sub && <div className="tab-header-sub">{sub}</div>}
    </div>
  );
}

function VaultRing({ pct, size = 44 }) {
  const SIZE = size;
  const STROKE = size >= 72 ? 6 : 4.5;
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
    stroke = "#9ca3af";
  } else if (fillPct >= 100) {
    stroke = "#16a34a";
  } else if (fillPct >= 50) {
    const t = (fillPct - 50) / 50;
    stroke = `rgb(${Math.round(245 + t * (34 - 245))},${Math.round(158 + t * (197 - 158))},${Math.round(11 + t * (94 - 11))})`;
  } else {
    stroke = "#f59e0b";
  }

  const labelSize = size >= 72 ? 14 : 10;

  return (
    <div className="vault-ring-wrap" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke="var(--border-light)" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none" stroke={stroke} strokeWidth={STROKE}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s" }} />
      </svg>
      <span className="vault-ring-label" style={{ color: stroke, fontSize: labelSize }}>
        {noTarget ? "—" : `${Math.round(fillPct)}%`}
      </span>
    </div>
  );
}

// Savings "goal card" hero themes. Emergency Fund + Holidays are fixed; every other
// vault (Revolut pockets) gets a stable colour from the palette, hashed by name.
const VAULT_SHIELD = (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 2.5v5.5c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9V5.5L12 3z" /><path d="M9 12l2 2 4-4.5" /></svg>);
const VAULT_COINS = (<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></svg>);
// Quiet Luxury — muted deep jewel/earth hero tones (white text + brass accent).
// The footer percentage uses `solid`, unified to brass so the accent reads as one.
const VAULT_PALETTE = [
  { from: "#33503d", to: "#213629", solid: "var(--accent)" },  // forest
  { from: "#6d3742", to: "#4a2530", solid: "var(--accent)" },  // wine
  { from: "#473a58", to: "#312840", solid: "var(--accent)" },  // aubergine
  { from: "#7a4a44", to: "#54322e", solid: "var(--accent)" },  // mahogany
  { from: "#8a6a30", to: "#5f4620", solid: "var(--accent)" },  // antique brass
  { from: "#2f4a4c", to: "#1f3436", solid: "var(--accent)" },  // deep teal-forest
];
function vaultTheme(v) {
  if (v.name === "Emergency Fund") return { from: "#33503d", to: "#213629", solid: "var(--accent)", icon: VAULT_SHIELD };
  if (v.name === "Holidays") return { from: "#8a6544", to: "#3d3550", solid: "var(--accent)", icon: null };
  let h = 0;
  for (let i = 0; i < v.name.length; i++) h = (h * 31 + v.name.charCodeAt(i)) >>> 0;
  return { ...VAULT_PALETTE[h % VAULT_PALETTE.length], icon: VAULT_COINS };
}

// Canonical key for matching a savings goal ("vault") by name. Import derives the
// goal name from a bank statement string, so matching must be tolerant of case and
// surrounding whitespace — otherwise a Revolut pocket rename or a manually-typed
// goal with different casing silently forks into a second, duplicate goal.
const normVaultName = (s) => (s || "").trim().toLowerCase();

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

  async function handleReset() {
    if (!email) { setError("Enter your email above first, then tap Forgot."); return; }
    setBusy(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setInfo(`Password reset link sent to ${email}.`);
    setBusy(false);
  }

  function onKey(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="auth-wrap">
      <AuthChartBackdrop />
      <div className="auth-card">
        <div className="auth-brand">
          <LedgerMark />
          <h1 className="auth-wordmark">Ledger</h1>
          <p className="auth-tagline">See everything you own, in one view</p>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email" className="auth-input" type="email" placeholder="you@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey}
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <button type="button" className="auth-forgot" onClick={handleReset} disabled={busy}>Forgot?</button>
          </div>
          <input
            id="auth-password" className="auth-input" type="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey}
            autoComplete="current-password"
          />
        </div>

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
          <div className="txn-date">
            {t.date.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}
            {t.account && (
              <span className={`txn-account ${t.account === "BOI" ? "boi" : "rev"}`}>{t.account}</span>
            )}
          </div>
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
          background: "var(--accent-bg)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "7px 12px", margin: "2px 0 4px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: "var(--accent)",
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            Always categorise <strong style={{ wordBreak: "break-all" }}>"{pendingRule.merchant}"</strong> as <strong>{pendingRule.category}</strong>?
          </span>
          <button onClick={onSaveRule} style={{
            background: "var(--accent)", color: "#fff", border: "none", borderRadius: 5,
            padding: "3px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>Yes</button>
          <button onClick={onDismissRule} style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 5,
            padding: "3px 10px", fontSize: 12, cursor: "pointer", color: "var(--text-2)",
            fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
          }}>No</button>
        </div>
      )}
    </Fragment>
  );
}

function EmptyState({ emoji = "📭", icon, headline, sub }) {
  return (
    <div className="empty-illustration">
      {icon
        ? <div className="empty-icon"><Icon name={icon} size={30} /></div>
        : <div className="empty-emoji">{emoji}</div>}
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
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid var(--border-light)" }}>
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

// Ambient rising-line backdrop shared by the login and PIN screens.
function AuthChartBackdrop() {
  const line = "M0,110 L40,96 L80,120 L120,88 L160,108 L200,74 L240,100 L280,64 L320,92 L360,70 L400,104 L440,82 L480,116 L520,90 L560,120 L600,110 L640,96 L680,120 L720,88 L760,108 L800,74 L840,100 L880,64 L920,92 L960,70 L1000,104 L1040,82 L1080,116 L1120,90 L1160,120 L1200,110";
  return (
    <div className="auth-chart" aria-hidden="true">
      <div className="auth-chart-tilt">
        <svg className="auth-chart-svg" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ledgerChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.32" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L1200,200 L0,200 Z`} fill="url(#ledgerChartFill)" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// Ledger logo mark (rising-line inside the accent tile) — shared by login + PIN.
function LedgerMark() {
  return (
    <span className="auth-mark" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <path d="M6 5 V22 H24" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <path d="M8.5 18.5 L13 13 L17 15.5 L23 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 7.5 H18.7 M23 7.5 V11.8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

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
      <AuthChartBackdrop />
      <div className="auth-card">
        <div className="auth-brand">
          <LedgerMark />
          <h1 className="auth-wordmark">Ledger</h1>
          <p className="auth-tagline">Enter your PIN to unlock</p>
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
  const darkMode = true; // single theme — banker's-green ledger (light mode removed)
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);   // Monthly-view cursor, decoupled from weekOffset
  const [balanceView, setBalanceView] = useState("combined"); // Account-balance chart: combined | boi | revolut
  const [viewMode, setViewMode] = useState("weekly");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(CATEGORIES.map((c) => ({ ...c, cadence: c.cadence ?? "weekly" })));
  const [savings, setSavings] = useState([]);
  const [importMsg, setImportMsg] = useState(null);
  const [pwResetMsg, setPwResetMsg] = useState(null);
  const [planner, setPlanner] = useState(PLANNER_DEFAULT);
  const [purchaseChecks, setPurchaseChecks] = useState([]); // "Worth It?" history
  const [wcName, setWcName] = useState("");
  const [wcCost, setWcCost] = useState("");
  const [wcKind, setWcKind] = useState("want");
  const [worthSaveError, setWorthSaveError] = useState(null);
  const [portfolio, setPortfolio] = useState(null);   // null=never fetched, []=empty, [{…}]=loaded
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState(null);
  const [netWorthSnapshots, setNetWorthSnapshots] = useState([]);
  const snapshotSavedRef = useRef(false);
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
  const [filtersStuck, setFiltersStuck] = useState(false); // toolbar pinned to top after scroll
  const [filtersOpen, setFiltersOpen] = useState(false);   // manual expand while pinned
  const [exportFilteredOnly, setExportFilteredOnly] = useState(true); // CSV export: filtered vs everything
  const [recurringOpen, setRecurringOpen] = useState(false); // collapsible recurring panel
  const [rulesExpanded, setRulesExpanded] = useState(false); // Settings: show all merchant rules
  const [plannerSaveError, setPlannerSaveError] = useState(null); // surfaced Supabase error, if any
  const saveTimers = useRef({});
  const inFlightSaves = useRef(new Set()); // writes that have fired but not yet completed
  const [revVaultMeta, setRevVaultMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem("revolut_vaults") || "{}"); } catch { return {}; }
  });
  const [editingHolidays, setEditingHolidays] = useState(false);
  const [holidaysEditDraft, setHolidaysEditDraft] = useState({ destinationName: "", targetDate: "", photoFile: undefined, clearPhoto: false });
  const [holidaysUploading, setHolidaysUploading] = useState(false);
  const [holidaysUploadError, setHolidaysUploadError] = useState(null);

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
  function exportTxnsCsv() {
    const rows = [...(exportFilteredOnly ? filteredTxns : transactions)].sort((a, b) => b.date - a.date);
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Date", "Description", "Category", "Account", "Amount", "Balance"];
    const lines = [header.join(",")];
    for (const t of rows) {
      const d = (t.date instanceof Date && !isNaN(t.date)) ? t.date.toISOString().slice(0, 10) : "";
      const bal = (t.balance != null && !isNaN(Number(t.balance))) ? Number(t.balance).toFixed(2) : "";
      lines.push([d, esc(t.description), esc(t.category), esc(t.account), Number(t.amount).toFixed(2), bal].join(","));
    }
    const csv = "﻿" + lines.join("\r\n");   // BOM so accents open correctly in Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  useEffect(() => {
    document.body.style.background = "#0c1a13";
  }, []);

  useEffect(() => {
    const names = { dashboard: "Dashboard", transactions: "Transactions", budget: "Budget", statements: "Statements", savings: "Savings", investments: "Investments", planner: "Planner", settings: "Settings" };
    document.title = `${names[tab] ?? tab} — Ledger`;
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
    if ((tab === "investments" || tab === "dashboard") && portfolio === null && !portfolioLoading && !portfolioError) {
      loadPortfolio();
    }
  }, [tab]);

  // Collapse the Transactions filter toolbar once scrolled past the header.
  // Uses scrollY with hysteresis (collapse >120, expand <60) so it can't flip-flop.
  useEffect(() => {
    if (tab !== "transactions") { setFiltersStuck(false); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setFiltersStuck((prev) => (prev ? y > 60 : y > 120));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [tab]);

  // Reset the manual open state whenever the toolbar unsticks (back near the top).
  useEffect(() => { if (!filtersStuck) setFiltersOpen(false); }, [filtersStuck]);

  // Track a write's promise while it's in flight, so flushSaves() can await it even
  // after its debounce timer has already fired it off — otherwise a write that left
  // the debounce window becomes an untracked fire-and-forget that sign-out can race.
  function trackSave(result) {
    if (!result || typeof result.then !== "function") return;
    const p = Promise.resolve(result);
    inFlightSaves.current.add(p);
    p.finally(() => inFlightSaves.current.delete(p));
  }

  // Debounced save that remembers the pending write; when the timer fires, the write
  // is handed to trackSave so it stays awaitable until it actually completes.
  function debounceSave(key, fn, delay = 600) {
    const entry = saveTimers.current[key];
    if (entry) clearTimeout(entry.timer);
    saveTimers.current[key] = {
      fn,
      timer: setTimeout(() => {
        delete saveTimers.current[key];
        try { trackSave(fn()); } catch { /* best-effort */ }
      }, delay),
    };
  }

  // Fire every still-pending debounced write now, then wait for ALL writes — the ones
  // just fired plus any already in flight — to fully complete, so sign-out can await
  // confirmation, not just initiation.
  function flushSaves() {
    const timers = saveTimers.current;
    for (const key of Object.keys(timers)) {
      const entry = timers[key];
      if (!entry) continue;
      clearTimeout(entry.timer);
      delete timers[key];
      try { trackSave(entry.fn()); } catch { /* best-effort */ }
    }
    return Promise.all([...inFlightSaves.current]);
  }

  // Flush pending saves when leaving a tab, so an edit made just before
  // switching tabs isn't lost with its timer still pending.
  useEffect(() => () => flushSaves(), [tab]);

  // Flush on page hide / unload (tab close, refresh, backgrounding). beforeunload
  // is best-effort for a hard close; visibilitychange fires earlier and more reliably.
  useEffect(() => {
    const onBeforeUnload = () => flushSaves();
    const onVisibility = () => { if (document.visibilityState === "hidden") flushSaves(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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
        setBudgets(CATEGORIES.map((c) => ({ ...c, cadence: c.cadence ?? "weekly" })));
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
    snapshotSavedRef.current = false;
    setLoading(true);
    Promise.all([
      supabase.from("budgets").select("*").eq("user_id", uid),
      supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
      supabase.from("savings").select("*").eq("user_id", uid),
      supabase.from("merchant_rules").select("*").eq("user_id", uid).order("merchant"),
      supabase.from("planner").select("*").eq("user_id", uid).limit(1),
      supabase.from("net_worth_snapshots").select("*").eq("user_id", uid).order("date", { ascending: true }),
      supabase.from("purchase_checks").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]).then(([{ data: dbBudgets }, { data: dbTxns }, { data: dbSavings }, { data: dbRules }, { data: dbPlanner }, { data: dbSnapshots }, { data: dbChecks }]) => {
      if (dbBudgets?.length) {
        setBudgets(CATEGORIES.map((c) => {
          const db = dbBudgets.find((b) => b.name === c.name)
            || (c.name === "Health / Personal Care" ? dbBudgets.find((b) => b.name === "Health") : null);
          return db
            ? { ...c, limit_amount: db.limit_amount ?? db.weekly ?? 0, cadence: db.cadence ?? c.cadence ?? "weekly" }
            : { ...c, cadence: c.cadence ?? "weekly" };
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
      if (dbSavings?.length) {
        setSavings(dbSavings);
        // One-time migration: move Holidays vault meta from localStorage to DB columns
        const stored = (() => { try { return JSON.parse(localStorage.getItem("holidays_vault_meta") || "null"); } catch { return null; } })();
        if (stored) {
          const hv = dbSavings.find(s => s.name === "Holidays");
          if (hv && !hv.destination_name && !hv.departure_date) {
            const patch = {};
            if (stored.destinationName) patch.destination_name = stored.destinationName;
            if (stored.targetDate) patch.departure_date = stored.targetDate;
            if (Object.keys(patch).length) {
              supabase.from("savings").update(patch).eq("id", hv.id).eq("user_id", uid).then(() => {
                setSavings(prev => prev.map(s => s.id === hv.id ? { ...s, ...patch } : s));
              });
            }
            localStorage.removeItem("holidays_vault_meta");
          }
        }
      }
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
          cash_balance: p.cash_balance ?? 0,
          hours_per_week: p.hours_per_week ?? 37.5,
          hourly_wage_override: p.hourly_wage_override ?? null,
        });
      }
      setNetWorthSnapshots(dbSnapshots ?? []);
      setPurchaseChecks(dbChecks ?? []);
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
  // Active filters excluding search (search stays visible in the condensed bar)
  const activeFilterCount = txnAccounts.length + txnCategories.length + (txnDateFrom ? 1 : 0) + (txnDateTo ? 1 : 0);

  // Recurring / subscription detection (derived from history; recomputed only when txns change)
  const recurring = useMemo(() => detectRecurring(transactions), [transactions]);
  const recurringActive = recurring.filter((r) => r.active);
  const recurringInactive = recurring.filter((r) => !r.active);
  const recurringMonthly = recurringActive.reduce((s, r) => s + r.monthly, 0);
  const recurringPriceChanges = recurring.filter((r) => r.priceChange).length;
  // Group filtered transactions by calendar day, preserving the newest-first order
  const txnGroups = [];
  filteredTxns.forEach((t) => {
    const key = t.date.toISOString().slice(0, 10);
    const last = txnGroups[txnGroups.length - 1];
    if (last && last.key === key) last.txns.push(t);
    else txnGroups.push({ key, date: t.date, txns: [t] });
  });

  const { start, end } = getWeekRange(weekOffset);
  const weekTxns = transactions.filter((t) => t.date >= start && t.date <= end && t.amount < 0);
  const weekSpendTxns = weekTxns.filter((t) => t.category !== "Transfers");
  const weekTransferTxns = transactions.filter((t) => t.date >= start && t.date <= end && t.category === "Transfers");
  // "Remaining this week" compares weekly-cadence budget against weekly-cadence spend.
  // Both sides derive from one shared category set so they can't drift apart.
  const weeklyCadenceBudgets = budgets.filter((b) => b.name !== "Transfers" && b.cadence !== "monthly");
  const weeklyCadenceNames = new Set(weeklyCadenceBudgets.map((b) => b.name));
  const totalBudget = weeklyCadenceBudgets.reduce((s, b) => s + b.limit_amount, 0);
  const weeklyCadenceSpent = weekSpendTxns
    .filter((t) => weeklyCadenceNames.has(t.category))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const remaining = totalBudget - weeklyCadenceSpent;
  // All non-transfer spend in the viewed week — drives the "Spent this week" metric.
  const weekSpentAll = weekSpendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSavings = savings.reduce((s, v) => s + v.balance, 0);

  // Tile-specific derived values — current week always (not affected by weekOffset nav)
  const { start: cwStart, end: cwEnd } = getWeekRange(0);
  const cwSpendTxns = transactions.filter(t => t.date >= cwStart && t.date <= cwEnd && t.amount < 0 && t.category !== "Transfers");
  const cwTotalSpent = cwSpendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const cwBudgetPct = totalBudget > 0 ? (cwTotalSpent / totalBudget) * 100 : null;
  const totalSavingsTarget = savings.reduce((s, v) => s + (v.target || 0), 0);
  const savingsPct = totalSavingsTarget > 0 ? Math.min(100, (totalSavings / totalSavingsTarget) * 100) : null;
  const nextMilestone = savings
    .map(v => {
      const ym = planner.savings_dates?.[v.id];
      const months = monthsUntil(ym);
      return { name: v.name, yearMonth: ym, months, needed: Math.max(0, (v.target || 0) - v.balance) };
    })
    .filter(m => m.yearMonth && m.months !== null && m.months >= 0)
    .sort((a, b) => a.months - b.months)[0] ?? null;

  // Spending (abs amount, non-transfer) per category within [from, to]. Single source for
  // every "spend per category for a period" figure — the date range is explicit and required
  // at each call site, so nav-following vs current-period ranges can't be silently confused.
  const spendByCategory = (from, to) => {
    const out = {};
    for (const t of transactions) {
      if (t.amount < 0 && t.category !== "Transfers" && t.date >= from && t.date <= to) {
        out[t.category] = (out[t.category] || 0) + Math.abs(t.amount);
      }
    }
    return out;
  };
  const bycat = spendByCategory(start, end);   // viewed week (follows the Dashboard week nav)

  // Monthly view uses its own calendar-month cursor (monthOffset) so the current
  // in-progress month is reachable; Weekly view keeps deriving the focused month
  // from the week being viewed, exactly as before.
  const { from: monthFrom, to: monthTo } = viewMode === "monthly"
    ? getMonthRangeByOffset(monthOffset)
    : getMonthRange(weekOffset);
  const monthLabel = monthFrom.toLocaleString("en-IE", { month: "long", year: "numeric" });
  // How far back Monthly nav may go: the month of the earliest transaction (0 if none).
  const minMonthOffset = (() => {
    if (!transactions.length) return 0;
    let earliest = transactions[0].date;
    for (const t of transactions) if (t.date < earliest) earliest = t.date;
    const now = new Date();
    return Math.min(0, (earliest.getFullYear() - now.getFullYear()) * 12 + (earliest.getMonth() - now.getMonth()));
  })();
  // ── Account balance chart: BOI + Revolut, both real running balances ─────────
  const boiRowsSorted = transactions
    .filter((t) => t.account === "BOI" && t.balance != null && t.date instanceof Date && !isNaN(t.date))
    .sort((a, b) => a.date - b.date);
  // Revolut CURRENT account only (savings-pot rows excluded), real Balance column.
  const revRowsSorted = transactions
    .filter((t) => t.account === "Revolut" && t.subaccount !== "savings" && t.balance != null && t.date instanceof Date && !isNaN(t.date))
    .sort((a, b) => a.date - b.date);
  const balAt = (rows, dayEnd) => { let bal = null; for (const t of rows) { if (t.date <= dayEnd) bal = Number(t.balance); else break; } return bal; };

  // Day axis: days within the shown month with BOI or Revolut balance activity.
  const __daySet = new Set();
  for (const t of boiRowsSorted) if (t.date >= monthFrom && t.date <= monthTo) __daySet.add(t.date.toISOString().slice(0, 10));
  for (const t of revRowsSorted) if (t.date >= monthFrom && t.date <= monthTo) __daySet.add(t.date.toISOString().slice(0, 10));
  const balanceDays = [...__daySet].sort();
  const __dayEnd = (d) => new Date(d + "T23:59:59.999");
  const boiSeries = balanceDays.map((d) => balAt(boiRowsSorted, __dayEnd(d)));
  const revSeries = balanceDays.map((d) => balAt(revRowsSorted, __dayEnd(d)));
  const combinedSeries = balanceDays.map((d, i) => {
    const b = boiSeries[i], r = revSeries[i];
    if (b == null && r == null) return null;
    return Math.round(((b ?? 0) + (r ?? 0)) * 100) / 100;
  });
  const boiLatest = boiRowsSorted.length ? Number(boiRowsSorted[boiRowsSorted.length - 1].balance) : null;
  const revLatest = revRowsSorted.length ? Number(revRowsSorted[revRowsSorted.length - 1].balance) : null;

  // Datasets per the Combined / BOI / Revolut toggle — real, solid lines.
  const balanceDatasets = balanceView === "boi"
    ? [{ data: boiSeries, colorToken: "--boi", color: "#2a5fa5", fill: true, width: 2 }]
    : balanceView === "revolut"
    ? [{ data: revSeries, colorToken: "--rev", color: "#c2610a", fill: true, width: 2 }]
    : [{ data: combinedSeries, colorToken: "--accent", color: "#9c7636", fill: true, width: 2.6 }];

  // Monthly view
  const monthTxns = transactions.filter((t) => t.date >= monthFrom && t.date <= monthTo);
  const monthSpendTxns = monthTxns.filter((t) => t.amount < 0 && t.category !== "Transfers");
  const monthIncomeTxns = monthTxns.filter((t) => t.amount > 0 && t.category !== "Transfers");
  const totalMonthSpent = monthSpendTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalMonthIncome = monthIncomeTxns.reduce((s, t) => s + t.amount, 0);
  const netSaved = totalMonthIncome - totalMonthSpent;
  const monthBycat = spendByCategory(monthFrom, monthTo);   // viewed month (follows the month nav)
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
  const trendAccent = darkMode ? "#c69c5d" : "#9c7636";
  const trendDatasets = [{
    label: "Spent",
    data: trendWeeks.map((w) => w.spent),
    backgroundColor: trendWeeks.map((w) => w.isCurrent ? trendAccent + "cc" : trendAccent + "33"),
    borderRadius: 4,
    borderSkipped: false,
  }];

  // Current-week and current-month spend per category — always THIS week / THIS calendar
  // month, independent of the Dashboard's week/month nav. The single source for budget-health
  // checks (over-budget banner, Budget tiles). Distinct from the nav-following bycat/monthBycat,
  // which reflect whichever week/month you've navigated to.
  const budgetWeekSpent = spendByCategory(cwStart, cwEnd);   // always the CURRENT week
  const budgetMonthStart = new Date(); budgetMonthStart.setDate(1); budgetMonthStart.setHours(0, 0, 0, 0);
  const budgetMonthEnd = new Date(budgetMonthStart.getFullYear(), budgetMonthStart.getMonth() + 1, 0, 23, 59, 59, 999);
  const budgetMonthSpent = spendByCategory(budgetMonthStart, budgetMonthEnd);   // always the CURRENT calendar month
  // Per-category spend over the category's own cadence period (current week vs current month-to-date).
  const budgetSpentFor = (b) => (b.cadence === "monthly" ? budgetMonthSpent[b.name] : budgetWeekSpent[b.name]) || 0;

  // Over-budget categories: monthly-cadence vs the TRUE current month (budgetMonthSpent),
  // weekly-cadence vs the viewed week (bycat) — the latter left as-is.
  const overBudgetCats = budgets.filter((b) => {
    if (b.name === "Transfers" || b.limit_amount <= 0) return false;
    const spent = (b.cadence === "monthly" ? budgetMonthSpent[b.name] : bycat[b.name]) || 0;
    return spent > b.limit_amount;
  });

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
      .select("date, description, amount, balance")
      .eq("user_id", uid)
      .eq("account", accountLabel);
    const { data: existingForAcct } = await (importAllDates
      ? dupQuery
      : dupQuery.gte("date", from.toISOString()).lte("date", to.toISOString()));
    // key → whether the existing row already has a real balance
    const existingByKey = new Map();
    for (const t of (existingForAcct || [])) {
      const key = `${t.date.slice(0, 10)}|${t.description}|${Math.round(parseFloat(t.amount) * 100)}`;
      const prev = existingByKey.get(key);
      if (prev === undefined || (prev.balance == null && t.balance != null)) existingByKey.set(key, { balance: t.balance });
    }
    const toInsert = withRules.filter(t => {
      const key = `${t.date.toISOString().slice(0, 10)}|${t.description}|${Math.round(t.amount * 100)}`;
      const existing = existingByKey.get(key);
      if (!existing) return true;                                       // brand-new row
      if (existing.balance == null && t.balance != null) return true;   // re-import to backfill a missing balance
      return false;                                                     // already fully imported
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

      // Match against a FRESH read of the goals in the DB — NOT the in-memory
      // `savings` state, which may not yet reflect a goal created by a prior import
      // in this session. Reading state here is what let a second import fail to see
      // the first import's new goal and insert a duplicate. Matching is by normalized
      // name so a pocket rename / casing change can't fork a goal either. Shared by
      // both the deposit loop and the sync-metadata refresh below.
      const { data: dbSavingsFresh } = await supabase
        .from("savings").select("*").eq("user_id", uid);
      let localSavings = dbSavingsFresh ?? savings;

      if (newDeposits.length > 0) {
        // Insert vault transactions that aren't in the DB yet.
        // These may be outside the user's chosen date range, but we always want them recorded.
        const newVaultTxnIds = new Set(newDeposits.map(d => d.txnId));
        const vaultTxnRows = parsed
          .filter(t => newVaultTxnIds.has(t.id))
          .map(t => ({
            id: t.id, date: t.date.toISOString(), description: t.description,
            amount: t.amount, category: t.category, account: accountLabel,
            balance: t.balance ?? null, subaccount: t.subaccount ?? null, user_id: uid,
          }));
        if (vaultTxnRows.length > 0) {
          await supabase.from("transactions").upsert(vaultTxnRows, { onConflict: "id" });
        }

        const byVault = {};
        for (const d of newDeposits) byVault[d.vaultName] = (byVault[d.vaultName] || 0) + d.amount;
        const vaultNotes = [];

        for (const [vaultName, total] of Object.entries(byVault)) {
          const depositTotal = parseFloat(total.toFixed(2));
          if (depositTotal <= 0) continue;

          const key = normVaultName(vaultName);
          let vault = localSavings.find(v => normVaultName(v.name) === key);
          if (!vault) {
            const { data: newVault } = await supabase
              .from("savings")
              .insert({ name: vaultName.trim(), balance: 0, target: 0, user_id: uid })
              .select().single();
            if (newVault) {
              vault = newVault;
              localSavings = [...localSavings, newVault];
            }
          }
          if (vault) {
            const newBal = parseFloat((vault.balance + depositTotal).toFixed(2));
            await supabase.from("savings").update({ balance: newBal }).eq("id", vault.id).eq("user_id", uid);
            localSavings = localSavings.map(v => v.id === vault.id ? { ...v, balance: newBal } : v);
            vaultNotes.push(`+€${depositTotal.toFixed(2)} → ${vaultName}`);
          }
        }

        // Reconcile UI state with the fresh DB set + the balance deltas just applied.
        // (A single update, since `localSavings` came from a fresh DB read and may
        // contain goals the in-memory `savings` state didn't have.)
        setSavings(localSavings);

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
        const key = normVaultName(vaultName);
        const vault = localSavings.find(v => normVaultName(v.name) === key);
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

    // Backfill: tag any already-imported Revolut savings-pot rows (imported before the
    // subaccount column existed) so the current-account balance reconstruction excludes them.
    const savingsIds = [...new Set(parsed.filter(t => t.subaccount === "savings").map(t => t.id))];
    if (savingsIds.length > 0) {
      const { error: sbErr } = await supabase.from("transactions")
        .update({ subaccount: "savings" }).in("id", savingsIds).eq("user_id", uid).is("subaccount", null);
      if (!sbErr) {
        const idSet = new Set(savingsIds);
        setTransactions(prev => prev.map(t => (idSet.has(t.id) && t.subaccount == null) ? { ...t, subaccount: "savings" } : t));
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
      subaccount: t.subaccount ?? null,
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
    // Prevent a manual add from forking an existing goal (case/whitespace-insensitive).
    const existing = savings.find(v => normVaultName(v.name) === normVaultName(name));
    if (existing) {
      alert(`A savings goal named "${existing.name}" already exists.`);
      return;
    }
    const target = parseFloat(prompt("Target amount (€):")) || 1000;
    const { data } = await supabase
      .from("savings").insert({ name: name.trim(), balance: 0, target, user_id: uid }).select().single();
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
      supabase.from("purchase_checks").delete().eq("user_id", uid),
    ]);
    setTransactions([]);
    setSavings([]);
    setBudgets(CATEGORIES.map((c) => ({ ...c, cadence: c.cadence ?? "weekly" })));
    setMerchantRules([]);
    setPurchaseChecks([]);
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
      cash_balance: p.cash_balance,
      hours_per_week: p.hours_per_week,
      hourly_wage_override: p.hourly_wage_override,
    };
    let error;
    if (p.id) {
      ({ error } = await supabase.from("planner").update(payload).eq("id", p.id));
    } else {
      const res = await supabase.from("planner").insert(payload).select().single();
      error = res.error;
      if (res.data) setPlanner((prev) => ({ ...prev, id: res.data.id }));
    }
    if (error) {
      // Surface the real Postgres/PostgREST error instead of swallowing it.
      console.error("[planner save failed]", error);
      const parts = [error.code, error.message, error.details, error.hint && `hint: ${error.hint}`].filter(Boolean);
      setPlannerSaveError(parts.join(" · "));
    } else {
      setPlannerSaveError(null);
    }
  }

  function updatePlanner(updates) {
    setPlanner((prev) => {
      const next = { ...prev, ...updates };
      debounceSave("planner", () => persistPlanner(next));
      return next;
    });
  }

  // ── Worth It? — save/remove a purchase check ──────────────────────────────
  async function addPurchaseCheck() {
    const name = wcName.trim();
    const cost = parseFloat(wcCost) || 0;
    if (!name || cost <= 0) return;
    const uid = session.user.id;
    const row = { user_id: uid, name, cost, kind: wcKind, hourly_wage: hourlyWage > 0 ? hourlyWage : null };
    const { data, error } = await supabase.from("purchase_checks").insert(row).select().single();
    if (error) {
      console.error("[purchase_checks insert failed]", error);
      const parts = [error.code, error.message, error.details, error.hint && `hint: ${error.hint}`].filter(Boolean);
      setWorthSaveError(parts.join(" · "));
      return;
    }
    setWorthSaveError(null);
    setPurchaseChecks((prev) => [data, ...prev]);
    setWcName(""); setWcCost(""); setWcKind("want");
  }
  async function deletePurchaseCheck(id) {
    const uid = session.user.id;
    const prev = purchaseChecks;
    setPurchaseChecks((cur) => cur.filter((p) => p.id !== id)); // optimistic
    const { error } = await supabase.from("purchase_checks").delete().eq("id", id).eq("user_id", uid);
    if (error) {
      console.error("[purchase_checks delete failed]", error);
      setPurchaseChecks(prev); // roll back
    }
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

  const catSpend = (b) => (b.cadence === "monthly" ? monthBycat[b.name] : bycat[b.name]) || 0;
  const activeCats = budgets.filter((b) => b.name !== "Transfers" && catSpend(b) > 0);
  const dashDatasets = activeCats.length ? [
    { label: "Spent", data: activeCats.map((b) => parseFloat(Math.abs(catSpend(b)).toFixed(2))), backgroundColor: activeCats.map((b) => b.color + "cc"), borderRadius: 4, borderSkipped: false },
    { label: "Budget", data: activeCats.map((b) => b.limit_amount), backgroundColor: activeCats.map((b) => b.color + "33"), borderRadius: 4, borderSkipped: false },
  ] : [];


  // ── Portfolio derived ──────────────────────────────────────────────────────

  const sortedPortfolio = portfolio
    ? [...portfolio].sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice))
    : [];
  const pfTotalValue    = sortedPortfolio.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const pfTotalInvested = sortedPortfolio.reduce((s, p) => s + p.quantity * (p.averagePrice ?? p.averageBuyPrice ?? 0), 0);
  const pfTotalPnL      = sortedPortfolio.reduce((s, p) => s + (p.ppl ?? 0), 0);
  const pfPnLPct        = pfTotalInvested > 0 ? (pfTotalPnL / pfTotalInvested) * 100 : 0;

  // ── Net worth derived ──────────────────────────────────────────────────────

  // Account balance = each bank's most recent real running balance, summed (BOI +
  // Revolut current account) — the same combined logic as the Cash balance chart.
  // Both BOI PDFs and consolidated Revolut CSVs now carry a running balance, so summing
  // a single account's most-recent row alone would drop the other. null only when
  // NEITHER account has a balance yet.
  const latestBalance = (boiLatest != null || revLatest != null)
    ? (boiLatest ?? 0) + (revLatest ?? 0)
    : null;
  const netWorthTotal = (latestBalance ?? 0) + totalSavings + pfTotalValue + (Number(planner.cash_balance) || 0);

  const nwSorted = [...netWorthSnapshots].sort((a, b) =>
    String(a.date) < String(b.date) ? -1 : String(a.date) > String(b.date) ? 1 : 0
  );
  // Trend vs the earliest snapshot in the current calendar month; null if none to compare against.
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = todayStr.slice(0, 7);
  const nwMonthStart = nwSorted.find(s => String(s.date).slice(0, 7) === monthPrefix);
  const nwTrend = nwMonthStart ? netWorthTotal - Number(nwMonthStart.total) : null;

  // Auto-save one snapshot per calendar day, once the live totals (incl. portfolio) are ready.
  useEffect(() => {
    if (!session?.user?.id || loading || snapshotSavedRef.current) return;
    // Wait until the portfolio has actually resolved so investments aren't recorded as €0.
    if (portfolio === null && !portfolioError) return;
    // Don't record a not-ready / all-zero net worth — wait until there's something real to save.
    // (The effect re-runs when netWorthTotal changes, so it captures the value once it's positive.)
    if (netWorthTotal <= 0) return;
    // If today's row already matches the live total, leave it. If it exists but is stale
    // (e.g. Cash was set after it was first written), fall through to the upsert below so it
    // self-heals to the current Account + Savings + Investments + Cash total.
    const todayRow = netWorthSnapshots.find(s => String(s.date).slice(0, 10) === todayStr);
    if (todayRow && Math.abs(Number(todayRow.total) - netWorthTotal) < 0.5) {
      snapshotSavedRef.current = true;
      return;
    }
    snapshotSavedRef.current = true;
    const uid = session.user.id;
    supabase
      .from("net_worth_snapshots")
      .upsert({
        date: todayStr,
        account_balance: latestBalance ?? 0,
        savings_total: totalSavings,
        investments_value: pfTotalValue,
        total: netWorthTotal,
        user_id: uid,
      }, { onConflict: "user_id,date" })   // one row per user per day — can't duplicate
      .select()
      .then(({ data, error }) => {
        if (error) { snapshotSavedRef.current = false; return; }  // allow a retry next load
        if (data?.length) {
          const saved = data[0];
          const day = String(saved.date).slice(0, 10);
          // Replace any existing row for this day (update case) instead of appending a duplicate.
          setNetWorthSnapshots(prev => [...prev.filter(s => String(s.date).slice(0, 10) !== day), saved]);
        }
      });
  }, [session?.user?.id, loading, portfolio, portfolioError, netWorthSnapshots,
      latestBalance, totalSavings, pfTotalValue, netWorthTotal, todayStr]);

  // ── Planner derived ────────────────────────────────────────────────────────

  // Worth It? — hourly wage derived from take-home income (override wins if set).
  const hoursPerWeek = Number(planner.hours_per_week) > 0 ? Number(planner.hours_per_week) : 37.5;
  const hoursPerDay = hoursPerWeek / 5; // a "workday" for the hours→days threshold
  const derivedHourly = (Number(planner.monthly_income) * 12) / (52 * hoursPerWeek);
  const hasWageOverride = planner.hourly_wage_override != null && Number(planner.hourly_wage_override) > 0;
  const hourlyWage = hasWageOverride ? Number(planner.hourly_wage_override) : (derivedHourly > 0 ? derivedHourly : 0);
  const wcCostNum = parseFloat(wcCost) || 0;
  const wcHours = hourlyWage > 0 ? wcCostNum / hourlyWage : 0;
  // Hours a stored check represents — prefer its snapshot wage, fall back to current.
  const checkHours = (c) => {
    const w = Number(c.hourly_wage) > 0 ? Number(c.hourly_wage) : hourlyWage;
    return w > 0 ? Number(c.cost) / w : 0;
  };
  const wantsHours = purchaseChecks.filter((c) => c.kind === "want").reduce((s, c) => s + checkHours(c), 0);
  const needsHours = purchaseChecks.filter((c) => c.kind === "need").reduce((s, c) => s + checkHours(c), 0);

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
  // Monthly-equivalent of all limits: weekly-cadence ×4, monthly-cadence added directly.
  const budgetMonthlyTotal = budgets
    .filter((b) => b.name !== "Transfers")
    .reduce((s, b) => s + (b.cadence === "monthly" ? b.limit_amount : b.limit_amount * 4), 0);
  const plannerChartData = [fixedTotal, savingsContribTotal, investEur, Math.max(0, plannerAvailable)].map((v) => parseFloat(v.toFixed(2)));
  const plannerChartLabels = ["Fixed costs", "Savings", "Investments", "Spending"];
  const plannerChartColors = ["#e34948", "#2a78d6", "#0f6e56", "#1baf7a"];
  const plannerChartFiltered = plannerChartLabels
    .map((l, i) => ({ l, v: plannerChartData[i], c: plannerChartColors[i] }))
    .filter((x) => x.v > 0);

  // ── Tab header stats ───────────────────────────────────────────────────────
  const headerMonthStart = new Date();
  headerMonthStart.setDate(1); headerMonthStart.setHours(0, 0, 0, 0);
  const headerMonthTxns = transactions.filter((t) => t.date >= headerMonthStart);
  const headerIn = headerMonthTxns.filter((t) => t.amount > 0 && t.category !== "Transfers").reduce((s, t) => s + t.amount, 0);
  const headerOut = headerMonthTxns.filter((t) => t.amount < 0 && t.category !== "Transfers").reduce((s, t) => s + Math.abs(t.amount), 0);
  const headerNet = headerIn - headerOut;
  const latestTxnDate = transactions.reduce((m, t) => (!m || t.date > m ? t.date : m), null);
  const fmt0 = (n) => n.toLocaleString("en-IE", { maximumFractionDigits: 0 });
  // budgetWeekSpent / budgetMonthSpent / budgetSpentFor are defined earlier (above the
  // over-budget banner). Monthly-budget usage % for the command-centre Budget tile:
  const budgetMonthTotalSpent = Object.values(budgetMonthSpent).reduce((s, v) => s + v, 0);
  const budgetMonthPct = budgetMonthlyTotal > 0 ? (budgetMonthTotalSpent / budgetMonthlyTotal) * 100 : null;

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
            await flushSaves();
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
    <div className="app dark">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 30 30" fill="none">
              <path d="M6 5 V22 H24" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
              <path d="M8.5 18.5 L13 13 L17 15.5 L23 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 7.5 H18.7 M23 7.5 V11.8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="sidebar-logo-text">Ledger</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.ids.map((id) => {
                const item = NAV_ITEMS.find((n) => n.id === id);
                return (
                  <button
                    key={id}
                    className={`sidebar-item${tab === id ? " active" : ""}`}
                    onClick={() => setTab(id)}
                  >
                    <span className="sidebar-icon"><Icon name={id} size={18} /></span>
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">{session.user.email[0].toUpperCase()}</span>
            <span className="sidebar-user-email">{session.user.email}</span>
          </div>
          <button className="sidebar-signout" onClick={async () => { await flushSaves(); await supabase.auth.signOut(); }}>Sign out</button>
        </div>
      </aside>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ id }) => (
          <button
            key={id}
            className={`bottom-nav-item${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            <span className="bottom-nav-icon"><Icon name={id} size={20} /></span>
          </button>
        ))}
      </nav>

      {loading ? <DashboardSkeleton /> : (
      <main className="main">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            {/* ── Net worth hero ── */}
            <div className="networth-hero">
              <div className="networth-label">Net Worth</div>
              <div className="networth-headline">
                <span className="networth-total">
                  <CountUp value={netWorthTotal} prefix="€" />
                </span>
                {nwTrend !== null && (
                  <span className={`networth-trend ${nwTrend >= 0 ? "up" : "down"}`}>
                    {nwTrend >= 0 ? "▲" : "▼"} {nwTrend >= 0 ? "+" : "−"}€{Math.abs(nwTrend).toLocaleString("en-IE", { maximumFractionDigits: 0 })} this month
                  </span>
                )}
              </div>
              <div className="networth-components">
                <div className="networth-comp">
                  <div className="networth-comp-label">Account</div>
                  <div className="networth-comp-val">
                    {latestBalance != null ? `€${latestBalance.toLocaleString("en-IE", { maximumFractionDigits: 0 })}` : "—"}
                  </div>
                </div>
                <div className="networth-comp">
                  <div className="networth-comp-label">Savings</div>
                  <div className="networth-comp-val">€{totalSavings.toLocaleString("en-IE", { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="networth-comp">
                  <div className="networth-comp-label">Investments</div>
                  <div className="networth-comp-val">
                    {portfolio === null && portfolioLoading ? "…" : `€${pfTotalValue.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`}
                  </div>
                </div>
                <div className="networth-comp">
                  <div className="networth-comp-label">Cash</div>
                  <div className="networth-comp-val networth-comp-editable">
                    €<input
                      type="number" min="0" step="10"
                      value={planner.cash_balance || ""}
                      placeholder="0"
                      aria-label="Cash on hand"
                      className="networth-comp-input"
                      style={{ width: `${Math.max(String(planner.cash_balance || "").length, 1) + 1}ch` }}
                      onChange={(e) => updatePlanner({ cash_balance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <div className="networth-divider" />
              {nwSorted.length >= 3 ? (
                <div className="networth-chart-slot">
                  <LineChart
                    labels={nwSorted.map(s => {
                      const dt = new Date(String(s.date).slice(0, 10) + "T12:00:00");
                      return `${dt.getDate()} ${dt.toLocaleString("en-IE", { month: "short" })}`;
                    })}
                    data={nwSorted.map(s => Number(s.total))}
                    darkMode={darkMode}
                  />
                </div>
              ) : (
                <div className="networth-empty">
                  {nwSorted.length <= 1
                    ? "📈 Net worth tracking starts today — check back in a few days to see your trend."
                    : "Building your history — your trend line fills in over the next few days."}
                </div>
              )}
            </div>

            <div className="week-nav">
              <button
                className="nav-btn"
                disabled={viewMode === "monthly" && monthOffset <= minMonthOffset}
                onClick={() => viewMode === "monthly"
                  ? setMonthOffset((o) => Math.max(minMonthOffset, o - 1))
                  : setWeekOffset((w) => w - 1)}
              >‹</button>
              <span className="week-label">{viewMode === "monthly" ? monthLabel : fmtWeekLabel(weekOffset)}</span>
              <button
                className="nav-btn"
                disabled={viewMode === "monthly" ? monthOffset >= 0 : weekOffset >= 0}
                onClick={() => viewMode === "monthly"
                  ? setMonthOffset((o) => Math.min(0, o + 1))
                  : setWeekOffset((w) => Math.min(0, w + 1))}
              >›</button>
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

            {/* ── Command center: 4 status tiles (full width, both views) ── */}
            <div className="dash-section-label">Overview</div>
            <div className="snap-tiles">
              <button className="snap-tile" onClick={() => setTab("budget")}>
                <div className="snap-tile-header"><span className="snap-tile-icon"><Icon name="budget" size={13} /></span>Budget</div>
                {budgetMonthlyTotal <= 0 ? (
                  <>
                    <div className="snap-tile-primary" style={{ color: "var(--text-3)" }}>—</div>
                    <div className="snap-tile-sub">No budgets set</div>
                  </>
                ) : budgetMonthTotalSpent <= 0 ? (
                  <>
                    <div className="snap-tile-primary" style={{ fontSize: 20, color: "var(--text-2)" }}>New month</div>
                    <div className="snap-tile-sub">nothing spent yet</div>
                  </>
                ) : (
                  <>
                    <div className="snap-tile-primary" style={{ color: budgetMonthPct >= 100 ? "var(--red)" : budgetMonthPct >= 80 ? "var(--amber)" : "var(--green)" }}>
                      {budgetMonthPct.toFixed(0)}%
                    </div>
                    <div className="snap-tile-sub">of €{fmt0(budgetMonthlyTotal)}/mo budget</div>
                  </>
                )}
              </button>

              <button className="snap-tile" onClick={() => setTab("savings")}>
                <div className="snap-tile-header"><span className="snap-tile-icon"><Icon name="savings" size={13} /></span>Savings</div>
                <div className="snap-tile-primary">€{totalSavings.toLocaleString("en-IE")}</div>
                <div className="snap-tile-sub">
                  {savingsPct !== null
                    ? `${savingsPct.toFixed(0)}% of €${totalSavingsTarget.toLocaleString()} target`
                    : "across all vaults"}
                </div>
              </button>

              <button className="snap-tile" onClick={() => setTab("investments")}>
                <div className="snap-tile-header"><span className="snap-tile-icon"><Icon name="investments" size={13} /></span>Portfolio</div>
                {portfolioLoading ? (
                  <>
                    <div className="snap-tile-primary" style={{ color: "var(--text-3)" }}>…</div>
                    <div className="snap-tile-sub">Loading</div>
                  </>
                ) : portfolio !== null ? (
                  <>
                    <div className="snap-tile-primary" style={{ color: pfTotalPnL >= 0 ? "var(--green)" : "var(--red)" }}>
                      {pfTotalPnL >= 0 ? "+" : ""}€{pfTotalPnL.toFixed(2)}
                    </div>
                    <div className="snap-tile-sub">{pfPnLPct >= 0 ? "+" : ""}{pfPnLPct.toFixed(2)}% return</div>
                  </>
                ) : portfolioError ? (
                  <>
                    <div className="snap-tile-primary" style={{ color: "var(--text-3)" }}>—</div>
                    <div className="snap-tile-sub">Could not load</div>
                  </>
                ) : null}
              </button>
            </div>

            {/* ── This period's numbers: 3-up in both views (no reflow on toggle) ── */}
            <div className="dash-section-label">{viewMode === "weekly" ? "This week" : "This month"}</div>
            <div className="metric-row metric-row-3">
              {(viewMode === "weekly"
                ? [
                    { label: "Remaining this week", value: `${remaining < 0 ? "-" : ""}€${Math.abs(remaining).toFixed(0)}`, sub: remaining < 0 ? "over budget" : "left in budget", warn: remaining < 0 },
                    { label: "Spent this week", value: `€${weekSpentAll.toFixed(0)}`, sub: "this week" },
                    { label: "Transactions this week", value: weekTxns.length, sub: `${weekSpendTxns.length} spending · ${weekTransferTxns.length} transfers` },
                  ]
                : [
                    { label: "Spent", value: `€${totalMonthSpent.toFixed(0)}`, sub: monthLabel },
                    { label: "Income", value: `€${totalMonthIncome.toFixed(0)}`, sub: "received this month" },
                    { label: "Net saved", value: `${netSaved < 0 ? "-" : ""}€${Math.abs(netSaved).toFixed(0)}`, sub: netSaved < 0 ? "deficit" : "surplus", warn: netSaved < 0 },
                  ]
              ).map((m) => (
                <div className="metric" key={m.label}>
                  <div className="metric-label">{m.label}</div>
                  <div className={`metric-value${m.warn ? " over" : ""}`}>{m.value}</div>
                  <div className="metric-sub">{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="dash-grid">
              <div className="dash-main">
            {viewMode === "weekly" ? (
              <>
                <div className="card">
                  <div className="card-title">Spending by category</div>
                  {budgets.filter((b) => b.name !== "Transfers").map((b) => {
                    const isMonthly = b.cadence === "monthly";
                    // Monthly-cadence → true current calendar month; weekly-cadence → viewed week.
                    const spent = (isMonthly ? budgetMonthSpent[b.name] : bycat[b.name]) || 0;
                    if (!b.limit_amount && !spent) return null;
                    const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0;
                    const color = b.limit_amount > 0 ? (spent > b.limit_amount ? "#e24b4a" : spent > b.limit_amount * 0.8 ? "#ba7517" : b.color) : b.color;
                    return (
                      <div className="budget-row" key={b.name}>
                        <div className="budget-label">{b.icon}<span>{b.name}</span></div>
                        <div className="progress-wrap">{b.limit_amount > 0 && <div className="progress-bar" style={{ width: pct + "%", background: color }} />}</div>
                        <div className="budget-spent" style={{ color }}>{`€${spent.toFixed(0)}`}</div>
                        <div className="budget-limit">{b.limit_amount > 0 ? `/ €${b.limit_amount}${isMonthly ? "/mo" : "/wk"}` : ""}</div>
                      </div>
                    );
                  })}
                  {activeCats.length > 0 && (
                    <div className="chart-wrap">
                      <BarChart labels={activeCats.map((b) => b.name)} datasets={dashDatasets} darkMode={darkMode} />
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-title">Recent transactions</div>
                  {weekTxns.length === 0 ? (
                    <EmptyState icon="transactions" headline="Nothing here yet" sub="Import a Revolut CSV to see your spending" />
                  ) : (
                    <>
                      {weekSpendTxns.map((t) => (
                        <TxnRow key={t.id} t={t} {...txnRowProps} />
                      ))}
                      {weekTransferTxns.length > 0 && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 4px" }}>
                            <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
                            <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>Transfers & settlements</span>
                            <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
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
                <div className="card">
                  <div className="card-title">Spending breakdown — {monthLabel}</div>
                  {monthCatsSorted.length === 0 ? (
                    <EmptyState icon="transactions" headline="Nothing here yet" sub={`No spending recorded for ${monthLabel}`} />
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
              </div>

              <div className="dash-side">

            {balanceDays.length > 0 && (
              <div className="card">
                <div className="balance-card-head">
                  <div className="card-title" style={{ marginBottom: 0 }}>Account balance — {monthLabel}</div>
                  <div className="balance-toggle" role="group" aria-label="Balance view">
                    <button type="button" className={balanceView === "combined" ? "active" : ""} onClick={() => setBalanceView("combined")}>Combined</button>
                    <button type="button" className={balanceView === "boi" ? "active" : ""} onClick={() => setBalanceView("boi")}>BOI</button>
                    <button type="button" className={balanceView === "revolut" ? "active" : ""} onClick={() => setBalanceView("revolut")}>Revolut</button>
                  </div>
                </div>

                <div className="chart-wrap" style={{ height: 200 }}>
                  <LineChart
                    labels={balanceDays.map((d) => {
                      const dt = new Date(d + "T12:00:00");
                      return `${dt.getDate()} ${dt.toLocaleString("en-IE", { month: "short" })}`;
                    })}
                    datasets={balanceDatasets}
                    darkMode={darkMode}
                  />
                </div>

                <div className="balance-legend">
                  {boiLatest != null && (
                    <span className="balance-legend-item"><span className="balance-swatch boi" />BOI €{boiLatest.toLocaleString("en-IE", { maximumFractionDigits: 0 })}</span>
                  )}
                  {revLatest != null && (
                    <span className="balance-legend-item"><span className="balance-swatch rev" />Revolut €{revLatest.toLocaleString("en-IE", { maximumFractionDigits: 0 })}</span>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title">Spending trends — last 8 weeks</div>
              <div className="chart-wrap">
                <BarChart labels={trendWeeks.map((w) => w.label)} datasets={trendDatasets} darkMode={darkMode} />
              </div>
            </div>
              </div>
            </div>
          </>
        )}

        {/* TRANSACTIONS */}
        {tab === "transactions" && (
          <>
            <TabHeader
              eyebrow="Transactions"
              sub={`€${fmt0(headerIn)} in · €${fmt0(headerOut)} out · this month`}
            >
              <span style={{ color: headerNet >= 0 ? "var(--green)" : "var(--red)" }}>
                {headerNet >= 0 ? "+" : "−"}<CountUp value={Math.abs(headerNet)} prefix="€" />
              </span>
            </TabHeader>

            {/* Recurring / subscriptions — collapsible, detected from history */}
            {recurring.length > 0 && (
              <div className="card recurring-card">
                <button className="recurring-header" onClick={() => setRecurringOpen((o) => !o)} aria-expanded={recurringOpen}>
                  <span className="recurring-header-icon"><Icon name="recurring" size={16} /></span>
                  <span className="recurring-header-title">Recurring</span>
                  <span className="recurring-header-summary">
                    €{fmt0(recurringMonthly)}/mo · {recurringActive.length} payment{recurringActive.length !== 1 ? "s" : ""}
                  </span>
                  {recurringPriceChanges > 0 && (
                    <span className="recurring-alert-badge">{recurringPriceChanges} price change{recurringPriceChanges !== 1 ? "s" : ""}</span>
                  )}
                  <span className={`recurring-chevron${recurringOpen ? " open" : ""}`}>⌄</span>
                </button>
                {recurringOpen && (
                  <div className="recurring-list">
                    {recurringActive.map((r) => {
                      const cat = CATEGORIES.find((c) => c.name === r.category) || CATEGORIES[CATEGORIES.length - 1];
                      return (
                        <div className="recurring-row" key={r.key}>
                          <span className="recurring-dot" style={{ background: cat.color }} />
                          <div className="recurring-info">
                            <div className="recurring-name-row">
                              <span className="recurring-name">{r.name}</span>
                              <span className="recurring-freq">{r.period}</span>
                              {r.priceChange && (
                                <span className={`recurring-price-flag ${r.priceChange.new > r.priceChange.old ? "up" : "down"}`}>
                                  €{r.priceChange.old.toFixed(2)} → €{r.priceChange.new.toFixed(2)} {r.priceChange.new > r.priceChange.old ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                            <div className="recurring-meta">
                              last {r.lastSeen.toLocaleDateString("en-IE", { day: "numeric", month: "short" })} · next ~{r.nextDue.toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                          <div className="recurring-amount">€{r.amount.toFixed(2)}</div>
                        </div>
                      );
                    })}
                    {recurringInactive.length > 0 && (
                      <>
                        <div className="recurring-subhead">Not seen recently</div>
                        {recurringInactive.map((r) => {
                          const cat = CATEGORIES.find((c) => c.name === r.category) || CATEGORIES[CATEGORIES.length - 1];
                          return (
                            <div className="recurring-row muted" key={r.key}>
                              <span className="recurring-dot" style={{ background: cat.color }} />
                              <div className="recurring-info">
                                <div className="recurring-name-row">
                                  <span className="recurring-name">{r.name}</span>
                                  <span className="recurring-freq">{r.period}</span>
                                </div>
                                <div className="recurring-meta">
                                  last seen {r.lastSeen.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                              </div>
                              <div className="recurring-amount">€{r.amount.toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Filters card — collapses to search + toggle once scrolled */}
            <div className={`card txn-filters${filtersStuck && !filtersOpen ? " collapsed" : ""}`}>
              <div className="txn-filters-bar">
                <input
                  type="search"
                  className="txn-search-input"
                  placeholder="Search by merchant or description…"
                  value={txnSearch}
                  onChange={e => setTxnSearch(e.target.value)}
                />
                {filtersStuck && (
                  <button
                    className="txn-filters-toggle"
                    onClick={() => setFiltersOpen(o => !o)}
                    aria-expanded={filtersOpen}
                  >
                    {filtersOpen ? "Hide filters" : (
                      <>Filters{activeFilterCount > 0 && (
                        <span className="txn-filters-badge" title={`${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active`}>{activeFilterCount}</span>
                      )}</>
                    )}
                  </button>
                )}
              </div>

              {!(filtersStuck && !filtersOpen) && (
                <>
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
                </>
              )}
            </div>

            {/* Results card */}
            <div className="card">
              {/* Summary row */}
              <div className="filter-summary">
                <span className="filter-count">
                  {hasActiveTxnFilters ? "Filtered" : "All"} · {filteredTxns.length} transaction{filteredTxns.length !== 1 ? "s" : ""}
                </span>
                <div className="filter-summary-actions">
                  <div className="filter-totals">
                    {filteredIncome > 0 && (
                      <span className="filter-total in">+€{filteredIncome.toFixed(2)}</span>
                    )}
                    {filteredSpend > 0 && (
                      <span className="filter-total out">−€{filteredSpend.toFixed(2)}</span>
                    )}
                  </div>
                  <label className="export-toggle" title="On: export only the filtered results. Off: export every transaction.">
                    <input type="checkbox" checked={exportFilteredOnly} onChange={(e) => setExportFilteredOnly(e.target.checked)} />
                    <span>Filtered only</span>
                  </label>
                  <button className="export-btn" onClick={exportTxnsCsv} disabled={transactions.length === 0}>Export CSV</button>
                </div>
              </div>

              {filteredTxns.length === 0 ? (
                <EmptyState
                  icon="search"
                  headline={transactions.length === 0 ? "No transactions yet" : "No matches"}
                  sub={transactions.length === 0 ? "Import a statement to get started" : "Try adjusting your search or filters"}
                />
              ) : (
                txnGroups.map((g) => (
                  <div className="txn-day-group" key={g.key}>
                    <div className="txn-day-header">
                      {g.date.toLocaleDateString("en-IE", { weekday: "long" })}, {g.date.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    {g.txns.map((t) => <TxnRow key={t.id} t={t} {...txnRowProps} />)}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* BUDGET */}
        {tab === "budget" && (
          <>
            <TabHeader
              eyebrow="Budget"
              sub={budgets.filter((b) => b.limit_amount > 0).length > 0
                ? `${budgets.filter((b) => b.limit_amount > 0 && b.cadence !== "monthly").length} weekly · ${budgets.filter((b) => b.limit_amount > 0 && b.cadence === "monthly").length} monthly limits`
                : "set your spending limits below"}
            >
              <CountUp value={budgetMonthlyTotal} prefix="€" /><span className="tab-header-unit">/mo</span>
            </TabHeader>
            <div className="card">
            <div className="card-title">Category budget limits</div>
            {planner.monthly_income > 0 && (
              <div style={{
                background: budgetMonthlyTotal > plannerAvailable ? "var(--red-bg)"
                  : budgetMonthlyTotal >= plannerAvailable * 0.9 ? "var(--amber-bg)"
                  : "var(--green-bg)",
                color: budgetMonthlyTotal > plannerAvailable ? "var(--red)"
                  : budgetMonthlyTotal >= plannerAvailable * 0.9 ? "var(--amber)"
                  : "var(--green)",
                borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500, marginBottom: "1rem",
              }}>
                <div>Planner: €{plannerAvailable.toFixed(0)}/mo available · Limits total: €{budgetMonthlyTotal.toFixed(0)}/mo</div>
                <div style={{ fontWeight: 400, fontSize: 12, marginTop: 3, opacity: 0.85 }}>
                  {budgetMonthlyTotal > plannerAvailable
                    ? `€${(budgetMonthlyTotal - plannerAvailable).toFixed(0)} over — reduce limits or update your Planner`
                    : budgetMonthlyTotal >= plannerAvailable * 0.9
                    ? `€${(plannerAvailable - budgetMonthlyTotal).toFixed(0)} to spare — limits are close to the maximum`
                    : `€${(plannerAvailable - budgetMonthlyTotal).toFixed(0)} buffer — limits fit comfortably`}
                </div>
              </div>
            )}
            <div className="budget-tiles">
              {budgets.filter((b) => b.name !== "IOUs & Splits").map((b) => {
                const isMonthly = b.cadence === "monthly";
                const spent = budgetSpentFor(b);
                const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0;
                const barColor = b.limit_amount > 0 ? (spent > b.limit_amount ? "#e24b4a" : spent > b.limit_amount * 0.8 ? "#ba7517" : b.color) : b.color;
                const saveBudget = (limit_amount, cadence) => {
                  const uid = session.user.id;
                  const { name, color } = b;
                  debounceSave(`budget-${name}`, () =>
                    supabase.from("budgets").upsert({ name, limit_amount, color, cadence, user_id: uid }, { onConflict: "name,user_id" })
                  );
                };
                const setCadence = (cadence) => {
                  if (cadence === b.cadence) return;
                  setBudgets((prev) => prev.map((p) => p.name === b.name ? { ...p, cadence } : p));
                  saveBudget(b.limit_amount, cadence);
                };
                return (
                  <div className="budget-tile" key={b.name}>
                    <div className="budget-tile-head">
                      <span className="budget-tile-dot" style={{ background: b.color }} />
                      <span className="budget-tile-icon">{b.icon}</span>
                      <span className="budget-tile-name">{b.name}</span>
                    </div>
                    <div className="budget-tile-input-row">
                      <span className="budget-tile-currency">€</span>
                      <input
                        type="number" min="0" step="5" value={b.limit_amount}
                        className="budget-input budget-tile-input"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setBudgets((prev) => prev.map((p) => p.name === b.name ? { ...p, limit_amount: val } : p));
                          saveBudget(val, b.cadence);
                        }}
                      />
                      <div className="budget-tile-cadence" role="group" aria-label="Budget cadence">
                        <button type="button" className={!isMonthly ? "active" : ""} onClick={() => setCadence("weekly")}>wk</button>
                        <button type="button" className={isMonthly ? "active" : ""} onClick={() => setCadence("monthly")}>mo</button>
                      </div>
                    </div>
                    <div className="progress-wrap">
                      {b.limit_amount > 0 && <div className="progress-bar" style={{ width: pct + "%", background: barColor }} />}
                    </div>
                    <div className="budget-tile-usage">
                      <span style={{ color: barColor }}>€{spent.toFixed(0)}</span>
                      <span className="budget-tile-usage-sub">{b.limit_amount > 0 ? `spent of €${b.limit_amount} · ${isMonthly ? "month" : "week"}` : "no limit set"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </>
        )}

        {/* STATEMENTS */}
        {tab === "statements" && (
          <>
            <TabHeader
              eyebrow="Statements"
              sub={transactions.length ? `${fmt0(transactions.length)} transactions imported` : "upload a statement to begin"}
            >
              {latestTxnDate
                ? <span className="tab-header-text">{latestTxnDate.toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}</span>
                : <span className="tab-header-text" style={{ color: "var(--text-3)" }}>No imports yet</span>}
            </TabHeader>
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
            <TabHeader
              eyebrow="Savings"
              sub={totalSavingsTarget > 0
                ? `${savingsPct?.toFixed(0)}% of €${fmt0(totalSavingsTarget)} target`
                : "across all vaults"}
            >
              <CountUp value={totalSavings} prefix="€" />
            </TabHeader>
            {savings.length === 0 && (
              <div className="card">
                <EmptyState icon="savings" headline="Nothing here yet" sub="Import a Revolut CSV to populate your vaults" />
              </div>
            )}
            <div className="vault-cards">
              {savings.map((v) => {
                const isHolidays = v.name === "Holidays";
                const pct = v.target > 0 ? Math.min(100, (v.balance / v.target) * 100) : null;
                const autoMeta = revVaultMeta[v.id];
                const days = isHolidays ? daysUntil(v.departure_date) : null;
                const hasPhoto = isHolidays && !!v.photo_url;
                const theme = vaultTheme(v);
                const openEdit = () => {
                  setHolidaysEditDraft({ destinationName: v.destination_name || "", targetDate: v.departure_date || "", photoFile: undefined, clearPhoto: false });
                  setHolidaysUploadError(null);
                  setEditingHolidays(true);
                };
                const saveHolidays = async () => {
                  const uid = session.user.id;
                  setHolidaysUploading(true);
                  setHolidaysUploadError(null);
                  try {
                    let photoUrl = v.photo_url ?? null;
                    if (holidaysEditDraft.clearPhoto) {
                      await supabase.storage.from("vault-photos").remove([`${uid}/holidays`]);
                      photoUrl = null;
                    } else if (holidaysEditDraft.photoFile) {
                      const file = holidaysEditDraft.photoFile;
                      const ext = file.name.split(".").pop();
                      const storagePath = `${uid}/holidays.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from("vault-photos")
                        .upload(storagePath, file, { upsert: true, contentType: file.type });
                      if (upErr) throw upErr;
                      const { data: { publicUrl } } = supabase.storage
                        .from("vault-photos")
                        .getPublicUrl(storagePath);
                      photoUrl = publicUrl;
                    }
                    const { error: dbErr } = await supabase
                      .from("savings")
                      .update({
                        photo_url: photoUrl,
                        destination_name: holidaysEditDraft.destinationName || null,
                        departure_date: holidaysEditDraft.targetDate || null,
                      })
                      .eq("id", v.id)
                      .eq("user_id", uid);
                    if (dbErr) throw dbErr;
                    setSavings(prev => prev.map(s => s.id === v.id ? {
                      ...s,
                      photo_url: photoUrl,
                      destination_name: holidaysEditDraft.destinationName || null,
                      departure_date: holidaysEditDraft.targetDate || null,
                    } : s));
                    setEditingHolidays(false);
                  } catch (err) {
                    setHolidaysUploadError(err.message || "Upload failed");
                  } finally {
                    setHolidaysUploading(false);
                  }
                };
                return (
                  <Fragment key={v.id}>
                    {/* Goal card: colour/photo hero + footer figures */}
                    <div className="vault-card">
                      <div
                        className={`vault-hero${hasPhoto ? " has-photo" : ""}`}
                        style={hasPhoto
                          ? { backgroundImage: `url(${v.photo_url})` }
                          : { background: `linear-gradient(150deg, ${theme.from}, ${theme.to})` }}
                      >
                        <div className="vault-hero-top">
                          <span className="vault-hero-name">{v.name}</span>
                          <span className="vault-hero-chips">
                            {autoMeta && <span className="vault-chip">↻ Revolut</span>}
                            {isHolidays && !editingHolidays && (
                              <button className="vault-chip edit" onClick={openEdit}>✎ Edit</button>
                            )}
                          </span>
                        </div>
                        {isHolidays && days !== null && (
                          <span className="vault-hero-days">✈ {v.destination_name ? `${days} days to ${v.destination_name}` : `${days} days to go`}</span>
                        )}
                        {isHolidays && !v.photo_url && !editingHolidays && (
                          <button className="vault-hero-addphoto" onClick={openEdit}>＋ Add photo</button>
                        )}
                        {!isHolidays && <span className="vault-hero-glyph">{theme.icon}</span>}
                        <div className="vault-prog"><i style={{ width: `${pct ?? 0}%` }} /></div>
                      </div>
                      <div className="vault-foot">
                        <span className="vault-bal">€{v.balance % 1 === 0 ? v.balance : v.balance.toFixed(2)}</span>
                        <span className="vault-foot-tgt">
                          of <span className="savings-target-currency">€</span>
                          <input
                            type="number" min="0" step="50" value={v.target || ""}
                            placeholder="—"
                            aria-label="Target amount"
                            className="savings-target-inline"
                            style={{ width: `${Math.max((v.target ? String(v.target).length : 2), 2) + 1}ch` }}
                            onChange={(e) => {
                              const uid = session.user.id;
                              const val = parseFloat(e.target.value) || 0;
                              setSavings(prev => prev.map(s => s.id === v.id ? { ...s, target: val } : s));
                              debounceSave(`vault-target-${v.id}`, () =>
                                supabase.from("savings").update({ target: val }).eq("id", v.id).eq("user_id", uid)
                              );
                            }}
                          />
                        </span>
                        <span className="vault-pct" style={{ color: pct === null ? "var(--text-3)" : theme.solid }}>
                          {pct === null ? "—" : `${Math.round(pct)}%`}
                        </span>
                        {autoMeta && <span className="vault-imp">Last imported: {autoMeta.lastImported}</span>}
                      </div>
                    </div>

                    {/* Holidays edit form */}
                    {isHolidays && editingHolidays && (
                      <div className="holidays-edit-form">
                        <div className="holidays-edit-field">
                          <label className="holidays-edit-label">Destination</label>
                          <input
                            type="text" placeholder="e.g. Lisbon" value={holidaysEditDraft.destinationName}
                            className="savings-input" style={{ width: "100%" }}
                            onChange={(e) => setHolidaysEditDraft(d => ({ ...d, destinationName: e.target.value }))}
                          />
                        </div>
                        <div className="holidays-edit-field">
                          <label className="holidays-edit-label">Departure date</label>
                          <input
                            type="date" value={holidaysEditDraft.targetDate}
                            className="savings-input"
                            onChange={(e) => setHolidaysEditDraft(d => ({ ...d, targetDate: e.target.value }))}
                          />
                        </div>
                        <div className="holidays-edit-field">
                          <label className="holidays-edit-label">Destination photo</label>
                          <div className="holidays-upload-row">
                            <label className={`holidays-upload-label${holidaysUploading ? " disabled" : ""}`}>
                              {holidaysEditDraft.photoFile ? holidaysEditDraft.photoFile.name : "Choose photo"}
                              <input type="file" accept="image/*" style={{ display: "none" }} disabled={holidaysUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setHolidaysEditDraft(d => ({ ...d, photoFile: file, clearPhoto: false }));
                                }} />
                            </label>
                            {!holidaysEditDraft.photoFile && v.photo_url && !holidaysEditDraft.clearPhoto && (
                              <span className="holidays-upload-status">Current photo kept</span>
                            )}
                            {holidaysEditDraft.clearPhoto && (
                              <span className="holidays-upload-status" style={{ color: "var(--red)" }}>Photo will be removed</span>
                            )}
                            {v.photo_url && !holidaysEditDraft.clearPhoto && (
                              <button className="holidays-upload-clear" onClick={() => setHolidaysEditDraft(d => ({ ...d, clearPhoto: true, photoFile: undefined }))}>
                                Remove photo
                              </button>
                            )}
                            {holidaysEditDraft.clearPhoto && (
                              <button className="holidays-upload-clear" onClick={() => setHolidaysEditDraft(d => ({ ...d, clearPhoto: false }))}>
                                Undo
                              </button>
                            )}
                          </div>
                          {holidaysUploadError && (
                            <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>{holidaysUploadError}</div>
                          )}
                        </div>
                        <div className="holidays-edit-actions">
                          <button className="holidays-save-btn" onClick={saveHolidays} disabled={holidaysUploading}>
                            {holidaysUploading ? "Uploading…" : "Save"}
                          </button>
                          <button className="holidays-cancel-btn" onClick={() => { setEditingHolidays(false); setHolidaysUploadError(null); }} disabled={holidaysUploading}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </>
        )}

        {/* INVESTMENTS */}
        {tab === "investments" && (
          <>
            <TabHeader
              eyebrow="Investments"
              sub={portfolio === null && portfolioLoading ? "loading your portfolio…" : "your Trading 212 portfolio"}
            >
              {portfolio === null
                ? <span style={{ color: "var(--text-3)" }}>{portfolioLoading ? "…" : "—"}</span>
                : <CountUp value={pfTotalValue} prefix="€" />}
            </TabHeader>
            {portfolioLoading && (
              <div className="card">
                <div className="skel" style={{ height: 14, width: 160, marginBottom: 20 }} />
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "0.5px solid var(--border-light)" }}>
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
                <EmptyState icon="alert" headline="Could not load portfolio" sub={portfolioError} />
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
                    <EmptyState icon="investments" headline="No positions yet" sub="Your Trading 212 portfolio is empty — positions will appear here once you invest" />
                  </div>
                ) : (
                  <div className="inv-grid">
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
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* PLANNER */}
        {tab === "planner" && (
          <>
            <TabHeader
              eyebrow="Planner"
              sub={planner.monthly_income > 0 ? "available to spend each month" : "set your income below to begin"}
            >
              <span style={{ color: plannerAvailable < 0 ? "var(--red)" : undefined }}>
                {plannerAvailable < 0 ? "−" : ""}<CountUp value={Math.abs(plannerAvailable)} prefix="€" />
              </span>
            </TabHeader>
            {plannerSaveError && (
              <div className="import-msg err" style={{ marginBottom: "1rem", wordBreak: "break-word" }}>
                Planner didn’t save: {plannerSaveError}
              </div>
            )}
            <div className="planner-grid">
              <div className="planner-inputs">
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
                <EmptyState icon="savings" headline="No vaults yet" sub="Add savings vaults in the Savings tab to plan contributions here" />
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
              </div>

              <div className="planner-summary-pane">
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
                  <span>Budget limits (monthly)</span>
                  <span>€{budgetMonthlyTotal.toFixed(0)}</span>
                </div>
                {planner.monthly_income > 0 && (
                  <div className={`planner-compare-banner ${plannerAvailable >= budgetMonthlyTotal ? "ok" : "warn"}`}>
                    {plannerAvailable >= budgetMonthlyTotal
                      ? `€${(plannerAvailable - budgetMonthlyTotal).toFixed(0)} buffer above your budget limits`
                      : `€${(budgetMonthlyTotal - plannerAvailable).toFixed(0)} short of your budget limits`}
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
              </div>
            </div>
          </>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <>
            <TabHeader eyebrow="Settings" sub="signed in">
              <span className="tab-header-text">{session.user.email}</span>
            </TabHeader>
            <div className="card">
              <div className="card-title">Account</div>
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
              <div className="card-title">Merchant rules{merchantRules.length > 0 ? ` · ${merchantRules.length}` : ""}</div>
              {merchantRules.length === 0 ? (
                <div className="empty-state">No rules yet — recategorise a transaction and click "Yes" to save one.</div>
              ) : (
                <>
                  {(rulesExpanded ? merchantRules : merchantRules.slice(0, 5)).map((r) => (
                    <div key={r.id} className="settings-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="settings-value" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.merchant}</div>
                        <div className="settings-hint">→ {r.category}</div>
                      </div>
                      <button className="remove-btn" onClick={() => deleteMerchantRule(r.id)}>✕</button>
                    </div>
                  ))}
                  {merchantRules.length > 5 && (
                    <button className="rules-toggle" onClick={() => setRulesExpanded((o) => !o)}>
                      {rulesExpanded ? "Show less" : `Show all ${merchantRules.length}`}
                    </button>
                  )}
                </>
              )}
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

        {/* WORTH IT? */}
        {tab === "worthit" && (
          <>
            <TabHeader
              eyebrow="Worth It?"
              sub={hourlyWage > 0 ? "what an hour of your work is worth" : "set your income in Planner to begin"}
            >
              {hourlyWage > 0
                ? <><CountUp value={hourlyWage} prefix="€" decimals={hourlyWage < 100 ? 2 : 0} /> <span className="worth-hr-unit">/ hr</span></>
                : <span style={{ color: "var(--text-3)" }}>€— / hr</span>}
            </TabHeader>

            {worthSaveError && (
              <div className="import-msg err" style={{ marginBottom: "1rem", wordBreak: "break-word" }}>
                Couldn’t save: {worthSaveError}
              </div>
            )}

            <div className="worth-grid">
              {/* Calculator */}
              <div className="card worth-calc">
                <div className="card-title">What are you considering?</div>
                <div className="worth-input-row">
                  <input
                    className="worth-name-input"
                    placeholder="e.g. AirPods Pro"
                    value={wcName}
                    onChange={(e) => setWcName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addPurchaseCheck(); }}
                  />
                  <div className="worth-cost-wrap">
                    <span className="worth-cost-currency">€</span>
                    <input
                      className="worth-cost-input"
                      type="number" min="0" step="5" placeholder="0"
                      value={wcCost}
                      onChange={(e) => setWcCost(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addPurchaseCheck(); }}
                    />
                  </div>
                  <div className="worth-kind-toggle" role="group" aria-label="Want or need">
                    <button type="button" className={wcKind === "want" ? "active" : ""} onClick={() => setWcKind("want")}>Want</button>
                    <button type="button" className={wcKind === "need" ? "active" : ""} onClick={() => setWcKind("need")}>Need</button>
                  </div>
                </div>

                <div className="worth-result">
                  {hourlyWage <= 0 ? (
                    <div className="worth-result-empty">Set your hourly rate on the right, or add your income in Planner, to see the time cost.</div>
                  ) : wcCostNum > 0 ? (
                    <>
                      <div className="worth-result-lead">That’s about</div>
                      <div className="worth-result-time">{fmtWorkTime(wcHours, hoursPerDay)}</div>
                      <div className="worth-result-sub">of work · at €{hourlyWage.toFixed(2)}/hr</div>
                    </>
                  ) : (
                    <div className="worth-result-empty">Enter a price to see how many hours of work it costs.</div>
                  )}
                </div>

                <button className="worth-check-btn" onClick={addPurchaseCheck} disabled={!wcName.trim() || wcCostNum <= 0}>
                  Save to history
                </button>
              </div>

              {/* Rate settings */}
              <div className="card worth-rate">
                <div className="card-title">Your rate</div>
                <div className="worth-rate-row">
                  <label className="worth-rate-label" htmlFor="wc-hpw">Hours worked / week</label>
                  <input
                    id="wc-hpw" className="worth-rate-input" type="number" min="1" step="0.5"
                    value={planner.hours_per_week ?? ""}
                    placeholder="37.5"
                    onChange={(e) => updatePlanner({ hours_per_week: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="worth-rate-row">
                  <label className="worth-rate-label" htmlFor="wc-override">Hourly wage override</label>
                  <div className="worth-cost-wrap">
                    <span className="worth-cost-currency">€</span>
                    <input
                      id="wc-override" className="worth-rate-input worth-rate-input-euro" type="number" min="0" step="0.5"
                      value={planner.hourly_wage_override ?? ""}
                      placeholder={derivedHourly > 0 ? derivedHourly.toFixed(2) : "—"}
                      onChange={(e) => {
                        const v = e.target.value;
                        updatePlanner({ hourly_wage_override: v === "" ? null : (parseFloat(v) || 0) });
                      }}
                    />
                  </div>
                </div>
                <div className="worth-rate-hint">
                  {hourlyWage > 0
                    ? <>Using <b>€{hourlyWage.toFixed(2)}/hr</b> · {hasWageOverride ? "manual override" : "from Planner income"} · workday ≈ {hoursPerDay % 1 === 0 ? hoursPerDay : hoursPerDay.toFixed(1)}h</>
                    : <>No wage yet — add take-home income in <button className="link-btn" onClick={() => setTab("planner")}>Planner</button>, or set an override above.</>}
                </div>
              </div>
            </div>

            {/* History */}
            <div className="card">
              <div className="worth-history-head">
                <div className="card-title" style={{ marginBottom: 0 }}>Recently weighed</div>
                {purchaseChecks.length > 0 && (
                  <div className="worth-history-totals">
                    {fmtWorkTimeShort(wantsHours, hoursPerDay)} wants · {fmtWorkTimeShort(needsHours, hoursPerDay)} needs
                  </div>
                )}
              </div>
              {purchaseChecks.length === 0 ? (
                <EmptyState icon="worthit" headline="Nothing weighed yet" sub="Check something above to start building a history of your decisions." />
              ) : (
                <div className="worth-history-list">
                  {purchaseChecks.map((c) => (
                    <div className="worth-history-row" key={c.id}>
                      <span className={`worth-kind-badge ${c.kind}`}>{c.kind}</span>
                      <span className="worth-history-name">{c.name}</span>
                      <span className="worth-history-cost">€{Number(c.cost).toFixed(0)}</span>
                      <span className="worth-history-time">{fmtWorkTimeShort(checkHours(c), hoursPerDay)}</span>
                      <button className="remove-btn" title="Remove" onClick={() => deletePurchaseCheck(c.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      )}
    </div>
  );
}
