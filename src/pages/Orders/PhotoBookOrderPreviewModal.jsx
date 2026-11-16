import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, Spin, Tag, Button, message } from "antd";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
  MdClose,
  MdOutlineLightMode,
  MdOutlineDarkMode,
} from "react-icons/md";
import { FiDownload } from "react-icons/fi";
import { getPhotoBookDesign, getPhotoBookTemplateById } from "../../api";
import { exportPhotoBookOrderZip } from "../../helper/photobookExportHelper";
import {
  buildSizeInfo,
  PRESET_STUDIO_SIZES,
} from "../PhotoBook/utils/sizeUtils";
import {
  getFontFamilyFallback,
  PRESET_DECORATIONS,
} from "../PhotoBook/utils/presetAssets";
import {
  getElementCoords,
  calculateDynamicTextDimensions,
} from "../PhotoBook/utils/textUtils";

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
  "Inter",
  "Jost",
  "Roboto",
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

const renderShapeSvgClip = (def) => {
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
  if (shape === "butterfly" || el.custom_svg_path === "butterfly") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 45 C40 10 5 15 15 50 C20 65 40 60 50 55 C60 60 80 65 85 50 C95 15 60 10 50 45 Z M50 55 C42 65 30 90 45 92 C55 90 52 70 50 55 M50 55 C58 65 70 90 55 92 C45 90 48 70 50 55" /></svg>`;
  }
  if (shape === "flower" || el.custom_svg_path === "flower") {
    return `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="15" fill="#f59e0b"/><circle cx="50" cy="20" r="16"/><circle cx="50" cy="80" r="16"/><circle cx="20" cy="50" r="16"/><circle cx="80" cy="50" r="16"/></svg>`;
  }
  return null;
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
      className="page-canvas-container relative w-full h-full overflow-hidden select-none bg-white isolate"
      style={{ containerType: "inline-size", isolation: "isolate" }}
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
                    {renderShapeSvgClip(clipDef)}
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
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  style={{ zIndex: 10, overflow: "visible" }}
                >
                  <g
                    transform="scale(100, 100)"
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={normalizedBorderStroke}
                    vectorEffect="non-scaling-stroke"
                  >
                    {renderShapeSvgClip(clipDef)}
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
          const effectiveTextTransform =
            el.text_transform || el.textTransform || "none";

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
                textTransform: effectiveTextTransform,
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
                textShadow:
                  el.shadow?.blur || el.shadow?.offsetX || el.shadow?.offsetY
                    ? `${el.shadow.offsetX ?? 2}px ${el.shadow.offsetY ?? 2}px ${el.shadow.blur || 0}px ${el.shadow.color || "rgba(0,0,0,0.5)"}`
                    : undefined,
                background:
                  el.background?.type !== "none" && el.background?.value
                    ? el.background.value
                    : el.bg_color || undefined,
                padding:
                  el.background?.value || el.bg_color
                    ? `${el.background?.padding ?? 4}px ${(el.background?.padding ?? 4) * 1.5}px`
                    : undefined,
                borderRadius:
                  el.background?.value || el.bg_color
                    ? `${el.background?.radius ?? 4}px`
                    : undefined,
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
                  textTransform: effectiveTextTransform,
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
          const isExplicitButterfly =
            el.shape === "butterfly" || el.custom_svg_path === "butterfly";
          const isExplicitHeart =
            el.shape === "heart" || el.custom_svg_path === "heart";

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
                    className="w-full h-full flex items-center justify-center fill-current [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : hasAsset ? (
                  <img
                    src={el.asset_url}
                    alt={el.name || "Decoration"}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : isExplicitButterfly ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill={el.tint || "#f43f5e"}
                    className="w-full h-full drop-shadow"
                  >
                    <path d="M12 4.5C12.5 3 14 2 16 2c2.5 0 4.5 2 4.5 4.5 0 2.5-2.5 4.5-5 5.5 3 .5 5.5 2.5 5.5 5.5 0 3-2.5 5.5-5.5 5.5-2 0-3.5-1-4-2.5-.5 1.5-2 2.5-4 2.5C4.5 23 2 20.5 2 17.5c0-3 2.5-5 5.5-5.5-2.5-1-5-3-5-5.5C2.5 4 4.5 2 7 2c2 0 3.5 1 4 2.5l1 1 1-1z" />
                  </svg>
                ) : isExplicitHeart ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill={el.tint || "#ec4899"}
                    className="w-full h-full drop-shadow"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
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
  order,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState("next"); // "next" | "prev"
  const [transitionData, setTransitionData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewTheme, setPreviewTheme] = useState("dark"); // "dark" | "light"
  const isDark = previewTheme === "dark";

  const handleDownloadZip = async () => {
    if (!order) {
      message.warning("Order details not available for export.");
      return;
    }
    const orderId = String(order.invoice_no || order._id || "order").trim();
    try {
      setIsExporting(true);
      message.loading({
        content: `Preparing 300 DPI Photo Book download for order #${orderId}...`,
        key: `modal-export-${orderId}`,
        duration: 0,
      });

      await exportPhotoBookOrderZip(order, {
        onStatus: (statusText) => {
          message.loading({
            content: statusText,
            key: `modal-export-${orderId}`,
            duration: 0,
          });
        },
      });

      message.success({
        content: `Photo Book ${orderId}.zip exported successfully!`,
        key: `modal-export-${orderId}`,
        duration: 4,
      });
    } catch (err) {
      console.error("Photo Book export error:", err);
      message.error({
        content: err.message || "Failed to download ZIP.",
        key: `modal-export-${orderId}`,
        duration: 5,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const totalSteps = steps.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  const handleNext = useCallback(() => {
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
  }, [currentStepIndex, isFlipping, isLast, onStepChange, steps]);

  const handlePrev = useCallback(() => {
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
  }, [currentStepIndex, isFlipping, isFirst, onStepChange, steps]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const singlePageRatio = sizeInfo?.singlePageRatio || 0.707;
  const spreadRatio = sizeInfo?.spreadRatio || +(singlePageRatio * 2).toFixed(4);

  return (
    <div className="flex flex-col select-none relative pb-2">
      {/* Top Bar with Book Title, Dimensions, Mode Toggle, and Download */}
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
          {/* Dark / Light Studio Toggle */}
          <button
            type="button"
            onClick={() => setPreviewTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Studio Background`}
          >
            {isDark ? (
              <>
                <MdOutlineLightMode className="text-sm text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <MdOutlineDarkMode className="text-sm text-slate-600" />
                <span>Dark</span>
              </>
            )}
          </button>

          {order && (
            <Button
              size="small"
              type="primary"
              icon={<FiDownload />}
              loading={isExporting}
              onClick={handleDownloadZip}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 flex items-center gap-1 font-medium text-xs rounded-lg shadow-sm"
            >
              Download Book (ZIP)
            </Button>
          )}

          {sizeInfo?.dimensions && (
            <Tag color="cyan" className="font-semibold px-2.5 py-0.5 text-xs m-0 rounded-full">
              Size: {sizeInfo.dimensions}
            </Tag>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <MdClose className="text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Book Stage */}
      <div
        className={`w-full relative flex items-center justify-center min-h-[460px] py-8 my-2 rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-b from-[#090d16] via-[#111827] to-[#090d16] border-slate-800"
            : "bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] border-slate-200"
        }`}
        style={{
          perspective: "2400px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Soft studio table spotlight pattern */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity ${
            isDark ? "opacity-15" : "opacity-10"
          }`}
          style={{
            backgroundImage: isDark
              ? "radial-gradient(#ffffff 1px, transparent 1px)"
              : "radial-gradient(#000000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Book Soft Drop Shadow */}
        <div
          className={`absolute bottom-4 w-[78%] h-9 blur-xl rounded-full pointer-events-none transition-colors ${
            isDark ? "bg-black/90" : "bg-slate-900/35"
          }`}
        />

        {/* Floating Prev Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirst || isFlipping}
          className={`absolute left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full shadow-xl flex items-center justify-center transition-all ${
            isDark
              ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700"
              : "bg-white/95 hover:bg-white text-slate-800 border border-slate-200"
          } ${
            isFirst ? "opacity-25 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
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
          className={`absolute right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full shadow-xl flex items-center justify-center transition-all ${
            isDark
              ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700"
              : "bg-white/95 hover:bg-white text-slate-800 border border-slate-200"
          } ${
            isLast ? "opacity-25 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"
          }`}
          title="Next Page (Right Arrow)"
        >
          <MdChevronRight className="text-2xl" />
        </button>

        {/* ── CASE 1: ACTIVE TURNING ANIMATION (3D Flipping Leaf) ── */}
        {isFlipping && transitionData && (
          <div
            className="relative rounded-sm shadow-2xl flex select-none overflow-hidden"
            style={{
              width: `min(94%, calc(min(440px, 46vh) * ${spreadRatio}))`,
              maxWidth: spreadRatio < 1.6 ? "780px" : "900px",
              aspectRatio: `${spreadRatio}`,
              maxHeight: "46vh",
              transformStyle: "preserve-3d",
              backgroundColor: "#000000",
            }}
          >
            {/* Stationary Left Half */}
            <div className="flex-1 h-full relative overflow-hidden bg-white">
              {transitionData.stationaryLeft?.is_blank ? (
                <div className="w-full h-full bg-[#fdfdfd]" />
              ) : (
                renderCanvas(transitionData.stationaryLeft)
              )}
              {/* Subtle natural binding shadow */}
              <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
            </div>

            {/* Center Spine Gap (2px dark gutter, no white lines) */}
            <div className="w-[2px] h-full shrink-0 z-30 bg-[#050811]" />

            {/* Stationary Right Half */}
            <div className="flex-1 h-full relative overflow-hidden bg-white">
              {transitionData.stationaryRight?.is_blank ? (
                <div className="w-full h-full bg-[#fdfdfd]" />
              ) : (
                renderCanvas(transitionData.stationaryRight)
              )}
              {/* Subtle natural binding shadow */}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-20" />
            </div>

            {/* 3D Flipping Leaf */}
            <div
              className={`absolute top-0 bottom-0 ${
                flipDirection === "next"
                  ? "left-1/2 w-1/2 origin-left book-leaf-turning-next"
                  : "left-0 w-1/2 origin-right book-leaf-turning-prev"
              }`}
              style={{
                transformStyle: "preserve-3d",
                zIndex: 60,
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

        {/* ── CASE 2: STATIC FRONT COVER (Single Closed Book) ── */}
        {!isFlipping && currentStep.type === "cover_front" && (
          <div
            className="relative rounded-r-lg overflow-hidden transition-transform duration-300 shadow-2xl"
            style={{
              aspectRatio: `${singlePageRatio}`,
              width: `min(85%, calc(min(400px, 46vh) * ${singlePageRatio}))`,
              maxHeight: "46vh",
              boxShadow:
                "-12px 0 24px -4px rgba(0,0,0,0.7), 16px 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Hardcover Spine Ridge on Left */}
            <div className="absolute top-0 bottom-0 left-0 w-5 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none z-30" />
            <div className="w-full h-full relative">
              {renderCanvas(currentStep.page)}
            </div>
          </div>
        )}

        {/* ── CASE 3: STATIC SPREAD (Clean Realistic Layout - Exact Size Aspect Ratio) ── */}
        {!isFlipping && currentStep.type === "spread" && (
          <div
            className="relative rounded-sm overflow-hidden flex transition-all duration-300 select-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.5)]"
            style={{
              width: `min(94%, calc(min(440px, 46vh) * ${spreadRatio}))`,
              maxWidth: spreadRatio < 1.6 ? "780px" : "900px",
              aspectRatio: `${spreadRatio}`,
              maxHeight: "46vh",
              backgroundColor: isDark ? "#050811" : "#0f172a",
            }}
          >
            {/* Left Page Half */}
            <div className="flex-1 h-full relative overflow-hidden bg-white">
              {currentStep.leftPage?.is_blank ? (
                <div className="w-full h-full bg-[#fdfdfd] flex flex-col items-center justify-center text-slate-300 select-none">
                  <span className="text-xs uppercase tracking-widest font-serif opacity-40">
                    Inside Cover
                  </span>
                </div>
              ) : (
                renderCanvas(currentStep.leftPage)
              )}
              {/* Natural soft binding shadow on right edge of Left Page */}
              <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
            </div>

            {/* Clean Center Spine Gap / Crease Divider - No White Lines */}
            <div className={`w-[2px] h-full shrink-0 z-30 ${isDark ? "bg-[#050811]" : "bg-[#94a3b8]"}`} />

            {/* Right Page Half */}
            <div className="flex-1 h-full relative overflow-hidden bg-white">
              {currentStep.rightPage?.is_blank ? (
                <div className="w-full h-full bg-[#fdfdfd] flex flex-col items-center justify-center text-slate-300 select-none">
                  <span className="text-xs uppercase tracking-widest font-serif opacity-40">
                    Inside Back Cover
                  </span>
                </div>
              ) : (
                renderCanvas(currentStep.rightPage)
              )}
              {/* Natural soft binding shadow on left edge of Right Page */}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-20" />
            </div>
          </div>
        )}

        {/* ── CASE 4: STATIC BACK COVER (Single Closed Book) ── */}
        {!isFlipping && currentStep.type === "cover_back" && (
          <div
            className="relative rounded-l-lg overflow-hidden transition-transform duration-300 shadow-2xl"
            style={{
              aspectRatio: `${singlePageRatio}`,
              width: `min(85%, calc(min(400px, 46vh) * ${singlePageRatio}))`,
              maxHeight: "46vh",
              boxShadow:
                "12px 0 24px -4px rgba(0,0,0,0.7), -16px 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Hardcover Spine Ridge on Right */}
            <div className="absolute top-0 bottom-0 right-0 w-5 bg-gradient-to-l from-black/40 via-black/10 to-transparent pointer-events-none z-30" />
            <div className="w-full h-full relative">
              {renderCanvas(currentStep.page)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="flex items-center justify-between pt-2 px-2 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={isFirst || isFlipping}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
            isFirst || isFlipping
              ? "opacity-30 cursor-not-allowed text-slate-400 bg-slate-50"
              : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 shadow-xs cursor-pointer"
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
              : "text-white bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-sm cursor-pointer"
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
        .book-leaf-turning-next {
          animation: bookFlipNext3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .book-leaf-turning-prev {
          animation: bookFlipPrev3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
      setDesignData(item.photobook_design_data || order?.photobook_design_data);
    }

    // 3. Fetch canonical photobook design from backend
    if (designId) {
      try {
        setLoading(true);
        const res = await getPhotoBookDesign(designId);
        const fullDesign = res?.data?.data;
        if (fullDesign && fullDesign.pages?.length > 0) {
          // If embedded pages have customized photos/elements, merge them with fullDesign
          if (embeddedPages && embeddedPages.length > 0) {
            setDesignData({
              ...fullDesign,
              ...item.photobook_design_data,
              pages: embeddedPages,
            });
          } else {
            setDesignData(fullDesign);
          }

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

  // Derive size parameters using the unified buildSizeInfo helper
  const sizeInfo = useMemo(() => {
    const item = orderItem || (Array.isArray(order?.cart_items) ? order.cart_items[0] : order?.cart_items) || {};
    const rawSize =
      item.photobook_size_name ||
      item.photobook_size ||
      item.photobook_variants?.Size ||
      item.photobook_details?.size_name ||
      item.photobook_details?.size ||
      designData?.size ||
      designData?.size_name ||
      templateData?.page_config?.selected_size ||
      "8x8";

    const configSizes = [
      ...(item.photobook_config?.sizes || []),
      ...(templateData?.supported_sizes || []),
      ...(templateData?.page_config?.sizes || []),
    ];

    const resolved = buildSizeInfo(rawSize, 0, configSizes);
    return resolved;
  }, [orderItem, order, designData, templateData]);

  // Construct sequential flip preview steps (Step 0: Front Cover -> Spreads -> Step N: Back Cover)
  const previewSteps = useMemo(() => {
    const item = orderItem || (Array.isArray(order?.cart_items) ? order.cart_items[0] : order?.cart_items) || {};
    const orderPages = item.photobook_design_data?.pages || order?.photobook_design_data?.pages;
    const pages = (orderPages && orderPages.length > 0) ? orderPages : (designData?.pages || []);
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
      width={1020}
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
          order={order}
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
