import { describe, it, expect, vi, beforeAll } from "vitest";

describe("requireRole", () => {
  it("returns 401 when no auth user", async () => {
    const { requireRole } = await import("./auth.js");
    const middleware = requireRole("admin");

    const req = { authUser: undefined } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not in allowed roles", async () => {
    const { requireRole } = await import("./auth.js");
    const middleware = requireRole("admin", "manager");

    const req = {
      authUser: { id: 1, name: "Bookkeeper", role: "bookkeeper" },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Insufficient permissions",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when user role is allowed", async () => {
    const { requireRole } = await import("./auth.js");
    const middleware = requireRole("admin", "bookkeeper");

    const req = {
      authUser: { id: 1, name: "Bookkeeper", role: "bookkeeper" },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
