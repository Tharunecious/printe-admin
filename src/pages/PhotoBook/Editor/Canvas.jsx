import React, { useRef, useState, useEffect, useCallback } from "react";
import ElementRenderer from "./ElementRenderer";
import {
  MdContentCopy,
  MdDeleteOutline,
  MdLockOutline,
  MdLockOpen,
  MdVerticalAlignTop,
  MdVerticalAlignBottom,
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
import { FiRotateCw } from "react-icons/fi";
import { getCanvasDimensionsForSize } from "../utils/sizeUtils";
import { calculateDynamicTextDimensions, getElementCoords } from "../utils/textUtils";

const CANVAS_BASE_SIZE = 1000;

const RESIZE_HANDLES = [
  { position: "nw", cursor: "nwse-resize", xPct: 0, yPct: 0 },
  { position: "n", cursor: "ns-resize", xPct: 0.5, yPct: 0 },
  { position: "ne", cursor: "nesw-resize", xPct: 1, yPct: 0 },
  { position: "e", cursor: "ew-resize", xPct: 1, yPct: 0.5 },
  { position: "se", cursor: "nwse-resize", xPct: 1, yPct: 1 },
  { position: "s", cursor: "ns-resize", xPct: 0.5, yPct: 1 },
  { position: "sw", cursor: "nesw-resize", xPct: 0, yPct: 1 },
  { position: "w", cursor: "ew-resize", xPct: 0, yPct: 0.5 },
];

const Canvas = ({
  page,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
  zoom = 1,
  aspectRatio = "1:1",
  selectedSize = "A4",
  sizeInfo = null,
  configSizes = [],
}) => {
  const canvasRef = useRef(null);
  const [activeTransform, setActiveTransform] = useState(null);

  // Compute dimensions from selected size & sizeInfo matching real paper dimensions
  const canvasDimensions = getCanvasDimensionsForSize(sizeInfo || selectedSize, configSizes);
  const {
    width: canvasWidth,
    height: canvasHeight,
    label: paperLabel,
    orientation: paperOrientation,
    width_in: paperWidthIn,
    height_in: paperHeightIn,
    width_cm: paperWidthCm,
    height_cm: paperHeightCm,
    dimensions: paperDimensions,
    singlePageRatio,
    sizeInfo: resolvedSizeInfo,
  } = canvasDimensions;

  const elements = page?.elements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Background styling
  const getBackgroundStyle = () => {
    const bg = page?.background || {};
    if (bg.type === "gradient") {
      return { background: bg.value, opacity: bg.opacity ?? 1 };
    }
    const isImage =
      bg.type === "image" ||
      (typeof bg.value === "string" &&
        (bg.value.startsWith("http") ||
          bg.value.startsWith("/uploads/") ||
          /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i.test(bg.value)));
    if (isImage && bg.value) {
      const posX = bg.position_x !== undefined ? `${bg.position_x}%` : "50%";
      const posY = bg.position_y !== undefined ? `${bg.position_y}%` : "50%";
      const fitMode = bg.fit_mode || "cover";
      const size =
        fitMode === "stretch" || fitMode === "100% 100%"
          ? "100% 100%"
          : fitMode === "contain"
          ? (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "contain")
          : (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "cover");
      return {
        backgroundImage: `url("${bg.value}")`,
        backgroundSize: size,
        backgroundPosition: `${posX} ${posY}`,
        backgroundRepeat: "no-repeat",
        opacity: bg.opacity ?? 1,
      };
    }
    return { backgroundColor: bg.value || "#ffffff", opacity: bg.opacity ?? 1 };
  };

  // Helper to compute pixel rectangle for current canvas dimensions
  const getElementPxRect = (el) => {
    if (!el) return { x: 0, y: 0, width: 100, height: 100 };
    const coords = getElementCoords(el);
    const is1to1Shape =
      el.type === "photo_frame" &&
      ["circle", "heart", "star", "scallop", "hexagon"].includes(el.shape || el.mask_shape);
    const x = (coords.left / 100) * canvasWidth;
    const y = (coords.top / 100) * canvasHeight;
    const w = (coords.width / 100) * canvasWidth;
    const h = is1to1Shape ? w : (coords.height / 100) * canvasHeight;
    return {
      x: Number(x) || 0,
      y: Number(y) || 0,
      width: Math.max(10, Number(w) || 10),
      height: Math.max(10, Number(h) || 10),
    };
  };

  // Dragging element logic
  const handleElementMouseDown = (e, element) => {
    if (element.is_locked) {
      onSelectElement(element);
      return;
    }
    e.stopPropagation();
    onSelectElement(element);

    const rect = getElementPxRect(element);

    setActiveTransform({
      type: "move",
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.x,
      initialY: rect.y,
    });
  };

  // Resize handle mouse down
  const handleResizeMouseDown = (e, handle) => {
    if (!selectedElement || selectedElement.is_locked) return;
    e.stopPropagation();

    const rect = getElementPxRect(selectedElement);

    setActiveTransform({
      type: "resize",
      handle: handle.position,
      elementId: selectedElement.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.x,
      initialY: rect.y,
      initialW: rect.width,
      initialH: rect.height,
    });
  };

  // Rotate handle mouse down
  const handleRotateMouseDown = (e) => {
    if (!selectedElement || selectedElement.is_locked) return;
    e.stopPropagation();

    const rect = getElementPxRect(selectedElement);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const centerX =
      canvasRect.left + (rect.x + rect.width / 2) * zoom;
    const centerY =
      canvasRect.top + (rect.y + rect.height / 2) * zoom;

    setActiveTransform({
      type: "rotate",
      elementId: selectedElement.id,
      centerX,
      centerY,
      initialRotation: selectedElement.rotation || 0,
    });
  };

  // Mouse move and up handlers
  const handleMouseMove = useCallback(
    (e) => {
      if (!activeTransform) return;

      if (activeTransform.type === "move") {
        const deltaX = (e.clientX - activeTransform.startX) / zoom;
        const deltaY = (e.clientY - activeTransform.startY) / zoom;

        let nextX = Math.round(activeTransform.initialX + deltaX);
        let nextY = Math.round(activeTransform.initialY + deltaY);

        const el = elements.find((item) => item.id === activeTransform.elementId);
        const rect = getElementPxRect(el);
        // Allow moving anywhere, including negative X/Y out of the page
        const minX = -Math.round(canvasWidth * 1.5);
        const maxX = Math.round(canvasWidth * 2.5);
        const minY = -Math.round(canvasHeight * 1.5);
        const maxY = Math.round(canvasHeight * 2.5);
        const clampedX = Math.max(minX, Math.min(maxX, nextX));
        const clampedY = Math.max(minY, Math.min(maxY, nextY));

        const x_pct = Number(((clampedX / canvasWidth) * 100).toFixed(2));
        const y_pct = Number(((clampedY / canvasHeight) * 100).toFixed(2));

        onUpdateElement(activeTransform.elementId, {
          x: Math.round(clampedX),
          y: Math.round(clampedY),
          x_pct,
          y_pct,
          x_norm: +(clampedX / canvasWidth).toFixed(6),
          y_norm: +(clampedY / canvasHeight).toFixed(6),
          x_str: `${x_pct}%`,
          y_str: `${y_pct}%`,
          unit: "%",
          is_percentage: true,
          ...(el?.type === "text"
            ? {
                width_pct: Number(((rect.width / canvasWidth) * 100).toFixed(2)),
                height_pct: Number(((rect.height / canvasHeight) * 100).toFixed(2)),
              }
            : {}),
        });
      } else if (activeTransform.type === "resize") {
        const deltaX = (e.clientX - activeTransform.startX) / zoom;
        const deltaY = (e.clientY - activeTransform.startY) / zoom;

        const targetEl = elements.find((item) => item.id === activeTransform.elementId);
        const is1to1Shape =
          targetEl?.type === "photo_frame" &&
          ["circle", "heart", "star", "scallop", "hexagon"].includes(targetEl?.shape);

        let { initialX, initialY, initialW, initialH, handle } = activeTransform;
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        if (handle.includes("e")) newW = Math.max(20, initialW + deltaX);
        if (handle.includes("s")) newH = Math.max(20, initialH + deltaY);
        if (handle.includes("w")) {
          const w = Math.max(20, initialW - deltaX);
          newX = initialX + (initialW - w);
          newW = w;
        }
        if (handle.includes("n")) {
          const h = Math.max(20, initialH - deltaY);
          newY = initialY + (initialH - h);
          newH = h;
        }

        if (is1to1Shape) {
          // Circle, Heart, Star, Scalloped Flower must have identical width and height
          const uniformW = Math.max(20, Math.max(newW, newH));
          if (handle.includes("w")) {
            newX = initialX + (initialW - uniformW);
          }
          if (handle.includes("n")) {
            newY = initialY + (initialH - uniformW);
          }
          newW = uniformW;
          newH = uniformW;
        }

        const minCoordX = -Math.round(canvasWidth * 1.5);
        const minCoordY = -Math.round(canvasHeight * 1.5);
        const clampedX = Math.max(minCoordX, newX);
        const clampedY = Math.max(minCoordY, newY);
        const clampedW = Math.max(20, newW);
        const clampedH = is1to1Shape ? clampedW : Math.max(20, newH);

        const x_pct = Number(((clampedX / canvasWidth) * 100).toFixed(2));
        const y_pct = Number(((clampedY / canvasHeight) * 100).toFixed(2));
        const width_pct = Number(((clampedW / canvasWidth) * 100).toFixed(2));
        // height % focuses on width % value for 1:1 shapes
        const height_pct = is1to1Shape
          ? Number(((clampedW / canvasHeight) * 100).toFixed(2))
          : Number(((clampedH / canvasHeight) * 100).toFixed(2));

        onUpdateElement(activeTransform.elementId, {
          x: Math.round(clampedX),
          y: Math.round(clampedY),
          width: Math.round(clampedW),
          height: Math.round(clampedH),
          x_pct,
          y_pct,
          width_pct,
          height_pct,
          x_norm: +(clampedX / canvasWidth).toFixed(6),
          y_norm: +(clampedY / canvasHeight).toFixed(6),
          w_norm: +(clampedW / canvasWidth).toFixed(6),
          h_norm: +(clampedH / canvasHeight).toFixed(6),
          x_str: `${x_pct}%`,
          y_str: `${y_pct}%`,
          width_str: `${width_pct}%`,
          height_str: `${height_pct}%`,
          unit: "%",
          is_percentage: true,
        });
      } else if (activeTransform.type === "rotate") {
        const rad = Math.atan2(
          e.clientY - activeTransform.centerY,
          e.clientX - activeTransform.centerX
        );
        let deg = Math.round((rad * 180) / Math.PI + 90);
        if (deg < 0) deg += 360;
        deg = deg % 360;

        // Snap to 0, 90, 180, 270 if close
        if (deg > 355 || deg < 5) deg = 0;
        if (Math.abs(deg - 90) < 5) deg = 90;
        if (Math.abs(deg - 180) < 5) deg = 180;
        if (Math.abs(deg - 270) < 5) deg = 270;

        onUpdateElement(activeTransform.elementId, { rotation: deg });
      }
    },
    [activeTransform, zoom, onUpdateElement, canvasWidth, canvasHeight, elements]
  );

  const handleMouseUp = useCallback(() => {
    if (activeTransform) {
      setActiveTransform(null);
    }
  }, [activeTransform]);

  useEffect(() => {
    if (activeTransform) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [activeTransform, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="flex-1 overflow-auto bg-slate-900/90 flex items-center justify-center p-8 relative select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Centered Canvas Container with Zoom Transform */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: activeTransform ? "none" : "transform 0.15s ease-out",
        }}
        className="relative my-8"
      >
        {/* Paper Dimension & Format Indicator Banner */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-between text-xs text-slate-300 px-1 py-1 select-none pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-400 bg-slate-800/90 border border-teal-500/30 px-2.5 py-0.5 rounded-full text-[11px] shadow-sm tracking-wide">
              📄 {paperLabel || "Paper"}
            </span>
            <span className="font-mono text-slate-200 text-xs font-semibold">
              {paperWidthIn} × {paperHeightIn} in ({paperWidthCm} × {paperHeightCm} cm)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-800/60 px-2 py-0.5 rounded">
              {paperOrientation || (singlePageRatio < 0.95 ? "Vertical" : singlePageRatio > 1.05 ? "Horizontal" : "Square")}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
            Ratio: {singlePageRatio ? singlePageRatio.toFixed(3) : "1.000"} : 1
          </div>
        </div>

        {/* Top Horizontal Studio Ruler */}
        <div
          className="absolute -top-6 left-0 h-5 bg-slate-800/90 border-b border-slate-700/90 rounded-t flex items-end select-none pointer-events-none text-[9px] font-mono text-slate-400 overflow-hidden z-10"
          style={{ width: `${canvasWidth}px` }}
        >
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`ruler-top-${i}`}
              className="absolute flex flex-col items-center bottom-0 -translate-x-1/2"
              style={{ left: `${(i / 20) * 100}%` }}
            >
              <span className="text-[8px] leading-none mb-0.5">{i}</span>
              <div className={`w-px ${i % 2 === 0 ? "h-2 bg-slate-300" : "h-1 bg-slate-600"}`} />
            </div>
          ))}
        </div>

        {/* Left Vertical Studio Ruler */}
        <div
          className="absolute top-0 -left-6 w-5 bg-slate-800/90 border-r border-slate-700/90 rounded-l flex flex-col items-end select-none pointer-events-none text-[9px] font-mono text-slate-400 overflow-hidden z-10"
          style={{ height: `${canvasHeight}px` }}
        >
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`ruler-left-${i}`}
              className="absolute flex items-center right-0 -translate-y-1/2"
              style={{ top: `${(i / 20) * 100}%` }}
            >
              <span className="text-[8px] leading-none mr-0.5">{i}</span>
              <div className={`h-px ${i % 2 === 0 ? "w-2 bg-slate-300" : "w-1 bg-slate-600"}`} />
            </div>
          ))}
        </div>

        {/* Paper Sheet */}
        <div
          ref={canvasRef}
          className="relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-300 transition-all duration-300 ease-out select-none"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
          {/* Clipped Page Area (Hides/crops any overflowing elements, images, or text from the page) */}
          <div className="absolute inset-0 overflow-hidden bg-white" style={{ containerType: "inline-size" }}>
            {/* Dedicated Background Layer (Opacity affects ONLY the background, not page content) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 0,
                ...getBackgroundStyle(),
              }}
            />

            {/* Subtle Photobook Spine Shade (For interior pages) */}
            {page?.page_type === "interior" && (
              <div
                className={`absolute top-0 bottom-0 w-8 pointer-events-none z-10 ${
                  (page?.page_number || 1) % 2 === 0
                    ? "right-0 bg-gradient-to-l from-black/10 to-transparent"
                    : "left-0 bg-gradient-to-r from-black/10 to-transparent"
                }`}
              />
            )}

            {/* Safe Print Zone / 3mm Cutting Bleed Guides */}
            <div
              className="absolute inset-5 border border-dashed border-sky-400/30 pointer-events-none z-10"
              title="Safe Printing Zone (3mm Cut Bleed Line)"
            />

            {/* Render Elements Sorted by z-index */}
            {[...elements]
              .sort((a, b) => (a.z_index || 1) - (b.z_index || 1))
              .map((el) => (
                <ElementRenderer
                  key={`${el.id}_${el.content || ''}_${el.font_family || ''}_${el.font_size || ''}_${el.font_style || ''}_${el.font_weight || ''}_${el.color || ''}_${el.align || ''}`}
                  element={el}
                  isSelected={el.id === selectedElementId}
                  onSelect={onSelectElement}
                  scale={zoom}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                />
              ))}
          </div>

          {/* Active Selection Overlay & Transform Handles */}
          {selectedElement && !selectedElement.is_hidden && (() => {
            const is1to1Shape =
              selectedElement.type === "photo_frame" &&
              ["circle", "heart", "star", "scallop", "hexagon"].includes(selectedElement.shape || selectedElement.mask_shape);

            const coords = getElementCoords(selectedElement);
            const leftPct = `${coords.left}%`;
            const topPct = `${coords.top}%`;
            const widthPct = `${coords.width}%`;
            const heightPct = is1to1Shape ? undefined : `${coords.height}%`;

            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: leftPct,
                  top: topPct,
                  width: widthPct,
                  height: heightPct,
                  aspectRatio: is1to1Shape ? "1 / 1" : undefined,
                  transform: `rotate(${selectedElement.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  zIndex: 9999,
                }}
              >
                {/* Cyan Selection Border */}
                <div className="absolute inset-0 border-2 border-cyan-400 pointer-events-none shadow-sm" />

                {/* Floating Quick Action Mini Toolbar */}
                <div
                  className="absolute -top-13 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 text-white border border-slate-700/80 px-2 py-1.5 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto z-[10000] text-xs whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    title="Duplicate (Ctrl+D)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateElement(selectedElement.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <MdContentCopy size={16} />
                  </button>
                  <button
                    type="button"
                    title="Bring Forward (Higher Z-Index)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBringForward(selectedElement.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <MdArrowUpward size={16} />
                  </button>
                  <button
                    type="button"
                    title="Send Backward (Lower Z-Index)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendBackward(selectedElement.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <MdArrowDownward size={16} />
                  </button>

                  <div className="w-px h-4 bg-slate-700 mx-0.5" />

                  <button
                    type="button"
                    title={selectedElement.is_locked ? "Unlock element" : "Lock element"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement(selectedElement.id, {
                        is_locked: !selectedElement.is_locked,
                      });
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {selectedElement.is_locked ? (
                      <MdLockOutline size={16} className="text-amber-400" />
                    ) : (
                      <MdLockOpen size={16} />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete element"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(selectedElement.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition-colors cursor-pointer"
                  >
                    <MdDeleteOutline size={16} />
                  </button>
                </div>

              {/* 8 Resizing Handles (Hidden if locked) */}
              {!selectedElement.is_locked &&
                RESIZE_HANDLES.map((handle) => (
                  <div
                    key={handle.position}
                    onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                    className="absolute w-3 h-3 bg-white border-2 border-teal-600 rounded-sm pointer-events-auto hover:scale-125 transition-transform"
                    style={{
                      left: `${handle.xPct * 100}%`,
                      top: `${handle.yPct * 100}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: handle.cursor,
                    }}
                  />
                ))}

              {/* Rotation Handle with connecting line */}
              {!selectedElement.is_locked && (
                <>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-0.5 h-6 bg-teal-500" />
                  <div
                    onMouseDown={handleRotateMouseDown}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-teal-600 rounded-full shadow pointer-events-auto flex items-center justify-center hover:scale-110 cursor-grab active:cursor-grabbing transition-transform text-teal-700"
                    title="Rotate element"
                  >
                    <FiRotateCw size={10} />
                  </div>
                </>
              )}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Canvas Size & Format Info Badge */}
      {/* <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium select-none mt-2">
        <span className="bg-slate-200/90 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full shadow-2xs border border-slate-300">
          📐 {canvasDimensions.label} ({canvasDimensions.dimensions})
        </span>
        <span className="text-slate-400">•</span>
        <span className="font-mono text-slate-600">{canvasWidth} × {canvasHeight}px</span>
        <span className="text-slate-400">•</span>
        <span className="text-teal-700 font-semibold uppercase">{canvasDimensions.orientation}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-600">{page?.name || "Page"}</span>
      </div> */}
    </div>
  );
};

export default Canvas;
