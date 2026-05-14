import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Crown,
  Eye,
  FileCheck2,
  Gem,
  Globe2,
  Heart,
  Home,
  KeyRound,
  Landmark,
  Layers3,
  MapPin,
  Phone,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
  Video,
  WalletCards,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toggleSaved, isSaved } from "@/lib/saved";
import { useLang } from "@/lib/language";
import { faqsAr, articleCardsAr } from "@/lib/i18n";

export const heroImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85";
export const villaImage = "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85";
export const penthouseImage = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85";
export const compoundImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";
export const interiorImage = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85";
export const coastImage = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85";
export const cityImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85";
export const arImage = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=85";

export const properties = [
  {
    id: "ahel-masr-walkway",
    title: "Apartment Near Ahel Masr Walkway",
    titleAr: "شقة بجوار ممشى أهل مصر",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 8,250,000",
    location: "Heliopolis",
    locationAr: "مصر الجديدة",
    area: "160 sqm",
    image: "/properties/ahel-masr-walkway/08.webp",
    images: [
      "/properties/ahel-masr-walkway/08.webp",
      "/properties/ahel-masr-walkway/01.webp",
      "/properties/ahel-masr-walkway/02.webp",
      "/properties/ahel-masr-walkway/03.webp",
      "/properties/ahel-masr-walkway/04.webp",
      "/properties/ahel-masr-walkway/05.webp",
      "/properties/ahel-masr-walkway/06.webp",
      "/properties/ahel-masr-walkway/07.webp",
      "/properties/ahel-masr-walkway/09.webp",
      "/properties/ahel-masr-walkway/10.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Verified"],
    tagsAr: ["للبيع", "موثق"],
    bedrooms: 3,
    bathrooms: 2,
    size: "160 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Spacious apartment near the popular Ahel Masr Walkway in Heliopolis, fully finished and ready for immediate occupancy.",
      "Features 3 bedrooms, 2 bathrooms, a large reception area, and modern kitchen — located on the 2nd floor with easy access and excellent natural light throughout.",
    ],
    descriptionAr: [
      "شقة فسيحة بجوار ممشى أهل مصر في مصر الجديدة، مشطبة بالكامل وجاهزة للسكن الفوري.",
      "تتميز بـ 3 غرف نوم، و2 حمام، وصالة استقبال واسعة ومطبخ حديث — تقع في الدور الثاني مع إمكانية وصول سهلة وإضاءة طبيعية ممتازة.",
    ],
    features: ["Fully finished", "3 bedrooms", "2 bathrooms", "Large reception", "Modern kitchen", "2nd floor"],
    featuresAr: ["تشطيب كامل", "3 غرف نوم", "2 حمام", "صالة واسعة", "مطبخ حديث", "دور ثانٍ"],
  },
  {
    id: "green5-north",
    title: "Apartment in Green 5 Compound, North Extensions",
    titleAr: "شقة بكمباوند جرين 5 بالتوسعات الشمالية",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 8,250,000",
    location: "North Extensions, New Cairo",
    locationAr: "التوسعات الشمالية، القاهرة الجديدة",
    area: "160 sqm",
    image: "/properties/green5-north/04.webp",
    images: [
      "/properties/green5-north/04.webp",
      "/properties/green5-north/01.webp",
      "/properties/green5-north/02.webp",
      "/properties/green5-north/03.webp",
      "/properties/green5-north/05.webp",
      "/properties/green5-north/06.webp",
      "/properties/green5-north/07.webp",
      "/properties/green5-north/08.webp",
      "/properties/green5-north/09.webp",
      "/properties/green5-north/10.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Compound"],
    tagsAr: ["للبيع", "كمباوند"],
    bedrooms: 3,
    bathrooms: 1,
    size: "160 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Bright and modern apartment in the sought-after Green 5 Compound within the North Extensions of New Cairo.",
      "The unit offers 3 bedrooms, 1 bathroom, a spacious living area, and premium compound amenities including security, landscaped areas, and parking.",
    ],
    descriptionAr: [
      "شقة مشرقة وعصرية في كمباوند جرين 5 المميز بالتوسعات الشمالية للقاهرة الجديدة.",
      "تضم الوحدة 3 غرف نوم وحمامًا وصالة معيشة فسيحة مع مرافق كمباوند راقية تشمل الأمن والمناطق الخضراء والمواقف.",
    ],
    features: ["Gated compound", "3 bedrooms", "Landscaped gardens", "24/7 security", "Parking", "Modern finishes"],
    featuresAr: ["كمباوند مسوّر", "3 غرف نوم", "حدائق منسقة", "حراسة 24 ساعة", "مواقف سيارات", "تشطيبات عصرية"],
  },
  {
    id: "nakheel-compound",
    title: "Apartment in Nakheel Compound",
    titleAr: "شقة بكمباوند النخيل",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 5,000,000",
    location: "Nakheel Compound",
    locationAr: "كمباوند النخيل",
    area: "180 sqm",
    image: "/properties/nakheel-compound/01.webp",
    images: ["/properties/nakheel-compound/01.webp"],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Spacious"],
    tagsAr: ["للبيع", "مساحة واسعة"],
    bedrooms: 3,
    bathrooms: 1,
    size: "180 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Generously sized apartment in the well-established Nakheel Compound, offering 180 sqm of comfortable living space.",
      "Three bedrooms, a large reception, and balcony, set within a secure and well-maintained compound environment.",
    ],
    descriptionAr: [
      "شقة ذات مساحة سخية في كمباوند النخيل الراسخ، توفر 180 متر مربع من مساحة المعيشة المريحة.",
      "ثلاث غرف نوم وصالة استقبال كبيرة وشرفة، في بيئة كمباوند آمنة وجيدة الصيانة.",
    ],
    features: ["180 m² area", "3 bedrooms", "Large reception", "Balcony", "Compound security", "Established community"],
    featuresAr: ["مساحة 180م²", "3 غرف نوم", "صالة كبيرة", "شرفة", "أمن الكمباوند", "مجتمع راسخ"],
  },
  {
    id: "lamirada-duplex",
    title: "Duplex in La Mirada Compound",
    titleAr: "دوبلكس كومبوند لاميرادا",
    type: "Duplex",
    typeAr: "دوبلكس",
    price: "EGP 15,000,000",
    location: "La Mirada Compound",
    locationAr: "كمباوند لاميرادا",
    area: "140 sqm",
    image: "/properties/lamirada-duplex/04.webp",
    images: [
      "/properties/lamirada-duplex/04.webp",
      "/properties/lamirada-duplex/01.webp",
      "/properties/lamirada-duplex/02.webp",
      "/properties/lamirada-duplex/03.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Duplex"],
    tagsAr: ["للبيع", "دوبلكس"],
    bedrooms: 3,
    bathrooms: 2,
    size: "140 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Elegant duplex unit in the prestigious La Mirada Compound — a double-floor layout delivering generous living space and privacy.",
      "Modern architecture, quality finishes, and access to all compound amenities including pools, club house, and landscaped parks.",
    ],
    descriptionAr: [
      "وحدة دوبلكس أنيقة في كمباوند لاميرادا الراقي — تصميم على دورين يوفر مساحة معيشية سخية وخصوصية تامة.",
      "هندسة معمارية عصرية وتشطيبات راقية مع إمكانية الوصول إلى جميع مرافق الكمباوند بما فيها المسابح والنادي والحدائق.",
    ],
    features: ["Double-floor layout", "Private entrance", "Compound pools", "Club house", "Landscaped parks", "24/7 security"],
    featuresAr: ["تصميم على دورين", "مدخل خاص", "مسابح الكمباوند", "نادي اجتماعي", "حدائق منسقة", "حراسة 24 ساعة"],
  },
  {
    id: "l010-142",
    title: "L010 Top Distinction Apartment — 142 sqm",
    titleAr: "شقة للبيع مساحة ١٤٢م أعلى تميز L010",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 5,340,000",
    location: "L010",
    locationAr: "L010",
    area: "142 sqm",
    image: "/properties/l010-142/02.webp",
    images: [
      "/properties/l010-142/02.webp",
      "/properties/l010-142/01.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Installments"],
    tagsAr: ["للبيع", "بالتقسيط"],
    bedrooms: 3,
    bathrooms: 2,
    size: "142 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Premium apartment in the L010 development with a total area of 142 sqm across top distinction floors offering panoramic views and superior specifications.",
      "Available with flexible installment plans. The unit features high-quality finishes, spacious rooms, and access to the compound's full range of facilities.",
    ],
    descriptionAr: [
      "شقة مميزة في مشروع L010 بمساحة إجمالية 142 متر مربع في أدوار أعلى تميز توفر إطلالات بانورامية ومواصفات متميزة.",
      "متاحة بخطط تقسيط مرنة. تتميز الوحدة بتشطيبات عالية الجودة وغرف فسيحة والوصول إلى كافة مرافق الكمباوند.",
    ],
    features: ["142 m² area", "Top floors", "Installment plan", "Panoramic views", "High-quality finishes", "Full compound facilities"],
    featuresAr: ["مساحة 142م²", "أدوار علوية", "نظام تقسيط", "إطلالات بانورامية", "تشطيبات راقية", "مرافق متكاملة"],
  },
  {
    id: "l010-b14",
    title: "L010 B14 — Top Distinction Apartment 97 sqm",
    titleAr: "شقة للبيع في B14 الأعلى تمييز L010",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 9,206,000",
    location: "L010 B14",
    locationAr: "L010 B14",
    area: "97 sqm",
    image: "/properties/l010-b14/04.webp",
    images: [
      "/properties/l010-b14/04.webp",
      "/properties/l010-b14/01.webp",
      "/properties/l010-b14/02.webp",
      "/properties/l010-b14/03.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Installments"],
    tagsAr: ["للبيع", "بالتقسيط"],
    bedrooms: 2,
    bathrooms: 2,
    size: "97 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Prestigious apartment in Building B14 of the L010 development — part of the 'Highest Distinction' tier with premium positioning and elevated views.",
      "97 sqm, 2 bedrooms, 2 bathrooms. Flexible installment payment plan available. Exceptional build quality and an exclusive community lifestyle.",
    ],
    descriptionAr: [
      "شقة راقية في مبنى B14 بمشروع L010 — ضمن فئة 'الأعلى تمييز' بموقع متميز وإطلالات مرتفعة.",
      "97 متر مربع، 2 غرفة نوم، 2 حمام. خطة سداد بالتقسيط المرن متاحة. جودة بناء استثنائية ونمط حياة راقٍ.",
    ],
    features: ["97 m² area", "2 bedrooms", "2 bathrooms", "Installment plan", "Elevated views", "Premium build quality"],
    featuresAr: ["مساحة 97م²", "2 غرفة نوم", "2 حمام", "نظام تقسيط", "إطلالات مرتفعة", "جودة بناء فائقة"],
  },
  {
    id: "standalone-villa",
    title: "Standalone Villa",
    titleAr: "فيلا مستقلة",
    type: "Villa",
    typeAr: "فيلا",
    price: "EGP 16,000,000",
    location: "Residential Area",
    locationAr: "منطقة سكنية",
    area: "120 sqm",
    image: "/properties/standalone-villa/01.webp",
    images: ["/properties/standalone-villa/01.webp"],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Villa"],
    tagsAr: ["للبيع", "فيلا"],
    bedrooms: 4,
    bathrooms: 3,
    size: "120 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "A well-designed standalone villa offering privacy, space, and a premium residential lifestyle — with its own private garden and entrance.",
      "Modern architectural style with quality finishes throughout. Ideal for families seeking an independent, spacious home away from apartment living.",
    ],
    descriptionAr: [
      "فيلا مستقلة ذات تصميم راقٍ توفر الخصوصية والمساحة ونمط حياة سكني متميز — مع حديقة خاصة ومدخل مستقل.",
      "طراز معماري حديث بتشطيبات عالية الجودة. مثالية للعائلات الباحثة عن منزل مستقل وفسيح بعيداً عن الشقق.",
    ],
    features: ["Private garden", "Independent entrance", "4 bedrooms", "3 bathrooms", "Modern architecture", "Family-friendly"],
    featuresAr: ["حديقة خاصة", "مدخل مستقل", "4 غرف نوم", "3 حمامات", "معمار حديث", "مناسب للعائلات"],
  },
  {
    id: "tayba-garden",
    title: "Apartment in Tayba Garden",
    titleAr: "شقة بطيبة جاردن",
    type: "Apartment",
    typeAr: "شقة",
    price: "EGP 1,700,000",
    location: "Tayba Garden",
    locationAr: "طيبة جاردن",
    area: "140 sqm",
    image: "/properties/tayba-garden/01.webp",
    images: [
      "/properties/tayba-garden/01.webp",
      "/properties/tayba-garden/02.webp",
      "/properties/tayba-garden/03.webp",
      "/properties/tayba-garden/04.webp",
      "/properties/tayba-garden/05.webp",
      "/properties/tayba-garden/06.webp",
      "/properties/tayba-garden/07.webp",
      "/properties/tayba-garden/08.webp",
      "/properties/tayba-garden/09.webp",
      "/properties/tayba-garden/10.webp",
      "/properties/tayba-garden/11.webp",
      "/properties/tayba-garden/12.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Best Value"],
    tagsAr: ["للبيع", "قيمة ممتازة"],
    bedrooms: 3,
    bathrooms: 2,
    size: "140 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Excellent value apartment in Tayba Garden — a well-maintained residential compound offering a comfortable and community-oriented lifestyle.",
      "140 sqm, 3 bedrooms, 2 bathrooms, fully finished with modern interior design, air conditioning in all rooms, and a bright reception area.",
    ],
    descriptionAr: [
      "شقة بقيمة ممتازة في طيبة جاردن — مجمع سكني جيد الصيانة يوفر نمط حياة مريحاً ومجتمعياً.",
      "140 متر مربع، 3 غرف نوم، 2 حمام، تشطيب كامل بتصميم داخلي عصري وتكييف في جميع الغرف وصالة مضيئة.",
    ],
    features: ["140 m² area", "3 bedrooms", "2 bathrooms", "Fully finished", "Air conditioning", "Compound lifestyle"],
    featuresAr: ["مساحة 140م²", "3 غرف نوم", "2 حمام", "تشطيب كامل", "تكييف هواء", "نمط حياة كمباوند"],
  },
  {
    id: "beit-alwatan-6oct",
    title: "Luxury Apartment in Beit Al-Watan, 6th of October",
    titleAr: "شقة فاخرة للبيع في بيت الوطن 6 أكتوبر",
    type: "Residential",
    typeAr: "سكني",
    price: "EGP 9,000,000",
    location: "6th of October",
    locationAr: "6 أكتوبر",
    area: "330 sqm",
    image: "/properties/beit-alwatan-6oct/01.webp",
    images: [
      "/properties/beit-alwatan-6oct/01.webp",
      "/properties/beit-alwatan-6oct/02.webp",
      "/properties/beit-alwatan-6oct/03.webp",
      "/properties/beit-alwatan-6oct/04.webp",
      "/properties/beit-alwatan-6oct/05.webp",
      "/properties/beit-alwatan-6oct/06.webp",
      "/properties/beit-alwatan-6oct/07.webp",
      "/properties/beit-alwatan-6oct/08.webp",
      "/properties/beit-alwatan-6oct/09.webp",
      "/properties/beit-alwatan-6oct/10.webp",
      "/properties/beit-alwatan-6oct/11.webp",
      "/properties/beit-alwatan-6oct/12.webp",
      "/properties/beit-alwatan-6oct/13.webp",
      "/properties/beit-alwatan-6oct/14.webp",
      "/properties/beit-alwatan-6oct/15.webp",
    ],
    ownerPhone: "+201025812666",
    tags: ["For Sale", "Luxury"],
    tagsAr: ["للبيع", "فاخر"],
    bedrooms: 4,
    bathrooms: 3,
    size: "330 m²",
    status: "For Sale",
    statusAr: "للبيع",
    description: [
      "Exceptional luxury apartment in Beit Al-Watan, 6th of October — a sprawling 330 sqm unit with exclusive specifications and premium finishes throughout.",
      "Four bedrooms, three bathrooms, double reception areas, and a full balcony. The building features a striking illuminated facade and is located in one of 6th of October's most prestigious residential addresses.",
    ],
    descriptionAr: [
      "شقة فاخرة استثنائية في بيت الوطن، 6 أكتوبر — وحدة شاملة 330 متر مربع بمواصفات حصرية وتشطيبات فاخرة في كل مكان.",
      "أربع غرف نوم وثلاثة حمامات وصالتا استقبال وشرفة كاملة. يتميز المبنى بواجهة مضيئة فارهة ويقع في أحد أرقى عناوين السكن في 6 أكتوبر.",
    ],
    features: ["330 m² area", "4 bedrooms", "3 bathrooms", "Double reception", "Full balcony", "Premium location"],
    featuresAr: ["مساحة 330م²", "4 غرف نوم", "3 حمامات", "صالتا استقبال", "شرفة كاملة", "موقع راقٍ"],
  },
];

export const agencies = [
  {
    id: "ras-el-hekma",
    name: "Ras El Hekma Coastal Resort", nameAr: "منتجع رأس الحكمة الساحلي",
    area: "North Coast", areaAr: "الساحل الشمالي", listings: 12, logo: coastImage,
    phone: "+201025812666",
    specialties: ["Resorts", "Chalets", "Beach Villas"],
    specialtiesAr: ["منتجعات", "شاليهات", "فيلات بحرية"],
    about: "A premier coastal real estate developer operating along Egypt's North Coast. Specializing in resort-style properties, beach chalets, and sea-front investment units.",
    aboutAr: "مطور عقاري ساحلي رائد يعمل على الساحل الشمالي لمصر. متخصص في العقارات بأسلوب المنتجع والشاليهات البحرية ووحدات الاستثمار المطلة على البحر.",
  },
  {
    id: "97-hills",
    name: "97 Hills Developments", nameAr: "تطويرات 97 هيلز",
    area: "New Cairo", areaAr: "القاهرة الجديدة", listings: 8, logo: villaImage,
    phone: "+201025812666",
    specialties: ["Villas", "Twin Houses", "Townhouses"],
    specialtiesAr: ["فيلات", "توين هاوس", "تاون هاوس"],
    about: "Boutique developer creating elevated residential communities in New Cairo's most prestigious neighborhoods. Known for premium finishes and quality construction.",
    aboutAr: "مطور بوتيك يبني مجتمعات سكنية راقية في أحياء القاهرة الجديدة الأكثر تميزاً. معروف بالتشطيبات الفاخرة وجودة البناء.",
  },
  {
    id: "blanca-gardens",
    name: "Blanca Gardens Collection", nameAr: "مجموعة بلانكا جاردنز",
    area: "Somabay", areaAr: "سوما باي", listings: 5, logo: compoundImage,
    phone: "+201025812666",
    specialties: ["Compounds", "Sea-View Villas", "Resort Living"],
    specialtiesAr: ["كمباوندات", "فيلات بإطلالة بحرية", "حياة المنتجع"],
    about: "Exclusive compound specialist in Somabay offering sea-view units and villas with world-class resort amenities and direct beach access.",
    aboutAr: "متخصص في المجمعات الحصرية في سوما باي يقدم وحدات وفيلات بإطلالة بحرية ومرافق منتجعية عالمية ووصول مباشر للشاطئ.",
  },
  {
    id: "solana-east",
    name: "Solana East Living", nameAr: "سولانا إيست ليفينج",
    area: "New Cairo", areaAr: "القاهرة الجديدة", listings: 9, logo: cityImage,
    phone: "+201025812666",
    specialties: ["Apartments", "Offices", "Mixed-Use"],
    specialtiesAr: ["شقق", "مكاتب", "متعدد الاستخدامات"],
    about: "Full-service real estate group offering premium apartments and commercial units in New Cairo's east corridor, combining residential comfort with investment potential.",
    aboutAr: "مجموعة عقارية متكاملة الخدمات تقدم شقق فاخرة ووحدات تجارية في الممر الشرقي للقاهرة الجديدة، تجمع بين الراحة السكنية وإمكانات الاستثمار.",
  },
];

export const faqs = [
  { q: "What is Osoulk?", a: "Osoulk is a premium real estate brokerage platform for discovering verified homes, compounds, agencies, reels, and investment opportunities across Egypt." },
  { q: "How can I sell my property?", a: "Start from Create a Listing, submit your property details and media, then our approval team reviews the listing before it goes live." },
  { q: "Can users upload property reels?", a: "Yes. Reel submission is permission-based: users request access first, then approved accounts can upload reels for moderation." },
];

export const articleCards = [
  { title: "How to choose a compound in New Cairo", category: "Buyer Guide", href: "/articles", image: compoundImage },
  { title: "North Coast investment signals for 2026", category: "Market Insight", href: "/articles", image: coastImage },
  { title: "Why video reels convert premium property leads", category: "Seller Growth", href: "/reels", image: interiorImage },
];

export function PageHero({ kicker, title, subtitle, image = heroImage, children }: { kicker: string; title: string; subtitle: string; image?: string; children?: React.ReactNode }) {
  const { t, lang } = useLang();
  const [slides, setSlides] = useState<{ image: string; title?: string; titleAr?: string; subtitle?: string; subtitleAr?: string; ctaText?: string; ctaTextAr?: string; ctaLink?: string }[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/site-settings")
      .then(async r => {
        if (!r.ok) { const text = await r.text(); throw new Error(`HTTP ${r.status}: ${text}`); }
        return r.json();
      })
      .then((s: { heroSlides?: { image: string; title?: string; titleAr?: string; subtitle?: string; subtitleAr?: string; ctaText?: string; ctaTextAr?: string; ctaLink?: string; enabled?: boolean }[] }) => {
        const enabled = (s.heroSlides ?? []).filter(sl => sl.enabled !== false && sl.image);
        if (enabled.length > 0) setSlides(enabled);
      })
      .catch((err) => { console.error("[site-settings hero] API request failed:", err); });
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const activeImage = slides.length > 0 ? slides[current].image : image;
  const activeSlide = slides[current];

  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-0 -z-10 hero-field" />

      {/* Slide images — cross-fade */}
      {slides.length > 0 ? (
        slides.map((sl, i) => (
          <img
            key={sl.image + i}
            src={sl.image}
            alt=""
            className={`absolute inset-0 -z-10 h-full w-full object-cover opacity-0 transition-opacity duration-1000 ${i === current ? "opacity-35" : ""}`}
          />
        ))
      ) : (
        <img src={activeImage} alt="Luxury real estate background" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35 cinematic-pan" />
      )}

      <div className="os-container grid min-h-[440px] items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
        <div className="max-w-3xl text-primary-foreground reveal-up">
          <p className="section-kicker text-gold-soft">{kicker}</p>
          <h1 className="mt-5 text-5xl font-black leading-tight sm:text-7xl">
            {(lang === "ar" ? activeSlide?.titleAr : activeSlide?.title) || title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/85">
            {(lang === "ar" ? activeSlide?.subtitleAr : activeSlide?.subtitle) || subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {activeSlide?.ctaLink ? (
              <Button asChild size="xl" variant="gold">
                <a href={activeSlide.ctaLink}>{(lang === "ar" ? activeSlide.ctaTextAr : activeSlide.ctaText) || t("hero.explore")}</a>
              </Button>
            ) : (
              <Button asChild size="xl" variant="gold"><Link to="/explore">{t("hero.explore")}</Link></Button>
            )}
            <Button asChild size="xl" variant="outline" className="border-primary-foreground/35 bg-background/10 text-primary-foreground hover:bg-background/20"><Link to="/contact">{t("hero.advice")}</Link></Button>
          </div>

          {/* Slide dots */}
          {slides.length > 1 && (
            <div className="mt-6 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-gold" : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/70"}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="glass-panel rounded-2xl p-5 reveal-up reveal-delay">
          {children ?? <SearchPanel />}
        </div>
      </div>
    </section>
  );
}

export function SearchPanel() {
  const { t } = useLang();
  const [mode, setMode] = useState<"buy" | "rent" | "invest">("buy");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const status = mode === "buy" ? "For Sale" : mode === "rent" ? "For Rent" : "";
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    if (propertyType.trim()) params.set("type", propertyType.trim());
    if (status) params.set("status", status);
    window.location.href = `/explore?${params.toString()}`;
  }

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div>
        <p className="section-kicker">{t("search.kicker")}</p>
        <h2 className="mt-2 text-3xl font-bold text-navy">{t("search.title")}</h2>
      </div>
      <div className="grid gap-3">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="h-12 rounded-lg border bg-background/90 px-4 text-sm"
          placeholder={t("search.keyword")}
        />
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="h-12 rounded-lg border bg-background/90 px-4 text-sm"
          placeholder={t("search.location")}
        />
        <input
          value={propertyType}
          onChange={e => setPropertyType(e.target.value)}
          className="h-12 rounded-lg border bg-background/90 px-4 text-sm"
          placeholder={t("search.type")}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-navy">
        {(["buy", "rent", "invest"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg p-3 transition-colors ${mode === m ? "bg-navy text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
          >
            {t(`search.${m}`)}
          </button>
        ))}
      </div>
      <Button type="submit" className="w-full" size="lg"><Search className="mr-2 h-4 w-4" />{t("search.btn")}</Button>
    </form>
  );
}

function useFadeImg() {
  return function onImgRef(el: HTMLImageElement | null) {
    if (!el) return;
    if (el.complete) { el.classList.add("loaded"); return; }
    el.onload = () => el.classList.add("loaded");
  };
}

export function PropertyCard({ property = properties[0] }: { property?: typeof properties[number] }) {
  const { t, lang } = useLang();
  const [saved, setSaved] = useState(false);
  const imgRef = useFadeImg();

  useEffect(() => {
    setSaved(isSaved(property.id));
  }, [property.id]);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleSaved(property.id);
    setSaved(next);
    window.dispatchEvent(new Event("osoulk-saved-change"));
  }

  const title = lang === "ar" && property.titleAr ? property.titleAr : property.title;
  const location = lang === "ar" && property.locationAr ? property.locationAr : property.location;
  const type = lang === "ar" && property.typeAr ? property.typeAr : property.type;
  const tags = lang === "ar" && property.tagsAr ? property.tagsAr : property.tags;

  return (
    <Link to="/properties/$id" params={{ id: property.id }} className="block">
      <article className="property-card overflow-hidden rounded-2xl border bg-card shadow-float">
        <div className="relative h-56 overflow-hidden bg-secondary">
          <img
            ref={imgRef}
            src={property.image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-primary-foreground">{tag}</span>)}</div>
          <button
            onClick={handleSave}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all ${saved ? "bg-navy text-primary-foreground" : "bg-background/90 text-muted-foreground hover:text-navy"}`}
            aria-label={saved ? t("property.saved") : t("property.save")}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs font-black uppercase text-muted-foreground">{type}</p>
          <h3 className="mt-2 text-xl font-black text-navy">{property.price}</h3>
          <p className="mt-1 font-bold">{title}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{location}</p>
          <div className="mt-4 flex items-center justify-between text-sm font-bold text-ink-soft">
            <span>{property.area}</span>
            <span className="flex gap-2"><Phone className="h-4 w-4" /> {t("whatsapp")}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function SectionHeader({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="section-kicker">{kicker}</p>
      <h2 className="mt-3 text-4xl font-black text-navy sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-muted-foreground">{text}</p>}
    </div>
  );
}

export function ListingGrid({ filtered }: { filtered?: typeof properties }) {
  const list = filtered ?? properties;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {list.length === 0 ? (
        <p className="col-span-3 py-12 text-center text-muted-foreground font-bold">No properties match your filters.</p>
      ) : (
        list.map(p => <PropertyCard key={p.id} property={p} />)
      )}
    </div>
  );
}

export function TrustSection() {
  const { t } = useLang();
  const stats = [
    ["9+", t("trust.properties")],
    ["4", t("trust.developers")],
    ["3", t("trust.compounds")],
    ["100%", t("trust.verified")],
  ];
  return (
    <section className="py-16">
      <div className="os-container premium-card p-8 sm:p-12">
        <SectionHeader kicker={t("trust.kicker")} title={t("trust.title")} text={t("trust.text")} />
        <div className="grid gap-4 sm:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-background p-6 text-center shadow-float">
              <div className="text-3xl font-black text-navy">{n}</div>
              <div className="mt-2 text-sm font-bold text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppCTA() {
  const { t } = useLang();
  const [appNotice, setAppNotice] = useState<string | null>(null);

  function handleAppBtn(store: string) {
    setAppNotice(store);
    setTimeout(() => setAppNotice(null), 3000);
  }

  return (
    <section className="py-12">
      <div className="os-container grid items-center gap-8 rounded-2xl border bg-secondary p-8 shadow-float md:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="section-kicker">{t("app.kicker")}</p>
          <h2 className="mt-2 text-4xl font-black text-navy">{t("app.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("app.text")}</p>
          {appNotice && (
            <p className="mt-3 rounded-xl bg-navy/10 px-4 py-2 text-sm font-bold text-navy">
              {appNotice} — {t("app.title").includes("Download") ? "Coming Soon!" : "قريباً!"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-start gap-3 md:justify-end">
          <Button variant="luxury" onClick={() => handleAppBtn(t("app.appStore"))}>{t("app.appStore")}</Button>
          <Button variant="outline" onClick={() => handleAppBtn(t("app.googlePlay"))}>{t("app.googlePlay")}</Button>
        </div>
      </div>
    </section>
  );
}

export function ConsultationForm() {
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  }

  return (
    <section className="py-16">
      <div className="os-container grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="section-kicker">{t("consult.kicker")}</p>
          <h2 className="mt-3 text-4xl font-black text-navy">{t("consult.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("consult.text")}</p>
          <div className="mt-8 space-y-4 text-sm font-bold">
            <p className="flex gap-3"><MapPin className="text-aqua" /> {t("consult.address")}</p>
            <p className="flex gap-3"><Phone className="text-aqua" /><span dir="ltr">+201025812666</span></p>
          </div>
        </div>
        {submitted ? (
          <div className="premium-card grid place-items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aqua/10">
              <MapPin className="h-8 w-8 text-aqua" />
            </div>
            <h3 className="text-2xl font-black text-navy">{t("create.successTitle")}</h3>
            <p className="text-muted-foreground">{t("consult.text")}</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              {t("error.retry")}
            </Button>
          </div>
        ) : (
          <form className="premium-card grid gap-4 p-6" onSubmit={handleSubmit}>
            <input required className="h-12 rounded-lg border bg-background px-4" placeholder={t("consult.name")} />
            <select className="h-12 rounded-lg border bg-background px-4">
              <option>{t("consult.location")}</option>
              <option>{t("consult.newCairo")}</option>
              <option>{t("consult.northCoast")}</option>
            </select>
            <input required className="h-12 rounded-lg border bg-background px-4" placeholder={t("consult.phone")} />
            <textarea className="min-h-32 rounded-lg border bg-background p-4" placeholder={t("consult.message")} />
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? t("loading") : t("consult.submit")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export function FAQPreview() {
  const { t, lang } = useLang();
  const faqData = lang === "ar" ? faqsAr : faqs;
  const links = ["/about", "/create-listing", "/reels"];
  return (
    <section className="py-14">
      <div className="os-container">
        <SectionHeader kicker={t("faq.kicker")} title={t("faq.title")} />
        <div className="mx-auto max-w-4xl space-y-3">
          {faqData.map((f, i) => (
            <details key={f.q} open={i === 0} className="rounded-xl border bg-card p-5 shadow-float">
              <summary className="cursor-pointer font-black text-navy">{f.q}</summary>
              <p className="mt-3 text-muted-foreground">
                {f.a}{" "}
                <Link to={links[i] as "/" | "/about" | "/create-listing" | "/reels"} className="font-bold text-navy underline">
                  {lang === "ar" ? "اعرف المزيد" : "Learn more"}
                </Link>
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t, lang } = useLang();
  const [cmsPages, setCmsPages] = useState<{ slug: string; title: string; titleAr: string }[]>([]);
  const cols = [
    { head: t("footer.col1"), items: [t("footer.col1.1"), t("footer.col1.2"), t("footer.col1.3")] },
    { head: t("footer.col2"), items: [t("footer.col2.1"), t("footer.col2.2"), t("footer.col2.3")] },
    { head: t("footer.col3"), items: [t("footer.col3.1"), t("footer.col3.2"), t("footer.col3.3")] },
  ];

  useEffect(() => {
    fetch("/api/pages")
      .then(async r => {
        if (!r.ok) { const text = await r.text(); throw new Error(`HTTP ${r.status}: ${text}`); }
        return r.json();
      })
      .then((pages: { slug: string; title: string; titleAr: string; showInFooter?: boolean }[]) => {
        setCmsPages(pages.filter(p => p.showInFooter));
      })
      .catch((err) => { console.error("[pages footer] API request failed:", err); });
  }, []);

  return (
    <footer className="mt-10 bg-card pb-24 pt-12 md:pb-12">
      <div className="os-container grid gap-10 md:grid-cols-4">
        <div>
          <h3 className="text-3xl font-black text-navy">OSOULK</h3>
          <p className="mt-3 text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-navy p-2 text-primary-foreground"><Phone className="h-4 w-4" /></span>
            <span className="rounded-full bg-navy p-2 text-primary-foreground"><Globe2 className="h-4 w-4" /></span>
          </div>
        </div>
        {cols.map(col => (
          <div key={col.head}>
            <h4 className="font-black text-navy">{col.head}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {col.items.map(x => <li key={x}>› {x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="os-container mt-10 flex flex-wrap justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
        <span>{t("footer.copy")}</span>
        <div className="flex flex-wrap gap-4">
          <Link to="/explore">{t("footer.explore")}</Link>
          <Link to="/articles">{t("footer.articles")}</Link>
          <Link to="/faqs">{t("footer.faqs")}</Link>
          {cmsPages.map(p => (
            <Link key={p.slug} to="/pages/$slug" params={{ slug: p.slug }}>
              {lang === "ar" && p.titleAr ? p.titleAr : p.title}
            </Link>
          ))}
          <Link to="/admin">{t("footer.admin")}</Link>
        </div>
      </div>
    </footer>
  );
}

export const icons = { ArrowRight, BadgeCheck, Building2, Camera, Check, ChevronRight, Crown, Eye, FileCheck2, Gem, Home, KeyRound, Landmark, Layers3, Play, ShieldCheck, Sparkles, Star, Upload, Users, Video, WalletCards };
