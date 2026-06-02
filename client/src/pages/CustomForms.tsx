import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/TopBar";
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
  User,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const FREQ_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
  semi_annual: "Semi-Annual",
  one_time: "One-Time",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const emptyForm = {
  name: "",
  description: "",
  filingFrequency: "monthly" as "monthly" | "quarterly" | "annually" | "semi_annual" | "one_time",
  deadlineDay: 15,
  deadlineMonthOffset: 0,
  requiredFields: [] as string[],
};

type FormData = typeof emptyForm;

export default function CustomForms() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [newField, setNewField] = useState("");
  const [fieldInputKey, setFieldInputKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: customForms = [], isLoading } = useQuery({
    queryKey: ["custom-forms"],
    queryFn: formsApi.listCustom,
  });

  const createMutation = useMutation({
    mutationFn: () => formsApi.createCustom(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-forms"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => formsApi.updateCustom(editingId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-forms"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => formsApi.deleteCustom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-forms"] });
      setDeleteConfirm(null);
    },
  });

  // Focus name input when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [modalOpen]);

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) closeModal();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (cf: (typeof customForms)[0]) => {
    setEditingId(cf.id);
    setForm({
      name: cf.name,
      description: cf.description || "",
      filingFrequency: cf.filingFrequency,
      deadlineDay: cf.deadlineDay || 15,
      deadlineMonthOffset: cf.deadlineMonthOffset,
      requiredFields: cf.requiredFields || [],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewField("");
  };

  const addField = () => {
    if (newField.trim()) {
      setForm((prev) => ({
        ...prev,
        requiredFields: [...prev.requiredFields, newField.trim()],
      }));
      setNewField("");
      setFieldInputKey((k) => k + 1);
    }
  };

  const removeField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      requiredFields: prev.requiredFields.filter((_, i) => i !== index),
    }));
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addField();
    }
  };

  const submitForm = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (user?.role !== "admin") {
    return (
      <div>
        <TopBar title="Custom Forms" />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Only admins can access the Custom Form Builder.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Custom Form Builder" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Custom Forms</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {customForms.length} form{customForms.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Button onClick={openCreate} size="lg" className="shadow-sm">
            <Plus size={18} className="mr-1.5" /> New Form
          </Button>
        </div>

        {/* Modal overlay */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center sm:items-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Edit custom form" : "Create custom form"}
          >
            <div
              ref={modalRef}
              className="relative w-full sm:max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-2xl mt-16 sm:mt-0 mx-0 sm:mx-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <FileText size={18} />
                  </div>
                  <h2 className="text-lg font-semibold">
                    {editingId ? "Edit Form" : "Create Form"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-5">
                {/* Form Name */}
                <div>
                  <label htmlFor="form-name" className="block text-sm font-medium mb-1.5">
                    Form Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    ref={nameRef}
                    id="form-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Annual Financial Report"
                    required
                    aria-required="true"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="form-desc" className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="form-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this form..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Filing Frequency & Deadline Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="form-freq" className="block text-sm font-medium mb-1.5">
                      Filing Frequency
                    </label>
                    <Select
                      id="form-freq"
                      value={form.filingFrequency}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          filingFrequency: e.target.value as FormData["filingFrequency"],
                        })
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                      <option value="semi_annual">Semi-Annual</option>
                      <option value="one_time">One-Time</option>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="form-deadline" className="block text-sm font-medium mb-1.5">
                      Deadline Day (1–31)
                    </label>
                    <Input
                      id="form-deadline"
                      type="number"
                      min={1}
                      max={31}
                      value={form.deadlineDay}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setForm({ ...form, deadlineDay: isNaN(v) ? 1 : Math.min(31, Math.max(1, v)) });
                      }}
                    />
                  </div>
                </div>

                {/* Deadline Month (for annually, semi-annual, one-time) */}
                {["annually", "semi_annual", "one_time"].includes(form.filingFrequency) && (
                  <div>
                    <label htmlFor="form-deadline-month" className="block text-sm font-medium mb-1.5">
                      Deadline Month
                    </label>
                    <Select
                      id="form-deadline-month"
                      value={String(form.deadlineMonthOffset)}
                      onChange={(e) =>
                        setForm({ ...form, deadlineMonthOffset: parseInt(e.target.value) })
                      }
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Required Fields</label>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Input
                      key={fieldInputKey}
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      onKeyDown={handleFieldKeyDown}
                      placeholder="Add a required field..."
                      className="flex-1"
                      aria-label="New field name"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addField}
                      disabled={!newField.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {form.requiredFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Required fields">
                      {form.requiredFields.map((field, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-sm"
                          role="listitem"
                        >
                          {field}
                          <button
                            onClick={() => removeField(i)}
                            className="p-0.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Remove ${field}`}
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No required fields added yet.</p>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-white rounded-b-xl">
                <Button variant="outline" onClick={closeModal} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  onClick={submitForm}
                  disabled={!form.name.trim() || isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="mr-1.5 animate-spin" />
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : editingId ? (
                    <>
                      <Pencil size={16} className="mr-1.5" /> Update
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-1.5" /> Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form list area */}
        <div className="rounded-xl border bg-card/50 p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-muted-foreground" />
            </div>
          ) : customForms.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No custom forms yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                Create your first custom form to define filing requirements and deadlines for your clients.
              </p>
              <Button onClick={openCreate}>
                <Plus size={16} className="mr-1.5" /> Create Your First Form
              </Button>
            </div>
          ) : (
            /* Form cards grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {customForms.map((cf) => (
                <Card
                  key={cf.id}
                  className="card-hover border-border/60 overflow-hidden group"
                >
                  <CardContent className="p-0">
                    {/* Top colored accent bar */}
                    <div className="h-1 bg-gradient-to-r from-primary/40 to-primary/10" />

                    <div className="p-5">
                      {/* Header row: name + actions */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0 mt-0.5">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base leading-tight truncate">
                              {cf.name}
                            </h3>
                            {cf.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {cf.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(cf)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Edit ${cf.name}`}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {deleteConfirm === cf.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(cf.id)}
                                className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Confirm delete ${cf.name}`}
                                title="Confirm delete"
                              >
                                <AlertCircle size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Cancel delete"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(cf.id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Delete ${cf.name}`}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <Badge variant="info" className="text-[11px] px-2 py-0.5 font-medium">
                          <CalendarDays size={11} className="mr-1 inline" />
                          {FREQ_LABELS[cf.filingFrequency] || cf.filingFrequency}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-medium">
                          {["annually", "semi_annual", "one_time"].includes(cf.filingFrequency) && cf.deadlineMonthOffset
                            ? `${MONTHS[cf.deadlineMonthOffset - 1]} ${cf.deadlineDay || 15}`
                            : `Due day ${cf.deadlineDay || 15}`}
                        </Badge>
                      </div>

                      {/* Required fields badges */}
                      {cf.requiredFields && cf.requiredFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {cf.requiredFields.map((field: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 bg-muted/50"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Creator info */}
                      <div className="flex items-center gap-3 pt-2.5 border-t border-border/40 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User size={11} className="shrink-0" />
                          {cf.creatorName || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="shrink-0" />
                          {new Date(cf.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
