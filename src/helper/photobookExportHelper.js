import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getPhotoBookDesign, getPhotoBookTemplateById } from "../api";
import { PRESET_STUDIO_SIZES } from "../pages/PhotoBook/utils/sizeUtils";
import { getFontFamilyFallback, PRESET_DECORATIONS } from "../pages/PhotoBook/utils/presetAssets";
import { getElementCoords } from "../pages/PhotoBook/utils/textUtils";

// ── Google Fonts List & Dynamic Font Preloader ───────────────────────────────
const GOOGLE_FONTS_LIST = [
  "Playfair Display",
  "Montserrat",
  "Great Vibes",
  "Dancing Script",
  "Cinzel",
  "Cormorant Garamond",
  "Alex Brush",
  "Lora",
  "Merriweather",
  "Oswald",
  "Raleway",
  "Pacifico",
  "Caveat",
  "Allura",
  "Parisienne",
  "Abril Fatface",
  "Italianno",
  "Pinyon Script",
  "Marcellus",
  "Bodoni Moda",
  "Inter",
  "Jost",
  "Roboto",
];

export const injectExportGoogleFonts = () => {
  if (typeof document === "undefined") return;
  const linkId = "photobook-admin-export-google-fonts";
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    const families = GOOGLE_FONTS_LIST.map(
      (f) => `family=${f.replace(/\s+/g, "+")}:ital,wght@0,300..900;1,300..900`
    ).join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }
};

export const ensureFontsLoaded = async (fonts = []) => {
  injectExportGoogleFonts();
  if (typeof document === "undefined" || !document.fonts) return;

  const fontFamilies = Array.from(new Set(fonts.filter(Boolean)));
  const loadPromises = fontFamilies.map(async (family) => {
    try {
      await document.fonts.load(`16px "${family}"`);
      await document.fonts.load(`bold 16px "${family}"`);
      await document.fonts.load(`italic 16px "${family}"`);
    } catch (e) {}
  });

  try {
    await Promise.race([
      Promise.all(loadPromises),
      new Promise((res) => setTimeout(res, 2500)),
    ]);
    await document.fonts.ready;
  } catch (e) {}
};

// ── Resolve Book Dimensions at 300 DPI ───────────────────────────────────────
export const resolveBookDimensions300DPI = (rawSize, optionalSizes = []) => {
  const DPI = 300;

  // 1. If size is already an object with dimensions
  if (typeof rawSize === "object" && rawSize !== null) {
    let win = Number(rawSize.width_in || rawSize.width);
    let hin = Number(rawSize.height_in || rawSize.height);
    if ((!win || !hin) && rawSize.width_cm && rawSize.height_cm) {
      win = +(Number(rawSize.width_cm) / 2.54).toFixed(2);
      hin = +(Number(rawSize.height_cm) / 2.54).toFixed(2);
    }
    if (win && hin) {
      return {
        widthInches: win,
        heightInches: hin,
        widthPx: Math.round(win * DPI),
        heightPx: Math.round(hin * DPI),
        aspectRatio: win / hin,
        label: `${win}x${hin} in`,
      };
    }
  }

  const str = String(rawSize || "").trim();

  // 2. Check in optional configuration sizes list
  if (Array.isArray(optionalSizes) && optionalSizes.length > 0) {
    const matched = optionalSizes.find(
      (s) =>
        s &&
        (String(s._id) === str ||
          String(s.id) === str ||
          String(s.name || "").trim().toLowerCase() === str.toLowerCase())
    );
    if (matched) {
      return resolveBookDimensions300DPI(matched);
    }
  }

  // 3. Check preset studio sizes
  const preset = (PRESET_STUDIO_SIZES || []).find(
    (p) =>
      p &&
      (p.id.toLowerCase() === str.toLowerCase() ||
        p.name.toLowerCase() === str.toLowerCase())
  );
  if (preset) {
    return {
      widthInches: preset.width_in,
      heightInches: preset.height_in,
      widthPx: Math.round(preset.width_in * DPI),
      heightPx: Math.round(preset.height_in * DPI),
      aspectRatio: preset.width_in / preset.height_in,
      label: preset.name,
    };
  }

  // 4. Regex dimension matcher: "W x H in" or "W x H" or "W*H" (e.g. "8.27 x 11.69 in", "10x10 in", "12x12 inch")
  const dimMatch = str.match(/(\d+(\.\d+)?)\s*[xX×*]\s*(\d+(\.\d+)?)/);
  if (dimMatch) {
    const win = parseFloat(dimMatch[1]);
    const hin = parseFloat(dimMatch[3]);
    if (win > 0 && hin > 0) {
      return {
        widthInches: win,
        heightInches: hin,
        widthPx: Math.round(win * DPI),
        heightPx: Math.round(hin * DPI),
        aspectRatio: win / hin,
        label: `${win}x${hin} in`,
      };
    }
  }

  // 5. Standard paper name mappings
  const lower = str.toLowerCase();
  if (lower.includes("a4") && lower.includes("landscape")) {
    return { widthInches: 11.69, heightInches: 8.27, widthPx: 3508, heightPx: 2480, aspectRatio: 11.69 / 8.27, label: "A4 Landscape" };
  }
  if (lower.includes("a4")) {
    return { widthInches: 8.27, heightInches: 11.69, widthPx: 2480, heightPx: 3508, aspectRatio: 8.27 / 11.69, label: "A4" };
  }
  if (lower.includes("a5")) {
    return { widthInches: 5.83, heightInches: 8.27, widthPx: 1748, heightPx: 2480, aspectRatio: 5.83 / 8.27, label: "A5" };
  }
  if (lower.includes("a3")) {
    return { widthInches: 11.69, heightInches: 16.54, widthPx: 3508, heightPx: 4960, aspectRatio: 11.69 / 16.54, label: "A3" };
  }
  if (lower.includes("12x12") || lower.includes("12 x 12")) {
    return { widthInches: 12.0, heightInches: 12.0, widthPx: 3600, heightPx: 3600, aspectRatio: 1.0, label: "12x12 inch" };
  }
  if (lower.includes("10x10") || lower.includes("10 x 10")) {
    return { widthInches: 10.0, heightInches: 10.0, widthPx: 3000, heightPx: 3000, aspectRatio: 1.0, label: "10x10 inch" };
  }
  if (lower.includes("8x8") || lower.includes("8 x 8") || lower.includes("square")) {
    return { widthInches: 8.0, heightInches: 8.0, widthPx: 2400, heightPx: 2400, aspectRatio: 1.0, label: "8x8 inch" };
  }

  // Default print standard fallback: A4 @ 300 DPI
  return { widthInches: 8.27, heightInches: 11.69, widthPx: 2480, heightPx: 3508, aspectRatio: 8.27 / 11.69, label: "A4" };
};

// ── Reliable Cross-Origin Image Loader with Cache-Busting Fallback ───────────
const loadImageSafe = async (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return null;
  }
  const cleanSrc = src.trim();

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = async () => {
      // Fallback 1: Fetch blob with CORS and anti-cache parameter to avoid browser tainted cache
      try {
        const delimiter = cleanSrc.includes("?") ? "&" : "?";
        const noCacheUrl = `${cleanSrc}${delimiter}_pb_nocache=${Date.now()}`;
        const response = await fetch(noCacheUrl, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            URL.revokeObjectURL(objUrl);
            resolve(fallbackImg);
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(objUrl);
            resolve(null);
          };
          fallbackImg.src = objUrl;
          return;
        }
      } catch (e) {}

      // Fallback 2: Direct fetch without query param
      try {
        const response = await fetch(cleanSrc, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            URL.revokeObjectURL(objUrl);
            resolve(fallbackImg);
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(objUrl);
            resolve(null);
          };
          fallbackImg.src = objUrl;
          return;
        }
      } catch (e) {}

      resolve(null);
    };
    img.src = cleanSrc;
  });
};

// ── Linear Gradient Parser for Canvas ─────────────────────────────────────────
const parseLinearGradient = (ctx, cssGradient, width, height) => {
  const match = String(cssGradient || "").match(/linear-gradient\((.*)\)/i);
  if (!match) return null;
  const content = match[1].trim();

  // Split content by comma ignoring commas inside rgb/rgba/hsl
  const parts = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === "(") parenDepth++;
    else if (c === ")") parenDepth--;
    if (c === "," && parenDepth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current.trim());
  if (parts.length === 0) return null;

  let angleDeg = 180; // default top to bottom
  let stopStartIndex = 0;
  const first = parts[0].toLowerCase();

  if (first.includes("deg")) {
    angleDeg = parseFloat(first);
    stopStartIndex = 1;
  } else if (first.includes("to right")) {
    angleDeg = 90;
    stopStartIndex = 1;
  } else if (first.includes("to bottom right") || first.includes("to right bottom")) {
    angleDeg = 135;
    stopStartIndex = 1;
  } else if (first.includes("to bottom")) {
    angleDeg = 180;
    stopStartIndex = 1;
  } else if (first.includes("to left")) {
    angleDeg = 270;
    stopStartIndex = 1;
  } else if (first.includes("to top")) {
    angleDeg = 0;
    stopStartIndex = 1;
  }

  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const len = (Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad))) / 2;
  const x0 = cx - Math.cos(rad) * len;
  const y0 = cy - Math.sin(rad) * len;
  const x1 = cx + Math.cos(rad) * len;
  const y1 = cy + Math.sin(rad) * len;

  const rawStops = parts.slice(stopStartIndex);
  if (rawStops.length === 0) return null;

  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  rawStops.forEach((s, idx) => {
    const sTrim = s.trim();
    const pctMatch = sTrim.match(/([0-9.]+)%$/);
    let color = sTrim;
    let offset = null;
    if (pctMatch) {
      offset = parseFloat(pctMatch[1]) / 100;
      color = sTrim.slice(0, pctMatch.index).trim();
    } else {
      offset = rawStops.length === 1 ? 0 : idx / (rawStops.length - 1);
    }
    const clampedOffset = Math.max(0, Math.min(1, offset));
    try {
      grad.addColorStop(clampedOffset, color);
    } catch (e) {
      // Fallback in case of hex color format issues
      try {
        grad.addColorStop(clampedOffset, "#000000");
      } catch (ignore) {}
    }
  });

  return grad;
};

// ── SVG Path Scaler for Resolution-Independent Shape Clipping ────────────────
const parseAndScaleSvgPath = (d, w, h) => {
  const tokens = String(d || "").match(/([a-zA-Z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/g) || [];
  const result = [];
  let isX = true;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[a-zA-Z]$/.test(t)) {
      result.push(t);
      if (t.toUpperCase() === "Z") {
        isX = true;
      } else if (t.toUpperCase() === "H") {
        isX = true;
      } else if (t.toUpperCase() === "V") {
        isX = false;
      } else {
        isX = true;
      }
    } else {
      const val = parseFloat(t);
      if (isNaN(val)) {
        result.push(t);
      } else {
        const scaled = isX ? val * w : val * h;
        result.push(scaled.toFixed(2));
        isX = !isX;
      }
    }
  }
  return result.join(" ");
};

const polygonPointsToSvgPath = (pointsStr) => {
  const pairs = String(pointsStr || "").trim().split(/\s+/);
  const pathParts = [];
  pairs.forEach((pair, idx) => {
    const [x, y] = pair.split(",");
    if (x !== undefined && y !== undefined) {
      pathParts.push(`${idx === 0 ? "M" : "L"} ${x} ${y}`);
    }
  });
  pathParts.push("Z");
  return pathParts.join(" ");
};

// ── Shape Path Generator for Canvas ──────────────────────────────────────────
const getCanvasShapePath = (shape, w, h, cornerRadius = 0) => {
  const normShape = String(shape || "rectangle").toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (normShape === "circle" || normShape === "round") {
    const p = new Path2D();
    p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    return p;
  }

  if (normShape === "oval" || normShape === "ellipse") {
    const p = new Path2D();
    p.ellipse(w / 2, h / 2, w / 2, h * 0.38, 0, 0, Math.PI * 2);
    return p;
  }

  if (normShape === "rectangle" || normShape === "rect" || !normShape) {
    const p = new Path2D();
    if (cornerRadius > 0 && typeof p.roundRect === "function") {
      p.roundRect(0, 0, w, h, cornerRadius);
    } else if (cornerRadius > 0) {
      const r = Math.min(cornerRadius, w / 2, h / 2);
      p.moveTo(r, 0);
      p.lineTo(w - r, 0);
      p.quadraticCurveTo(w, 0, w, r);
      p.lineTo(w - r, h);
      p.quadraticCurveTo(w, h, w - r, h);
      p.lineTo(r, h);
      p.quadraticCurveTo(0, h, 0, h - r);
      p.lineTo(0, r);
      p.quadraticCurveTo(0, 0, r, 0);
      p.closePath();
    } else {
      p.rect(0, 0, w, h);
    }
    return p;
  }

  let d = "";
  if (normShape === "heart") {
    d = "M 0.5,0.88 C 0.08,0.58 0,0.38 0,0.25 C 0,0.1 0.12,0 0.27,0 C 0.38,0 0.46,0.06 0.5,0.16 C 0.54,0.06 0.62,0 0.73,0 C 0.88,0 1,0.1 1,0.25 C 1,0.38 0.92,0.58 0.5,0.88 Z";
  } else if (normShape === "star") {
    d = polygonPointsToSvgPath("0.5,0.02 0.63,0.36 0.98,0.38 0.71,0.61 0.79,0.96 0.5,0.77 0.21,0.96 0.29,0.61 0.02,0.38 0.37,0.36");
  } else if (normShape === "hexagon") {
    d = polygonPointsToSvgPath("0.5,0.02 0.95,0.26 0.95,0.74 0.5,0.98 0.05,0.74 0.05,0.26");
  } else if (normShape === "arch") {
    d = "M 0,1 L 0,0.45 C 0,0.2 0.22,0 0.5,0 C 0.78,0 1,0.2 1,0.45 L 1,1 Z";
  } else if (normShape === "scallop") {
    d = "M 0.5,0.05 C 0.58,0 0.68,0.03 0.72,0.1 C 0.77,0.08 0.86,0.12 0.88,0.18 C 0.94,0.21 0.98,0.3 0.97,0.37 C 1.01,0.43 1,0.52 0.96,0.57 C 1,0.63 0.98,0.72 0.92,0.77 C 0.92,0.84 0.86,0.91 0.79,0.92 C 0.76,0.98 0.68,1 0.61,0.98 C 0.56,1.02 0.46,1.02 0.41,0.98 C 0.34,1 0.26,0.98 0.23,0.92 C 0.16,0.91 0.1,0.84 0.1,0.77 C 0.04,0.72 0.02,0.63 0.06,0.57 C 0.02,0.52 0.01,0.43 0.05,0.37 C 0.04,0.3 0.08,0.21 0.14,0.18 C 0.16,0.12 0.25,0.08 0.3,0.1 C 0.34,0.03 0.44,0 0.5,0.05 Z";
  }

  if (d && typeof Path2D !== "undefined") {
    const scaledD = parseAndScaleSvgPath(d, w, h);
    return new Path2D(scaledD);
  }

  const fallback = new Path2D();
  fallback.rect(0, 0, w, h);
  return fallback;
};

// ── Resolve DB Decoration Data (Vector or Asset Image) ───────────────────────
const resolveDecorationData = (el, templateData) => {
  // 1. Direct asset_url or svg on element
  if (el.asset_url) return { type: "image", src: el.asset_url };
  if (el.svg) return { type: "svg", content: el.svg };
  if (el.custom_svg) return { type: "svg", content: el.custom_svg };

  // 2. Check in template decorations catalog or template pages
  if (templateData) {
    const tplDecs = Array.isArray(templateData.decorations) ? templateData.decorations : [];
    const matchedDec = tplDecs.find(
      (d) =>
        (d.id && d.id === el.preset_id) ||
        (d.preset_id && d.preset_id === el.preset_id) ||
        (d.name && el.name && d.name.toLowerCase() === el.name.toLowerCase())
    );
    if (matchedDec) {
      if (matchedDec.asset_url) return { type: "image", src: matchedDec.asset_url };
      if (matchedDec.svg) return { type: "svg", content: matchedDec.svg };
    }

    // Check template pages elements
    if (Array.isArray(templateData.pages)) {
      for (const pg of templateData.pages) {
        for (const tplEl of pg.elements || []) {
          if (
            tplEl.type === "decoration" &&
            ((tplEl.preset_id && tplEl.preset_id === el.preset_id) ||
              (tplEl.id && tplEl.id === el.id) ||
              (tplEl.name && el.name && tplEl.name.toLowerCase() === el.name.toLowerCase()))
          ) {
            if (tplEl.asset_url) return { type: "image", src: tplEl.asset_url };
            if (tplEl.svg) return { type: "svg", content: tplEl.svg };
          }
        }
      }
    }
  }

  // 3. Check PRESET_DECORATIONS
  if (Array.isArray(PRESET_DECORATIONS)) {
    const matchedPreset = PRESET_DECORATIONS.find(
      (p) =>
        (p.id && p.id === el.preset_id) ||
        (p.name && el.name && p.name.toLowerCase() === el.name.toLowerCase())
    );
    if (matchedPreset) {
      if (matchedPreset.asset_url) return { type: "image", src: matchedPreset.asset_url };
      if (matchedPreset.svg) return { type: "svg", content: matchedPreset.svg };
    }
  }

  // 4. Built-in vector shapes
  const shape = String(el.shape || el.custom_svg_path || "").toLowerCase();
  if (shape === "heart") {
    return {
      type: "svg",
      content: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M 50,85 C 10,60 0,35 15,15 C 30,-5 48,8 50,22 C 52,8 70,-5 85,15 C 100,35 90,60 50,85 Z" /></svg>`,
    };
  }
  if (shape === "star") {
    return {
      type: "svg",
      content: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M 50,2 L 64,32 L 98,35 L 72,58 L 80,92 L 50,74 L 20,92 L 28,58 L 2,35 L 36,32 Z" /></svg>`,
    };
  }
  if (shape === "butterfly") {
    return {
      type: "svg",
      content: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 45 C40 10 5 15 15 50 C20 65 40 60 50 55 C60 60 80 65 85 50 C95 15 60 10 50 45 Z M50 55 C42 65 30 90 45 92 C55 90 52 70 50 55 M50 55 C58 65 70 90 55 92 C45 90 48 70 50 55" /></svg>`,
    };
  }
  if (shape === "flower") {
    return {
      type: "svg",
      content: `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="15" fill="#f59e0b"/><circle cx="50" cy="20" r="16"/><circle cx="50" cy="80" r="16"/><circle cx="20" cy="50" r="16"/><circle cx="80" cy="50" r="16"/></svg>`,
    };
  }

  return null;
};

// ── Text Wrapping Helper for Canvas ──────────────────────────────────────────
const wrapTextLines = (ctx, text, maxWidth) => {
  const paragraphs = String(text || "").split("\n");
  const resultLines = [];

  for (const para of paragraphs) {
    if (!para || para.trim() === "") {
      resultLines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        resultLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines;
};

// ── Render Single Photobook Page to High-Resolution Canvas (300 DPI) ─────────
export const renderPageToCanvas = async (page, { widthPx, heightPx, templateData = null }) => {
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");

  // Smooth antialiasing & image quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Draw Default White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  // 2. Custom Background (image, gradient, or color)
  const bg = page.background || {};
  const isImage =
    bg.type === "image" ||
    (typeof bg.value === "string" &&
      (bg.value.startsWith("http://") ||
        bg.value.startsWith("https://") ||
        bg.value.startsWith("/uploads/") ||
        bg.value.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i.test(bg.value)));

  const isGradient =
    bg.type === "gradient" ||
    (typeof bg.value === "string" && bg.value.startsWith("linear-gradient")) ||
    (typeof bg === "string" && bg.startsWith("linear-gradient"));

  if (isGradient) {
    const gradStr = bg.value || bg;
    const linearGrad = parseLinearGradient(ctx, gradStr, widthPx, heightPx);
    if (linearGrad) {
      ctx.save();
      ctx.globalAlpha = bg.opacity !== undefined ? Number(bg.opacity) : 1;
      ctx.fillStyle = linearGrad;
      ctx.fillRect(0, 0, widthPx, heightPx);
      ctx.restore();
    }
  } else if (isImage) {
    const bgUrl = bg.value || bg.image_url || bg.url;
    const bgImg = await loadImageSafe(bgUrl);
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = bg.opacity !== undefined ? Number(bg.opacity) : 1;

      const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasRatio = widthPx / heightPx;
      const fitMode = bg.fit_mode || "cover";
      const scale = bg.scale && bg.scale > 1 ? Number(bg.scale) : 1;

      let dw, dh;
      if (fitMode === "stretch" || fitMode === "100% 100%") {
        dw = widthPx;
        dh = heightPx;
      } else if (fitMode === "contain") {
        if (imgRatio > canvasRatio) {
          dw = widthPx * scale;
          dh = (widthPx / imgRatio) * scale;
        } else {
          dh = heightPx * scale;
          dw = heightPx * imgRatio * scale;
        }
      } else {
        // cover
        if (imgRatio > canvasRatio) {
          dh = heightPx * scale;
          dw = heightPx * imgRatio * scale;
        } else {
          dw = widthPx * scale;
          dh = (widthPx / imgRatio) * scale;
        }
      }

      const posXRatio = (bg.position_x !== undefined ? Number(bg.position_x) : 50) / 100;
      const posYRatio = (bg.position_y !== undefined ? Number(bg.position_y) : 50) / 100;
      const dx = (widthPx - dw) * posXRatio;
      const dy = (heightPx - dh) * posYRatio;

      ctx.drawImage(bgImg, dx, dy, dw, dh);
      ctx.restore();
    }
  } else if (bg.value || (typeof bg === "string" && bg.length > 0)) {
    const colorVal = bg.value || bg;
    ctx.save();
    ctx.globalAlpha = bg.opacity !== undefined ? Number(bg.opacity) : 1;
    ctx.fillStyle = colorVal;
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.restore();
  }

  // 3. Render Elements in Strict Z-Index Order
  const elements = (page.elements || []).slice().sort((a, b) => (a.z_index || 1) - (b.z_index || 1));
  const baseDesignWidth = 707;
  const scaleFactor = widthPx / baseDesignWidth;

  for (const el of elements) {
    if (el.is_hidden) continue;

    const coords = getElementCoords(el);
    const leftPx = (coords.left / 100) * widthPx;
    const topPx = (coords.top / 100) * heightPx;
    const widthElPx = (coords.width / 100) * widthPx;

    const shape = el.shape || el.mask_shape || "rectangle";
    const is1to1Shape =
      el.type === "photo_frame" &&
      ["circle", "heart", "star", "scallop", "hexagon"].includes(shape);
    const heightElPx = is1to1Shape ? widthElPx : (coords.height / 100) * heightPx;

    const rotation = el.rotation || 0;

    // ── Element Type 1: Photo Frame ──────────────────────────────────────────
    if (el.type === "photo_frame") {
      const displayPhoto =
        el.photo_url ||
        el.photo?.url ||
        el.photo?.preview ||
        el.image_url ||
        el.url ||
        el.src ||
        el.test_image_url ||
        el.sample_image_url ||
        "";

      const fitMode = el.fit_mode || "cover";
      const isContain = fitMode === "contain";
      const hasPhoto = Boolean(displayPhoto);

      const borderWidth = el.border?.width || 0;
      const borderColor = el.border?.color || "#ffffff";
      const isCircle = shape === "circle" || shape === "round";
      const radiusVal = el.border?.radius ?? el.corner_radius ?? (isCircle ? 50 : 0);
      const cornerRadiusPx = (Number(radiusVal) / 100) * Math.min(widthElPx, heightElPx);

      ctx.save();
      ctx.translate(leftPx + widthElPx / 2, topPx + heightElPx / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-widthElPx / 2, -heightElPx / 2);

      const shapePath = getCanvasShapePath(shape, widthElPx, heightElPx, cornerRadiusPx);

      // Cast drop shadow onto page if configured.
      // IMPORTANT: When fit_mode is "contain" and an image is present, the unused space
      // inside the placeholder must remain completely transparent (not filled with white),
      // allowing any background or design elements behind it to remain visible.
      // Therefore, do NOT fill shapePath with white when isContain is true.
      if (el.shadow?.blur > 0 && (!hasPhoto || !isContain)) {
        ctx.save();
        ctx.shadowColor = el.shadow.color || "rgba(0,0,0,0.15)";
        ctx.shadowBlur = el.shadow.blur * scaleFactor;
        ctx.shadowOffsetX = (el.shadow.offsetX || 0) * scaleFactor;
        ctx.shadowOffsetY = (el.shadow.offsetY || 4) * scaleFactor;
        ctx.fillStyle = hasPhoto ? "#ffffff" : "#f1f5f9";
        ctx.fill(shapePath);
        ctx.restore();
      }

      // Clip canvas strictly to photo frame shape
      ctx.save();
      ctx.clip(shapePath);

      if (!displayPhoto) {
        // Draw empty photo holder placeholder
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, 0, widthElPx, heightElPx);

        // Optional placeholder text
        ctx.fillStyle = "#94a3b8";
        const placeholderFontSize = Math.max(12, Math.round(14 * scaleFactor));
        ctx.font = `600 ${placeholderFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = el.frame_id ? `PHOTO ${el.frame_id.split("-").pop()}` : "EMPTY";
        ctx.fillText(label, widthElPx / 2, heightElPx / 2);
      } else {
        const photoImg = await loadImageSafe(displayPhoto);
        if (photoImg) {
          const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
          const boxRatio = widthElPx / heightElPx;
          let dw, dh;

          if (fitMode === "fill" || fitMode === "stretch") {
            dw = widthElPx;
            dh = heightElPx;
          } else if (fitMode === "contain") {
            if (imgRatio > boxRatio) {
              dw = widthElPx;
              dh = widthElPx / imgRatio;
            } else {
              dh = heightElPx;
              dw = heightElPx * imgRatio;
            }
          } else {
            // cover
            if (imgRatio > boxRatio) {
              dh = heightElPx;
              dw = heightElPx * imgRatio;
            } else {
              dw = widthElPx;
              dh = widthElPx / imgRatio;
            }
          }

          const cropZoom = el.crop?.zoom || 1;
          const cropOffsetX = el.crop?.offsetX || 0;
          const cropOffsetY = el.crop?.offsetY || 0;
          const cropRotation = el.crop?.rotation || 0;
          const isFlipped = Boolean(el.crop?.flipH || el.flip_h);

          ctx.save();
          const centerX = widthElPx / 2 + (cropOffsetX / 100) * widthElPx;
          const centerY = heightElPx / 2 + (cropOffsetY / 100) * heightElPx;
          ctx.translate(centerX, centerY);
          ctx.rotate((cropRotation * Math.PI) / 180);
          ctx.scale(isFlipped ? -cropZoom : cropZoom, cropZoom);

          // For contain fitting with drop shadow, apply shadow directly to the photo image
          if (isContain && el.shadow?.blur > 0) {
            ctx.shadowColor = el.shadow.color || "rgba(0,0,0,0.15)";
            ctx.shadowBlur = el.shadow.blur * scaleFactor;
            ctx.shadowOffsetX = (el.shadow.offsetX || 0) * scaleFactor;
            ctx.shadowOffsetY = (el.shadow.offsetY || 4) * scaleFactor;
          }

          // Centered drawing (preserves aspect ratio and transparent padding for contain)
          ctx.drawImage(photoImg, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        } else {
          // If image fails to fetch due to network, fallback to placeholder
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(0, 0, widthElPx, heightElPx);
        }
      }
      ctx.restore(); // remove shape clip

      // Border overlay following exact shape boundary
      if (borderWidth > 0) {
        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth * scaleFactor;
        ctx.stroke(shapePath);
        ctx.restore();
      }

      ctx.restore(); // restore element transform
    }

    // ── Element Type 2: Text ─────────────────────────────────────────────────
    else if (el.type === "text" && el.content) {
      ctx.save();
      ctx.translate(leftPx + widthElPx / 2, topPx + heightElPx / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-widthElPx / 2, -heightElPx / 2);

      // 1. Text Background (Solid Color or Linear Gradient)
      const textBg = el.background || (el.bg_color ? { type: "color", value: el.bg_color } : null);
      if (textBg && textBg.type !== "none" && textBg.value) {
        ctx.save();
        const padPx = (Number(textBg.padding) || 6) * scaleFactor;
        const radPx = (Number(textBg.radius) || 4) * scaleFactor;
        const bgX = -padPx;
        const bgY = -padPx;
        const bgW = widthElPx + padPx * 2;
        const bgH = heightElPx + padPx * 2;

        if (textBg.type === "gradient" || (typeof textBg.value === "string" && textBg.value.startsWith("linear-gradient"))) {
          const linearGrad = parseLinearGradient(ctx, textBg.value, bgW, bgH);
          ctx.fillStyle = linearGrad || "#ffffff";
        } else {
          ctx.fillStyle = textBg.value;
        }

        if (radPx > 0 && typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(bgX, bgY, bgW, bgH, radPx);
          ctx.fill();
        } else {
          ctx.fillRect(bgX, bgY, bgW, bgH);
        }
        ctx.restore();
      }

      const fontSizePx = Math.round(Number(el.font_size || 24) * scaleFactor);
      const fontFamily = getFontFamilyFallback(el.font_family || "Playfair Display");
      const fontStyle = el.font_style || "normal";
      const fontWeight = el.font_weight || "normal";
      ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
      ctx.fillStyle = el.color || "#1f2937";
      ctx.textBaseline = "middle";

      // 2. Text Shadow
      const textShadow = el.shadow;
      if (textShadow && (textShadow.blur > 0 || textShadow.offsetX || textShadow.offsetY)) {
        ctx.shadowColor = textShadow.color || "rgba(0,0,0,0.5)";
        ctx.shadowBlur = (Number(textShadow.blur) || 0) * scaleFactor;
        ctx.shadowOffsetX = (Number(textShadow.offsetX) || 0) * scaleFactor;
        ctx.shadowOffsetY = (Number(textShadow.offsetY) || 0) * scaleFactor;
      }

      if (el.letter_spacing) {
        const letterSpacingPx = Number(el.letter_spacing) * scaleFactor;
        if (typeof ctx.letterSpacing !== "undefined") {
          ctx.letterSpacing = `${letterSpacingPx}px`;
        }
      }

      const lines = wrapTextLines(ctx, el.content, widthElPx);
      const lineHeightPx = fontSizePx * (Number(el.line_height) || 1.2);
      const totalTextH = lines.length * lineHeightPx;
      const startY = (heightElPx - totalTextH) / 2 + lineHeightPx / 2;

      lines.forEach((line, lineIdx) => {
        const lineY = startY + lineIdx * lineHeightPx;
        let lineX = widthElPx / 2;
        if (el.align === "left") {
          ctx.textAlign = "left";
          lineX = 0;
        } else if (el.align === "right") {
          ctx.textAlign = "right";
          lineX = widthElPx;
        } else {
          ctx.textAlign = "center";
          lineX = widthElPx / 2;
        }
        ctx.fillText(line, lineX, lineY);
      });

      ctx.restore();
    }

    // ── Element Type 3: Decoration ───────────────────────────────────────────
    else if (el.type === "decoration") {
      ctx.save();
      ctx.translate(leftPx + widthElPx / 2, topPx + heightElPx / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-widthElPx / 2, -heightElPx / 2);
      ctx.globalAlpha = el.opacity !== undefined ? Number(el.opacity) : 1;

      const decData = resolveDecorationData(el, templateData);

      if (decData) {
        let decImg = null;
        if (decData.type === "image") {
          decImg = await loadImageSafe(decData.src);
        } else if (decData.type === "svg" && decData.content) {
          let svgContent = decData.content;
          if (el.tint && el.tint !== "currentColor") {
            svgContent = svgContent.replace(/currentColor/g, el.tint);
          }
          const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
          const blobUrl = URL.createObjectURL(svgBlob);
          decImg = await loadImageSafe(blobUrl);
          URL.revokeObjectURL(blobUrl);
        }

        if (decImg) {
          // Object-contain drawing centered
          const imgRatio = decImg.naturalWidth / decImg.naturalHeight;
          const boxRatio = widthElPx / heightElPx;
          let dw, dh, dx, dy;
          if (imgRatio > boxRatio) {
            dw = widthElPx;
            dh = widthElPx / imgRatio;
            dx = 0;
            dy = (heightElPx - dh) / 2;
          } else {
            dh = heightElPx;
            dw = heightElPx * imgRatio;
            dx = (widthElPx - dw) / 2;
            dy = 0;
          }
          ctx.drawImage(decImg, dx, dy, dw, dh);
        }
      }

      ctx.restore();
    }
  }

  // Convert canvas to print-ready JPEG blob (98% quality for print fidelity)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.98);
  });
};

// ── Main Export Handler: Generates ZIP with Order_ID/ Folder & All Pages ─────
export const exportPhotoBookOrderZip = async (order, { onProgress, onStatus } = {}) => {
  if (!order) {
    throw new Error("No order provided for export.");
  }

  const orderId = String(order.invoice_no || order._id || "order").trim();
  const cartItems = Array.isArray(order.cart_items)
    ? order.cart_items
    : order.cart_items
    ? [order.cart_items]
    : [];

  const item =
    cartItems.find(
      (it) =>
        it.is_photobook ||
        it.photobook_design_id ||
        it.photobook_details?.design_id ||
        it.photobook_design_data ||
        String(it.product_name || "").toLowerCase().includes("photo book") ||
        String(it.product_name || "").toLowerCase().includes("photobook")
    ) ||
    cartItems[0] ||
    {};

  onStatus?.("Resolving photobook customer design...");

  // 1. Resolve canonical customer design data
  let designData = item.photobook_design_data || order.photobook_design_data;
  let templateData = null;

  const designId =
    item.photobook_design_id ||
    item.photobook_details?.design_id ||
    order.photobook_design_id ||
    order.photobook_details?.design_id;

  if (designId) {
    try {
      const res = await getPhotoBookDesign(designId);
      const fullDesign = res?.data?.data;
      if (fullDesign && fullDesign.pages?.length > 0) {
        designData = fullDesign;
        if (fullDesign.template_id) {
          try {
            const tplRes = await getPhotoBookTemplateById(fullDesign.template_id);
            templateData = tplRes?.data?.data || null;
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Could not fetch canonical photobook design from backend:", err);
    }
  }

  const pages = designData?.pages || [];
  if (!pages || pages.length === 0) {
    throw new Error("Order does not contain any saved photobook pages to export.");
  }

  // Preload all fonts used in design
  const usedFonts = [
    ...new Set(
      pages.flatMap((p) =>
        (p.elements || []).filter((e) => e.type === "text").map((e) => e.font_family)
      )
    ),
  ];
  await ensureFontsLoaded(usedFonts);

  // 2. Resolve exact print dimensions at 300 DPI
  const rawSize =
    item.photobook_details?.size_name ||
    item.photobook_details?.size ||
    item.photobook_size ||
    item.size ||
    order.photobook_details?.size ||
    designData?.size ||
    "8x8";

  const configSizes = [
    ...(item.photobook_config?.sizes || []),
    ...(templateData?.supported_sizes || []),
    ...(templateData?.page_config?.sizes || []),
  ];

  const dimensions = resolveBookDimensions300DPI(rawSize, configSizes);
  const { widthPx, heightPx, label } = dimensions;

  onStatus?.(`Preparing print resolution: ${widthPx}×${heightPx} px (${label} @ 300 DPI)...`);

  // 3. Separate pages into Front Cover, Interior Pages, Back Cover
  const frontCover =
    pages.find((p) => p.page_type === "front_cover" || p.page_id === "front-cover") ||
    pages[0];

  const backCover =
    pages.find((p) => p.page_type === "back_cover" || p.page_id === "back-cover") ||
    pages[pages.length - 1];

  const interiorPages = pages
    .filter((p) => {
      if (p === frontCover || p === backCover) return false;
      if (p.page_id === "front-cover" || p.page_type === "front_cover") return false;
      if (p.page_id === "back-cover" || p.page_type === "back_cover") return false;
      // Skip blank virtual covers if they have no custom content
      if (
        (p.page_id === "blank-inside-front" || p.page_id === "blank-inside-back" || p.is_blank) &&
        (!p.elements || p.elements.length === 0)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const numA = typeof a.page_number === "number" ? a.page_number : parseFloat(a.page_number) || 0;
      const numB = typeof b.page_number === "number" ? b.page_number : parseFloat(b.page_number) || 0;
      if (numA !== numB) return numA - numB;
      return pages.indexOf(a) - pages.indexOf(b);
    });

  // Prepare ordered render items: front_cover.jpg, page-1.jpg ... page-N.jpg, back_cover.jpg
  const renderList = [
    { filename: "front_cover.jpg", page: frontCover, label: "Front Cover" },
    ...interiorPages.map((pg, idx) => {
      const pageNum = idx + 1;
      return {
        filename: `page-${pageNum}.jpg`,
        page: pg,
        label: `Page ${pageNum}`,
      };
    }),
    { filename: "back_cover.jpg", page: backCover, label: "Back Cover" },
  ];

  const zip = new JSZip();
  // Folder named after the order ID inside the zip
  const orderFolder = zip.folder(orderId);

  // 4. Render all pages sequentially with 100% visual parity
  for (let i = 0; i < renderList.length; i++) {
    const item = renderList[i];
    const progressPct = Math.round(((i + 1) / renderList.length) * 100);
    onStatus?.(`Rendering ${item.label} (${i + 1}/${renderList.length}) at 300 DPI...`);
    onProgress?.(progressPct);

    const jpegBlob = await renderPageToCanvas(item.page, { widthPx, heightPx, templateData });
    orderFolder.file(item.filename, jpegBlob);
  }

  // 5. Generate and trigger ZIP download
  onStatus?.("Compressing print-ready ZIP archive...");
  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (metadata.percent) {
        onProgress?.(Math.round(metadata.percent));
      }
    }
  );

  saveAs(zipBlob, `${orderId}.zip`);
  onStatus?.("Download complete!");
  return `${orderId}.zip`;
};
