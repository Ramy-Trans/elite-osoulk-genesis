import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ConsultationForm } from "@/components/site/ConsultationForm";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact Us — OSOULK" },
    { name: "description", content: "Talk to an OSOULK property consultant. Offices in New Cairo and Sheikh Zayed." },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="container-luxe py-16 grid lg:grid-cols-2 gap-12 items-start">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Contact</p>
        <h1 className="mt-3 font-display text-5xl">Let's talk property.</h1>
        <p className="mt-4 text-muted-foreground max-w-md">Whether you're buying, selling, or simply exploring — our consultants are ready to help.</p>

        <div className="mt-10 space-y-6">
          {[
            { icon: MapPin, t: "Address", lines: ["North 90th, New Cairo 1, Egypt", "1st District, Al Sheikh Zayed, Egypt"] },
            { icon: Phone, t: "Contacts", lines: ["(800) 987 6543", "Hotline: 19871"] },
            { icon: Mail, t: "Email", lines: ["info@osoulk.com"] },
            { icon: Clock, t: "Working Hours", lines: ["Sunday – Thursday", "10:00 AM – 5:00 PM"] },
          ].map((c) => (
            <div key={c.t} className="flex items-start gap-4">
              <div className="h-11 w-11 grid place-items-center rounded-full bg-ink text-ivory shrink-0"><c.icon className="h-5 w-5" /></div>
              <div>
                <h3 className="font-display text-lg">{c.t}</h3>
                {c.lines.map((l) => <p key={l} className="text-sm text-muted-foreground">{l}</p>)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 aspect-video rounded-md overflow-hidden border border-border bg-secondary/60 grid place-items-center text-muted-foreground text-sm">
          Map placeholder — connect Google Maps key in dashboard
        </div>
      </div>
      <ConsultationForm compact />
    </div>
  );
}
