"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Contact = {
  id: string;
  full_name: string;
  job_title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  qr_image_url?: string;
};

type Variant = {
  id: string;
  attempt_number: number;
  image_url: string;
  image_url_source: string;
  is_accepted: boolean;
};

type DesignSession = {
  id: string;
  attempts_remaining: number;
  payment_status: string;
  variants?: Variant[];
};

const initialContact = {
  full_name: "",
  job_title: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  address: "",
};

const demoVcard =
  "BEGIN:VCARD\nVERSION:3.0\nFN:Priya Sharma\nORG:EcoVentures Pte Ltd\nTITLE:Head of Operations\nEMAIL:priya@ecoventures.sg\nTEL:+6591234567\nURL:https://ecoventures.sg\nEND:VCARD";

export default function Home() {
  const [form, setForm] = useState(initialContact);
  const [contact, setContact] = useState<Contact | null>(null);
  const [session, setSession] = useState<DesignSession | null>(null);
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [demoQr, setDemoQr] = useState("");

  const variants = useMemo(() => session?.variants ?? [], [session]);

  useEffect(() => {
    void QRCode.toDataURL(demoVcard, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "H",
    }).then(setDemoQr);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId = params.get("session_id");
    if (!checkoutSessionId) return;

    void loadSession(checkoutSessionId);
  }, []);

  async function loadSession(checkoutSessionId?: string, contactId = contact?.id) {
    setLoading("session");
    setError("");
    const query = new URLSearchParams();
    if (checkoutSessionId) query.set("checkoutSessionId", checkoutSessionId);
    if (contactId) query.set("contactId", contactId);

    const response = await fetch(`/api/sessions?${query.toString()}`);
    const payload = await response.json();
    setLoading("");

    if (!response.ok) {
      setError(payload.error ?? "Could not load design session");
      return;
    }

    if (!payload.session) {
      setStatus("No active design session - complete payment first");
      return;
    }

    setSession(payload.session);
    if (payload.session.contact) setContact(payload.session.contact);
    setStatus("Payment confirmed. Your design session is ready.");
  }

  async function generateQr(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!form.full_name.trim()) {
      setError("Full name is required");
      return;
    }

    setLoading("qr");
    const response = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setLoading("");

    if (!response.ok) {
      setError(payload.error ?? "Could not generate QR code");
      return;
    }

    setContact(payload.contact);
    setSession(null);
    setOrderId("");
    setStatus("QR generated and saved. You can download the PNG or continue to card design.");
  }

  async function downloadQr() {
    if (!contact?.qr_image_url) return;

    const response = await fetch(contact.qr_image_url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contact.full_name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function startCheckout() {
    if (!contact?.id) return;

    setLoading("checkout");
    setError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: contact.id }),
    });
    const payload = await response.json();
    setLoading("");

    if (!response.ok) {
      setError(payload.error ?? "Could not start checkout");
      return;
    }

    window.location.href = payload.url;
  }

  async function generateDesign() {
    if (!session?.id) return;

    setLoading("design");
    setError("");
    const response = await fetch("/api/generate-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    const payload = await response.json();
    setLoading("");

    if (!response.ok) {
      setError(payload.error ?? "Could not generate design");
      return;
    }

    setSession({
      ...session,
      ...payload.session,
      variants: [...variants, payload.variant],
    });
    setStatus("Design saved. You can generate another or accept this one.");
  }

  async function acceptDesign(variantId: string) {
    setLoading(`accept-${variantId}`);
    setError("");
    const response = await fetch("/api/confirm-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    const payload = await response.json();
    setLoading("");

    if (!response.ok) {
      setError(payload.error ?? "Could not confirm order");
      return;
    }

    setOrderId(payload.order.id);
    setSession(
      session
        ? {
            ...session,
            variants: variants.map((variant) =>
              variant.id === variantId ? { ...variant, is_accepted: true } : variant,
            ),
          }
        : null,
    );
    setStatus("Order confirmed. The builder has been notified.");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f1] text-[#15201a]">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-6">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2f6f4e]">
              Reusable metal cards
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Green Biz Card
            </h1>
            <p className="max-w-2xl text-base text-[#516258]">
              Create a contact QR, download the high-res PNG, unlock five AI card
              concepts, and confirm the metal card order in one browser session.
            </p>
          </header>

          <form
            onSubmit={generateQr}
            className="grid gap-4 rounded-lg border border-[#d7dfd2] bg-white p-5 shadow-sm sm:grid-cols-2"
          >
            <Field
              label="Full name"
              value={form.full_name}
              required
              onChange={(full_name) => setForm({ ...form, full_name })}
            />
            <Field
              label="Job title"
              value={form.job_title}
              onChange={(job_title) => setForm({ ...form, job_title })}
            />
            <Field
              label="Company"
              value={form.company}
              onChange={(company) => setForm({ ...form, company })}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
            <Field
              label="Website"
              value={form.website}
              onChange={(website) => setForm({ ...form, website })}
            />
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-[#314238]">Address</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-[#cdd8c8] px-3 py-2 outline-none focus:border-[#2f6f4e]"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </label>
            <button
              className="rounded-md bg-[#255f42] px-4 py-3 font-semibold text-white transition hover:bg-[#1e4c36] disabled:opacity-60"
              disabled={loading === "qr"}
            >
              {loading === "qr" ? "Generating..." : "Generate QR"}
            </button>
          </form>

          {(error || status) && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                error
                  ? "border-[#d8aaa0] bg-[#fff5f2] text-[#8c2f20]"
                  : "border-[#bdd8c6] bg-[#edf8f0] text-[#255f42]"
              }`}
            >
              {error || status}
            </div>
          )}

          {session && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Design session</h2>
                  <p className="text-sm text-[#5c6b62]">
                    Attempts remaining: {session.attempts_remaining}
                  </p>
                </div>
                <button
                  onClick={generateDesign}
                  disabled={loading === "design" || session.attempts_remaining === 0}
                  className="rounded-md bg-[#10251c] px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {session.attempts_remaining === 0
                    ? "No attempts remaining"
                    : loading === "design"
                      ? "Generating..."
                      : "Generate Design"}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {variants.map((variant) => (
                  <article
                    key={variant.id}
                    className="overflow-hidden rounded-lg border border-[#d7dfd2] bg-white shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={variant.image_url}
                      alt={`Card design attempt ${variant.attempt_number}`}
                      className="aspect-[5/3] w-full object-cover"
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">Attempt {variant.attempt_number}</span>
                        <span className="text-[#5c6b62]">{variant.image_url_source}</span>
                      </div>
                      <button
                        onClick={() => acceptDesign(variant.id)}
                        disabled={Boolean(orderId) || loading === `accept-${variant.id}`}
                        className="w-full rounded-md bg-[#2f6f4e] px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {variant.is_accepted ? "Accepted" : "Accept this design"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#d7dfd2] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">QR preview</h2>
            <div className="mt-4 grid aspect-square place-items-center rounded-md bg-[#edf2ea] p-5">
              {contact?.qr_image_url || demoQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={contact?.qr_image_url ?? demoQr}
                  alt="Generated contact QR code"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center text-sm text-[#617067]">
                  Preparing seed demo QR...
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm text-[#405047]">
              <p className="font-semibold">{contact?.full_name ?? "Priya Sharma"}</p>
              <p>{contact?.job_title ?? "Head of Operations"}</p>
              <p>{contact?.company ?? "EcoVentures Pte Ltd"}</p>
              <p>{contact?.email ?? "priya@ecoventures.sg"}</p>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                onClick={downloadQr}
                disabled={!contact?.qr_image_url}
                className="rounded-md border border-[#255f42] px-4 py-3 font-semibold text-[#255f42] disabled:opacity-50"
              >
                Download PNG
              </button>
              <button
                onClick={startCheckout}
                disabled={!contact?.id || loading === "checkout"}
                className="rounded-md bg-[#255f42] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading === "checkout" ? "Opening checkout..." : "Design my metal card - $8.99"}
              </button>
            </div>
          </section>

          {orderId && (
            <section className="rounded-lg border border-[#bdd8c6] bg-[#edf8f0] p-5">
              <h2 className="text-xl font-bold text-[#255f42]">Order confirmed</h2>
              <p className="mt-2 text-sm text-[#405047]">
                Supabase order row: <span className="font-mono">{orderId}</span>
              </p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#314238]">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-[#cdd8c8] px-3 py-2 outline-none focus:border-[#2f6f4e]"
      />
    </label>
  );
}
