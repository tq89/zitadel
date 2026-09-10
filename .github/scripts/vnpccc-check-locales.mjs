#!/usr/bin/env node
// vnpccc fork — cổng kiểm bản dịch màn đăng nhập.
//
// Chạy trong CI trước khi build image. Bắt đúng 2 thứ có thể làm hỏng trang
// đăng nhập mà build vẫn xanh:
//   1. Thiếu khoá  → next-intl rơi về tiếng Anh (bản dịch thủng lỗ chỗ).
//   2. Lệch placeholder ({appName}, {minLength}...) → câu mất biến, hoặc lỗi
//      lúc dựng câu. Upstream từng dính ở zh.json/device.request.disclaimer.
//
// Phạm vi: vnpccc CAM KẾT 4 ngôn ngữ (Quí chốt 2026-09-10) → thiếu khoá hoặc
// lệch placeholder ở 4 ngôn ngữ này là LỖI, chặn build image.
// 11 ngôn ngữ còn lại do upstream giữ (nhiều bản đang thiếu chuỗi / lệch
// placeholder sẵn) → CHỈ báo, không chặn: ta không nhận bảo trì chúng.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../apps/login/locales");
const SUPPORTED = ["vi", "zh-TW", "zh"]; // + "en" là bản tham chiếu
const REFERENCE = "en";

const flatten = (obj, prefix = "") =>
  Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(acc, flatten(v, key));
    else acc[key] = String(v);
    return acc;
  }, {});

const placeholders = (s) => [...(s.match(/\{[a-zA-Z]+\}/g) ?? [])].sort().join(",");
const load = (locale) => flatten(JSON.parse(readFileSync(join(LOCALES_DIR, `${locale}.json`), "utf8")));

const reference = load(REFERENCE);
const locales = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((l) => l !== REFERENCE);

let failed = false;
const lines = [];

for (const locale of locales) {
  const messages = load(locale);
  const supported = SUPPORTED.includes(locale);
  const mark = supported ? "❌" : "⚠️";
  const missing = Object.keys(reference).filter((k) => !messages[k]);
  const mismatched = Object.keys(reference).filter((k) => messages[k] && placeholders(messages[k]) !== placeholders(reference[k]));

  if (!missing.length && !mismatched.length) {
    lines.push(`✅ ${locale}: đủ ${Object.keys(reference).length} khoá${supported ? " (ngôn ngữ vnpccc cam kết)" : ""}`);
    continue;
  }
  if (supported) failed = true;
  if (missing.length) {
    lines.push(`${mark} ${locale}: thiếu ${missing.length} khoá → ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " …" : ""}`);
  }
  if (mismatched.length) {
    lines.push(`${mark} ${locale}: lệch placeholder ở ${mismatched.length} khoá → ${mismatched.slice(0, 8).join(", ")}`);
  }
}

console.log(lines.join("\n"));

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Kiểm bản dịch\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`);
}

if (failed) {
  console.error(`\n4 ngôn ngữ cam kết (${REFERENCE}, ${SUPPORTED.join(", ")}) chưa đạt — sửa apps/login/locales/*.json rồi chạy lại.`);
  process.exit(1);
}
console.log(`\n4 ngôn ngữ cam kết (${REFERENCE}, ${SUPPORTED.join(", ")}) đầy đủ. Dòng ⚠️ là ngôn ngữ upstream, không chặn build.`);
