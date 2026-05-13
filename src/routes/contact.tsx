import { createFileRoute } from "@tanstack/react-router";
import { ConsultationForm, Footer, PageHero } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";
import { MapPin, Phone, Map } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Osoulk — Expert Property Advice" },
      { name: "description", content: "Contact Osoulk for property consultation, listing support, agency partnerships, and premium real estate advice." },
      { property: "og:title", content: "Contact Osoulk" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useLang();

  return (
    <main>
      <PageHero
        kicker={t("contact.kicker")}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
      />
      <ConsultationForm />
      <section className="py-10">
        <div className="os-container grid gap-6 md:grid-cols-3">
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-aqua" />
              <h2 className="font-black text-navy">{t("contact.addressTitle")}</h2>
            </div>
            <p className="text-muted-foreground whitespace-pre-line">{t("contact.addressText")}</p>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-5 w-5 text-aqua" />
              <h2 className="font-black text-navy">{t("contact.contactsTitle")}</h2>
            </div>
            <p className="text-muted-foreground" dir="ltr">
              +201025812666<br />
              info@osoulk.com
            </p>
          </div>
          <div className="premium-card overflow-hidden p-0">
            <div className="flex items-center gap-2 px-6 py-4">
              <Map className="h-5 w-5 text-aqua" />
              <h2 className="font-black text-navy">{t("contact.mapTitle")}</h2>
            </div>
            <iframe
              title="Osoulk Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.676!2d31.4!3d30.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583d6ef8eb32e9%3A0x49a583cde5e8bc1e!2sNew%20Cairo%20City%2C%20Cairo%20Governorate%2C%20Egypt!5e0!3m2!1sen!2seg!4v1700000000000!5m2!1sen!2seg"
              width="100%"
              height="180"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
