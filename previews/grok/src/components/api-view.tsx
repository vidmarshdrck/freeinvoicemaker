import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { snapshot, useStore } from "@/lib/invoice-store";

export function ApiView() {
  const keys = useStore((state) => state.apiKeys);
  const createApiKey = useStore((state) => state.createApiKey);
  const revokeApiKey = useStore((state) => state.revokeApiKey);
  const documents = useStore((state) => state.documents);
  const [name, setName] = useState("Laptop agent");
  const sample = keys[0]?.token ?? "fim_your_key";
  const invoice = documents.find((doc) => doc.type === "invoice") ?? documents[0];

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  const example = `curl http://127.0.0.1:8000/api/v1/invoices \\
  -H "Authorization: Bearer ${sample}"`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">API</h1>
          <p className="mt-2 text-sm text-muted">
            Built for agents that run next to your files. This preview keeps documents in the browser, so a key
            made here is not a live server token. On the self-hosted app, agents call your machine at
            /api/v1. Nothing is sent to a shared cloud.
          </p>
        </div>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Keys on this device</h2>
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              createApiKey(name);
              toast.success("Key stored on this device");
            }}
          >
            <input
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Key name"
            />
            <Button type="submit" variant="primary">
              Create key
            </Button>
          </form>
          <ul className="mt-4 flex flex-col gap-3">
            {keys.length === 0 ? (
              <li className="text-sm text-muted">No keys yet.</li>
            ) : (
              keys.map((key) => (
                <li key={key.id} className="rounded-lg border border-line bg-bg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="mt-1 truncate font-mono text-xs text-muted">{key.token}</p>
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        className="inline-flex size-11 items-center justify-center text-muted hover:text-fg"
                        aria-label="Copy key"
                        onClick={() => void copy(key.token)}
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
                        aria-label="Revoke key"
                        onClick={() => revokeApiKey(key.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Example</h2>
            <Button variant="quiet" size="sm" onClick={() => void copy(example)}>
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-muted">{example}</pre>
          <p className="mt-3 text-sm text-muted">
            Same shape for customers, products, and payments. Open /api/docs when the desktop or self-hosted
            app is running.
            {invoice ? ` Your latest invoice number here is ${invoice.number}.` : ""}
          </p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Workspace JSON</h2>
          <p className="mt-2 text-sm text-muted">
            Hand this file to an agent on the same machine. It is the backup, not a network call.
          </p>
          <Button
            className="mt-3"
            onClick={() => {
              void copy(JSON.stringify(snapshot(useStore.getState()), null, 2));
            }}
          >
            <Copy className="size-4" />
            Copy workspace JSON
          </Button>
        </section>
      </div>
    </div>
  );
}
