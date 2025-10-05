import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const JKT_TZ = "Asia/Jakarta";

export function fromJktToUtc(dateLike: Date | string): Date {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return fromZonedTime(date, JKT_TZ);
}

export function fromUtcToJkt(dateLike: Date | string): Date {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return toZonedTime(date, JKT_TZ);
}

export function formatJkt(date: Date, formatStr: string): string {
  const jktDate = toZonedTime(date, JKT_TZ);
  return format(jktDate, formatStr);
}

export function toJktHour(date: Date): number {
  const jktDate = toZonedTime(date, JKT_TZ);
  return jktDate.getHours();
}
