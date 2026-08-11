import { DEMO_TIMEZONE } from "@/lib/progression";

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  timeZone: DEMO_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("vi-VN", {
  timeZone: DEMO_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Relative for anything recent (which is most of what the feeds show during a
 * demo), absolute once it stops being useful to say "3 ngày trước".
 */
export function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);

  if (diffMinutes < 1) return "vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.round(hours / 24);
  if (days <= 7) return `${days} ngày trước`;

  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/** "70 giờ" / "45 phút" — whichever reads better at that magnitude. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} phút`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} giờ`;
}
