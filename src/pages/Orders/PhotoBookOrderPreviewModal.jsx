import React, { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Spin, Tag } from "antd";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
  MdClose,
  MdLayers,
} from "react-icons/md";
import { getPhotoBookDesign, getPhotoBookTemplateById } from "../../api";

// ── Google Fonts dynamic stylesheet injector ─────────────────────────────────
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
];

const injectGoogleFonts = () => {
  if (typeof document === "undefined") return;
  const linkId = "photobook-admin-preview-google-fonts";
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

// ── Fallback font family mappings ─────────────────────────────────────────────
const FONT_FALLBACK_MAP = {
  "Playfair Display": "'Playfair Display', serif",
  Montserrat: "'Montserrat', sans-serif",
  "Great Vibes": "'Great Vibes', cursive",
  "Dancing Script": "'Dancing Script', cursive",
  Cinzel: "'Cinzel', serif",
  "Cormorant Garamond": "'Cormorant Garamond', serif",
  "Alex Brush": "'Alex Brush', cursive",
  Lora: "'Lora', serif",
  Merriweather: "'Merriweather', serif",
  Oswald: "'Oswald', sans-serif",
  Raleway: "'Raleway', sans-serif",
  Pacifico: "'Pacifico', cursive",
  Caveat: "'Caveat', cursive",
  Allura: "'Allura', cursive",
  Parisienne: "'Parisienne', cursive",
  "Abril Fatface": "'Abril Fatface', cursive",
  Italianno: "'Italianno', cursive",
  "Pinyon Script": "'Pinyon Script', cursive",
  Marcellus: "'Marcellus', serif",
  "Bodoni Moda": "'Bodoni Moda', serif",
};

const getFontFamilyFallback = (fontName) => {
  if (!fontName) return "'Playfair Display', serif";
  return FONT_FALLBACK_MAP[fontName] || `'${fontName}', sans-serif`;
};

// ── Element normalized coordinates helper ─────────────────────────────────────
const getElementCoords = (el) => {
  if (!el) return { left: 0, top: 0, width: 100, height: 100 };

  const parseCoord = (val, pctVal, normVal, defaultPct = 0) => {
    if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) {
      return Number(pctVal);
    }
    if (normVal !== undefined && normVal !== null && !isNaN(Number(normVal))) {
      return +(Number(normVal) * 100).toFixed(4);
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) return num;
      }
      const num = parseFloat(trimmed);
      if (!isNaN(num)) val = num;
    }
    if (typeof val === "number" && !isNaN(val)) {
      if ((el.unit === "%" || el.is_percentage) && val <= 100) {
        return val;
      }
      if (val > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      if (val > 0 && val <= 1) {
        return +(val * 100).toFixed(4);
      }
      if (Number(el.width) > 100 || Number(el.height) > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      return val;
    }
    return defaultPct;
  };

  const parseDimension = (val, pctVal, normVal, defaultPct = 100) => {
    if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) {
      return Number(pctVal);
    }
    if (normVal !== undefined && normVal !== null && !isNaN(Number(normVal))) {
      return +(Number(normVal) * 100).toFixed(4);
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) return num;
      }
      const num = parseFloat(trimmed);
      if (!isNaN(num)) val = num;
    }
    if (typeof val === "number" && !isNaN(val)) {
      if ((el.unit === "%" || el.is_percentage) && val <= 100) {
        return val;
      }
      if (val > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      if (val > 0 && val <= 1) {
        return +(val * 100).toFixed(4);
      }
      return val;
    }
    return defaultPct;
  };

  let left = parseCoord(el.x, el.x_pct, el.x_norm, 0);
  let top = parseCoord(el.y, el.y_pct, el.y_norm, 0);
  let width = parseDimension(el.width, el.width_pct, el.w_norm, 100);
  let height = parseDimension(el.height, el.height_pct, el.h_norm, 100);

  if (el.type === "decoration" || el.type === "text") {
    return { left, top, width, height };
  }

  left = Math.max(-100, Math.min(200, left));
  top = Math.max(-100, Math.min(200, top));
  width = Math.max(1, width);
  height = Math.max(1, height);

  return { left, top, width, height };
};

// ── SVG Mask / Shape Paths (0.0 to 1.0 objectBoundingBox) ─────────────────────
const getShapeClipPathDefinition = (shape = "rectangle", radiusVal = 0) => {
  const normShape = String(shape || "rectangle").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  switch (normShape) {
    case "circle":
    case "round":
      return { type: "circle", cx: "0.5", cy: "0.5", r: "0.5" };
    case "oval":
    case "ellipse":
      return { type: "ellipse", cx: "0.5", cy: "0.5", rx: "0.5", ry: "0.38" };
    case "rounded_rectangle":
    case "rounded_rect":
    case "rounded":
      return {
        type: "rect",
        x: "0",
        y: "0",
        width: "1",
        height: "1",
        rx: (radiusVal / 100).toFixed(3),
        ry: (radiusVal / 100).toFixed(3),
      };
    case "heart":
      return {
        type: "path",
        d: "M 0.5,0.88 C 0.08,0.58 0,0.38 0,0.25 C 0,0.1 0.12,0 0.27,0 C 0.38,0 0.46,0.06 0.5,0.16 C 0.54,0.06 0.62,0 0.73,0 C 0.88,0 1,0.1 1,0.25 C 1,0.38 0.92,0.58 0.5,0.88 Z",
      };
    case "star":
      return {
        type: "polygon",
        points: "0.5,0.02 0.63,0.36 0.98,0.38 0.71,0.61 0.79,0.96 0.5,0.77 0.21,0.96 0.29,0.61 0.02,0.38 0.37,0.36",
      };
    case "hexagon":
      return {
        type: "polygon",
        points: "0.5,0.02 0.95,0.26 0.95,0.74 0.5,0.98 0.05,0.74 0.05,0.26",
      };
    case "scallop":
      return {
        type: "path",
        d: "M 0.5,0.05 C 0.58,0 0.68,0.03 0.72,0.1 C 0.77,0.08 0.86,0.12 0.88,0.18 C 0.94,0.21 0.98,0.3 0.97,0.37 C 1.01,0.43 1,0.52 0.96,0.57 C 1,0.63 0.98,0.72 0.92,0.77 C 0.92,0.84 0.86,0.91 0.79,0.92 C 0.76,0.98 0.68,1 0.61,0.98 C 0.56,1.02 0.46,1.02 0.41,0.98 C 0.34,1 0.26,0.98 0.23,0.92 C 0.16,0.91 0.1,0.84 0.1,0.77 C 0.04,0.72 0.02,0.63 0.06,0.57 C 0.02,0.52 0.01,0.43 0.05,0.37 C 0.04,0.3 0.08,0.21 0.14,0.18 C 0.16,0.12 0.25,0.08 0.3,0.1 C 0.34,0.03 0.44,0 0.5,0.05 Z",
      };
    case "arch":
      return {
        type: "path",
        d: "M 0,1 L 0,0.45 C 0,0.2 0.22,0 0.5,0 C 0.78,0 1,0.2 1,0.45 L 1,1 Z",
      };
    case "rectangle":
    case "rect":
    default: {
      const rx = radiusVal > 0 ? (Number(radiusVal) / 100).toFixed(3) : "0";
      return {
        type: "rect",
        x: "0",
        y: "0",
        width: "1",
        height: "1",
        rx,
        ry: rx,
      };
    }
  }
};

const renderShapeSvgClip = (def, isClip = false) => {
  if (!def) return <rect x="0" y="0" width="1" height="1" />;
  if (def.type === "circle") {
    return <circle cx={def.cx} cy={def.cy} r={def.r} />;
  }
  if (def.type === "ellipse") {
    return <ellipse cx={def.cx} cy={def.cy} rx={def.rx} ry={def.ry} />;
  }
  if (def.type === "rect") {
    return <rect x={def.x} y={def.y} width={def.width} height={def.height} rx={def.rx} ry={def.ry} />;
  }
  if (def.type === "path") {
    return <path d={def.d} />;
  }
  if (def.type === "polygon") {
    return <polygon points={def.points} />;
  }
  return <rect x="0" y="0" width="1" height="1" />;
};

// ── Resolve Decoration SVG ────────────────────────────────────────────────────
const resolveDecorationSvg = (el) => {
  if (el.custom_svg) return el.custom_svg;
  const shape = String(el.shape || "").toLowerCase();
  if (shape === "heart" || el.custom_svg_path === "heart") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M 50,85 C 10,60 0,35 15,15 C 30,-5 48,8 50,22 C 52,8 70,-5 85,15 C 100,35 90,60 50,85 Z" /></svg>`;
  }
  if (shape === "star" || el.custom_svg_path === "star") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M 50,2 L 64,32 L 98,35 L 72,58 L 80,92 L 50,74 L 20,92 L 28,58 L 2,35 L 36,32 Z" /></svg>`;
  }
  if (shape === "butterfly") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 45 C40 10 5 15 15 50 C20 65 40 60 50 55 C60 60 80 65 85 50 C95 15 60 10 50 45 Z M50 55 C42 65 30 90 45 92 C55 90 52 70 50 55 M50 55 C58 65 70 90 55 92 C45 90 48 70 50 55" /></svg>`;
  }
  if (shape === "flower") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="15" fill="#f59e0b"/><circle cx="50" cy="20" r="16"/><circle cx="50" cy="80" r="16"/><circle cx="20" cy="50" r="16"/><circle cx="80" cy="50" r="16"/></svg>`;
  }
  return null;
};

// ── Size Formatter Helper ─────────────────────────────────────────────────────
const formatBookSizeInches = (rawSize, configSizes = []) => {
  if (!rawSize) return "A4 - 8.27 x 11.69 in";
  const sStr = String(rawSize).trim();
  if (/\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*in/i.test(sStr)) {
    return sStr;
  }
  if (configSizes && configSizes.length > 0) {
    const matched = configSizes.find(
      (s) =>
        String(s._id) === sStr ||
        String(s.id) === sStr ||
        String(s.name).toLowerCase() === sStr.toLowerCase()
    );
    if (matched) {
      const w = matched.width_in || matched.width;
      const h = matched.height_in || matched.height;
      if (w && h) return `${matched.name || sStr} - ${w} x ${h} in`;
      if (matched.name) return matched.name;
    }
  }
  if (sStr.toLowerCase().includes("a4") || sStr.startsWith("size-")) {
    return "A4 - 8.27 x 11.69 in";
  }
  if (sStr.includes("8x8") || sStr.toLowerCase().includes("square")) {
    return "8x8 Square - 8.00 x 8.00 in";
  }
  if (sStr.includes("12x12")) {
    return "12x12 Square - 12.00 x 12.00 in";
  }
  return sStr;
};

// ── Pure Page Canvas Renderer (100% Identical Visual Fidelity) ────────────────
const PhotobookPageCanvas = ({ page }) => {
  if (!page) return null;
  const elements = page.elements || [];
  const bg = page.background || {};

  const isImage =
    bg.type === "image" ||
    (typeof bg.value === "string" &&
      (bg.value.startsWith("http://") ||
        bg.value.startsWith("https://") ||
        bg.value.startsWith("/uploads/") ||
        bg.value.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i.test(bg.value)));

  const bgLayerStyle = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    opacity: bg.opacity ?? 1,
  };

  if (bg.type === "gradient") {
    bgLayerStyle.background = bg.value;
  } else if (isImage && bg.value) {
    const posX = bg.position_x !== undefined ? `${bg.position_x}%` : "50%";
    const posY = bg.position_y !== undefined ? `${bg.position_y}%` : "50%";
    const fitMode = bg.fit_mode || "cover";
    const size =
      fitMode === "stretch" || fitMode === "100% 100%"
        ? "100% 100%"
        : fitMode === "contain"
        ? bg.scale && bg.scale > 1
          ? `${Math.round(bg.scale * 100)}%`
          : "contain"
        : bg.scale && bg.scale > 1
        ? `${Math.round(bg.scale * 100)}%`
        : "cover";
    bgLayerStyle.backgroundImage = `url("${bg.value}")`;
    bgLayerStyle.backgroundSize = size;
    bgLayerStyle.backgroundPosition = `${posX} ${posY}`;
    bgLayerStyle.backgroundRepeat = "no-repeat";
    bgLayerStyle.backgroundColor = "#ffffff";
  } else if (bg.value) {
    bgLayerStyle.backgroundColor = bg.value;
  } else {
    bgLayerStyle.backgroundColor = "#ffffff";
  }

  return (
    <div
      className="page-canvas-container relative w-full h-full overflow-hidden select-none bg-white"
      style={{ containerType: "inline-size" }}
    >
      {/* Background layer */}
      <div style={bgLayerStyle} />

      {/* Page Elements */}
      {elements.map((el, elIdx) => {
        const elKey = el.id || el.frame_id || `el-${elIdx}`;
        const coords = getElementCoords(el);
        const leftPct = coords.left;
        const topPct = coords.top;
        const widthPct = coords.width;
        const heightPct = coords.height;

        const shape = el.shape || el.mask_shape || "rectangle";
        const isCircle = shape === "circle";
        const is1to1Shape =
          el.type === "photo_frame" &&
          ["circle", "heart", "star", "scallop", "hexagon"].includes(shape);

        const baseStyle = {
          position: "absolute",
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: is1to1Shape ? undefined : `${heightPct}%`,
          aspectRatio: is1to1Shape ? "1 / 1" : undefined,
          zIndex: el.z_index || 1,
          transform: `rotate(${el.rotation || 0}deg)`,
          transformOrigin: "center center",
        };

        // 1. Photo Frame
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
          const hasPhoto = Boolean(displayPhoto);
          const fitMode = el.fit_mode || "cover";
          const borderWidth = el.border?.width || 0;
          const borderColor = el.border?.color || "#ffffff";
          const elRefDim = Math.max(
            50,
            Math.min(
              Number(el.width) > 10 ? Number(el.width) : coords.width * 10,
              Number(el.height) > 10 ? Number(el.height) : coords.height * 10
            ) || 400
          );
          const normalizedBorderStroke = borderWidth / elRefDim;
          const shadow = el.shadow || {};
          const shadowFilter =
            shadow.blur > 0
              ? `drop-shadow(${shadow.offsetX || 0}px ${shadow.offsetY || 4}px ${shadow.blur}px ${
                  shadow.color || "rgba(0,0,0,0.15)"
                })`
              : "none";

          const radiusVal =
            el.border?.radius ?? el.corner_radius ?? (isCircle ? 50 : 0);
          const clipDef = getShapeClipPathDefinition(shape, radiusVal);
          const clipId = `admin-preview-clip-${page.page_id || page.page_number || "pg"}-${elKey}`;

          const cropZoom = el.crop?.zoom || 1;
          const cropOffsetX = el.crop?.offsetX || 0;
          const cropOffsetY = el.crop?.offsetY || 0;
          const cropRotation = el.crop?.rotation || 0;
          const isFlipped = Boolean(el.crop?.flipH || el.flip_h);

          return (
            <div
              key={elKey}
              style={{
                ...baseStyle,
                filter: shadowFilter,
              }}
              className="group relative overflow-visible flex items-center justify-center pointer-events-none"
            >
              {/* SVG Defs for objectBoundingBox clip */}
              <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                  <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                    {renderShapeSvgClip(clipDef, false)}
                  </clipPath>
                </defs>
              </svg>

              {/* Clipped container: HTML clipping with clipPathUnits="objectBoundingBox" guarantees 100% boundary locking */}
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  clipPath: `url(#${clipId})`,
                  WebkitClipPath: `url(#${clipId})`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: hasPhoto ? "transparent" : "#f1f5f9" }}
                />

                {hasPhoto && (
                  <img
                    src={displayPhoto}
                    alt=""
                    style={{
                      position: "absolute",
                      left: `${cropOffsetX}%`,
                      top: `${cropOffsetY}%`,
                      width: "100%",
                      height: "100%",
                      objectFit:
                        fitMode === "contain"
                          ? "contain"
                          : fitMode === "stretch" || fitMode === "fill"
                          ? "fill"
                          : "cover",
                      transformOrigin: "50% 50%",
                      transform: `scale(${isFlipped ? -cropZoom : cropZoom}, ${cropZoom}) rotate(${cropRotation}deg)`,
                      transition: "transform 0.1s ease",
                      maxWidth: "none",
                      maxHeight: "none",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                )}

                {!hasPhoto && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {el.frame_id ? `Photo ${el.frame_id.split("-").pop()}` : "Empty"}
                    </span>
                  </div>
                )}
              </div>

              {/* Border overlay following the exact clip shape */}
              {borderWidth > 0 && (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                >
                  <g
                    transform="scale(100, 100)"
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={normalizedBorderStroke}
                    vectorEffect="non-scaling-stroke"
                  >
                    {renderShapeSvgClip(clipDef, false)}
                  </g>
                </svg>
              )}
            </div>
          );
        }

        // 2. Text Element
        if (el.type === "text") {
          const hasExplicitNewlines =
            el.content && String(el.content).includes("\n");
          return (
            <div
              key={elKey}
              style={{
                ...baseStyle,
                width: `${widthPct}%`,
                maxWidth: "100%",
                fontFamily: getFontFamilyFallback(
                  el.font_family || "Playfair Display"
                ),
                fontSize: `calc(${Number(el.font_size || 24)} * (100cqw / 707))`,
                fontWeight: el.font_weight || "normal",
                fontStyle: el.font_style || "normal",
                letterSpacing: el.letter_spacing
                  ? `calc(${Number(el.letter_spacing)} * (100cqw / 707))`
                  : "normal",
                lineHeight: el.line_height || 1.2,
                color: el.color || "#1f2937",
                textAlign: el.align || "center",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  el.align === "left"
                    ? "flex-start"
                    : el.align === "right"
                    ? "flex-end"
                    : "center",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: hasExplicitNewlines ? "pre-line" : "normal",
                zIndex: Math.max(100, Number(el.z_index) || 100),
                pointerEvents: "none",
              }}
              className="leading-tight select-none"
            >
              <span
                style={{
                  minWidth: "max-content",
                  maxWidth: "100%",
                  whiteSpace: hasExplicitNewlines ? "pre-line" : "nowrap",
                  wordBreak: "normal",
                  overflowWrap: "normal",
                  textAlign: el.align || "center",
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  fontStyle: "inherit",
                  letterSpacing: "inherit",
                }}
              >
                {el.content}
              </span>
            </div>
          );
        }

        // 3. Decoration Element
        if (el.type === "decoration") {
          const svgContent = resolveDecorationSvg(el);
          const hasSvg = Boolean(svgContent);
          const hasAsset = Boolean(el.asset_url);

          return (
            <div
              key={elKey}
              style={{
                ...baseStyle,
                opacity: el.opacity ?? 1,
                color: el.tint || "currentColor",
                pointerEvents: "none",
              }}
              className="flex items-center justify-center select-none overflow-visible"
            >
              <div className="w-full h-full flex items-center justify-center pointer-events-none">
                {hasSvg ? (
                  <div
                    className="w-full h-full flex items-center justify-center fill-current"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : hasAsset ? (
                  <img
                    src={el.asset_url}
                    alt=""
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full border border-dashed border-amber-300 rounded-sm opacity-50" />
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

// ── Realistic 3D Interactive Photobook Flip Preview Component ────────────────
const RealisticBookPreview = ({
  steps,
  currentStepIndex,
  onStepChange,
  renderCanvas,
  onClose,
  sizeInfo,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState("next"); // "next" | "prev"
  const [transitionData, setTransitionData] = useState(null);

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const totalSteps = steps.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLast || isFlipping) return;
    const nextIdx = currentStepIndex + 1;
    const curr = steps[currentStepIndex];
    const nxt = steps[nextIdx];

    let leafFront = null;
    let leafBack = null;
    let stationaryLeft = null;
    let stationaryRight = null;

    if (curr.type === "cover_front") {
      leafFront = curr.page;
      leafBack = nxt.leftPage;
      stationaryLeft = nxt.leftPage;
      stationaryRight = nxt.rightPage;
    } else if (nxt.type === "cover_back") {
      leafFront = curr.rightPage;
      leafBack = nxt.page;
      stationaryLeft = curr.leftPage;
      stationaryRight = { is_blank: true, label: "" };
    } else {
      leafFront = curr.rightPage;
      leafBack = nxt.leftPage;
      stationaryLeft = curr.leftPage;
      stationaryRight = nxt.rightPage;
    }

    setTransitionData({
      leafFront,
      leafBack,
      stationaryLeft,
      stationaryRight,
    });
    setFlipDirection("next");
    setIsFlipping(true);

    setTimeout(() => {
      onStepChange(nextIdx);
      setIsFlipping(false);
      setTransitionData(null);
    }, 650);
  };

  const handlePrev = () => {
    if (isFirst || isFlipping) return;
    const prevIdx = currentStepIndex - 1;
    const curr = steps[currentStepIndex];
    const prv = steps[prevIdx];

    let leafFront = null;
    let leafBack = null;
    let stationaryLeft = null;
    let stationaryRight = null;

    if (curr.type === "cover_back") {
      leafFront = curr.page;
      leafBack = prv.rightPage;
      stationaryLeft = prv.leftPage;
      stationaryRight = prv.rightPage;
    } else if (prv.type === "cover_front") {
      leafFront = curr.leftPage;
      leafBack = prv.page;
      stationaryLeft = { is_blank: true, label: "" };
      stationaryRight = curr.rightPage;
    } else {
      leafFront = curr.leftPage;
      leafBack = prv.rightPage;
      stationaryLeft = prv.leftPage;
      stationaryRight = curr.rightPage;
    }

    setTransitionData({
      leafFront,
      leafBack,
      stationaryLeft,
      stationaryRight,
    });
    setFlipDirection("prev");
    setIsFlipping(true);

    setTimeout(() => {
      onStepChange(prevIdx);
      setIsFlipping(false);
      setTransitionData(null);
    }, 650);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const aspectRatio = sizeInfo?.aspectRatio || 707 / 1000;
  const isCover = currentStep.type === "cover_front" || currentStep.type === "cover_back";

  return (
    <div className="flex flex-col select-none relative pb-2">
      {/* Top Bar with Book Title, Dimensions, and Close */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
            <MdOutlineAutoStories className="text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 leading-tight">
              Customer Photo Book Preview
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive 3D realistic flip preview (Ordered Specifications)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sizeInfo?.dimensions && (
            <Tag color="cyan" className="font-semibold px-2.5 py-0.5 text-xs m-0 rounded-full">
              Size: {sizeInfo.dimensions}
            </Tag>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Close"
            >
              <MdClose className="text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Book Stage (Dark Studio Stage matching customer side) */}
      <div
        className="w-full relative flex items-center justify-center min-h-[480px] py-6 my-2 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-visible"
        style={{
          perspective: "2600px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Soft studio table pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Book Soft Drop Shadow */}
        <div className="absolute bottom-4 w-[75%] h-8 bg-black/70 blur-xl rounded-full pointer-events-none" />

        {/* Floating Prev Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirst || isFlipping}
          className={`absolute left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl flex items-center justify-center transition-all ${
            isFirst ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
          }`}
          title="Previous Page (Left Arrow)"
        >
          <MdChevronLeft className="text-2xl" />
        </button>

        {/* Floating Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isLast || isFlipping}
          className={`absolute right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl flex items-center justify-center transition-all ${
            isLast ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
          }`}
          title="Next Page (Right Arrow)"
        >
          <MdChevronRight className="text-2xl" />
        </button>

        <div
          className="relative transition-all duration-300 ease-out flex items-center justify-center"
          style={{
            height: "460px",
            width: isCover ? `calc(460px * ${aspectRatio})` : `calc(460px * ${aspectRatio} * 2)`,
            maxWidth: "100%",
          }}
        >
          {/* Closed Front Cover */}
          {currentStep.type === "cover_front" && !isFlipping && (
            <div
              className="relative w-full h-full rounded-r-md overflow-hidden bg-white"
              style={{
                boxShadow:
                  "8px 12px 28px rgba(0, 0, 0, 0.28), 2px 4px 8px rgba(0, 0, 0, 0.15)",
                borderLeft: "6px solid #1e293b",
              }}
            >
              {renderCanvas(currentStep.page)}
              {/* Spine edge lighting overlay */}
              <div
                className="absolute inset-y-0 left-0 w-6 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)",
                }}
              />
            </div>
          )}

          {/* Closed Back Cover */}
          {currentStep.type === "cover_back" && !isFlipping && (
            <div
              className="relative w-full h-full rounded-l-md overflow-hidden bg-white"
              style={{
                boxShadow:
                  "-8px 12px 28px rgba(0, 0, 0, 0.28), -2px 4px 8px rgba(0, 0, 0, 0.15)",
                borderRight: "6px solid #1e293b",
              }}
            >
              {renderCanvas(currentStep.page)}
              {/* Spine edge lighting overlay */}
              <div
                className="absolute inset-y-0 right-0 w-6 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to left, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)",
                }}
              />
            </div>
          )}

          {/* Open 2-Page Spread */}
          {currentStep.type === "spread" && !isFlipping && (
            <div
              className="relative w-full h-full flex rounded-md overflow-hidden bg-white"
              style={{
                boxShadow:
                  "0 20px 40px -10px rgba(0,0,0,0.28), 0 0 15px rgba(0,0,0,0.08)",
              }}
            >
              {/* Left Page */}
              <div className="relative flex-1 h-full overflow-hidden border-r border-slate-200">
                {currentStep.leftPage?.is_blank ? (
                  <div className="w-full h-full bg-[#fdfdfd] flex items-center justify-center text-slate-300 text-xs italic">
                    {currentStep.leftPage.label || "Blank Page"}
                  </div>
                ) : (
                  renderCanvas(currentStep.leftPage)
                )}
                {/* Left Page Gutter Shadow */}
                <div
                  className="absolute inset-y-0 right-0 w-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(0,0,0,0.14))",
                  }}
                />
              </div>

              {/* Center Crease / Spine Highlight */}
              <div
                className="w-1.5 h-full z-20 shrink-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.4) 50%, rgba(0,0,0,0.25))",
                }}
              />

              {/* Right Page */}
              <div className="relative flex-1 h-full overflow-hidden border-l border-slate-200">
                {currentStep.rightPage?.is_blank ? (
                  <div className="w-full h-full bg-[#fdfdfd] flex items-center justify-center text-slate-300 text-xs italic">
                    {currentStep.rightPage.label || "Blank Page"}
                  </div>
                ) : (
                  renderCanvas(currentStep.rightPage)
                )}
                {/* Right Page Gutter Shadow */}
                <div
                  className="absolute inset-y-0 left-0 w-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(0,0,0,0.14))",
                  }}
                />
              </div>
            </div>
          )}

          {/* 3D Page Turn Transition Animation */}
          {isFlipping && transitionData && (
            <div
              className="relative w-full h-full flex rounded-md overflow-visible"
              style={{
                boxShadow:
                  "0 20px 40px -10px rgba(0,0,0,0.28), 0 0 15px rgba(0,0,0,0.08)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Stationary Left Half */}
              <div className="relative flex-1 h-full overflow-hidden bg-white border-r border-slate-200">
                {transitionData.stationaryLeft?.is_blank ? (
                  <div className="w-full h-full bg-[#fdfdfd]" />
                ) : (
                  renderCanvas(transitionData.stationaryLeft)
                )}
                <div
                  className="absolute inset-y-0 right-0 w-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(0,0,0,0.14))",
                  }}
                />
              </div>

              {/* Stationary Right Half */}
              <div className="relative flex-1 h-full overflow-hidden bg-white border-l border-slate-200">
                {transitionData.stationaryRight?.is_blank ? (
                  <div className="w-full h-full bg-[#fdfdfd]" />
                ) : (
                  renderCanvas(transitionData.stationaryRight)
                )}
                <div
                  className="absolute inset-y-0 left-0 w-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(0,0,0,0.14))",
                  }}
                />
              </div>

              {/* Turning 3D Leaf */}
              <div
                className="absolute inset-y-0 z-30"
                style={{
                  width: "50%",
                  left: flipDirection === "next" ? "50%" : "0%",
                  transformOrigin: flipDirection === "next" ? "left center" : "right center",
                  transformStyle: "preserve-3d",
                  animation:
                    flipDirection === "next"
                      ? "bookFlipNext3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                      : "bookFlipPrev3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
                }}
              >
                {/* Front of leaf */}
                <div
                  className="absolute inset-0 overflow-hidden bg-white"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {renderCanvas(transitionData.leafFront)}
                </div>

                {/* Back of leaf */}
                <div
                  className="absolute inset-0 overflow-hidden bg-white"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {renderCanvas(transitionData.leafBack)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="flex items-center justify-between pt-2 px-2 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={isFirst || isFlipping}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
            isFirst || isFlipping
              ? "opacity-30 cursor-not-allowed text-slate-400 bg-slate-50"
              : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 shadow-xs"
          }`}
        >
          <MdChevronLeft className="text-lg" />
          <span>Previous</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-800">
            {currentStep.title}
          </span>
          <span className="text-[11px] text-slate-400">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={isLast || isFlipping}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
            isLast || isFlipping
              ? "opacity-30 cursor-not-allowed text-slate-400 bg-slate-50"
              : "text-white bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-sm"
          }`}
        >
          <span>Next</span>
          <MdChevronRight className="text-lg" />
        </button>
      </div>

      <style>{`
        @keyframes bookFlipNext3D {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes bookFlipPrev3D {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
      `}</style>
    </div>
  );
};

// ── Main Export: PhotoBookOrderPreviewModal ──────────────────────────────────
const PhotoBookOrderPreviewModal = ({ open, onClose, orderItem, order }) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [designData, setDesignData] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    injectGoogleFonts();
  }, []);

  const loadDesign = async () => {
    setFetchError(null);
    // 1. Resolve design ID from orderItem or order
    const item = orderItem || (Array.isArray(order?.cart_items) ? order.cart_items[0] : order?.cart_items) || {};
    const designId =
      item.photobook_design_id ||
      item.photobook_details?.design_id ||
      order?.photobook_design_id ||
      order?.photobook_details?.design_id;

    // 2. Check for embedded design pages first
    const embeddedPages = item.photobook_design_data?.pages || order?.photobook_design_data?.pages;
    if (embeddedPages && embeddedPages.length > 0) {
      setDesignData(item.photobook_design_data || order.photobook_design_data);
    }

    // 3. Fetch canonical photobook design from backend
    if (designId) {
      try {
        setLoading(true);
        const res = await getPhotoBookDesign(designId);
        const fullDesign = res?.data?.data;
        if (fullDesign && fullDesign.pages?.length > 0) {
          setDesignData(fullDesign);

          if (fullDesign.template_id) {
            try {
              const tplRes = await getPhotoBookTemplateById(fullDesign.template_id);
              const tpl = tplRes?.data?.data;
              if (tpl) {
                setTemplateData(tpl);
              }
            } catch (e) {
              // Ignore template fetch error
            }
          }
        } else if (!embeddedPages || embeddedPages.length === 0) {
          setFetchError("Design has no pages saved yet.");
        }
      } catch (err) {
        console.error("Failed to load customer photobook design:", err);
        if (!embeddedPages || embeddedPages.length === 0) {
          setFetchError(err.response?.data?.message || err.message || "Failed to load customer design.");
        }
      } finally {
        setLoading(false);
      }
    } else if (!embeddedPages || embeddedPages.length === 0) {
      setFetchError("No photobook design ID attached to this order.");
    }
  };

  // Fetch full photobook design when modal opens
  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setDesignData(null);
      setTemplateData(null);
      setFetchError(null);
      return;
    }

    loadDesign();
  }, [open, orderItem, order]);

  // Derive size parameters
  const sizeInfo = useMemo(() => {
    const item = orderItem || (Array.isArray(order?.cart_items) ? order.cart_items[0] : order?.cart_items) || {};
    const rawSize =
      item.photobook_details?.size_name ||
      item.photobook_details?.size ||
      item.photobook_size ||
      designData?.size ||
      "8x8";

    const configSizes = [
      ...(item.photobook_config?.sizes || []),
      ...(templateData?.supported_sizes || []),
      ...(templateData?.page_config?.sizes || []),
    ];

    const formatted = formatBookSizeInches(rawSize, configSizes);
    const isLandscape = formatted.toLowerCase().includes("landscape");
    const isSquare = formatted.toLowerCase().includes("square") || formatted.includes("8x8") || formatted.includes("12x12");

    return {
      dimensions: formatted,
      name: formatted,
      aspectRatio: isLandscape ? 1000 / 707 : isSquare ? 1 : 707 / 1000,
    };
  }, [orderItem, order, designData, templateData]);

  // Construct sequential flip preview steps (Step 0: Front Cover -> Spreads -> Step N: Back Cover)
  const previewSteps = useMemo(() => {
    const item = orderItem || (Array.isArray(order?.cart_items) ? order.cart_items[0] : order?.cart_items) || {};
    const pages = designData?.pages || item.photobook_design_data?.pages || [];
    if (!pages || pages.length === 0) return [];

    const steps = [];

    // Front Cover
    const frontCover =
      pages.find((p) => p.page_type === "front_cover" || p.page_id === "front-cover") ||
      pages[0];

    // Back Cover
    const backCover =
      pages.find((p) => p.page_type === "back_cover" || p.page_id === "back-cover") ||
      pages[pages.length - 1];

    const isBlankPageEnabled = Boolean(
      templateData?.include_blank_page ||
      templateData?.page_config?.include_blank_page ||
      templateData?.published_snapshot?.include_blank_page ||
      templateData?.published_snapshot?.page_config?.include_blank_page
    );

    const hasBlankPage =
      Boolean(
        pages.some(
          (p) =>
            p.is_blank ||
            p.page_id === "blank-inside-front" ||
            p.page_id === "blank-inside-back" ||
            p.page_type === "blank"
        )
      ) || isBlankPageEnabled;

    // Step 0: Front Cover (Single Closed Book View)
    steps.push({
      type: "cover_front",
      stepIndex: 0,
      title: "Front Cover (Closed Book)",
      page: frontCover,
    });

    const interiorPages = pages
      .filter(
        (p) =>
          p.page_type !== "front_cover" &&
          p.page_type !== "back_cover" &&
          p.page_id !== "front-cover" &&
          p.page_id !== "back-cover" &&
          !p.is_blank &&
          p.page_id !== "blank-inside-front" &&
          p.page_id !== "blank-inside-back" &&
          p.page_type !== "blank"
      )
      .sort((a, b) => (Number(a.page_number) || 0) - (Number(b.page_number) || 0));

    let stepCount = 1;

    if (hasBlankPage) {
      const blankInsideFront = pages.find((p) => p.page_id === "blank-inside-front") || {
        page_id: "blank-inside-front",
        name: "Blank Page",
        display_label: "Blank Page",
        page_type: "blank",
        page_number: "Blank",
        is_blank: true,
        background: { type: "color", value: "#ffffff" },
        elements: [],
      };

      const blankInsideBack = pages.find((p) => p.page_id === "blank-inside-back") || {
        page_id: "blank-inside-back",
        name: "Blank Page",
        display_label: "Blank Page",
        page_type: "blank",
        page_number: "Blank",
        is_blank: true,
        background: { type: "color", value: "#ffffff" },
        elements: [],
      };

      const page1 =
        interiorPages.find((p) => p.page_number === 1 || p.page_id === "page-1") ||
        interiorPages[0];

      steps.push({
        type: "spread",
        stepIndex: 1,
        title: "Inside Cover & Page 1",
        leftPage: blankInsideFront,
        rightPage: page1,
      });

      const remainingPages = interiorPages.filter(
        (p) => (p.page_id || p.page_number) !== (page1?.page_id || page1?.page_number)
      );

      stepCount = 2;
      for (let i = 0; i < remainingPages.length; i += 2) {
        const leftP = remainingPages[i];
        const rightP = remainingPages[i + 1] || blankInsideBack;
        steps.push({
          type: "spread",
          stepIndex: stepCount,
          title: rightP?.is_blank
            ? `Page ${leftP?.page_number} & Inside Back Cover`
            : `Pages ${leftP?.page_number} & ${rightP?.page_number}`,
          leftPage: leftP,
          rightPage: rightP,
        });
        stepCount++;
      }
    } else {
      stepCount = 1;
      for (let i = 0; i < interiorPages.length; i += 2) {
        const leftP = interiorPages[i];
        const rightP = interiorPages[i + 1] || null;
        steps.push({
          type: "spread",
          stepIndex: stepCount,
          title: rightP
            ? `Pages ${leftP?.page_number} & ${rightP?.page_number}`
            : `Page ${leftP?.page_number}`,
          leftPage: leftP,
          rightPage: rightP,
        });
        stepCount++;
      }
    }

    // Step N: Back Cover (Single Closed Book View)
    steps.push({
      type: "cover_back",
      stepIndex: stepCount,
      title: "Back Cover (Closed Book)",
      page: backCover,
    });

    return steps;
  }, [designData, orderItem, order, templateData]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={980}
      destroyOnClose
      styles={{
        body: { padding: "16px 20px" },
      }}
    >
      {loading && !designData ? (
        <div className="min-h-[460px] flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <span className="text-sm text-slate-500 font-medium">
            Loading customer photobook design...
          </span>
        </div>
      ) : previewSteps.length > 0 ? (
        <RealisticBookPreview
          steps={previewSteps}
          currentStepIndex={stepIndex}
          onStepChange={setStepIndex}
          renderCanvas={(page) => <PhotobookPageCanvas page={page} />}
          onClose={onClose}
          sizeInfo={sizeInfo}
        />
      ) : (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-2">
          <MdOutlineAutoStories className="text-4xl text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            {fetchError || "No design pages found for this photobook order."}
          </p>
          <button
            type="button"
            onClick={loadDesign}
            className="mt-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Retry Loading Design
          </button>
        </div>
      )}
    </Modal>
  );
};

export default PhotoBookOrderPreviewModal;

