import React, { useRef, useState, useEffect, useCallback } from "react";
import ElementRenderer from "./ElementRenderer";
import {
  MdContentCopy,
  MdDeleteOutline,
  MdLockOutline,
  MdLockOpen,
  MdVerticalAlignTop,
  MdVerticalAlignBottom,
} from "react-icons/md";
import { FiRotateCw } from "react-icons/fi";

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
}) => {
  const canvasRef = useRef(null);
  const [activeTransform, setActiveTransform] = useState(null);

  // Compute dimensions from aspect ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case "4:3":
        return { width: 1000, height: 750 };
      case "3:4":
        return { width: 750, height: 1000 };
      case "16:9":
        return { width: 1000, height: 562.5 };
      case "8.5:11":
        return { width: 772, height: 1000 };
      case "1:1":
      default:
        return { width: 1000, height: 1000 };
    }
  };

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();

  const elements = page?.elements || [];
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Background styling
  const getBackgroundStyle = () => {
    const bg = page?.background || {};
    if (bg.type === "gradient") {
      return { background: bg.value, opacity: bg.opacity ?? 1 };
    }
    if (bg.type === "image" && bg.value) {
      return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: bg.opacity ?? 1,
      };
    }
    return { backgroundColor: bg.value || "#ffffff", opacity: bg.opacity ?? 1 };
  };

  // Dragging element logic
  const handleElementMouseDown = (e, element) => {
    if (element.is_locked) {
      onSelectElement(element);
      return;
    }
    e.stopPropagation();
    onSelectElement(element);

    setActiveTransform({
      type: "move",
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
    });
  };

  // Resize handle mouse down
  const handleResizeMouseDown = (e, handle) => {
    if (!selectedElement || selectedElement.is_locked) return;
    e.stopPropagation();

    setActiveTransform({
      type: "resize",
      handle: handle.position,
      elementId: selectedElement.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: selectedElement.x,
      initialY: selectedElement.y,
      initialW: selectedElement.width,
      initialH: selectedElement.height,
    });
  };

  // Rotate handle mouse down
  const handleRotateMouseDown = (e) => {
    if (!selectedElement || selectedElement.is_locked) return;
    e.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const centerX =
      canvasRect.left + (selectedElement.x + selectedElement.width / 2) * zoom;
    const centerY =
      canvasRect.top + (selectedElement.y + selectedElement.height / 2) * zoom;

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

        onUpdateElement(activeTransform.elementId, { x: nextX, y: nextY });
      } else if (activeTransform.type === "resize") {
        const deltaX = (e.clientX - activeTransform.startX) / zoom;
        const deltaY = (e.clientY - activeTransform.startY) / zoom;

        let { initialX, initialY, initialW, initialH, handle } = activeTransform;
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        if (handle.includes("e")) newW = Math.max(30, initialW + deltaX);
        if (handle.includes("s")) newH = Math.max(30, initialH + deltaY);
        if (handle.includes("w")) {
          const w = Math.max(30, initialW - deltaX);
          newX = initialX + (initialW - w);
          newW = w;
        }
        if (handle.includes("n")) {
          const h = Math.max(30, initialH - deltaY);
          newY = initialY + (initialH - h);
          newH = h;
        }

        onUpdateElement(activeTransform.elementId, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
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
    [activeTransform, zoom, onUpdateElement]
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
        className="relative shadow-2xl rounded-sm"
      >
        <div
          ref={canvasRef}
          className="relative overflow-hidden bg-white shadow-lg border border-slate-300"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            ...getBackgroundStyle(),
          }}
        >
          {/* Subtle Canvas Border Safe Zone Guides */}
          <div className="absolute inset-4 border border-dashed border-teal-500/20 pointer-events-none" />

          {/* Render Elements Sorted by z-index */}
          {[...elements]
            .sort((a, b) => (a.z_index || 1) - (b.z_index || 1))
            .map((el) => (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
              >
                <ElementRenderer
                  element={el}
                  isSelected={el.id === selectedElementId}
                  onSelect={onSelectElement}
                  scale={zoom}
                />
              </div>
            ))}

          {/* Active Selection Overlay & Transform Handles */}
          {selectedElement && !selectedElement.is_hidden && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${selectedElement.x}px`,
                top: `${selectedElement.y}px`,
                width: `${selectedElement.width}px`,
                height: `${selectedElement.height}px`,
                transform: `rotate(${selectedElement.rotation || 0}deg)`,
                transformOrigin: "center center",
              }}
            >
              {/* Canva Blue/Teal Selection Border */}
              <div className="absolute inset-0 border-2 border-teal-500" />

              {/* Floating Quick Action Mini Toolbar */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-auto z-50 text-xs">
                <button
                  type="button"
                  title="Duplicate (Ctrl+D)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateElement(selectedElement.id);
                  }}
                  className="hover:text-teal-400 p-1"
                >
                  <MdContentCopy size={14} />
                </button>
                <button
                  type="button"
                  title="Bring Forward"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBringForward(selectedElement.id);
                  }}
                  className="hover:text-teal-400 p-1"
                >
                  <MdVerticalAlignTop size={14} />
                </button>
                <button
                  type="button"
                  title="Send Backward"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendBackward(selectedElement.id);
                  }}
                  className="hover:text-teal-400 p-1"
                >
                  <MdVerticalAlignBottom size={14} />
                </button>
                <button
                  type="button"
                  title={selectedElement.is_locked ? "Unlock" : "Lock"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElement(selectedElement.id, {
                      is_locked: !selectedElement.is_locked,
                    });
                  }}
                  className="hover:text-teal-400 p-1"
                >
                  {selectedElement.is_locked ? (
                    <MdLockOutline size={14} className="text-amber-400" />
                  ) : (
                    <MdLockOpen size={14} />
                  )}
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(selectedElement.id);
                  }}
                  className="hover:text-rose-400 p-1 text-rose-300"
                >
                  <MdDeleteOutline size={14} />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
