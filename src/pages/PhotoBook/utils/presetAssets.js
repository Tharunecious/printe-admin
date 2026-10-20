/**
 * Curated Presets for Photo Book Editor: Backgrounds, Gradients, Vector Decorations, Typography
 */

export const PRESET_SOLID_COLORS = [
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0",
  "#1e1e2d", "#0f172a", "#18181b", "#27272a",
  "#fef2f2", "#fee2e2", "#fca5a5", "#ef4444",
  "#fdf4ff", "#fae8ff", "#e879f9", "#a855f7",
  "#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6",
  "#ecfdf5", "#d1fae5", "#6ee7b7", "#10b981",
  "#fefce8", "#fef08a", "#fde047", "#eab308",
  "#fff7ed", "#ffedd5", "#fdba74", "#f97316",
  "#f5f5f4", "#e7e5e4", "#d6d3d1", "#78716c",
  "#14532d", "#1e3a8a", "#4c1d95", "#831843",
];

export const PRESET_GRADIENTS = [
  { name: "Velvet Midnight", value: "linear-gradient(135deg, #1e1e2d 0%, #0f172a 100%)" },
  { name: "Golden Sunset", value: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)" },
  { name: "Rose Blush", value: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fda4af 100%)" },
  { name: "Champagne Luxury", value: "linear-gradient(135deg, #fefce8 0%, #fef08a 60%, #e2b714 100%)" },
  { name: "Ocean Breeze", value: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #93c5fd 100%)" },
  { name: "Sage Serenity", value: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #86efac 100%)" },
  { name: "Lavender Dream", value: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 60%, #d8b4fe 100%)" },
  { name: "Monochrome Studio", value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" },
  { name: "Dark Emerald", value: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" },
  { name: "Royal Indigo", value: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)" },
];

export const PRESET_FONTS = [
  { family: "Playfair Display", label: "Playfair Display (Serif / Luxury)", category: "serif" },
  { family: "Cinzel", label: "Cinzel (Classic / Regal)", category: "serif" },
  { family: "Cormorant Garamond", label: "Cormorant Garamond (Refined Editorial)", category: "serif" },
  { family: "Inter", label: "Inter (Modern Sans)", category: "sans-serif" },
  { family: "Montserrat", label: "Montserrat (Clean Geometric)", category: "sans-serif" },
  { family: "Caveat", label: "Caveat (Handwritten Signature)", category: "handwriting" },
  { family: "Dancing Script", label: "Dancing Script (Elegant Script)", category: "handwriting" },
  { family: "Great Vibes", label: "Great Vibes (Formal Calligraphy)", category: "handwriting" },
  { family: "Merriweather", label: "Merriweather (Classic Book)", category: "serif" },
  { family: "Roboto", label: "Roboto (Clean Standard)", category: "sans-serif" },
];

export const SAMPLE_TEST_PHOTOS = [
  {
    name: "Happy Couple Wedding",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Joyful Smiling Child",
    url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Golden Hour Mountain Travel",
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Family Portrait Outdoor",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Newborn Baby Sweet Sleep",
    url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Ocean Beach Sunset",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
  },
];

// Rich SVG Vector Decorations
export const PRESET_DECORATIONS = [
  {
    id: "dec_wreath",
    name: "Floral Laurel Wreath",
    category: "Wedding & Floral",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M50 85 C30 85 15 65 15 45 C15 25 35 15 45 15 M50 85 C70 85 85 65 85 45 C85 25 65 15 55 15"/><circle cx="20" cy="50" r="3" fill="currentColor"/><circle cx="80" cy="50" r="3" fill="currentColor"/><circle cx="30" cy="70" r="3" fill="currentColor"/><circle cx="70" cy="70" r="3" fill="currentColor"/><circle cx="30" cy="30" r="3" fill="currentColor"/><circle cx="70" cy="30" r="3" fill="currentColor"/></svg>`,
  },
  {
    id: "dec_botanical_branch",
    name: "Olive Botanical Branch",
    category: "Wedding & Floral",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 90 Q40 50 90 20"/><path d="M30 70 Q25 55 35 50 Q45 60 30 70" fill="currentColor" fill-opacity="0.3"/><path d="M50 50 Q45 35 55 30 Q65 40 50 50" fill="currentColor" fill-opacity="0.3"/><path d="M70 33 Q65 18 75 15 Q85 25 70 33" fill="currentColor" fill-opacity="0.3"/><path d="M35 75 Q50 80 50 70 Q40 65 35 75" fill="currentColor" fill-opacity="0.3"/><path d="M55 55 Q70 60 70 50 Q60 45 55 55" fill="currentColor" fill-opacity="0.3"/></svg>`,
  },
  {
    id: "dec_double_hearts",
    name: "Intertwined Hearts",
    category: "Love & Romance",
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M35 60 C15 45 10 32 10 23 C10 12 18 5 28 5 C35 5 41 9 44 15 C47 9 53 5 60 5 C70 5 78 12 78 23 C78 32 73 45 53 60 L44 68 Z" fill-opacity="0.75"/><path d="M55 75 C38 62 33 51 33 43 C33 34 40 28 48 28 C54 28 59 31 62 36 C65 31 70 28 76 28 C84 28 91 34 91 43 C91 51 86 62 70 75 L62 82 Z" stroke="#ffffff" stroke-width="2"/></svg>`,
  },
  {
    id: "dec_vintage_ribbon",
    name: "Banner Ribbon",
    category: "Badges & Banners",
    svg: `<svg viewBox="0 0 120 40" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 30 L25 10 L95 10 L110 30 L95 25 L25 25 Z" fill="currentColor" fill-opacity="0.15"/><path d="M15 10 L25 25 L10 30 Z" fill="currentColor"/><path d="M105 10 L95 25 L110 30 Z" fill="currentColor"/></svg>`,
  },
  {
    id: "dec_sparkle_stars",
    name: "Golden Sparkles",
    category: "Celebration",
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 10 Q50 40 20 50 Q50 60 50 90 Q50 60 80 50 Q50 40 50 10 Z"/><path d="M80 15 Q80 25 70 30 Q80 35 80 45 Q80 35 90 30 Q80 25 80 15 Z" fill-opacity="0.7"/><path d="M25 65 Q25 72 18 75 Q25 78 25 85 Q25 78 32 75 Q25 72 25 65 Z" fill-opacity="0.7"/></svg>`,
  },
  {
    id: "dec_ornate_corner",
    name: "Vintage Ornate Corner",
    category: "Borders & Frames",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 90 L10 20 Q10 10 20 10 L90 10"/><path d="M18 80 L18 24 Q18 18 24 18 L80 18"/><circle cx="28" cy="28" r="4" fill="currentColor"/><path d="M35 18 C35 25 25 35 18 35"/></svg>`,
  },
  {
    id: "dec_camera_retro",
    name: "Retro Memory Camera",
    category: "Icons",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><rect x="15" y="30" width="70" height="50" rx="8" fill="currentColor" fill-opacity="0.15"/><circle cx="50" cy="55" r="16"/><circle cx="50" cy="55" r="8" fill="currentColor"/><path d="M35 30 L42 20 L58 20 L65 30"/><circle cx="72" cy="40" r="3" fill="currentColor"/></svg>`,
  },
  {
    id: "dec_wax_seal",
    name: "Royal Wax Seal",
    category: "Badges & Banners",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><circle cx="50" cy="50" r="40" stroke-dasharray="4 2"/><circle cx="50" cy="50" r="34" fill="currentColor" fill-opacity="0.15"/><path d="M42 45 Q50 35 58 45 Q50 65 42 45" fill="currentColor"/><circle cx="50" cy="50" r="24" stroke="currentColor"/></svg>`,
  },
];
