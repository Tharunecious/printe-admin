import React from "react";
import { getShapeClipPathDefinition } from "../utils/clipPaths";
import { FaLock, FaImage, FaFont } from "react-icons/fa";

const ElementRenderer = ({
  element,
  isSelected,
  onSelect,
  scale = 1,
  previewMode = false,
}) => {
  const {
    id,
    type,
    x,
    y,
    width,
    height,
    rotation = 0,
    z_index = 1,
    is_locked = false,
    is_hidden = false,
  } = element;

  if (is_hidden) return null;

  const clipDef =
    type === "photo_frame"
      ? getShapeClipPathDefinition(element.shape || "rectangle", element.border?.radius || 0)
      : null;

  const renderClipContent = () => {
    if (!clipDef) return null;
    const { type: shapeType, attrs } = clipDef;

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
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              {renderClipContent()}
            </clipPath>
          </defs>

          {/* Background of frame when empty */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={hasImage ? "transparent" : "#f1f5f9"}
            clipPath={`url(#${clipId})`}
          />

          {/* Photo inside frame clipped with SVG clipPath */}
          {hasImage && (
            <image
              href={element.test_image_url}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio={
                fitMode === "contain" ? "xMidYMid meet" : "xMidYMid slice"
              }
              clipPath={`url(#${clipId})`}
            />
          )}

          {/* Border overlay following the exact clip shape */}
          {borderWidth > 0 && (
            <g
              transform="scale(100, 100)"
              fill="none"
              stroke={borderColor}
              strokeWidth={borderWidth / Math.min(width, height)}
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
              {element.frame_id || "Photo Frame"}
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
      <div
        className="w-full h-full flex items-center select-none"
        style={{
          fontFamily: element.font_family || "Inter",
          fontSize: `${element.font_size || 24}px`,
          fontWeight: element.font_weight || "normal",
          fontStyle: element.font_style || "normal",
          color: element.color || "#1f2937",
          justifyContent:
            element.align === "left"
              ? "flex-start"
              : element.align === "right"
              ? "flex-end"
              : "center",
          textAlign: element.align || "center",
          wordBreak: "break-word",
          lineHeight: 1.2,
        }}
      >
        <span>{element.content || element.placeholder || "Enter text here"}</span>
      </div>
    );
  };

  const renderDecoration = () => {
    if (element.svg) {
      return (
        <div
          className="w-full h-full select-none"
          style={{
            opacity: element.opacity ?? 1,
            color: element.tint || "currentColor",
          }}
          dangerouslySetInnerHTML={{ __html: element.svg }}
        />
      );
    }

    if (element.asset_url) {
      return (
        <img
          src={element.asset_url}
          alt="Decoration"
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{
            opacity: element.opacity ?? 1,
          }}
        />
      );
    }

    return (
      <div className="w-full h-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
        Decoration
      </div>
    );
  };

  return (
    <div
      id={`element-${id}`}
      data-element-id={id}
      onClick={(e) => {
        e.stopPropagation();
        if (!previewMode && onSelect) onSelect(element);
      }}
      className={`absolute cursor-pointer transition-shadow ${
        isSelected && !previewMode ? "ring-2 ring-teal-500 shadow-md" : ""
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        zIndex: z_index,
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
