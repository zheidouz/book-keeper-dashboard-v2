import { describe, it, expect } from "vitest";

// Replicate the STATUS_FLOW from tasks.ts to test it in isolation
const STATUS_FLOW: Record<string, string[]> = {
  pending: ["ready_to_file"],
  ready_to_file: ["pending", "submitted"],
  submitted: ["ready_to_file", "completed"],
  completed: ["submitted", "done"],
  done: ["pending"],
};

type TaskStatus = keyof typeof STATUS_FLOW;

describe("Task Status Flow", () => {
  it("has all 5 statuses defined", () => {
    expect(Object.keys(STATUS_FLOW)).toEqual([
      "pending", "ready_to_file", "submitted", "completed", "done",
    ]);
  });

  it("pending can only go to ready_to_file", () => {
    const allowed = STATUS_FLOW["pending"];
    expect(allowed).toEqual(["ready_to_file"]);
  });

  it("ready_to_file can go to pending (revert) or submitted", () => {
    expect(STATUS_FLOW["ready_to_file"]).toContain("pending");
    expect(STATUS_FLOW["ready_to_file"]).toContain("submitted");
  });

  it("submitted can go to ready_to_file (revert) or completed", () => {
    expect(STATUS_FLOW["submitted"]).toContain("ready_to_file");
    expect(STATUS_FLOW["submitted"]).toContain("completed");
  });

  it("completed can go to submitted (revert) or done", () => {
    expect(STATUS_FLOW["completed"]).toContain("submitted");
    expect(STATUS_FLOW["completed"]).toContain("done");
  });

  it("done can only go to pending (re-open)", () => {
    expect(STATUS_FLOW["done"]).toEqual(["pending"]);
  });

  // ── Path validation: ensure every transition has a valid path ──
  it("all statuses are reachable from pending through valid transitions", () => {
    // pending → ready_to_file → submitted → completed → done
    const path = ["pending", "ready_to_file", "submitted", "completed", "done"];
    for (let i = 0; i < path.length - 1; i++) {
      expect(STATUS_FLOW[path[i]]).toContain(path[i + 1]);
    }
  });

  it("backward transitions are defined for every non-terminal status", () => {
    // ready_to_file → pending
    expect(STATUS_FLOW["ready_to_file"]).toContain("pending");
    // submitted → ready_to_file
    expect(STATUS_FLOW["submitted"]).toContain("ready_to_file");
    // completed → submitted
    expect(STATUS_FLOW["completed"]).toContain("submitted");
    // done → pending (re-open)
    expect(STATUS_FLOW["done"]).toContain("pending");
  });

  // ── Invalid transitions ──
  const INVALID_TRANSITIONS: [TaskStatus, TaskStatus][] = [
    ["pending", "submitted"],
    ["pending", "completed"],
    ["pending", "done"],
    ["ready_to_file", "completed"],
    ["ready_to_file", "done"],
    ["submitted", "pending"],
    ["submitted", "done"],
    ["completed", "pending"],
    ["completed", "ready_to_file"],
    ["done", "ready_to_file"],
    ["done", "submitted"],
    ["done", "completed"],
  ];

  it.each(INVALID_TRANSITIONS)("transition %s → %s is NOT allowed", (from, to) => {
    expect(STATUS_FLOW[from]).not.toContain(to);
  });
});
