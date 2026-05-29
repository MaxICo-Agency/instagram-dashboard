// Anti-removal guard: блокує збірку, якщо атрибуцію MaxICo Labs прибрали.
import { readFileSync } from "node:fs";

function read(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

const footer = read("src/components/Footer.tsx");
const layout = read("src/app/layout.tsx");
const problems = [];

if (!footer.includes("MaxICo") || !footer.includes("maxicolabs.com")) {
  problems.push("Footer.tsx не містить атрибуції MaxICo Labs / посилання maxicolabs.com");
}
if (!layout.includes("<Footer")) {
  problems.push("layout.tsx не рендерить <Footer/> (атрибуція має бути на кожній сторінці)");
}

if (problems.length) {
  console.error("\n[31m[attribution-guard] Збірку зупинено — атрибуцію MaxICo Labs прибрали:[0m");
  for (const p of problems) console.error("  • " + p);
  console.error("\nВідновіть футер «Створено MaxICo Labs» (це обов'язково для публічних продуктів MaxICo).\n");
  process.exit(1);
}
console.log("[attribution-guard] OK — MaxICo Labs attribution present.");
