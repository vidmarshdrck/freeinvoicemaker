import { useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { cn } from "@/lib/cn";
import { useStore, type Client } from "@/lib/invoice-store";

export function ClientsView() {
  const clients = useStore((state) => state.clients);
  const activeClientId = useStore((state) => state.activeClientId);
  const selectClient = useStore((state) => state.selectClient);
  const createClient = useStore((state) => state.createClient);
  const [mobileForm, setMobileForm] = useState(false);
  const client = clients.find((item) => item.id === activeClientId) ?? null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
      <section className={cn("min-h-0 flex-col border-line lg:flex lg:w-72 lg:border-r", mobileForm ? "hidden lg:flex" : "flex")}>
        <div className="flex items-center justify-between gap-2 border-b border-line p-4">
          <h1 className="font-display text-xl font-semibold">Clients</h1>
          <Button
            variant="primary"
            onClick={() => {
              createClient();
              setMobileForm(true);
            }}
          >
            Add
          </Button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {clients.length === 0 ? (
            <li className="px-3 py-6 text-sm text-muted">No clients yet.</li>
          ) : (
            clients.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectClient(item.id);
                    setMobileForm(true);
                  }}
                  className={cn(
                    "flex h-14 w-full flex-col justify-center rounded-lg px-3 text-left",
                    item.id === activeClientId ? "bg-primary/15" : "hover:bg-surface",
                  )}
                >
                  <span className="truncate text-sm font-medium">{item.name || "Untitled client"}</span>
                  <span className="truncate text-xs text-muted">{item.email || item.cityLine || "No email"}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
      <section className={cn("min-h-0 flex-1 overflow-y-auto p-4 md:p-8", mobileForm ? "block" : "hidden lg:block")}>
        {client ? (
          <ClientForm client={client} onBack={() => setMobileForm(false)} />
        ) : (
          <p className="text-sm text-muted">Select a client or add one.</p>
        )}
      </section>
    </div>
  );
}

function ClientForm({ client, onBack }: { client: Client; onBack: () => void }) {
  const updateClient = useStore((state) => state.updateClient);
  const deleteClient = useStore((state) => state.deleteClient);
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Client>) => updateClient(client.id, patch);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center gap-1 text-sm text-muted lg:hidden"
      >
        <ChevronLeft className="size-4" />
        All clients
      </button>
      <h2 className="font-display text-2xl font-semibold">{client.name || "New client"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input className="field" value={client.name} onChange={(event) => set({ name: event.target.value })} />
        </Field>
        <Field label="Email">
          <input className="field" value={client.email} onChange={(event) => set({ email: event.target.value })} />
        </Field>
        <Field label="Phone">
          <input className="field" value={client.phone} onChange={(event) => set({ phone: event.target.value })} />
        </Field>
        <Field label="Tax number">
          <input
            className="field"
            value={client.taxNumber}
            onChange={(event) => set({ taxNumber: event.target.value })}
          />
        </Field>
        <Field label="Street">
          <input className="field" value={client.address} onChange={(event) => set({ address: event.target.value })} />
        </Field>
        <Field label="City">
          <input
            className="field"
            value={client.cityLine}
            onChange={(event) => set({ cityLine: event.target.value })}
          />
        </Field>
        <Field label="Country">
          <input className="field" value={client.country} onChange={(event) => set({ country: event.target.value })} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          className="field"
          rows={3}
          value={client.notes}
          onChange={(event) => set({ notes: event.target.value })}
        />
      </Field>
      {confirm ? (
        <Button
          variant="danger"
          onClick={() => {
            deleteClient(client.id);
            toast.success("Client removed");
            onBack();
          }}
        >
          Confirm delete
        </Button>
      ) : (
        <Button variant="quiet" className="self-start" onClick={() => setConfirm(true)}>
          <Trash2 className="size-4" />
          Delete client
        </Button>
      )}
    </div>
  );
}
