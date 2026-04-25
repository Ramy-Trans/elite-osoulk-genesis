import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

export function ConsultationForm({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Thank you. A consultant will reach out shortly.");
    }, 700);
  };

  return (
    <form
      onSubmit={submit}
      className={`glass rounded-xl p-7 md:p-9 shadow-elegant ${compact ? "" : "max-w-xl mx-auto"}`}
    >
      <div className="text-center">
        <h3 className="font-display text-2xl">Need Expert Advice?</h3>
        <div className="gold-divider mx-auto mt-3" />
        <p className="mt-3 text-sm text-muted-foreground">Fill the form — our property consultants will contact you.</p>
      </div>
      <div className="mt-6 grid gap-4">
        <Field label="Your Name" name="name" required />
        <div>
          <label className="text-sm font-medium">Preferred Location *</label>
          <select required name="location" className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Choose location</option>
            <option>New Cairo</option><option>New Capital</option><option>North Coast</option><option>6th of October</option><option>Madinaty</option>
          </select>
        </div>
        <Field label="Phone" name="phone" type="tel" required />
        <div>
          <label className="text-sm font-medium">Your Message</label>
          <textarea name="message" rows={3} className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm gradient-ink text-ivory text-sm font-medium tracking-wide hover:opacity-90 transition disabled:opacity-60">
          {loading ? "Sending…" : <>Submit <Send className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input
        required={required}
        name={name}
        type={type}
        className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={label}
      />
    </div>
  );
}
