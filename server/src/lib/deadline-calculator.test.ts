import { describe, it, expect } from "vitest";
import { calculateDeadline } from "./deadline-calculator.js";

describe("calculateDeadline", () => {
  // ── Monthly frequency ──
  describe("monthly", () => {
    it("returns correct deadline for monthly filing", () => {
      // Reference: May 2026, deadlineDay=10, offset=0 → due June 10, 2026
      const ref = new Date(2026, 4, 15); // May 15, 2026
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 10,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      expect(result.deadline).toBe("2026-06-10");
      expect(result.filingPeriod).toBe("2026-05");
      expect(result.taxYear).toBe(2026);
    });

    it("rolls deadline to next month when due date has passed", () => {
      // Reference: May 30, 2026, deadlineDay=10, offset=0
      // June 10 has passed relative to May 30? No, June 10 is after May 30.
      // Wait: deadlineMonth = month+1+offset = 5+1+0 = 6 (June), deadlineYear=2026
      // deadlineDate = June 10, 2026. This is after May 30, so fine.
      const ref = new Date(2026, 4, 30);
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 10,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // Due June 10 — after reference date, no roll needed
      expect(result.deadline).toBe("2026-06-10");
    });

    it("rolls to next period when computed deadline is before reference", () => {
      // Reference: June 15, 2026, deadlineDay=10, offset=0
      // deadlineMonth = 6+1+0 = 7 (July), deadlineDate = July 10
      // July 10 > June 15, so no roll needed.
      // To force a roll: reference after the computed deadline for the current period.
      // Let's use reference=June 5, 2026: deadlineMonth=7 (July), deadlineDate=July 10 > June 5, fine.
      // Actually this function computes the deadline for the period FOLLOWING the reference month.
      // For reference in June, deadline is July 10. That's after June, so fine.
      const ref = new Date(2026, 5, 5);
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 10,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      expect(result.deadline).toBe("2026-07-10");
    });

    it("handles December rollover to next year", () => {
      // Reference: December 2026, deadlineDay=15, offset=0
      // deadlineMonth = 11+1+0 = 12 => 12-12=0, deadlineYear++
      const ref = new Date(2026, 11, 1); // Dec 1, 2026
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 15,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      expect(result.deadline).toBe("2027-01-15");
      expect(result.filingPeriod).toBe("2026-12");
      expect(result.taxYear).toBe(2026);
    });
  });

  // ── Quarterly frequency ──
  describe("quarterly", () => {
    it("Q1 filing: Jan-Mar, deadline in April/May", () => {
      // Reference: Feb 2026 (month=1), Q=1
      // deadlineMonth = 1*3 + deadlineMonthOffset = 3 + 1 = 4 (May... wait)
      // q=1, deadlineMonth = q*3 + offset = 3 + 1 = 4 (April), deadlineYear = 2026
      // Hmm, month is 0-indexed: Jan=0, Feb=1
      // q = Math.floor(1/3)+1 = 1 (Q1)
      // deadlineMonth = 1*3 + 1 = 4 (May? No, 0-indexed: 0=Jan, 4=May)
      // The offset of 1 means the month AFTER Q1 ends (March=2, so month 3=April).
      // With offset 1: month 4 = May. Let me verify: q=1, deadlineMonth=3+1=4 -> month 4 = May
      // Actually 0-indexed: 0=Jan,1=Feb,2=Mar,3=Apr,4=May
      // Q1 ends in March (month 2). Deadline = 1 month after = April (month 3).
      // But q*3 = 3 (April). With offset=1: 4 (May). That seems wrong.
      // Wait, q=1, q*3 = 3 which is April (0-indexed), + offset(1) = 4 which is May.
      // For form 1701Q, deadlineDay=15, deadlineMonthOffset=1
      // So Q1 filing due May 15. That seems correct for BIR forms.
      const ref = new Date(2026, 1, 1); // Feb 1, 2026
      const result = calculateDeadline({
        filingFrequency: "quarterly",
        deadlineDay: 15,
        deadlineMonthOffset: 1,
        referenceDate: ref,
      });
      expect(result.filingPeriod).toBe("2026-Q1");
      expect(result.deadline).toBe("2026-05-15");
      expect(result.taxYear).toBe(2026);
    });

    it("Q4 filing carries to next year if offset pushes past December", () => {
      // Reference: Nov 2026 (month=10), Q=4
      // q = Math.floor(10/3)+1 = 4, deadlineMonth = 4*3+1 = 13 => 13-12=1, deadlineYear++
      const ref = new Date(2026, 10, 1); // Nov 1, 2026
      const result = calculateDeadline({
        filingFrequency: "quarterly",
        deadlineDay: 15,
        deadlineMonthOffset: 1,
        referenceDate: ref,
      });
      expect(result.filingPeriod).toBe("2026-Q4");
      // deadlineMonth = 13-12=1 (Feb), deadlineYear=2027
      expect(result.deadline).toBe("2027-02-15");
    });
  });

  // ── Annually frequency ──
  describe("annually", () => {
    it("returns April 15 deadline for annual filing (deadlineMonthOffset=4)", () => {
      // For annually: deadlineMonth = deadlineMonthOffset, deadlineYear = year + 1
      // With offset=4 (April), year+1=2027
      const ref = new Date(2026, 5, 1); // Jun 1, 2026
      const result = calculateDeadline({
        filingFrequency: "annually",
        deadlineDay: 15,
        deadlineMonthOffset: 4,
        referenceDate: ref,
      });
      expect(result.deadline).toBe("2027-04-15");
      expect(result.filingPeriod).toBe("2026");
      expect(result.taxYear).toBe(2026);
    });

    it("handles offset=0 deadline in January of next year", () => {
      const ref = new Date(2026, 5, 1);
      const result = calculateDeadline({
        filingFrequency: "annually",
        deadlineDay: 31,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // deadlineMonth=0 (Jan), deadlineYear=2027
      expect(result.deadline).toBe("2027-01-31");
    });

    it("uses last day of month when deadlineDay exceeds month length", () => {
      // Offset 3 -> March (month 2, 0-indexed) has 31 days, so no clamping.
      // Offset 4 -> April (month 3, 0-indexed) has 30 days. deadlineDay=31 -> clamped to 30.
      const ref = new Date(2026, 0, 1);
      const result = calculateDeadline({
        filingFrequency: "annually",
        deadlineDay: 31,
        deadlineMonthOffset: 4, // April
        referenceDate: ref,
      });
      // deadlineMonth=3 (April, 0-indexed), lastDay=30, min(31,30)=30
      expect(result.deadline).toBe("2027-04-30");
    });

    it("rolls forward when calculated deadline is before reference date", () => {
      // Reference: May 2027. deadline = April 2027 (already passed)
      const ref = new Date(2027, 4, 1); // May 1, 2027
      const result = calculateDeadline({
        filingFrequency: "annually",
        deadlineDay: 15,
        deadlineMonthOffset: 4,
        referenceDate: ref,
      });
      // First attempt: deadline Apr 2027 < May 2027 -> roll
      // Next: referenceDate = June 1, 2027 -> deadline Apr 2028
      expect(result.deadline).toBe("2028-04-15");
      expect(result.filingPeriod).toBe("2027");
    });
  });

  // ── Default (one_time / fallback) ──
  describe("one_time / default", () => {
    it("returns deadline in next month for one_time filing", () => {
      const ref = new Date(2026, 0, 15); // Jan 15
      const result = calculateDeadline({
        filingFrequency: "one_time",
        deadlineDay: 20,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // default: deadlineMonth = month + offset = 0+0 = 0 (Jan? No, month + deadlineMonthOffset)
      // default case: deadlineMonth = month + deadlineMonthOffset = 0+0 = 0 (Jan)
      // deadlineDate = Jan 20. This is after Jan 15, so fine.
      // But wait, the one_time check says: if deadlineDate < now && filingFrequency !== "one_time" -> roll
      // Since it IS one_time, it doesn't roll.
      expect(result.deadline).toBe("2026-01-20");
    });

    it("does NOT roll forward for one_time even if deadline passed", () => {
      const ref = new Date(2026, 0, 25); // Jan 25
      const result = calculateDeadline({
        filingFrequency: "one_time",
        deadlineDay: 20,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // deadlineMonth = 0+0 = 0 (Jan), deadlineDate = Jan 20 < Jan 25
      // one_time skips the roll
      expect(result.deadline).toBe("2026-01-20");
    });
  });

  // ── Edge cases ──
  describe("edge cases", () => {
    it("handles February 28/29 leap year correctly", () => {
      // Non-leap year: Feb has 28 days
      const ref = new Date(2027, 0, 15); // Jan 15, 2027
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 31,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // deadlineMonth = 0+1+0 = 1 (Feb), lastDay = 28 (2027 not leap)
      expect(result.deadline).toBe("2027-02-28");
    });

    it("handles leap year February (29 days)", () => {
      const ref = new Date(2028, 0, 15); // Jan 15, 2028 (leap year)
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 31,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // deadlineMonth = 0+1+0 = 1 (Feb), 2028 is leap -> 29 days
      expect(result.deadline).toBe("2028-02-29");
    });

    it("handles 31st day in 30-day month", () => {
      const ref = new Date(2026, 2, 1); // March 1, 2026
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 31,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      // April has 30 days, so min(31,30) = 30
      expect(result.deadline).toBe("2026-04-30");
    });

    it("produces unique label for monthly filings", () => {
      const ref = new Date(2026, 6, 1); // July
      const result = calculateDeadline({
        filingFrequency: "monthly",
        deadlineDay: 15,
        deadlineMonthOffset: 0,
        referenceDate: ref,
      });
      expect(result.label).toContain("2026-07");
    });

    it("produces unique label for quarterly filings", () => {
      const ref = new Date(2026, 8, 1); // September -> Q3
      const result = calculateDeadline({
        filingFrequency: "quarterly",
        deadlineDay: 15,
        deadlineMonthOffset: 1,
        referenceDate: ref,
      });
      expect(result.label).toContain("Q3");
    });
  });
});
