import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/create-listing")({
  head: () => ({ meta: [
    { title: "Create a Listing — OSOULK" },
    { name: "description", content: "List your property on OSOULK in minutes. Reach verified buyers across Egypt." },
  ] }),
  component: CreateListingPage,
});

const STEPS = ["Property", "Details", "Pricing", "Media", "Contact"];

function CreateListingPage() {
  const [step, setStep] = useState(0);

  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Create a Listing</p>
      <h1 className="mt-2 font-display text-4xl">Publish your property in minutes</h1>

      {/* Progress */}
      <div className="mt-10 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`h-9 w-9 grid place-items-center rounded-full text-xs font-medium border transition ${i < step ? "gradient-ink text-ivory border-transparent" : i === step ? "border-[color:var(--gold)] text-foreground" : "border-border text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-ink" : "bg-border"}`} />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        {STEPS.map((s) => <span key={s}>{s}</span>)}
      </div>

      {/* Step content */}
      <div className="mt-10 rounded-xl bg-card border border-border p-8 shadow-card">
        {step === 0 && (
          <div className="grid gap-4">
            <h2 className="font-display text-2xl">Property type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["Apartment", "Villa", "Townhouse", "Office", "Commercial", "Land"].map((t) => (
                <label key={t} className="border border-border rounded-md p-4 cursor-pointer hover:border-[color:var(--gold)] transition">
                  <input type="radio" name="t" className="sr-only peer" />
                  <span className="font-medium">{t}</span>
                </label>
              ))}
            </div>
            <Field label="Listing title" placeholder="Penthouse with skyline view" />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4">
            <h2 className="font-display text-2xl">Property details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Bedrooms" type="number" />
              <Field label="Bathrooms" type="number" />
              <Field label="Area (m²)" type="number" />
              <Field label="City" placeholder="New Cairo" />
            </div>
            <Field label="Address" placeholder="Compound, district, street" />
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea rows={4} className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <h2 className="font-display text-2xl">Pricing</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Price (EGP)" type="number" placeholder="12,500,000" />
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm">
                  <option>For Sale</option><option>For Rent</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4">
            <h2 className="font-display text-2xl">Media</h2>
            <div className="rounded-md border-2 border-dashed border-border p-10 text-center text-muted-foreground">
              <Upload className="h-7 w-7 mx-auto mb-2" />
              <p>Drop photos and videos here, or <span className="underline">browse</span></p>
              <p className="mt-1 text-xs">JPG, PNG, MP4 up to 50MB each</p>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-4">
            <h2 className="font-display text-2xl">Your contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" />
              <Field label="Phone" type="tel" />
            </div>
            <Field label="Email" type="email" />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="text-sm text-muted-foreground disabled:opacity-40">← Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm gradient-ink text-ivory text-sm">Continue <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={() => { toast.success("Listing submitted — pending review."); setStep(0); }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm">Publish for review</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} placeholder={placeholder} className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
