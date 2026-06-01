import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getClerkToken
vi.mock("@/providers/AuthProvider", () => ({
  getClerkToken: vi.fn().mockResolvedValue(null),
}));

// Import after mocking
import { clientsApi, tasksApi, formsApi, usersApi, reportsApi, notificationsApi, calendarApi } from "./api";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(data: any, status = 200, contentType = "application/json") {
  return Promise.resolve({
    status,
    headers: new Map(Object.entries({ "content-type": contentType })),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("clientsApi", () => {
    it("list calls GET /api/clients", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [{ id: 1, name: "Client A" }] }));
      const result = await clientsApi.list();
      expect(mockFetch).toHaveBeenCalledWith("/api/clients", expect.any(Object));
      expect(result).toEqual([{ id: 1, name: "Client A" }]);
    });

    it("list with search appends query param", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await clientsApi.list("searchTerm");
      expect(mockFetch).toHaveBeenCalledWith("/api/clients?search=searchTerm", expect.any(Object));
    });

    it("get calls GET /api/clients/:id", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { id: 5 } }));
      const result = await clientsApi.get(5);
      expect(mockFetch).toHaveBeenCalledWith("/api/clients/5", expect.any(Object));
      expect(result).toEqual({ id: 5 });
    });

    it("create calls POST with JSON body", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { id: 1 } }, 201));
      const result = await clientsApi.create({ name: "New Client" });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/clients",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "New Client" }),
        })
      );
      expect(result).toEqual({ id: 1 });
    });

    it("update calls PUT /api/clients/:id", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { id: 1 } }));
      await clientsApi.update(1, { name: "Updated" });
      expect(mockFetch).toHaveBeenCalledWith("/api/clients/1", expect.objectContaining({ method: "PUT" }));
    });

    it("delete calls DELETE /api/clients/:id", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      await clientsApi.delete(3);
      expect(mockFetch).toHaveBeenCalledWith("/api/clients/3", expect.objectContaining({ method: "DELETE" }));
    });

    it("assign calls POST /api/clients/:id/assign", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }));
      await clientsApi.assign(1, 2);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/clients/1/assign",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ userId: 2 }),
        })
      );
    });

    it("unassign calls DELETE /api/clients/:id/assign/:userId", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      await clientsApi.unassign(1, 2);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/clients/1/assign/2",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("tasksApi", () => {
    it("list calls GET /api/tasks", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await tasksApi.list();
      expect(mockFetch).toHaveBeenCalledWith("/api/tasks", expect.any(Object));
    });

    it("list with status filter appends query params", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await tasksApi.list({ status: "pending", clientId: 3, search: "VAT" });
      const url = (mockFetch.mock.calls[0] as any)[0];
      expect(url).toContain("status=pending");
      expect(url).toContain("clientId=3");
      expect(url).toContain("search=VAT");
    });

    it("get calls GET /api/tasks/:id", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { id: 42 } }));
      const result = await tasksApi.get(42);
      expect(mockFetch).toHaveBeenCalledWith("/api/tasks/42", expect.any(Object));
      expect(result).toEqual({ id: 42 });
    });

    it("create calls POST /api/tasks", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }, 201));
      await tasksApi.create({ clientId: 1, formType: "bir", formId: 5 });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ clientId: 1, formType: "bir", formId: 5 }),
        })
      );
    });

    it("updateStatus calls PATCH /api/tasks/:id/status", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }));
      await tasksApi.updateStatus(1, "submitted", "Filing completed");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks/1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "submitted", comment: "Filing completed" }),
        })
      );
    });

    it("delete calls DELETE /api/tasks/:id", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      await tasksApi.delete(7);
      expect(mockFetch).toHaveBeenCalledWith("/api/tasks/7", expect.objectContaining({ method: "DELETE" }));
    });
  });

  describe("formsApi", () => {
    it("listBir calls GET /api/forms/bir", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await formsApi.listBir();
      expect(mockFetch).toHaveBeenCalledWith("/api/forms/bir", expect.any(Object));
    });

    it("listCustom calls GET /api/forms/custom", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await formsApi.listCustom();
      expect(mockFetch).toHaveBeenCalledWith("/api/forms/custom", expect.any(Object));
    });

    it("createCustom calls POST /api/forms/custom", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }, 201));
      await formsApi.createCustom({ name: "New Form", filingFrequency: "monthly" } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/forms/custom",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("usersApi", () => {
    it("me calls GET /api/users/me", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: { id: 1, role: "admin" } }));
      const result = await usersApi.me();
      expect(mockFetch).toHaveBeenCalledWith("/api/users/me", expect.any(Object));
      expect(result.role).toBe("admin");
    });

    it("list calls GET /api/users", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await usersApi.list();
      expect(mockFetch).toHaveBeenCalledWith("/api/users", expect.any(Object));
    });

    it("listBookkeepers calls GET /api/users/bookkeepers", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await usersApi.listBookkeepers();
      expect(mockFetch).toHaveBeenCalledWith("/api/users/bookkeepers", expect.any(Object));
    });
  });

  describe("reportsApi", () => {
    it("stats calls GET /api/reports/stats", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }));
      await reportsApi.stats();
      expect(mockFetch).toHaveBeenCalledWith("/api/reports/stats", expect.any(Object));
    });

    it("dashboard calls GET /api/reports/dashboard", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }));
      await reportsApi.dashboard();
      expect(mockFetch).toHaveBeenCalledWith("/api/reports/dashboard", expect.any(Object));
    });
  });

  describe("notificationsApi", () => {
    it("list calls GET /api/notifications", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: {} }));
      await notificationsApi.list();
      expect(mockFetch).toHaveBeenCalledWith("/api/notifications", expect.any(Object));
    });

    it("markRead calls PATCH /api/notifications/:id/read", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      await notificationsApi.markRead(5);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/notifications/5/read",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("markAllRead calls PUT /api/notifications/read-all", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      await notificationsApi.markAllRead();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/notifications/read-all",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  describe("calendarApi", () => {
    it("list calls GET /api/calendar", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await calendarApi.list();
      expect(mockFetch).toHaveBeenCalledWith("/api/calendar", expect.any(Object));
    });

    it("list with date range appends query params", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));
      await calendarApi.list("2026-06-01", "2026-07-01");
      const url = (mockFetch.mock.calls[0] as any)[0];
      expect(url).toContain("start=2026-06-01");
      expect(url).toContain("end=2026-07-01");
    });
  });

  describe("error handling", () => {
    it("throws on API error response", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: false, error: "Not found" }, 404));
      await expect(clientsApi.get(999)).rejects.toThrow("Not found");
    });

    it("throws on non-JSON response", async () => {
      mockFetch.mockResolvedValueOnce(
        Promise.resolve({
          status: 500,
          headers: new Map(Object.entries({ "content-type": "text/html" })),
          text: () => Promise.resolve("<html>Error</html>"),
          json: () => Promise.reject(new Error("Not JSON")),
        })
      );
      await expect(clientsApi.get(1)).rejects.toThrow("Server returned 500");
    });
  });
});
