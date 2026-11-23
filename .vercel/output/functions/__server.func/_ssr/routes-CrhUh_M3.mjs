import { o as __toESM } from "../_runtime.mjs";
import { G as require_jsx_runtime, K as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CrhUh_M3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function Background() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb o1" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb o2" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orb o3" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stars" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b1" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b2" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b3" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b4" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b5" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bub b6" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cloud c1" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cloud c2" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cloud c3" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "cloud c4" })
	] });
}
var ADMIN_NAME = "Bank Account";
var ADMIN_ID = "admin";
var BANK_LOGIN_ID = "__bank";
var PAY_AMT = 3e3;
var THEMES = [
	{
		id: "purple",
		name: "Purple Clouds",
		fx: "clouds",
		color: "#2e1065"
	},
	{
		id: "classic",
		name: "Classic",
		fx: "orbs",
		color: "#1b1464"
	},
	{
		id: "aurora",
		name: "Aurora",
		fx: "none",
		color: "#0b1020"
	},
	{
		id: "ocean",
		name: "Ocean",
		fx: "bubbles",
		color: "#03045e"
	},
	{
		id: "candy",
		name: "Candy",
		fx: "none",
		color: "#ffd6e5"
	},
	{
		id: "space",
		name: "Space",
		fx: "stars",
		color: "#05010f"
	},
	{
		id: "gold",
		name: "Black Gold",
		fx: "none",
		color: "#0b0b0b"
	},
	{
		id: "sky",
		name: "Cotton Sky",
		fx: "clouds",
		color: "#7dd3fc"
	},
	{
		id: "neon",
		name: "Neon",
		fx: "none",
		color: "#07060f"
	},
	{
		id: "sunset",
		name: "Sunset",
		fx: "clouds",
		color: "#4a1942"
	}
];
var LEGACY_BANK = /* @__PURE__ */ new Set([
	"البنك",
	"Bank accawnt",
	"Bank acckawent",
	"Bank Account"
]);
function displayParty(name, id) {
	if (id === "admin" || LEGACY_BANK.has(name)) return ADMIN_NAME;
	return name;
}
function formatMoney(n) {
	return Number(n || 0).toLocaleString("en-US");
}
function formatWhen(t) {
	if (!t) return "";
	try {
		return new Date(t).toLocaleString("ar-EG");
	} catch {
		return "";
	}
}
function txTitle(tx, myId) {
	const from = displayParty(tx.from, tx.fromId);
	const to = displayParty(tx.to, tx.toId);
	if (myId && tx.toId === myId) return `وصلك تحويل من ${from}`;
	if (myId && tx.fromId === myId) return `حوّلت إلى ${to}`;
	return `${from} حوّل إلى ${to}`;
}
function txReceipt(tx) {
	return {
		kind: "one",
		id: tx.id,
		amount: tx.amt,
		fromName: displayParty(tx.from, tx.fromId),
		toName: displayParty(tx.to, tx.toId),
		note: tx.note,
		createdAt: tx.t
	};
}
function applyTheme(id) {
	const theme = THEMES.find((item) => item.id === id) ?? THEMES[0];
	document.documentElement.setAttribute("data-theme", theme.id);
	document.documentElement.setAttribute("data-fx", theme.fx);
	const meta = document.querySelector("meta[name=\"theme-color\"]");
	if (meta) meta.setAttribute("content", theme.color);
	try {
		localStorage.setItem("bank_theme", theme.id);
	} catch {}
	return theme.id;
}
function savedTheme() {
	try {
		return localStorage.getItem("bank_theme") || "purple";
	} catch {
		return "purple";
	}
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	const [App, setApp] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		applyTheme(savedTheme());
		let live = true;
		import("./bank-app-DVI8iED5.mjs").then((mod) => {
			if (live) setApp(() => mod.BankApp);
		}).catch(() => {
			if (live) setFailed(true);
		});
		return () => {
			live = false;
		};
	}, []);
	if (!App) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Background, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "بنك تيته امال الدولي" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sub",
				children: "بنك العيلة · الحد الأقصى 10 حسابات"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "glass",
				children: failed ? "تعذر فتح البنك" : "جاري التحميل..."
			})
		]
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {});
}
//#endregion
export { BANK_LOGIN_ID as a, applyTheme as c, savedTheme as d, txReceipt as f, formatMoney as l, Background as m, ADMIN_ID as n, PAY_AMT as o, txTitle as p, ADMIN_NAME as r, THEMES as s, routes_exports as t, formatWhen as u };
