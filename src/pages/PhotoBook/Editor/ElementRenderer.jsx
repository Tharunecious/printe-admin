import React from "react";
import { getShapeClipPathDefinition } from "../utils/clipPaths";
import { PRESET_DECORATIONS, getFontFamilyFallback } from "../utils/presetAssets";
import { getElementCoords } from "../utils/textUtils";
import { FaLock, FaImage } from "react-icons/fa";

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
    const borderWidth = element.border?.width || 0;
    const borderColor = element.border?.color || "#ffffff";
    const shadow = element.shadow || {};
    const shadowFilter =
      shadow.blur > 0
        ? `drop-shadow(${shadow.offsetX || 0}px ${shadow.offsetY || 4}px ${shadow.blur}px ${shadow.color || "rgba(0,0,0,0.2)"})`
        : "none";

    const clipId = `clip-${id}`;
    const cropZoom = element.crop?.zoom || 1;
    const cropOffsetX = element.crop?.offsetX || 0;
    const cropOffsetY = element.crop?.offsetY || 0;
    const cropRotation = element.crop?.rotation || 0;

    return (
      <div
        className="w-full h-full relative select-none"
        style={{
          filter: shadowFilter,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible w-full h-full"
        >
          <defs>
            <clipPath id={clipId}>
              {renderClipContent(true)}
            </clipPath>
          </defs>

          {/* Group firmly clipped to shape: keeps photo zoom & pan inside container */}
          <g clipPath={`url(#${clipId})`}>
            {/* Background of frame when empty */}
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={hasImage ? "transparent" : "#f1f5f9"}
            />

            {/* Photo inside frame clipped with SVG clipPath with Photoshop crop & pan */}
            {hasImage && (
              <image
                href={element.test_image_url}
                x={`${cropOffsetX}%`}
                y={`${cropOffsetY}%`}
                width="100"
                height="100"
                preserveAspectRatio={
                  fitMode === "contain" ? "xMidYMid meet" : "xMidYMid slice"
                }
                style={{
                  transformOrigin: "50% 50%",
                  transform: `scale(${cropZoom}) rotate(${cropRotation}deg)`,
                  transition: "transform 0.1s ease",
                }}
              />
            )}
          </g>

          {/* Border overlay following the exact clip shape */}
          {borderWidth > 0 && (
            <g
              transform="scale(100, 100)"
              fill="none"
              stroke={borderColor}
              strokeWidth={borderWidth / Math.min(width || 100, height || 100)}
              vectorEffect="non-scaling-stroke"
            >
              {renderClipContent()}
            </g>
          )}
        </svg>

        {/* Empty placeholder guide in editor mode */}
        {!hasImage && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none"
            style={{
              clipPath: `url(#${clipId})`,
            }}
          >
            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm mb-1 text-slate-500">
              <FaImage className="text-xl text-teal-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {element.frame_id || "Photo Placeholder"}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">
              {element.shape || "rectangle"} • {fitMode}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderText = () => {
    return (
      <span
        data-photobook-font="true"
        style={{
          "--photobook-font": effectiveFont,
          fontFamily: effectiveFont,
          fontWeight: "inherit",
          fontStyle: "inherit",
          letterSpacing: "inherit",
          minWidth: "max-content",
          maxWidth: "100%",
          whiteSpace: hasExplicitNewlines ? "pre-line" : "nowrap",
          wordBreak: "normal",
          overflowWrap: "normal",
          textAlign: element.align || "center",
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

  const is1to1Shape =
    type === "photo_frame" &&
    ["circle", "heart", "star", "scallop", "hexagon"].includes(element.shape || element.mask_shape);

  const effectiveFont = getFontFamilyFallback(element.font_family || "Inter");
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
      className={`absolute cursor-pointer transition-shadow ${
        isSelected && !previewMode ? "ring-2 ring-teal-500 shadow-md" : ""
      }`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        maxWidth: "100%",
        height: is1to1Shape ? undefined : `${heightPct}%`,
        aspectRatio: is1to1Shape ? "1 / 1" : undefined,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        zIndex: isSelected ? 150 : Math.max(1, Number(z_index) || 1),
        ...(type === "text"
          ? {
              "--photobook-font": effectiveFont,
              fontFamily: effectiveFont,
              fontSize: `calc(${Number(element.font_size || 24)} * (100cqw / 707))`,
              fontWeight: element.font_weight || "normal",
              fontStyle: element.font_style || "normal",
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
              padding:
                element.background?.value || element.bg_color
                  ? `${element.background?.padding ?? 4}px ${(element.background?.padding ?? 4) * 1.5}px`
                  : undefined,
              borderRadius:
                element.background?.value || element.bg_color
                  ? `${element.background?.radius ?? 4}px`
                  : undefined,
            }
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
