import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import compound1 from "@/assets/compound-1.jpg";
import compound2 from "@/assets/compound-2.jpg";

export type Property = {
  id: string;
  title: string;
  price: number;
  currency: string;
  type: string;
  status: "For Sale" | "For Rent";
  beds?: number;
  baths?: number;
  area: number;
  city: string;
  compound?: string;
  cover: string;
  featured?: boolean;
  newLaunch?: boolean;
};

export const PROPERTIES: Property[] = [
  { id: "p1", title: "Penthouse with Skyline View", price: 12500000, currency: "EGP", type: "Apartment", status: "For Sale", beds: 4, baths: 4, area: 320, city: "New Cairo", compound: "Mivida", cover: property1, featured: true },
  { id: "p2", title: "Beachfront Villa in Sahel", price: 27000000, currency: "EGP", type: "Villa", status: "For Sale", beds: 5, baths: 6, area: 480, city: "North Coast", compound: "Ras El Hekma", cover: property2, featured: true, newLaunch: true },
  { id: "p3", title: "Designer Apartment", price: 8250000, currency: "EGP", type: "Apartment", status: "For Sale", beds: 3, baths: 2, area: 180, city: "New Capital", compound: "Solana East", cover: property3 },
  { id: "p4", title: "Premium Office Tower Suite", price: 6000000, currency: "EGP", type: "Office", status: "For Sale", area: 145, city: "New Capital", cover: property4 },
  { id: "p5", title: "Family Villa with Garden", price: 17000000, currency: "EGP", type: "Villa", status: "For Sale", beds: 5, baths: 5, area: 463, city: "6th of October", compound: "Allegria", cover: compound1, newLaunch: true },
  { id: "p6", title: "Coastal Duplex with Sea View", price: 15000000, currency: "EGP", type: "Duplex", status: "For Sale", beds: 4, baths: 4, area: 290, city: "North Coast", compound: "Galala", cover: compound2 },
  { id: "p7", title: "Modern Studio in the Heart", price: 15000, currency: "EGP", type: "Apartment", status: "For Rent", beds: 1, baths: 1, area: 65, city: "New Cairo", cover: property1 },
  { id: "p8", title: "Executive Office Space", price: 2246000, currency: "EGP", type: "Office", status: "For Sale", area: 35, city: "New Capital", cover: property4 },
  { id: "p9", title: "Garden Townhouse", price: 9500000, currency: "EGP", type: "Townhouse", status: "For Sale", beds: 3, baths: 4, area: 240, city: "Madinaty", cover: compound1 },
];

export const COMPOUNDS = [
  { name: "IL Monte Galala", area: "Galala", units: 124, image: compound2 },
  { name: "Ras El Hekma Coastal", area: "North Coast", units: 86, image: compound2 },
  { name: "Solana East Living", area: "New Cairo", units: 210, image: property3 },
  { name: "97 Hills Palm Hills", area: "New Cairo", units: 178, image: compound1 },
];

export const AREAS = [
  { name: "New Cairo", listings: 314, image: property1 },
  { name: "North Coast", listings: 187, image: property2 },
  { name: "New Capital", listings: 248, image: property4 },
  { name: "6th of October", listings: 165, image: compound1 },
];

export const REELS = [
  { id: "r1", title: "Sunset tour — IL Monte Galala", agent: "Mariam Adel", agency: "OSOULK Elite", thumbnail: compound2, duration: "0:48" },
  { id: "r2", title: "Penthouse New Cairo walkthrough", agent: "Hassan Khaled", agency: "Palm Brokers", thumbnail: property1, duration: "1:12" },
  { id: "r3", title: "Sahel beachfront drone reel", agent: "Yara Sami", agency: "Coastal Co.", thumbnail: property2, duration: "0:34" },
  { id: "r4", title: "Office tower aerial — New Capital", agent: "Omar Tarek", agency: "Capital Realty", thumbnail: property4, duration: "0:55" },
  { id: "r5", title: "Allegria villa staging", agent: "Nour Magdy", agency: "OSOULK Elite", thumbnail: compound1, duration: "1:08" },
  { id: "r6", title: "Madinaty townhouse open day", agent: "Aly Selim", agency: "Townhomes EG", thumbnail: property3, duration: "0:42" },
];

export const AGENCIES = [
  { name: "OSOULK Elite", coverage: "New Cairo · Sahel", listings: 124, logo: property1 },
  { name: "Palm Hills Brokers", coverage: "Sheikh Zayed · 6th of October", listings: 87, logo: compound1 },
  { name: "Coastal Co.", coverage: "North Coast", listings: 56, logo: property2 },
  { name: "Capital Realty", coverage: "New Administrative Capital", listings: 142, logo: property4 },
  { name: "Madinaty Living", coverage: "Madinaty · Rehab", logo: compound1, listings: 73 },
  { name: "Solana Partners", coverage: "Solana East", logo: property3, listings: 38 },
];

export const PACKAGES = [
  { name: "Starter", price: 350, period: "month", features: ["1 active listing", "10 images per listing", "Email support", "Featured for 3 days"], cta: "Start Free", featured: false },
  { name: "Pro", price: 600, period: "month", features: ["10 active listings", "Unlimited images", "Priority support", "Featured for 14 days", "Reels uploads (with approval)", "Verified seller badge"], cta: "Subscribe Now", featured: true },
  { name: "Agency", price: 1800, period: "month", features: ["Unlimited listings", "Team accounts (5 seats)", "Dedicated account manager", "Lead routing & CRM export", "Homepage feature placement", "Top placement on search"], cta: "Talk to Sales", featured: false },
];

export const ARTICLES = [
  { slug: "best-areas-to-buy-in-new-cairo", title: "The Best Areas to Buy a Home in New Cairo (2026 Guide)", excerpt: "From Mivida to Eastown — what to expect from each district, average prices, and lifestyle considerations.", category: "Buyer Guide", cover: property1, author: "OSOULK Editorial", read: 8 },
  { slug: "north-coast-investment-2026", title: "Why North Coast Properties Are the Smartest Investment of 2026", excerpt: "Ras El Hekma, Sidi Heneish, and Sahel — yield projections and developer pipelines.", category: "Investment", cover: property2, author: "Hassan Khaled", read: 11 },
  { slug: "selling-your-property-faster", title: "How to Sell Your Property 3× Faster on OSOULK", excerpt: "Pricing strategy, photography, and the listing optimisation playbook our top sellers use.", category: "Sellers", cover: compound1, author: "Mariam Adel", read: 6 },
  { slug: "mortgage-vs-installments-egypt", title: "Mortgage vs Installments in Egypt: A Complete Comparison", excerpt: "Banks, developer plans, and how to choose what's right for your cashflow.", category: "Finance", cover: property3, author: "Omar Tarek", read: 9 },
  { slug: "ras-el-hekma-developer-guide", title: "Ras El Hekma — Developer-by-Developer Guide", excerpt: "Master plans, phase timelines, and what each operator brings to the new megacity.", category: "Compounds", cover: compound2, author: "Yara Sami", read: 13 },
  { slug: "interior-trends-2026", title: "Egyptian Luxury Interior Trends Defining 2026", excerpt: "Travertine, brushed brass, curved silhouettes — the references shaping high-end interiors.", category: "Lifestyle", cover: property1, author: "OSOULK Editorial", read: 7 },
];

export type FaqItem = { q: string; a: string; links?: Record<string, string> };

export const FAQS: FaqItem[] = [
  { q: "What is OSOULK?", a: "OSOULK is a modern real estate platform built to make buying, selling, and investing in property across Egypt smarter, faster, and more transparent. Read our story on the {about} page.", links: { about: "/about" } },
  { q: "How do I list my property on OSOULK?", a: "Create an account, complete your profile, and use our {sell} flow to publish your listing. Our team reviews submissions to ensure quality.", links: { sell: "/sell" } },
  { q: "Which compounds and areas can I find on OSOULK?", a: "We cover Egypt's most sought-after destinations including New Cairo, New Capital, North Coast, 6th of October, Madinaty, Galala and more. Browse them on {explore}.", links: { explore: "/explore" } },
  { q: "Do you offer flexible payment or move-in plans?", a: "Yes — many of our developer partners offer extended installment plans and move-now-pay-later programs. Talk to a consultant on {contact}." , links: { contact: "/contact" } },
  { q: "How can I become an OSOULK certified agent?", a: "Apply through the {agencies} directory and our partnerships team will review your credentials within 48 hours.", links: { agencies: "/agencies" } },
  { q: "Can I upload property reels?", a: "Yes — once your seller account is approved, you'll get permission to upload short property reels. They go live after our moderation team approves them. See {reels}.", links: { reels: "/reels" } },
  { q: "How do payments and subscriptions work?", a: "We offer transparent monthly and annual plans. Compare them on the {packages} page — you can start free and upgrade in one click.", links: { packages: "/packages" } },
  { q: "Is OSOULK only for buyers and sellers?", a: "No. OSOULK serves buyers, sellers, agents, agencies, and developers with tailored tools for each. Investors can also use our {ar} immersive previews to explore properties remotely.", links: { ar: "/ar" } },
];

export function formatPrice(p: number, currency = "EGP") {
  if (p >= 1_000_000) return `${currency} ${(p / 1_000_000).toFixed(p % 1_000_000 === 0 ? 0 : 1)}M`;
  if (p >= 1_000) return `${currency} ${p.toLocaleString()}`;
  return `${currency} ${p}`;
}
