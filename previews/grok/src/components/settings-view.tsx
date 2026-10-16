import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import {
  CURRENCIES,
  snapshot,
  safeFilePart,
  useStore,
  type BackupFile,
  type Business,
} from "@/lib/invoice-store";

export function SettingsView() {
  const business = useStore((state) => state.business);
  const profiles = useStore((state) => state.profiles);
  const currentId = useStore((state) => state.currentBusinessId);
  const switchBusiness = useStore((state) => state.switchBusiness);
  const addBusiness = useStore((state) => state.addBusiness);
  const updateBusiness = useStore((state) => state.updateBusiness);
  const cloudEmail = useStore((state) => state.cloudEmail);
  const setCloudEmail = useStore((state) => state.setCloudEmail);
  const replaceAll = useStore((state) => state.replaceAll);
  const resetDemo = useStore((state) => state.resetDemo);
  const documents = useStore((state) => state.documents);
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(cloudEmail ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [logoError, setLogoError] = useState("");
  const set = (patch: Partial<Business>) => updateBusiness(patch);
  const legacyBackup = localStorage.getItem("fim-grok-preview-legacy-backup-v1");
  function downloadLegacy() {
    if (!legacyBackup) return;
    const url = URL.createObjectURL(new Blob([legacyBackup], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url;
    link.download = "free-invoice-maker-pre-upgrade-backup.json"; link.click(); URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const payload = {
      ...snapshot(useStore.getState()),
      version: 2,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `free-invoice-maker-backup_${safeFilePart(business.name, "Business")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const data = (parsed.state ?? parsed) as BackupFile;
        if (!data.business || typeof data.business.name !== "string" || !Array.isArray(data.documents)) {
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
          <div className="sm:col-span-2">
            <Field label="Current business">
              <select aria-label="Current business" className="field" value={currentId} onChange={event => switchBusiness(event.target.value)}>
                {Object.entries({ ...profiles, [currentId]: { business } }).map(([id, profile]) =>
                  <option key={id} value={id}>{profile.business.name || "Untitled business"}</option>)}
              </select>
            </Field>
            <Button className="mt-3" onClick={addBusiness}>Add business</Button>
            <p className="mt-3 text-xs text-muted">Documents, clients, items and defaults are separate for each business. Profile edits apply to new documents; existing documents retain their issuer snapshot. Saved only in this browser, subject to device storage limits. No cloud sync.</p>
          </div>
          <h2 className="font-display text-lg font-semibold sm:col-span-2">Your business</h2>
          <Field label="Name">
            <input className="field" value={business.name} onChange={(event) => set({ name: event.target.value })} />
          </Field>
          <Field label="Legal name (if different)">
            <input className="field" value={business.legalName ?? ""} onChange={event => set({ legalName: event.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Logo image">
              <input className="field pt-2" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
                const file = event.target.files?.[0]; event.target.value = "";
                if (!file) return;
                if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 200 * 1024) {
                  setLogoError("Choose a PNG, JPEG or WebP image under 200 KB."); return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const image = new Image();
                  image.onload = () => { if (useStore.getState().currentBusinessId !== currentId) return; set({ logo: String(reader.result) }); setLogoError(""); };
                  image.onerror = () => setLogoError("This image could not be read.");
                  image.src = String(reader.result);
                };
                reader.readAsDataURL(file);
              }} />
            </Field>
            {logoError ? <p role="alert" className="mt-2 text-sm text-danger">{logoError}</p> : null}
            {business.logo && /^data:image\/(png|jpeg|webp);base64,/.test(business.logo) ? <div className="mt-3 flex items-center gap-3"><img src={business.logo} alt="Business logo" className="h-14 max-w-40 object-contain" /><Button onClick={() => set({ logo: undefined })}>Remove logo</Button></div> : null}
          </div>
          <Field label="Email">
            <input className="field" value={business.email} onChange={(event) => set({ email: event.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="field" placeholder="Optional" value={business.phone} onChange={(event) => set({ phone: event.target.value })} />
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
              placeholder="Optional"
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
            Defaults apply to new documents for the current business. Existing documents retain their currency and issuer.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Backup</h2>
          <p className="text-sm text-muted">
            Export the current business only. Import replaces only the current business; other businesses are unchanged. Keep a backup for each business.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportBackup}>
              Download backup
            </Button>
            <Button onClick={() => fileRef.current?.click()}>Import backup</Button>
            {legacyBackup ? <Button onClick={downloadLegacy}>Download pre-upgrade backup</Button> : null}
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
                toast.success("Sample workspace restored");
              }}
            >
              Confirm reset
            </Button>
          ) : (
            <Button variant="quiet" className="self-start" onClick={() => setConfirmReset(true)}>
              Reset to sample workspace
            </Button>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">Cloud backup</h2>
          <p className="mt-2 text-sm text-muted">
            Cloud sync is not connected. Download a backup to keep a separate copy.
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
