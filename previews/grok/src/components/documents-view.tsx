import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  Copy,
  Download,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Paper } from "@/components/paper";
import { cn } from "@/lib/cn";
import {
  DOC_LABEL,
  STATUSES,
  lineAmount,
  longDate,
  money,
  totals,
  useStore,
  type Doc,
  type DocStatus,
  type DocType,
  type Line,
} from "@/lib/invoice-store";

const FILTERS: { id: DocType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoices" },
  { id: "receipt", label: "Receipts" },
  { id: "estimate", label: "Estimates" },
  { id: "quotation", label: "Quotations" },
];

const METHODS = ["Bank transfer", "Cash", "Card", "Mobile money", "Other"];

export function DocumentActions() {
  const hasDoc = useStore((state) => state.documents.some((doc) => doc.id === state.activeDocId));
  const touch = useStore((state) => state.touch);
  const askExport = useStore((state) => state.askExport);

  return (
    <div className="ml-auto hidden items-center gap-2 md:flex">
      <NewMenu />
      <Button
        onClick={() => {
          touch();
          toast.success("Saved on this device");
        }}
      >
        <Save className="size-4" />
        Save
      </Button>
      <Button variant="primary" disabled={!hasDoc} onClick={() => askExport()}>
        <Download className="size-4" />
        Export PDF
      </Button>
    </div>
  );
}

export function DocumentsView() {
  const documents = useStore((state) => state.documents);
  const activeDocId = useStore((state) => state.activeDocId);
  const pane = useStore((state) => state.pane);
  const filter = useStore((state) => state.filter);
  const query = useStore((state) => state.query);
  const currency = useStore((state) => state.business.currency);
  const setPane = useStore((state) => state.setPane);
  const setFilter = useStore((state) => state.setFilter);
  const setQuery = useStore((state) => state.setQuery);
  const selectDoc = useStore((state) => state.selectDoc);
  const doc = documents.find((item) => item.id === activeDocId) ?? null;

  const filtered = documents.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const hay = [item.number, item.billTo.name, item.billTo.email, item.notes, item.status]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div role="tablist" aria-label="Document types" className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-elevated px-3 py-2">
        {FILTERS.map((item) => <button key={item.id} role="tab" type="button" aria-selected={filter === item.id} onClick={() => { setFilter(item.id); setPane("list"); }} className={cn("h-11 shrink-0 rounded-full px-3 text-sm", filter === item.id ? "bg-primary text-on-primary" : "bg-surface text-muted")}>{item.label}</button>)}
      </div>
      <div data-pane={pane} className="flex min-h-0 min-w-0 flex-1">
      <section className="list-pane" aria-label="Documents">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search documents</span>
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="field pl-9"
            />
          </label>
          <div className="md:hidden">
            <NewMenu />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">No documents in this view.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((item) => {
                const figures = totals(item);
                const active = item.id === activeDocId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectDoc(item.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left",
                        active ? "bg-primary/15" : "hover:bg-surface",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{item.number}</span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {money(figures.total, currency)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2 text-xs text-muted">
                        <span className="truncate">{item.billTo.name || "No client"}</span>
                        <span className={statusTone(item.status)}>{item.status}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="editor-pane" aria-label="Document editor">
        {doc ? (
          <Editor doc={doc} onShowList={() => setPane("list")} />
        ) : (
          <EmptyState onShowList={() => setPane("list")} />
        )}
      </section>
      </div>
    </div>
  );
}

function EmptyState({ onShowList }: { onShowList: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-4 px-6">
      <h1 className="font-display text-3xl font-semibold">No document open</h1>
      <p className="max-w-md text-sm text-muted">
        Create an invoice, quote, estimate, or receipt. It stays in this browser until you export it.
      </p>
      <div className="flex flex-wrap gap-2">
        <NewMenu />
        <Button variant="quiet" className="xl:hidden" onClick={onShowList}>
          All documents
        </Button>
      </div>
    </div>
  );
}

function Editor({ doc, onShowList }: { doc: Doc; onShowList: () => void }) {
  const business = useStore((state) => state.business);
  const clients = useStore((state) => state.clients);
  const items = useStore((state) => state.items);
  const updateBusiness = useStore((state) => state.updateBusiness);
  const updateDoc = useStore((state) => state.updateDoc);
  const updateBillTo = useStore((state) => state.updateBillTo);
  const setDocType = useStore((state) => state.setDocType);
  const applyClient = useStore((state) => state.applyClient);
  const saveBillAsClient = useStore((state) => state.saveBillAsClient);
  const addLine = useStore((state) => state.addLine);
  const addLineFromItem = useStore((state) => state.addLineFromItem);
  const updateLine = useStore((state) => state.updateLine);
  const removeLine = useStore((state) => state.removeLine);
  const addPayment = useStore((state) => state.addPayment);
  const removePayment = useStore((state) => state.removePayment);
  const duplicateDoc = useStore((state) => state.duplicateDoc);
  const deleteDoc = useStore((state) => state.deleteDoc);
  const touch = useStore((state) => state.touch);
  const exportTick = useStore((state) => state.exportTick);
  const seenExport = useRef(exportTick);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const figures = totals(doc);
  const dueLabel =
    doc.type === "quotation" || doc.type === "estimate"
      ? "Valid until"
      : doc.type === "receipt"
        ? "Paid on"
        : "Due Date";
  const dateLabel = doc.type === "receipt" ? "Receipt Date" : doc.type === "invoice" ? "Invoice Date" : "Issue Date";

  useEffect(() => {
    if (exportTick === seenExport.current) return;
    seenExport.current = exportTick;
    setPreview(true);
  }, [exportTick]);

  useEffect(() => {
    if (!preview) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  function save() {
    touch();
    toast.success("Saved on this device");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 xl:hidden">
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-raised hover:text-fg"
        >
          <ChevronLeft className="size-4" />
          Documents
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold">{DOC_LABEL[doc.type]}</h1>
            <label className="rounded-md border border-line bg-surface px-2">
              <span className="sr-only">Document number</span>
              <input
                value={doc.number}
                onChange={(event) => updateDoc(doc.id, { number: event.target.value })}
                className="quiet-input w-40 text-sm"
                aria-label="Document number"
              />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select
                value={doc.status}
                onChange={(event) => updateDoc(doc.id, { status: event.target.value as DocStatus })}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-semibold",
                  statusChip(doc.status),
                )}
              >
                {STATUSES[doc.type].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <label className="text-sm text-muted">
                <span className="sr-only">Document type</span>
                <select
                  value={doc.type}
                  onChange={(event) => setDocType(doc.id, event.target.value as DocType)}
                  className="quiet-input"
                >
                  {(Object.keys(DOC_LABEL) as DocType[]).map((type) => (
                    <option key={type} value={type}>
                      {DOC_LABEL[type]}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  duplicateDoc(doc.id);
                  toast.success("Copy created");
                }}
              >
                <Copy className="size-4" />
                Duplicate
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card title="From:">
              <Quiet
                label="Business name"
                value={business.name}
                onChange={(value) => updateBusiness({ name: value })}
                className="text-base font-medium"
              />
              <Quiet
                label="Street"
                value={business.address}
                onChange={(value) => updateBusiness({ address: value })}
              />
              <Quiet
                label="City"
                value={business.cityLine}
                onChange={(value) => updateBusiness({ cityLine: value })}
              />
              <Quiet
                label="Email"
                value={business.email}
                onChange={(value) => updateBusiness({ email: value })}
              />
              <Quiet
                label="Website"
                value={business.website}
                onChange={(value) => updateBusiness({ website: value })}
              />
            </Card>
            <Card title="To:">
              <label className="mb-1 block">
                <span className="sr-only">Saved client</span>
                <select
                  value={doc.clientId ?? ""}
                  onChange={(event) => {
                    if (event.target.value) applyClient(doc.id, event.target.value);
                  }}
                  className="quiet-input text-sm text-muted"
                >
                  <option value="">Choose a saved client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name || "Untitled client"}
                    </option>
                  ))}
                </select>
              </label>
              <Quiet
                label="Client name"
                value={doc.billTo.name}
                onChange={(value) => updateBillTo(doc.id, { name: value })}
                className="text-base font-medium"
              />
              <Quiet
                label="Street"
                value={doc.billTo.address}
                onChange={(value) => updateBillTo(doc.id, { address: value })}
              />
              <Quiet
                label="City"
                value={doc.billTo.cityLine}
                onChange={(value) => updateBillTo(doc.id, { cityLine: value })}
              />
              <Quiet
                label="Email"
                value={doc.billTo.email}
                onChange={(value) => updateBillTo(doc.id, { email: value })}
              />
              <Quiet
                label="Phone"
                value={doc.billTo.phone}
                onChange={(value) => updateBillTo(doc.id, { phone: value })}
              />
              <button
                type="button"
                className="mt-1 px-1 text-left text-xs text-primary"
                onClick={() => {
                  saveBillAsClient(doc.id);
                  toast.success("Client saved");
                }}
              >
                Save as new client
              </button>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <DateCard
              label={dateLabel}
              value={doc.issueDate}
              onChange={(value) => updateDoc(doc.id, { issueDate: value })}
            />
            <DateCard
              label={dueLabel}
              value={doc.dueDate}
              onChange={(value) => updateDoc(doc.id, { dueDate: value })}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="hidden grid-cols-12 gap-2 px-3 py-3 text-sm text-muted md:grid">
              <span className="col-span-3">Item</span>
              <span className="col-span-4">Description</span>
              <span className="col-span-1 text-right">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            <ul className="flex flex-col gap-2 p-3 md:gap-0 md:p-0">
              {doc.lines.map((line) => (
                <LineEditor
                  key={line.id}
                  line={line}
                  currency={business.currency}
                  onChange={(patch) => updateLine(doc.id, line.id, patch)}
                  onRemove={() => removeLine(doc.id, line.id)}
                />
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-line p-3 sm:flex-row sm:items-center">
              <Button variant="quiet" onClick={() => addLine(doc.id)}>
                <Plus className="size-4" />
                Add line
              </Button>
              <label className="min-w-0 sm:ml-auto">
                <span className="sr-only">Add from catalog</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) addLineFromItem(doc.id, event.target.value);
                  }}
                  className="field"
                >
                  <option value="">Add from catalog</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {money(item.price, business.currency)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end border-t border-line px-4 py-4">
              <div className="w-full max-w-xs text-sm">
                <TotalRow label="Subtotal" value={money(figures.subtotal, business.currency)} />
                <p className="flex items-center justify-between py-1 text-muted">
                  <span className="flex items-center gap-2">
                    Tax
                    <input
                      type="number"
                      inputMode="decimal"
                      value={doc.taxRate}
                      onChange={(event) =>
                        updateDoc(doc.id, { taxRate: Number(event.target.value) || 0 })
                      }
                      className="quiet-input w-16 text-right tabular-nums"
                      aria-label="Tax percent"
                    />
                    <span>%</span>
                  </span>
                  <span className="tabular-nums text-fg">{money(figures.tax, business.currency)}</span>
                </p>
                <p className="mt-1 flex items-baseline justify-between border-t border-line pt-2 font-display text-xl font-semibold text-primary">
                  <span>Total</span>
                  <span className="tabular-nums">{money(figures.total, business.currency)}</span>
                </p>
                {doc.payments.length > 0 ? (
                  <>
                    <TotalRow label="Paid" value={money(figures.paid, business.currency)} />
                    <TotalRow label="Balance" value={money(figures.balance, business.currency)} />
                  </>
                ) : null}
              </div>
            </div>
          </section>

          {doc.type === "invoice" || doc.type === "receipt" ? (
            <section className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm text-muted">Payments</h2>
                <Button variant="quiet" size="sm" onClick={() => setPayOpen((open) => !open)}>
                  Record payment
                </Button>
              </div>
              {doc.payments.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No payments yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {doc.payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {longDate(payment.date)} · {payment.method}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </span>
                      <span className="flex items-center gap-2 tabular-nums">
                        {money(payment.amount, business.currency)}
                        <button
                          type="button"
                          className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
                          aria-label="Remove payment"
                          onClick={() => removePayment(doc.id, payment.id)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {figures.balance <= 0 && doc.payments.length > 0 ? (
                <p className="mt-2 text-sm text-success">Paid in full.</p>
              ) : null}
              {payOpen ? (
                <PaymentForm
                  balance={Math.max(figures.balance, 0)}
                  onSave={(payment) => {
                    addPayment(doc.id, payment);
                    setPayOpen(false);
                    toast.success("Payment recorded");
                  }}
                />
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-line bg-surface p-4">
            <label className="block">
              <span className="text-sm text-muted">Notes / Terms</span>
              <textarea
                value={doc.notes}
                onChange={(event) => updateDoc(doc.id, { notes: event.target.value })}
                rows={3}
                className="quiet-input mt-2"
              />
            </label>
          </section>
          <p className="pb-2 text-xs text-muted">
            Saved on this device. No cloud sync. Download a backup to keep a separate copy.
          </p>
        </div>
      </div>

      <div role="toolbar" aria-label="Document actions" className="document-actions flex gap-2 border-t border-line bg-elevated p-3 md:hidden">
        <NewMenu drop="up" />
        <Button className="flex-1" onClick={save}>
          <Save className="size-4" />
          Save
        </Button>
        <Button className="flex-1" variant="primary" onClick={() => setPreview(true)}>
          <Download className="size-4" />
          PDF
        </Button>
      </div>

      {confirmDelete ? (
        <DeleteDialog
          label={`${DOC_LABEL[doc.type]} ${doc.number}`}
          onCancel={() => setConfirmDelete(false)}
          onDelete={() => {
            deleteDoc(doc.id);
            setConfirmDelete(false);
            toast.success("Document deleted");
          }}
        />
      ) : null}
      {preview
        ? createPortal(
            <div className="paper-stage">
              <div className="no-print flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
                <p className="text-sm text-muted">PDF preview</p>
                <div className="flex gap-2">
                  <Button onClick={() => setPreview(false)}>Close</Button>
                  <Button variant="primary" onClick={() => window.print()}>
                    <Download className="size-4" />
                    Save as PDF
                  </Button>
                </div>
              </div>
              <div className="paper-scroll">
                <div className="relative z-10 mx-auto w-full max-w-3xl">
                  <Paper doc={doc} business={business} />
                  <p className="no-print mt-3 text-center text-xs text-muted">
                    In the print dialog, choose Save as PDF.
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function DeleteDialog({ label, onCancel, onDelete }: {
  label: string; onCancel: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); trigger?.focus(); };
  }, []);
  return createPortal(
    <dialog ref={ref} className="delete-dialog rounded-xl border border-line bg-elevated p-5 text-fg shadow-2xl"
      aria-labelledby="delete-title" aria-describedby="delete-description"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onCancel();
      }}>
      <h2 id="delete-title" className="font-display text-xl font-semibold">Delete {label}?</h2>
      <p id="delete-description" className="mt-2 text-sm text-muted">This removes only this document from this device. This cannot be undone.</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button autoFocus onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onDelete}>Delete</Button>
      </div>
    </dialog>, document.body,
  );
}

function PaymentForm({
  balance,
  onSave,
}: {
  balance: number;
  onSave: (payment: { amount: number; date: string; method: string; reference: string }) => void;
}) {
  const [amount, setAmount] = useState(balance || 0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState("");

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label>
        <span className="text-xs text-muted">Amount</span>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value) || 0)}
          className="field"
        />
      </label>
      <label>
        <span className="text-xs text-muted">Date</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field" />
      </label>
      <label>
        <span className="text-xs text-muted">Method</span>
        <select value={method} onChange={(event) => setMethod(event.target.value)} className="field">
          {METHODS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-xs text-muted">Reference</span>
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="field"
          placeholder="Optional"
        />
      </label>
      <Button
        variant="primary"
        className="sm:col-span-2"
        onClick={() => onSave({ amount, date, method, reference })}
      >
        Add payment
      </Button>
    </div>
  );
}

function LineEditor({
  line,
  currency,
  onChange,
  onRemove,
}: {
  line: Line;
  currency: string;
  onChange: (patch: Partial<Line>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-lg border border-line p-3 md:rounded-none md:border-0 md:border-t md:border-line md:px-3 md:py-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-center">
        <input
          value={line.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Item"
          aria-label="Item"
          className="quiet-input font-medium md:col-span-3"
        />
        <input
          value={line.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Description"
          aria-label="Description"
          className="quiet-input text-sm text-muted md:col-span-4"
        />
        <div className="grid grid-cols-3 gap-2 md:contents">
          <input
            type="number"
            inputMode="decimal"
            value={line.qty}
            onChange={(event) => onChange({ qty: Number(event.target.value) || 0 })}
            aria-label="Quantity"
            className="quiet-input text-right tabular-nums md:col-span-1"
          />
          <input
            type="number"
            inputMode="decimal"
            value={line.rate}
            onChange={(event) => onChange({ rate: Number(event.target.value) || 0 })}
            aria-label="Rate"
            className="quiet-input text-right tabular-nums md:col-span-2"
          />
          <span className="flex items-center justify-end gap-1 text-sm tabular-nums md:col-span-2">
            {money(lineAmount(line), currency)}
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${line.name || "line"}`}
              className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-2 text-sm text-muted">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Quiet({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      placeholder={label}
      className={cn("quiet-input text-sm", className)}
    />
  );
}

function DateCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="relative rounded-xl border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">{label}</h2>
      <p className="mt-2 font-display text-xl font-medium">{longDate(value)}</p>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </section>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between py-1 text-muted">
      <span>{label}</span>
      <span className="tabular-nums text-fg">{value}</span>
    </p>
  );
}

function NewMenu({ drop = "down" }: { drop?: "up" | "down" }) {
  const createDoc = useStore((state) => state.createDoc);
  const [open, setOpen] = useState(false);
  const filter = useStore((state) => state.filter);
  const types: DocType[] = ["invoice", "receipt", "estimate", "quotation"];
  if (filter !== "all") return <Button onClick={() => createDoc(filter)}><Plus className="size-4" />New {DOC_LABEL[filter]}</Button>;

  return (
    <div className={cn("relative", open && "z-40")}>
      <Button aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Plus className="size-4" />
        New
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="Close new menu"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 z-30 w-48 rounded-xl border border-line bg-surface p-1 shadow-xl",
              drop === "up" ? "bottom-full mb-2" : "mt-2",
            )}
          >
            {types.map((type) => (
              <button
                key={type}
                type="button"
                className="flex h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-surface-raised"
                onClick={() => {
                  createDoc(type);
                  setOpen(false);
                }}
              >
                {DOC_LABEL[type]}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function statusTone(status: DocStatus) {
  if (status === "overdue" || status === "void") return "text-danger";
  if (status === "sent" || status === "draft") return "text-warning";
  return "text-success";
}

function statusChip(status: DocStatus) {
  if (status === "overdue" || status === "void") return "bg-danger/15 text-danger";
  if (status === "sent" || status === "draft") return "bg-warning/15 text-warning";
  return "bg-success/15 text-success";
}
