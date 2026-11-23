import { formatMoney, formatWhen, type ReceiptModel, type ThemeId } from "@/lib/bank-constants";

type Ink = { a: string; b: string; c: string; ink: string; gold: string; soft: string };

const INK: Record<ThemeId, Ink> = {
  purple: { a: "#2e1065", b: "#5b21b6", c: "#c4b5fd", ink: "#ffffff", gold: "#f5d77a", soft: "rgba(255,255,255,.78)" },
  classic: { a: "#1b1464", b: "#0b6e8a", c: "#67e8f9", ink: "#ffffff", gold: "#fde68a", soft: "rgba(255,255,255,.78)" },
  aurora: { a: "#0b1020", b: "#0f766e", c: "#818cf8", ink: "#ffffff", gold: "#a7f3d0", soft: "rgba(255,255,255,.75)" },
  ocean: { a: "#03045e", b: "#0077b6", c: "#90e0ef", ink: "#ffffff", gold: "#caf0f8", soft: "rgba(255,255,255,.8)" },
  candy: { a: "#9d174d", b: "#fb7185", c: "#fdba74", ink: "#3b2a4a", gold: "#9d174d", soft: "rgba(59,42,74,.72)" },
  space: { a: "#05010f", b: "#4c1d95", c: "#2563eb", ink: "#f5f3ff", gold: "#c4b5fd", soft: "rgba(245,243,255,.75)" },
  gold: { a: "#0b0b0b", b: "#3f2e0b", c: "#b8860b", ink: "#f3ead2", gold: "#f5d77a", soft: "rgba(243,234,210,.75)" },
  sky: { a: "#0369a1", b: "#38bdf8", c: "#f0f9ff", ink: "#0c2d48", gold: "#0369a1", soft: "rgba(12,45,72,.7)" },
  neon: { a: "#07060f", b: "#3b0764", c: "#00e5ff", ink: "#ffffff", gold: "#00e5ff", soft: "rgba(255,255,255,.75)" },
  sunset: { a: "#4a1942", b: "#c2410c", c: "#fbbf24", ink: "#ffffff", gold: "#fff7ed", soft: "rgba(255,255,255,.8)" },
};

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

async function readyFont() {
  try {
    await document.fonts.load("800 86px Cairo");
    await document.fonts.load("700 40px Cairo");
    await document.fonts.load("600 30px Cairo");
  } catch {
    /* system font still draws */
  }
}

export async function renderReceiptBlob(model: ReceiptModel, themeId: string) {
  await readyFont();
  const theme = INK[(themeId as ThemeId) in INK ? (themeId as ThemeId) : "purple"];
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("مش قادر أرسم الإيصال");

  const bg = ctx.createLinearGradient(0, 0, 1080, 1440);
  bg.addColorStop(0, theme.a);
  bg.addColorStop(0.55, theme.b);
  bg.addColorStop(1, theme.c);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1440);

  ctx.fillStyle = "rgba(255,255,255,.14)";
  ctx.beginPath();
  ctx.arc(920, 180, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(140, 1240, 260, 0, Math.PI * 2);
  ctx.fill();

  round(ctx, 72, 88, 936, 1264, 56);
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.48)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = theme.ink;
  ctx.font = "700 34px Cairo, Tahoma, sans-serif";
  ctx.fillText("بنك تيته امال الدولي", 540, 190);
  ctx.fillStyle = theme.gold;
  ctx.font = "700 28px Cairo, Tahoma, sans-serif";
  ctx.fillText(model.kind === "all" ? "إيصال تحويل للكل" : "إيصال تحويل", 540, 246);

  ctx.fillStyle = theme.ink;
  ctx.font = "800 92px Cairo, Tahoma, sans-serif";
  const amount = model.kind === "all" ? model.amount : model.amount;
  ctx.fillText(`${formatMoney(amount)} جنيه`, 540, 420);
  ctx.font = "600 30px Cairo, Tahoma, sans-serif";
  ctx.fillStyle = theme.soft;
  ctx.fillText(model.kind === "all" ? "لكل حساب" : "مبلغ التحويل", 540, 470);

  round(ctx, 128, 530, 824, model.kind === "all" ? 430 : 390, 36);
  ctx.fillStyle = "rgba(0,0,0,.16)";
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.soft;
  ctx.font = "600 26px Cairo, Tahoma, sans-serif";
  if (model.kind === "one") {
    ctx.fillText("من", 540, 600);
    ctx.fillStyle = theme.ink;
    ctx.font = "800 48px Cairo, Tahoma, sans-serif";
    ctx.fillText(model.fromName, 540, 670);
    ctx.fillStyle = theme.gold;
    ctx.font = "700 36px Cairo, Tahoma, sans-serif";
    ctx.fillText("↓", 540, 730);
    ctx.fillStyle = theme.soft;
    ctx.font = "600 26px Cairo, Tahoma, sans-serif";
    ctx.fillText("إلى", 540, 790);
    ctx.fillStyle = theme.ink;
    ctx.font = "800 48px Cairo, Tahoma, sans-serif";
    ctx.fillText(model.toName, 540, 860);
  } else {
    ctx.fillText("المرسل", 540, 600);
    ctx.fillStyle = theme.ink;
    ctx.font = "800 48px Cairo, Tahoma, sans-serif";
    ctx.fillText("Bank Account", 540, 670);
    ctx.fillStyle = theme.soft;
    ctx.font = "600 28px Cairo, Tahoma, sans-serif";
    ctx.fillText(`${formatMoney(model.count)} حسابات`, 540, 750);
    ctx.fillText(`الإجمالي ${formatMoney(model.amount * model.count)} جنيه`, 540, 810);
    ctx.font = "600 26px Cairo, Tahoma, sans-serif";
    const names = model.names.join(" · ");
    ctx.fillStyle = theme.ink;
    const lines = wrap(ctx, names, 720);
    lines.forEach((line, index) => ctx.fillText(line, 540, 880 + index * 40));
  }

  let y = model.kind === "all" ? 1040 : 1000;
  if (model.note) {
    ctx.fillStyle = theme.soft;
    ctx.font = "600 26px Cairo, Tahoma, sans-serif";
    ctx.fillText("السبب", 540, y);
    ctx.fillStyle = theme.ink;
    ctx.font = "700 32px Cairo, Tahoma, sans-serif";
    const noteLines = wrap(ctx, model.note, 760);
    noteLines.forEach((line, index) => ctx.fillText(line, 540, y + 52 + index * 42));
    y += 52 + noteLines.length * 42 + 20;
  }
  ctx.fillStyle = theme.soft;
  ctx.font = "600 26px Cairo, Tahoma, sans-serif";
  ctx.fillText(formatWhen(model.createdAt), 540, Math.min(y + 36, 1280));

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("مش قادر أحفظ صورة التحويل");
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function shareBlob(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text, title: "إيصال تحويل" });
    return "shared" as const;
  }
  return "unsupported" as const;
}
