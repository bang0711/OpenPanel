// Cron validation. The command itself is arbitrary (that's the point of cron),
// but we forbid newlines so a value can't inject extra crontab lines, and we
// write the crontab via `crontab -` stdin rather than shell interpolation.

const CRON_FIELD = /^[\d*/,\-]+$/;
const CRON_KEYWORD =
  /^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)$/;

export function isValidSchedule(schedule: string): boolean {
  const t = schedule.trim();
  if (CRON_KEYWORD.test(t)) return true;
  const parts = t.split(/\s+/);
  return parts.length === 5 && parts.every((p) => CRON_FIELD.test(p));
}

export function isValidCommand(command: string): boolean {
  return (
    command.trim().length > 0 &&
    command.length <= 1000 &&
    !command.includes("\n") &&
    !command.includes("\r")
  );
}
