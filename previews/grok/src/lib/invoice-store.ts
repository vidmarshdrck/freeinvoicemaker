import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DocType = "invoice" | "quotation" | "estimate" | "receipt";
export type DocStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "accepted"
  | "issued"
  | "void";
export type TemplateId = "ledger" | "paper" | "signal";
export type ViewId = "summaries" | "documents" | "clients" | "items" | "templates" | "settings" | "api";
export type Pane = "list" | "editor";

export interface Business {
  legalName?: string;
  logo?: string;
  name: string;
  address: string;
  cityLine: string;
  email: string;
  website: string;
  phone: string;
  currency: string;
  taxNumber: string;
  defaultTax: number;
  invoicePrefix: string;
  defaultNotes: string;
  paymentInfo: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  cityLine: string;
  country: string;
  email: string;
  phone: string;
  taxNumber: string;
  notes: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  kind: "service" | "product";
}

export interface Line {
  id: string;
  name: string;
  description: string;
  qty: number;
  rate: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
}

export interface BillTo {
  name: string;
  address: string;
  cityLine: string;
  email: string;
  phone: string;
}

export interface Doc {
  businessId?: string;
  issuer?: Business;
  id: string;
  type: DocType;
  number: string;
  status: DocStatus;
  clientId: string | null;
  billTo: BillTo;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  template: TemplateId;
  notes: string;
  lines: Line[];
  payments: Payment[];
}

export interface ApiKey {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface BackupFile {
  schemaVersion?: number;
  businessId?: string;
  usedNumbers?: string[];
  kind?: string;
  business?: Business;
  clients?: Client[];
  items?: CatalogItem[];
  documents?: Doc[];
  apiKeys?: ApiKey[];
  defaultTemplate?: TemplateId;
  cloudEmail?: string | null;
}

interface ProfileData {
  business: Business; clients: Client[]; items: CatalogItem[]; documents: Doc[];
  apiKeys: ApiKey[]; defaultTemplate: TemplateId; cloudEmail: string | null;
  usedNumbers: string[];
}

interface Workspace {
  currentBusinessId: string;
  profiles: Record<string, ProfileData>;
  usedNumbers: string[];
  business: Business;
  clients: Client[];
  items: CatalogItem[];
  documents: Doc[];
  apiKeys: ApiKey[];
  defaultTemplate: TemplateId;
  cloudEmail: string | null;
  view: ViewId;
  activeDocId: string | null;
  activeClientId: string | null;
  pane: Pane;
  filter: DocType | "all";
  query: string;
    revision: number;
}

interface Actions {
  addBusiness: () => void;
  switchBusiness: (id: string) => void;
  setView: (view: ViewId) => void;
  setPane: (pane: Pane) => void;
  setFilter: (filter: DocType | "all") => void;
  setQuery: (query: string) => void;
  selectDoc: (id: string) => void;
  selectClient: (id: string | null) => void;
  touch: () => void;
  updateBusiness: (patch: Partial<Business>) => void;
  updateDoc: (id: string, patch: Partial<Doc>) => void;
  updateBillTo: (id: string, patch: Partial<BillTo>) => void;
  applyClient: (docId: string, clientId: string) => void;
  saveBillAsClient: (docId: string) => void;
  addLine: (docId: string) => void;
  addLineFromItem: (docId: string, itemId: string) => void;
  updateLine: (docId: string, lineId: string, patch: Partial<Line>) => void;
  removeLine: (docId: string, lineId: string) => void;
  addPayment: (docId: string, payment: Omit<Payment, "id">) => void;
  removePayment: (docId: string, paymentId: string) => void;
  createDoc: (type: DocType) => void;
  duplicateDoc: (id: string) => void;
  deleteDoc: (id: string) => void;
  createClient: () => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  createItem: (item: Omit<CatalogItem, "id">) => void;
  updateItem: (id: string, patch: Partial<CatalogItem>) => void;
  deleteItem: (id: string) => void;
  setTemplate: (template: TemplateId) => void;
  createApiKey: (name: string) => void;
  revokeApiKey: (id: string) => void;
  setCloudEmail: (email: string) => void;
  replaceAll: (data: BackupFile) => void;
  resetDemo: () => void;
}

export type Store = Workspace & Actions;

export const CURRENCIES = ["USD", "ZMW", "ZAR", "EUR", "GBP", "KES", "NGN", "CAD", "AUD"] as const;

export const DOC_LABEL: Record<DocType, string> = {
  invoice: "Invoice",
  quotation: "Quotation",
  estimate: "Estimate",
  receipt: "Receipt",
};

export const STATUSES: Record<DocType, DocStatus[]> = {
  invoice: ["draft", "sent", "paid", "overdue", "void"],
  quotation: ["draft", "sent", "accepted", "void"],
  estimate: ["draft", "sent", "accepted", "void"],
  receipt: ["issued", "void"],
};

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  {
    id: "ledger",
    name: "Ledger",
    blurb: "Blue rule and a blue total. Same voice as the app.",
  },
  {
    id: "paper",
    name: "Classic",
    blurb: "Quiet black on white. The one you hand to a client.",
  },
  {
    id: "signal",
    name: "Signal",
    blurb: "Solid blue header with your business name.",
  },
];

const emptyBill = (): BillTo => ({
  name: "",
  address: "",
  cityLine: "",
  email: "",
  phone: "",
});

function billFromClient(client: Client): BillTo {
  return {
    name: client.name,
    address: client.address,
    cityLine: client.cityLine,
    email: client.email,
    phone: client.phone,
  };
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineAmount(line: Line) {
  return round2((Number(line.qty) || 0) * (Number(line.rate) || 0));
}

export function totals(doc: Doc) {
  const subtotal = round2(doc.lines.reduce((sum, line) => sum + lineAmount(line), 0));
  const tax = round2(subtotal * ((Number(doc.taxRate) || 0) / 100));
  const total = round2(subtotal + tax);
  const paid = round2(doc.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
  const balance = round2(total - paid);
  return { subtotal, tax, total, paid, balance };
}

export function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function safeFilePart(value: string, fallback = "Untitled") {
  const clean = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^[. -]+|[. -]+$/g, "");
  let part = "";
  for (const char of clean || fallback) {
    if (new TextEncoder().encode(part + char).length > 60 || Array.from(part).length >= 42) break;
    part += char;
  }
  part = part.replace(/[. -]+$/g, "") || fallback;
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part) ? `_${part}` : part;
}

export function documentFilename(doc: Doc, business: Business) {
  return `${DOC_LABEL[doc.type]}_${safeFilePart(doc.number)}_${safeFilePart((doc.issuer ?? business).name, "Business")}_to_${safeFilePart(doc.billTo.name, "Client")}`;
}

export function longDate(iso: string) {
  if (!iso) return "Set date";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function todayIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

function prefixFor(type: DocType, business: Business) {
  if (type === "invoice") return business.invoicePrefix.trim() || "INV";
  if (type === "quotation") return "QUO";
  if (type === "estimate") return "EST";
  return "RCT";
}

export function nextNumber(documents: Doc[], type: DocType, business: Business) {
  const year = new Date().getFullYear();
  const prefix = prefixFor(type, business);
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-${year}-(\\d+)$`);
  let max = 0;
  for (const doc of documents) {
    const match = doc.number.match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

function makeToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `fim_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

const businessSeed: Business = {
  name: "Acme Studio",
  address: "123 Design Street",
  cityLine: "San Francisco, CA 94107",
  email: "hello@acmestudio.dev",
  website: "acmestudio.dev",
  phone: "",
  currency: "USD",
  taxNumber: "",
  defaultTax: 8.5,
  invoicePrefix: "INV",
  defaultNotes: "Thank you for your business! Payment due within 14 days.",
  paymentInfo: "Bank transfer. Include the document number as the reference.",
};

const clientsSeed: Client[] = [
  {
    id: "client-pixel",
    name: "PixelPerfect Inc.",
    address: "456 Market Street, Suite 200",
    cityLine: "San Francisco, CA 94105",
    country: "United States",
    email: "billing@pixelperfect.dev",
    phone: "",
    taxNumber: "",
    notes: "",
  },
  {
    id: "client-north",
    name: "Northwind Labs",
    address: "18 Harbor Road",
    cityLine: "Lusaka",
    country: "Zambia",
    email: "accounts@northwind.example",
    phone: "",
    taxNumber: "",
    notes: "",
  },
];

const itemsSeed: CatalogItem[] = [
  {
    id: "item-ui",
    name: "UI/UX Design",
    description: "Landing page design & prototyping",
    price: 2400,
    unit: "project",
    kind: "service",
  },
  {
    id: "item-web",
    name: "Web Development",
    description: "Responsive development (React)",
    price: 3600,
    unit: "project",
    kind: "service",
  },
  {
    id: "item-rev",
    name: "Revisions",
    description: "Two rounds of revisions",
    price: 300,
    unit: "round",
    kind: "service",
  },
];

const documentsSeed: Doc[] = [
  {
    id: "doc-main",
    type: "invoice",
    number: "INV-2024-0015",
    status: "draft",
    clientId: "client-pixel",
    billTo: billFromClient(clientsSeed[0]),
    issueDate: "2024-05-24",
    dueDate: "2024-06-07",
    taxRate: 8.5,
    template: "ledger",
    notes: "Thank you for your business! Payment due within 14 days.",
    lines: [
      {
        id: "line-ui",
        name: "UI/UX Design",
        description: "Landing page design & prototyping",
        qty: 1,
        rate: 2400,
      },
      {
        id: "line-web",
        name: "Web Development",
        description: "Responsive development (React)",
        qty: 1,
        rate: 3600,
      },
      {
        id: "line-rev",
        name: "Revisions",
        description: "Two rounds of revisions",
        qty: 2,
        rate: 300,
      },
    ],
    payments: [],
  },
  {
    id: "doc-overdue",
    type: "invoice",
    number: "INV-2024-0012",
    status: "overdue",
    clientId: "client-north",
    billTo: billFromClient(clientsSeed[1]),
    issueDate: "2024-04-02",
    dueDate: "2024-04-16",
    taxRate: 8.5,
    template: "ledger",
    notes: "Please settle the outstanding balance.",
    lines: [
      {
        id: "line-brand",
        name: "Brand sprint",
        description: "Two-day working session",
        qty: 1,
        rate: 1800,
      },
    ],
    payments: [],
  },
  {
    id: "doc-quote",
    type: "quotation",
    number: "QUO-2024-0004",
    status: "sent",
    clientId: "client-pixel",
    billTo: billFromClient(clientsSeed[0]),
    issueDate: "2024-05-20",
    dueDate: "2024-06-20",
    taxRate: 8.5,
    template: "paper",
    notes: "Valid for 30 days.",
    lines: [
      {
        id: "line-system",
        name: "Design system",
        description: "Tokens, components, and documentation",
        qty: 1,
        rate: 4800,
      },
    ],
    payments: [],
  },
  {
    id: "doc-receipt",
    type: "receipt",
    number: "RCT-2024-0002",
    status: "issued",
    clientId: "client-pixel",
    billTo: billFromClient(clientsSeed[0]),
    issueDate: "2024-03-12",
    dueDate: "2024-03-12",
    taxRate: 0,
    template: "signal",
    notes: "Received with thanks.",
    lines: [
      {
        id: "line-workshop",
        name: "Workshop",
        description: "Half-day product workshop",
        qty: 1,
        rate: 900,
      },
    ],
    payments: [
      {
        id: "pay-workshop",
        amount: 900,
        date: "2024-03-12",
        method: "Bank transfer",
        reference: "TX-2041",
      },
    ],
  },
];

export function seedWorkspace(): Workspace {
  return {
    currentBusinessId: "business-default",
    profiles: {},
    usedNumbers: documentsSeed.map(doc => doc.number),
    business: { ...businessSeed },
    clients: clientsSeed,
    items: itemsSeed,
    documents: documentsSeed.map(doc => ({ ...doc, businessId: "business-default", issuer: { ...businessSeed } })),
    apiKeys: [],
    defaultTemplate: "ledger",
    cloudEmail: null,
    view: "documents",
    activeDocId: "doc-main",
    activeClientId: "client-pixel",
    pane: "editor",
    filter: "all",
    query: "",
    revision: 0,
  };
}

function mapDoc(documents: Doc[], id: string, updater: (doc: Doc) => Doc) {
  return documents.map((doc) => (doc.id === id ? updater(doc) : doc));
}

function profileData(state: Workspace): ProfileData {
  return { business: state.business, clients: state.clients, items: state.items,
    documents: state.documents, apiKeys: state.apiKeys, defaultTemplate: state.defaultTemplate,
    cloudEmail: state.cloudEmail, usedNumbers: state.usedNumbers };
}

function reservedDocuments(state: Workspace): Doc[] {
  return [...state.documents, ...state.usedNumbers.map(number => ({ number } as Doc))];
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...seedWorkspace(),
      addBusiness: () => {
        const state = get();
        const id = uid("business");
        const business: Business = { name: "New business", address: "", cityLine: "", email: "",
          website: "", phone: "", currency: "ZMW", taxNumber: "", defaultTax: 0,
          invoicePrefix: "INV", defaultNotes: "", paymentInfo: "" };
        set({ profiles: { ...state.profiles, [state.currentBusinessId]: profileData(state) },
          currentBusinessId: id, business, clients: [], items: [], documents: [], apiKeys: [],
          usedNumbers: [], defaultTemplate: "ledger", cloudEmail: null, activeDocId: null,
          activeClientId: null, pane: "list", filter: "all", query: "" });
      },
      switchBusiness: (id) => {
        const state = get();
        if (id === state.currentBusinessId || !state.profiles[id]) return;
        set({ ...state.profiles[id], currentBusinessId: id,
          profiles: { ...state.profiles, [state.currentBusinessId]: profileData(state) },
          activeDocId: null, activeClientId: null, pane: "list", filter: "all", query: "" });
      },
      setView: (view) => set({ view }),
      setPane: (pane) => set({ pane }),
      setFilter: (filter) => set({ filter }),
      setQuery: (query) => set({ query }),
      selectDoc: (id) => set({ activeDocId: id, pane: "editor", view: "documents" }),
      selectClient: (id) => set({ activeClientId: id, view: "clients" }),
      touch: () => set((state) => ({ revision: state.revision + 1 })),
      updateBusiness: (patch) =>
        set((state) => ({ business: { ...state.business, ...patch } })),
      updateDoc: (id, patch) =>
        set((state) => ({
          documents: mapDoc(state.documents, id, (doc) => ({ ...doc, ...patch })),
        })),
      updateBillTo: (id, patch) =>
        set((state) => ({
          documents: mapDoc(state.documents, id, (doc) => ({
            ...doc,
            billTo: { ...doc.billTo, ...patch },
          })),
        })),
      applyClient: (docId, clientId) => {
        const client = get().clients.find((item) => item.id === clientId);
        if (!client) return;
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            clientId,
            billTo: billFromClient(client),
          })),
        }));
      },
      saveBillAsClient: (docId) => {
        const doc = get().documents.find((item) => item.id === docId);
        if (!doc || !doc.billTo.name.trim()) return;
        const client: Client = {
          id: uid("client"),
          name: doc.billTo.name,
          address: doc.billTo.address,
          cityLine: doc.billTo.cityLine,
          country: "",
          email: doc.billTo.email,
          phone: doc.billTo.phone,
          taxNumber: "",
          notes: "",
        };
        set((state) => ({
          clients: [client, ...state.clients],
          activeClientId: client.id,
          documents: mapDoc(state.documents, docId, (item) => ({
            ...item,
            clientId: client.id,
          })),
        }));
      },
      addLine: (docId) =>
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            lines: [
              ...doc.lines,
              { id: uid("line"), name: "", description: "", qty: 1, rate: 0 },
            ],
          })),
        })),
      addLineFromItem: (docId, itemId) => {
        const item = get().items.find((entry) => entry.id === itemId);
        if (!item) return;
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            lines: [
              ...doc.lines,
              {
                id: uid("line"),
                name: item.name,
                description: item.description,
                qty: 1,
                rate: item.price,
              },
            ],
          })),
        }));
      },
      updateLine: (docId, lineId, patch) =>
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            lines: doc.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
          })),
        })),
      removeLine: (docId, lineId) =>
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            lines: doc.lines.filter((line) => line.id !== lineId),
          })),
        })),
      addPayment: (docId, payment) =>
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            payments: [...doc.payments, { ...payment, id: uid("pay") }],
          })),
        })),
      removePayment: (docId, paymentId) =>
        set((state) => ({
          documents: mapDoc(state.documents, docId, (doc) => ({
            ...doc,
            payments: doc.payments.filter((payment) => payment.id !== paymentId),
          })),
        })),
      createDoc: (type) => {
        const state = get();
        const issueDate = todayIso();
        const doc: Doc = {
          id: uid("doc"),
          businessId: state.currentBusinessId,
          issuer: { ...state.business },
          type,
          number: nextNumber(reservedDocuments(state), type, state.business),
          status: type === "receipt" ? "issued" : "draft",
          clientId: null,
          billTo: emptyBill(),
          issueDate,
          dueDate: type === "receipt" ? issueDate : addDays(issueDate, 14),
          taxRate: state.business.defaultTax,
          template: state.defaultTemplate,
          notes: type === "receipt" ? "Received with thanks." : type === "estimate" || type === "quotation" ? "Valid until the date shown. No payment is due until invoiced." : state.business.defaultNotes,
          lines: [{ id: uid("line"), name: "", description: "", qty: 1, rate: 0 }],
          payments: [],
        };
        set({
          documents: [doc, ...state.documents],
          usedNumbers: [...state.usedNumbers, doc.number],
          activeDocId: doc.id,
          view: "documents",
          pane: "editor",
          filter: type,
        });
      },
      duplicateDoc: (id) => {
        const state = get();
        const doc = state.documents.find((item) => item.id === id);
        if (!doc) return;
        const copy: Doc = {
          ...doc,
          id: uid("doc"),
          number: nextNumber(reservedDocuments(state), doc.type, state.business),
          status: doc.type === "receipt" ? "issued" : "draft",
          payments: [],
          lines: doc.lines.map((line) => ({ ...line, id: uid("line") })),
        };
        set({
          documents: [copy, ...state.documents],
          usedNumbers: [...state.usedNumbers, copy.number],
          activeDocId: copy.id,
          pane: "editor",
          view: "documents",
        });
      },
      deleteDoc: (id) =>
        set((state) => {
          const documents = state.documents.filter((doc) => doc.id !== id);
          const activeDocId =
            state.activeDocId === id ? (documents[0]?.id ?? null) : state.activeDocId;
          return { documents, activeDocId };
        }),
      createClient: () => {
        const client: Client = {
          id: uid("client"),
          name: "",
          address: "",
          cityLine: "",
          country: "",
          email: "",
          phone: "",
          taxNumber: "",
          notes: "",
        };
        set((state) => ({
          clients: [client, ...state.clients],
          activeClientId: client.id,
          view: "clients",
        }));
      },
      updateClient: (id, patch) =>
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id ? { ...client, ...patch } : client,
          ),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          documents: state.documents.map((doc) =>
            doc.clientId === id ? { ...doc, clientId: null } : doc,
          ),
          activeClientId: state.activeClientId === id ? null : state.activeClientId,
        })),
      createItem: (item) =>
        set((state) => ({
          items: [{ ...item, id: uid("item") }, ...state.items],
        })),
      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      deleteItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      setTemplate: (template) =>
        set((state) => ({
          defaultTemplate: template,
          documents: state.activeDocId
            ? mapDoc(state.documents, state.activeDocId, (doc) => ({ ...doc, template }))
            : state.documents,
        })),
      createApiKey: (name) =>
        set((state) => ({
          apiKeys: [
            {
              id: uid("key"),
              name: name.trim() || "Agent key",
              token: makeToken(),
              createdAt: new Date().toISOString(),
            },
            ...state.apiKeys,
          ],
        })),
      revokeApiKey: (id) =>
        set((state) => ({ apiKeys: state.apiKeys.filter((key) => key.id !== id) })),
      setCloudEmail: (email) => set({ cloudEmail: email }),
      replaceAll: (data) =>
        set((state) => ({
          business: data.business ? { ...data.business, phone: data.business.phone ?? "", taxNumber: data.business.taxNumber ?? "" } : state.business,
          clients: data.clients ?? [],
          items: data.items ?? [],
          documents: (data.documents ?? []).map(doc => ({ ...doc, businessId: state.currentBusinessId, issuer: doc.issuer ?? data.business ?? state.business })),
          usedNumbers: [...state.usedNumbers, ...(data.usedNumbers ?? []), ...(data.documents ?? []).map(doc => doc.number)],
          apiKeys: data.apiKeys ?? [],
          defaultTemplate: data.defaultTemplate ?? "ledger",
          cloudEmail: data.cloudEmail ?? null,
          activeDocId: data.documents?.[0]?.id ?? null,
          activeClientId: data.clients?.[0]?.id ?? null,
          view: "documents",
          pane: "editor",
        })),
      resetDemo: () => set(state => {
        const seed = seedWorkspace();
        return { ...profileData(seed), documents: seed.documents.map(doc => ({ ...doc, businessId: state.currentBusinessId })),
          activeDocId: "doc-main", pane: "editor", view: "documents" };
      }),
    }),
    {
      name: "fim-grok-preview-sandbox-v1",
      skipHydration: true,
      version: 2,
      migrate: (persisted) => {
        const legacy = persisted as Workspace;
        // Preserve the exact pre-migration data before any v2 persistence.
        const raw = localStorage.getItem("fim-grok-preview-sandbox-v1");
        if (raw && !localStorage.getItem("fim-grok-preview-legacy-backup-v1"))
          localStorage.setItem("fim-grok-preview-legacy-backup-v1", raw);
        const business = { ...legacy.business, phone: legacy.business?.phone ?? "", taxNumber: legacy.business?.taxNumber ?? "", legalName: legacy.business?.legalName ?? "" };
        return { ...legacy, business, currentBusinessId: "business-default", profiles: {},
          usedNumbers: (legacy.documents ?? []).map(doc => doc.number),
          documents: (legacy.documents ?? []).map(doc => ({ ...doc, businessId: "business-default", issuer: doc.issuer ?? { ...business } })) };
      },
      partialize: (state) => ({
        currentBusinessId: state.currentBusinessId,
        profiles: { ...state.profiles, [state.currentBusinessId]: profileData(state) },
        usedNumbers: state.usedNumbers,
        business: state.business,
        clients: state.clients,
        items: state.items,
        documents: state.documents,
        apiKeys: state.apiKeys,
        defaultTemplate: state.defaultTemplate,
        cloudEmail: state.cloudEmail,
        view: state.view,
        activeDocId: state.activeDocId,
        activeClientId: state.activeClientId,
        pane: state.pane,
        filter: state.filter,
        query: state.query,
        revision: state.revision,
      }),
    },
  ),
);

export function snapshot(state: Store): BackupFile {
  return {
    kind: "free-invoice-maker-backup",
    schemaVersion: 2,
    businessId: state.currentBusinessId,
    usedNumbers: state.usedNumbers,
    business: state.business,
    clients: state.clients,
    items: state.items,
    documents: state.documents,
    apiKeys: state.apiKeys,
    defaultTemplate: state.defaultTemplate,
    cloudEmail: state.cloudEmail,
  };
}
