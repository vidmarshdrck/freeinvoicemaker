import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import {
  CURRENCIES,
  snapshot,
  useStore,
  type BackupFile,
  type Business,
} from "@/lib/invoice-store";

export function SettingsView() {
  const business = useStore((state) => state.business);
  const updateBusiness = useStore((state) => state.updateBusiness);
  const cloudEmail = useStore((state) => state.cloudEmail);
  const setCloudEmail = useStore((state) => state.setCloudEmail);
  const replaceAll = useStore((state) => state.replaceAll);
  const resetDemo = useStore((state) => state.resetDemo);
  const documents = useStore((state) => state.documents);
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(cloudEmail ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<Business>) => updateBusiness(patch);

  function exportBackup() {
    const payload = {
      ...snapshot(useStore.getState()),
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "free-invoice-maker-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as BackupFile;
        if (!data.business || !Array.isArray(data.documents)) {
          throw new Error("bad backup");
        }
        replaceAll(data);
        toast.success("Backup restored on this device");
      } catch {
        toast.error("That file is not a Free Invoice Maker backup");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            {documents.length} document{documents.length === 1 ? "" : "s"} on this device.
          </p>
        </div>

        <section className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <h2 className="font-display text-lg font-semibold sm:col-span-2">Your business</h2>
          <Field label="Name">
            <input className="field" value={business.name} onChange={(event) => set({ name: event.target.value })} />
          </Field>
          <Field label="Email">
            <input className="field" value={business.email} onChange={(event) => set({ email: event.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="field" value={business.phone} onChange={(event) => set({ phone: event.target.value })} />
          </Field>
          <Field label="Website">
            <input
              className="field"
              value={business.website}
              onChange={(event) => set({ website: event.target.value })}
            />
          </Field>
          <Field label="Street">
            <input
              className="field"
              value={business.address}
              onChange={(event) => set({ address: event.target.value })}
            />
          </Field>
          <Field label="City">
            <input
              className="field"
              value={business.cityLine}
              onChange={(event) => set({ cityLine: event.target.value })}
            />
          </Field>
          <Field label="Tax number">
            <input
              className="field"
              value={business.taxNumber}
              onChange={(event) => set({ taxNumber: event.target.value })}
            />
          </Field>
        </section>

        <section className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <h2 className="font-display text-lg font-semibold sm:col-span-2">Defaults</h2>
          <Field label="Currency">
            <select
              className="field"
              value={business.currency}
              onChange={(event) => set({ currency: event.target.value })}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default tax %">
            <input
              className="field"
              type="number"
              value={business.defaultTax}
              onChange={(event) => set({ defaultTax: Number(event.target.value) || 0 })}
            />
          </Field>
          <Field label="Invoice prefix">
            <input
              className="field"
              value={business.invoicePrefix}
              onChange={(event) => set({ invoicePrefix: event.target.value.toUpperCase() })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Default note">
              <textarea
                className="field"
                rows={3}
                value={business.defaultNotes}
                onChange={(event) => set({ defaultNotes: event.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Payment instructions">
              <textarea
                className="field"
                rows={3}
                value={business.paymentInfo}
                onChange={(event) => set({ paymentInfo: event.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-muted sm:col-span-2">
            Currency applies to every document in this workspace. Tax and the note apply to new documents.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Backup</h2>
          <p className="text-sm text-muted">
            Export a JSON file and keep it wherever you like. Import replaces what is on this device.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportBackup}>
              Download backup
            </Button>
            <Button onClick={() => fileRef.current?.click()}>Import backup</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importBackup(file);
                event.target.value = "";
              }}
            />
          </div>
          {confirmReset ? (
            <Button
              variant="danger"
              className="self-start"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast.success("Demo workspace restored");
              }}
            >
              Confirm reset
            </Button>
          ) : (
            <Button variant="quiet" className="self-start" onClick={() => setConfirmReset(true)}>
              Reset to the demo workspace
            </Button>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Cloud backup</h2>
          <p className="mt-2 text-sm text-muted">
            Free Invoice Maker does not upload your invoices. A paid plan, hosted by the project owner, can
            keep a copy if this device is lost. There is no checkout here yet.
          </p>
          {cloudEmail ? (
            <p className="mt-3 text-sm text-success">Waitlist saved on this device for {cloudEmail}.</p>
          ) : (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.includes("@")) {
                  toast.error("Enter a real email");
                  return;
                }
                setCloudEmail(email.trim());
                toast.success("Saved on this device");
              }}
            >
              <input
                className="field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@studio.com"
                aria-label="Email for cloud waitlist"
              />
              <Button type="submit" variant="primary">
                Join waitlist
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
