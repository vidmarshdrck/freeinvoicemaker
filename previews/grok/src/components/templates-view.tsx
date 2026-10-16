import { TEMPLATES, useStore, type TemplateId } from "@/lib/invoice-store";
import { cn } from "@/lib/cn";

export function TemplatesView() {
  const current = useStore((state) => state.defaultTemplate);
  const setTemplate = useStore((state) => state.setTemplate);
  const active = useStore((state) => state.documents.find((doc) => doc.id === state.activeDocId));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">Templates</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Templates change the PDF, not this dark editor.
            {active ? ` Open document: ${active.number}.` : " Open a document to apply one."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplate(template.id)}
              className={cn(
                "rounded-xl border p-3 text-left",
                current === template.id ? "border-primary bg-primary/10" : "border-line bg-surface",
              )}
            >
              <Mini template={template.id} />
              <p className="mt-3 font-medium">{template.name}</p>
              <p className="mt-1 text-sm text-muted">{template.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ template }: { template: TemplateId }) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-paper text-ink">
      <div className={cn("px-3 py-3", template === "signal" && "bg-primary text-on-primary")}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Acme Studio</span>
          {template === "ledger" ? <span className="h-4 w-1 rounded bg-primary" /> : null}
        </div>
      </div>
      <div className="space-y-2 px-3 py-3">
        <div className="h-2 w-2/3 rounded bg-rule" />
        <div className="h-2 w-1/2 rounded bg-rule" />
        <div className="h-2 w-5/6 rounded bg-rule" />
        <p className={cn("pt-2 text-right text-xs font-semibold", template === "paper" ? "text-ink" : "text-primary-strong")}>
          $7,161.00
        </p>
      </div>
    </div>
  );
}
