import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { money, useStore, type CatalogItem } from "@/lib/invoice-store";

export function ItemsView() {
  const items = useStore((state) => state.items);
  const currency = useStore((state) => state.business.currency);
  const createItem = useStore((state) => state.createItem);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    price: 0,
    unit: "each",
    kind: "service" as CatalogItem["kind"],
  });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl font-semibold">Items</h1>
          <p className="mt-1 text-sm text-muted">
            Services and products you bill more than once. Adding one to an invoice copies the price.
          </p>
        </div>
        <form
          className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.name.trim()) return;
            createItem(draft);
            setDraft({ name: "", description: "", price: 0, unit: "each", kind: "service" });
          }}
        >
          <Field label="Name">
            <input
              className="field"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
            />
          </Field>
          <Field label="Price">
            <input
              className="field"
              type="number"
              inputMode="decimal"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) || 0 })}
            />
          </Field>
          <Field label="Description">
            <input
              className="field"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit">
              <input
                className="field"
                value={draft.unit}
                onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
              />
            </Field>
            <Field label="Type">
              <select
                className="field"
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as CatalogItem["kind"] })
                }
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </Field>
          </div>
          <Button type="submit" variant="primary" className="sm:col-span-2">
            Add item
          </Button>
        </form>
        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="text-sm text-muted">Your catalog is empty.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="field"
                    aria-label="Item name"
                    value={item.name}
                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                  />
                  <input
                    className="field"
                    aria-label="Price"
                    type="number"
                    value={item.price}
                    onChange={(event) => updateItem(item.id, { price: Number(event.target.value) || 0 })}
                  />
                  <input
                    className="field sm:col-span-2"
                    aria-label="Description"
                    value={item.description}
                    onChange={(event) => updateItem(item.id, { description: event.target.value })}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted">
                  <span>
                    {item.kind} · {item.unit} · {money(item.price, currency)}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
