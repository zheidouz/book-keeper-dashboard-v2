import { describe, it, expect } from "vitest";
import { cn, formatDate, isOverdue, isUpcoming, STATUS_LABELS, ROLE_LABELS } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-05-15");
    expect(result).toContain("May");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("returns empty string for falsy input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(undefined as unknown as string)).toBe("");
  });
});

describe("isOverdue", () => {
  beforeAll(() => {
    // Pin "today" to May 31, 2026 (context date)
    vi.useFakeTimers().setSystemTime(new Date("2026-05-31"));
  });
  afterAll(() => vi.useRealTimers());

  it("returns true if deadline is before today and not done/completed", () => {
    expect(isOverdue("2026-05-15", "pending")).toBe(true);
  });

  it("returns false if deadline is in the future", () => {
    expect(isOverdue("2026-06-15", "pending")).toBe(false);
  });

  it("returns false if status is done", () => {
    expect(isOverdue("2026-05-15", "done")).toBe(false);
  });

  it("returns false if status is completed", () => {
    expect(isOverdue("2026-05-15", "completed")).toBe(false);
  });

  it("returns false if deadline is today", () => {
    // deadline < today, deadline="2026-05-31", today="2026-05-31"
    // "2026-05-31" < "2026-05-31" -> false
    expect(isOverdue("2026-05-31", "pending")).toBe(false);
  });
});

describe("isUpcoming", () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date("2026-05-31"));
  });
  afterAll(() => vi.useRealTimers());

  it("returns true for deadlines within next 30 days", () => {
    expect(isUpcoming("2026-06-15")).toBe(true);
  });

  it("returns false for past deadlines", () => {
    expect(isUpcoming("2026-05-01")).toBe(false);
  });

  it("returns false for deadlines far in the future", () => {
    expect(isUpcoming("2026-08-01")).toBe(false);
  });

  it("returns true for today's date", () => {
    expect(isUpcoming("2026-05-31")).toBe(true);
  });

  it("accepts custom days parameter", () => {
    expect(isUpcoming("2026-07-01", 60)).toBe(true);
    expect(isUpcoming("2026-08-01", 60)).toBe(false);
  });
});

describe("STATUS_LABELS", () => {
  it("has labels for all task statuses", () => {
    const statuses = ["pending", "ready_to_file", "submitted", "completed", "done"];
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeDefined();
      expect(STATUS_LABELS[s].length).toBeGreaterThan(0);
    }
  });
});

describe("ROLE_LABELS", () => {
  it("has labels for all user roles", () => {
    const roles = ["admin", "manager", "bookkeeper", "encoder"];
    for (const r of roles) {
      expect(ROLE_LABELS[r]).toBeDefined();
      expect(ROLE_LABELS[r].length).toBeGreaterThan(0);
    }
  });
});
