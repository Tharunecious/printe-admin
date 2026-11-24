import React from "react";
import { getShapeClipPathDefinition, getShape100Definition, is1to1Shape } from "../utils/clipPaths";
import { PRESET_DECORATIONS, getFontFamilyFallback, dynamicallyLoadGoogleFont } from "../utils/presetAssets";
import { getElementCoords, parseBorderValues, parsePaddingValues } from "../utils/textUtils";
import { FaLock, FaImage } from "react-icons/fa";

export const renderShape100 = (def, fill, stroke, strokeWidth, style = {}) => {
  if (!def) return null;
  const { type: shapeType, attrs } = def;
  const props = {
    ...attrs,
    fill: fill || "none",
    stroke: stroke || "none",
    strokeWidth: strokeWidth || 0,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    style,
  };
  if (shapeType === "ellipse") return <ellipse {...props} />;
  if (shapeType === "path") return <path {...props} />;
  if (shapeType === "polygon") return <polygon {...props} />;
  if (shapeType === "rect") return <rect {...props} />;
  return null;
};

export const renderShapeSvgBorder = (clipDef, strokeColor, strokeWidthVal) => {
  if (!clipDef || !strokeWidthVal) return null;
  const { type: shapeType, attrs } = clipDef;

  const strokeStyle = {
    strokeWidth: `calc(${strokeWidthVal} * (100cqw / 707))`,
  };

  const commonProps = {
    ...attrs,
    fill: "none",
    stroke: strokeColor,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    vectorEffect: "non-scaling-stroke",
    style: strokeStyle,
  };

  if (shapeType === "ellipse") {
    return <ellipse {...commonProps} />;
  }
  if (shapeType === "path") {
    return <path {...commonProps} />;
  }
  if (shapeType === "polygon") {
    return <polygon {...commonProps} />;
  }
  if (shapeType === "rect") {
    return <rect {...commonProps} />;
  }
  return null;
};

const ElementRenderer = ({
  element,
  isSelected,
  onSelect,
  scale = 1,
  previewMode = false,
  canvasWidth = 707,
  canvasHeight = 1000,
  onMouseDown,
}) => {
  if (!element || element.is_hidden) return null;

  const {
    id,
    type,
    width,
    height,
    rotation = 0,
    z_index = 1,
    is_locked = false,
  } = element;

  const clipDef =
    type === "photo_frame"
      ? getShapeClipPathDefinition(element.shape || "rectangle", element.border?.radius || 0)
      : null;

  const renderClipContent = (isScaled100 = false) => {
    if (!clipDef) return null;
    const { type: shapeType, attrs } = clipDef;

    if (isScaled100) {
      if (shapeType === "ellipse") return <ellipse cx="50" cy="50" rx="50" ry="50" />;
      if (shapeType === "rect") {
        const rx = Number(attrs.rx || 0) * 100;
        return <rect x="0" y="0" width="100" height="100" rx={rx} ry={rx} />;
      }
      if (shapeType === "path") return <path {...attrs} transform="scale(100, 100)" />;
      if (shapeType === "polygon") return <polygon {...attrs} transform="scale(100, 100)" />;
      return <rect x="0" y="0" width="100" height="100" />;
    }

    if (shapeType === "ellipse") {
      return <ellipse {...attrs} />;
    }
    if (shapeType === "path") {
      return <path {...attrs} />;
    }
    if (shapeType === "polygon") {
      return <polygon {...attrs} />;
    }
    if (shapeType === "rect") {
      return <rect {...attrs} />;
    }
    return <rect x="0" y="0" width="1" height="1" />;
  };

  const renderPhotoFrame = () => {
    const hasImage = Boolean(element.test_image_url);
    const fitMode = element.fit_mode || "cover";
    const bord = parseBorderValues(element.border);
    const pad = parsePaddingValues(element.padding);
    const shadow = element.shadow || {};
    const shadowFilter =
      shadow.blur > 0
        ? `drop-shadow(${shadow.offsetX || 0}px ${shadow.offsetY || 4}px ${shadow.blur}px ${shadow.color || "rgba(0,0,0,0.2)"})`
        : "none";

    const isRounded = element.shape === "rounded" || element.shape === "rounded_rectangle";
    const isRect = !element.shape || element.shape === "rectangle" || isRounded;
    const maxBorder = Math.max(bord.top, bord.right, bord.bottom, bord.left, bord.width);
    const cropZoom = element.crop?.zoom || 1;
    const cropOffsetX = element.crop?.offsetX || 0;
    const cropOffsetY = element.crop?.offsetY || 0;
    const cropRotation = element.crop?.rotation || 0;
    const effectiveRadius = bord.radius > 0 ? bord.radius : (isRounded ? 22 : 0);
    const innerRadius = Math.max(0, effectiveRadius - Math.min(bord.top, bord.left));

    // For rectangle & rounded rectangle: standard CSS box model works 100% correctly
    if (isRect) {
      return (
        <div
          className="w-full h-full relative select-none box-border"
          style={{
            borderTop: bord.top ? `calc(${bord.top} * (100cqw / 707)) solid ${bord.color}` : undefined,
            borderRight: bord.right ? `calc(${bord.right} * (100cqw / 707)) solid ${bord.color}` : undefined,
            borderBottom: bord.bottom ? `calc(${bord.bottom} * (100cqw / 707)) solid ${bord.color}` : undefined,
            borderLeft: bord.left ? `calc(${bord.left} * (100cqw / 707)) solid ${bord.color}` : undefined,
            borderRadius: effectiveRadius ? `calc(${effectiveRadius} * (100cqw / 707))` : undefined,
            backgroundColor: element.bg_color || element.background?.value || "transparent",
            filter: shadowFilter,
            boxSizing: "border-box",
          }}
        >
          <div
            className={`absolute overflow-hidden ${!hasImage ? "bg-slate-100/90 border border-dashed border-slate-300 rounded" : ""}`}
            style={{
              top: pad.top ? `calc(${pad.top} * (100cqw / 707))` : 0,
              right: pad.right ? `calc(${pad.right} * (100cqw / 707))` : 0,
              bottom: pad.bottom ? `calc(${pad.bottom} * (100cqw / 707))` : 0,
              left: pad.left ? `calc(${pad.left} * (100cqw / 707))` : 0,
              borderRadius: innerRadius ? `calc(${innerRadius} * (100cqw / 707))` : undefined,
            }}
          >
            {hasImage ? (
              <img
                src={element.test_image_url}
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
                  transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                  transition: "transform 0.1s ease",
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm mb-1 text-slate-500">
                  <FaImage className="text-xl text-teal-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  {element.frame_id || "Photo Placeholder"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {element.shape || "rectangle"} • {fitMode}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // For all custom shapes (heart, star, hexagon, scallop, arch, circle):
    // Use objectBoundingBox SVG clip-path with uniform inset to guarantee 100% EVEN gap and border on all sides!
    const shapeClipDef = getShapeClipPathDefinition(element.shape || "rectangle", bord.radius || 0);
    const shape100Def = getShape100Definition(element.shape || "rectangle", bord.radius || 0);
    const clipId = `clip-${id}`;
    const elementBg = element.bg_color || element.background?.value;
    const totalPadTop = pad.top || 0;
    const totalPadRight = pad.right || 0;
    const totalPadBottom = pad.bottom || 0;
    const totalPadLeft = pad.left || 0;

    return (
      <div
        className="w-full h-full relative select-none box-border"
        style={{
          filter: shadowFilter,
        }}
      >
        {/* SVG clip-path definition in objectBoundingBox coordinates */}
        <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              {shapeClipDef.type === "ellipse" && <ellipse {...shapeClipDef.attrs} />}
              {shapeClipDef.type === "path" && <path {...shapeClipDef.attrs} />}
              {shapeClipDef.type === "polygon" && <polygon {...shapeClipDef.attrs} />}
              {shapeClipDef.type === "rect" && <rect {...shapeClipDef.attrs} />}
            </clipPath>
          </defs>
        </svg>

        {/* Outer shape background (visible in the padding gap / matting area) */}
        <div
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: elementBg || "transparent",
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        />

        {/* Inner photo/placeholder area - Inset uniformly on all sides by (border + padding) */}
        <div
          className={`absolute overflow-hidden ${!hasImage ? "bg-slate-100/90" : ""}`}
          style={{
            top: totalPadTop ? `calc(${totalPadTop} * (100cqw / 707))` : 0,
            right: totalPadRight ? `calc(${totalPadRight} * (100cqw / 707))` : 0,
            bottom: totalPadBottom ? `calc(${totalPadBottom} * (100cqw / 707))` : 0,
            left: totalPadLeft ? `calc(${totalPadLeft} * (100cqw / 707))` : 0,
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        >
          {hasImage ? (
            <img
              src={element.test_image_url}
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
                transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                transition: "transform 0.1s ease",
                maxWidth: "none",
                maxHeight: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm mb-1 text-slate-500">
                <FaImage className="text-xl text-teal-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                {element.frame_id || "Photo Placeholder"}
              </span>
              <span className="text-[10px] text-slate-500">
                {element.shape || "rectangle"} • {fitMode}
              </span>
            </div>
          )}
        </div>

        {/* Outer Border SVG Overlay */}
        {maxBorder > 0 && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full absolute inset-0 select-none overflow-visible pointer-events-none z-10"
          >
            {renderShapeSvgBorder(shape100Def, bord.color, maxBorder)}
          </svg>
        )}
      </div>
    );
  };

  const renderText = () => {
    const boldStrokePx = Number(element.bold_px ?? element.stroke_width ?? 0);
    return (
      <span
        data-photobook-font="true"
        style={{
          "--photobook-font": effectiveFont,
          fontFamily: effectiveFont,
          fontWeight: boldStrokePx > 0 ? "normal" : (element.font_weight || "normal"),
          fontStyle: "inherit",
          letterSpacing: "inherit",
          textTransform: element.text_transform || element.textTransform || "none",
          minWidth: "max-content",
          maxWidth: "100%",
          whiteSpace: hasExplicitNewlines ? "pre-line" : "nowrap",
          wordBreak: "normal",
          overflowWrap: "normal",
          textAlign: element.align || "center",
          WebkitTextStroke: boldStrokePx > 0 ? `calc(${boldStrokePx} * (100cqw / 707)) ${element.color || "#1f2937"}` : undefined,
          paintOrder: boldStrokePx > 0 ? "stroke fill" : undefined,
        }}
      >
        {element.content !== undefined && element.content !== null && String(element.content).trim().length > 0
          ? element.content
          : isSelected
            ? "|"
            : ""}
      </span>
    );
  };

  const renderDecoration = () => {
    let svgContent = element.svg;
    if (!svgContent && !element.asset_url) {
      const matched = PRESET_DECORATIONS.find(
        (d) =>
          d.id === element.preset_id ||
          d.id === element.id ||
          (element.name && d.name?.toLowerCase() === element.name?.toLowerCase()) ||
          d.id === element.frame_id
      );
      if (matched) svgContent = matched.svg;
    }

    if (svgContent) {
      return (
        <div
          className="w-full h-full select-none flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          style={{
            opacity: element.opacity ?? 1,
            color: element.tint || "currentColor",
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      );
    }

    if (element.asset_url) {
      return (
        <img
          src={element.asset_url}
          alt={element.name || "Decoration"}
          className="w-full h-full pointer-events-none select-none"
          style={{
            opacity: element.opacity ?? 1,
            objectFit: element.fit_mode || "contain",
          }}
        />
      );
    }

    if (previewMode) return null;

    return (
      <div className="w-full h-full border border-dashed border-teal-300 bg-teal-50/40 rounded flex items-center justify-center text-teal-600 text-xs px-1 text-center select-none font-medium">
        {element.name || "Decoration"}
      </div>
    );
  };

  const coords = getElementCoords(element);
  const leftPct = coords.left;
  const topPct = coords.top;
  const widthPct = coords.width;
  const heightPct = coords.height;

  const is1to1 =
    type === "photo_frame" &&
    is1to1Shape(element.shape || element.mask_shape);

  const effectiveFontName = element.font_family || element.fontFamily || "Inter";
  if (type === "text") dynamicallyLoadGoogleFont(effectiveFontName);
  const effectiveFont = getFontFamilyFallback(effectiveFontName);
  const hasExplicitNewlines = element.content && String(element.content).includes("\n");

  return (
    <div
      id={`element-${id}`}
      data-element-id={id}
      data-photobook-font={type === "text" ? "true" : undefined}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!previewMode && onSelect) onSelect(element);
      }}
      className={`absolute cursor-pointer transition-shadow ${isSelected && !previewMode && type !== "text" ? "ring-2 ring-teal-500 shadow-md" : ""
        }`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        maxWidth: "100%",
        height: is1to1 ? undefined : `${heightPct}%`,
        aspectRatio: is1to1 ? "1 / 1" : undefined,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        zIndex: isSelected ? 150 : Math.max(1, Number(z_index) || 1),
        ...(type === "text"
          ? (() => {
            const textBord = parseBorderValues(element.border);
            const textPad = parsePaddingValues(element.padding);
            const boldStrokePx = Number(element.bold_px ?? element.stroke_width ?? 0);
            return {
              "--photobook-font": effectiveFont,
              fontFamily: effectiveFont,
              textTransform: element.text_transform || element.textTransform || "none",
              fontSize: `calc(${Number(element.font_size || 24)} * (100cqw / 707))`,
              fontWeight: boldStrokePx > 0 ? "normal" : (element.font_weight || "normal"),
              fontStyle: element.font_style || "normal",
              WebkitTextStroke: boldStrokePx > 0 ? `calc(${boldStrokePx} * (100cqw / 707)) ${element.color || "#1f2937"}` : undefined,
              paintOrder: boldStrokePx > 0 ? "stroke fill" : undefined,
              letterSpacing: element.letter_spacing ? `calc(${Number(element.letter_spacing)} * (100cqw / 707))` : "normal",
              lineHeight: element.line_height || 1.2,
              color: element.color || "#1f2937",
              textAlign: element.align || "center",
              display: "flex",
              alignItems: "center",
              justifyContent:
                element.align === "left"
                  ? "flex-start"
                  : element.align === "right"
                    ? "flex-end"
                    : "center",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: hasExplicitNewlines ? "pre-line" : "normal",
              textShadow:
                element.shadow?.blur || element.shadow?.offsetX || element.shadow?.offsetY
                  ? `${element.shadow.offsetX ?? 2}px ${element.shadow.offsetY ?? 2}px ${element.shadow.blur || 0}px ${element.shadow.color || "rgba(0,0,0,0.5)"}`
                  : undefined,
              background:
                element.background?.type !== "none" && element.background?.value
                  ? element.background.value
                  : element.bg_color || undefined,
              borderTop: textBord.top ? `calc(${textBord.top} * (100cqw / 707)) solid ${textBord.color}` : undefined,
              borderRight: textBord.right ? `calc(${textBord.right} * (100cqw / 707)) solid ${textBord.color}` : undefined,
              borderBottom: textBord.bottom ? `calc(${textBord.bottom} * (100cqw / 707)) solid ${textBord.color}` : undefined,
              borderLeft: textBord.left ? `calc(${textBord.left} * (100cqw / 707)) solid ${textBord.color}` : undefined,
              borderRadius: textBord.radius
                ? `calc(${textBord.radius} * (100cqw / 707))`
                : element.background?.value || element.bg_color
                  ? `calc(${element.background?.radius ?? 4} * (100cqw / 707))`
                  : undefined,
              paddingTop: textPad.top
                ? `calc(${textPad.top} * (100cqw / 707))`
                : element.background?.value || element.bg_color
                  ? `calc(${element.background?.padding ?? 4} * (100cqw / 707))`
                  : undefined,
              paddingRight: textPad.right
                ? `calc(${textPad.right} * (100cqw / 707))`
                : element.background?.value || element.bg_color
                  ? `calc(${((element.background?.padding ?? 4) * 1.5)} * (100cqw / 707))`
                  : undefined,
              paddingBottom: textPad.bottom
                ? `calc(${textPad.bottom} * (100cqw / 707))`
                : element.background?.value || element.bg_color
                  ? `calc(${element.background?.padding ?? 4} * (100cqw / 707))`
                  : undefined,
              paddingLeft: textPad.left
                ? `calc(${textPad.left} * (100cqw / 707))`
                : element.background?.value || element.bg_color
                  ? `calc(${((element.background?.padding ?? 4) * 1.5)} * (100cqw / 707))`
                  : undefined,
              boxSizing: "border-box",
            };
          })()
          : {}),
      }}
    >
      {type === "photo_frame" && renderPhotoFrame()}
      {type === "text" && renderText()}
      {type === "decoration" && renderDecoration()}

      {/* Lock indicator */}
      {is_locked && !previewMode && (
        <div className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded text-xs pointer-events-none">
          <FaLock size={10} />
        </div>
      )}

      {/* Customer editable badge for text in admin view */}
      {type === "text" && element.is_customer_editable && !previewMode && (
        <div className="absolute -top-3 -right-2 bg-teal-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight shadow-sm pointer-events-none">
          Customer
        </div>
      )}
    </div>
  );
};

export default ElementRenderer;
