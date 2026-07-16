import { isValidIp } from "@/server/modules/fail2ban/fail2ban.constant";
for (const n of [20, 22, 24, 26]) {
  const evil = "a" + ":".repeat(n) + "!";
  const t0 = performance.now();
  isValidIp(evil);
  console.log(`${n} colons -> ${(performance.now() - t0).toFixed(1)}ms`);
}
