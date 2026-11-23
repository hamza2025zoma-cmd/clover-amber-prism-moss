export const ADMIN_NAME = "Bank Account";
export const ADMIN_PASS = "Bank@1628";
export const ADMIN_ID = "admin";
export const BANK_LOGIN_ID = "__bank";
export const MAX_ACCOUNTS = 10;
export const PAY_AMT = 3000;
export const PAY_HOUR = 11;

export const THEMES = [
  { id: "purple", name: "Purple Clouds", fx: "clouds", color: "#2e1065" },
  { id: "classic", name: "Classic", fx: "orbs", color: "#1b1464" },
  { id: "aurora", name: "Aurora", fx: "none", color: "#0b1020" },
  { id: "ocean", name: "Ocean", fx: "bubbles", color: "#03045e" },
  { id: "candy", name: "Candy", fx: "none", color: "#ffd6e5" },
  { id: "space", name: "Space", fx: "stars", color: "#05010f" },
  { id: "gold", name: "Black Gold", fx: "none", color: "#0b0b0b" },
  { id: "sky", name: "Cotton Sky", fx: "clouds", color: "#7dd3fc" },
  { id: "neon", name: "Neon", fx: "none", color: "#07060f" },
  { id: "sunset", name: "Sunset", fx: "clouds", color: "#4a1942" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export type Account = {
  id: string;
  name: string;
  balance: number;
  pin: string;
  t: number;
};

export type Tx = {
  id: string;
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amt: number;
  note: string;
  t: number;
};

export type OneReceipt = {
  kind: "one";
  id: string;
  amount: number;
  fromName: string;
  toName: string;
  note: string;
  createdAt: number;
};

export type AllReceipt = {
  kind: "all";
  amount: number;
  count: number;
  note: string;
  createdAt: number;
  names: string[];
};

export type ReceiptModel = OneReceipt | AllReceipt;

const LEGACY_BANK = new Set(["البنك", "Bank accawnt", "Bank acckawent", "Bank Account"]);

export function displayParty(name: string, id?: string) {
  if (id === ADMIN_ID || LEGACY_BANK.has(name)) return ADMIN_NAME;
  return name;
}

export function formatMoney(n: number) {
  return Number(n || 0).toLocaleString("en-US");
}

export function formatWhen(t: number) {
  if (!t) return "";
  try {
    return new Date(t).toLocaleString("ar-EG");
  } catch {
    return "";
  }
}

export function txTitle(tx: Tx, myId: string | null) {
  const from = displayParty(tx.from, tx.fromId);
  const to = displayParty(tx.to, tx.toId);
  if (myId && tx.toId === myId) return `وصلك تحويل من ${from}`;
  if (myId && tx.fromId === myId) return `حوّلت إلى ${to}`;
  return `${from} حوّل إلى ${to}`;
}

export function txReceipt(tx: Tx): OneReceipt {
  return {
    kind: "one",
    id: tx.id,
    amount: tx.amt,
    fromName: displayParty(tx.from, tx.fromId),
    toName: displayParty(tx.to, tx.toId),
    note: tx.note,
    createdAt: tx.t,
  };
}

export function applyTheme(id: string) {
  const theme = THEMES.find((item) => item.id === id) ?? THEMES[0];
  document.documentElement.setAttribute("data-theme", theme.id);
  document.documentElement.setAttribute("data-fx", theme.fx);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.color);
  try {
    localStorage.setItem("bank_theme", theme.id);
  } catch {
    /* ignore quota */
  }
  return theme.id;
}

export function savedTheme() {
  try {
    return localStorage.getItem("bank_theme") || "purple";
  } catch {
    return "purple";
  }
}
