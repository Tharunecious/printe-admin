import React, { useState, useRef, useEffect } from "react";
import { Modal, Slider, Button, Tooltip, Switch } from "antd";
import {
  MdCenterFocusStrong,
  MdZoomIn,
  MdAspectRatio,
  MdRefresh,
  MdPanTool,
  MdCheck,
  MdOutlineCropFree,
  MdOutlineFitScreen,
  MdVisibility,
  MdVisibilityOff,
  MdLayers,
} from "react-icons/md";
import ElementRenderer from "../ElementRenderer";

const POSITION_PRESETS = [
  { label: "Top-Left", x: 0, y: 0, icon: "↖" },
  { label: "Top", x: 50, y: 0, icon: "⬆" },
  { label: "Top-Right", x: 100, y: 0, icon: "↗" },
  { label: "Left", x: 0, y: 50, icon: "⬅" },
  { label: "Center", x: 50, y: 50, icon: "⏺" },
  { label: "Right", x: 100, y: 50, icon: "➡" },
  { label: "Bottom-Left", x: 0, y: 100, icon: "↙" },
  { label: "Bottom", x: 50, y: 100, icon: "⬇" },
  { label: "Bottom-Right", x: 100, y: 100, icon: "↘" },
];

const BackgroundRepositionModal = ({
  open,
  onClose,
  bg,
  onSave,
  aspectRatio = "1:1",
  page = null,
  sizeInfo = null,
}) => {
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [scale, setScale] = useState(1);
  const [fitMode, setFitMode] = useState("cover"); // "cover" | "contain" | "stretch"
  const [showElements, setShowElements] = useState(true);
  const [showBleedGuides, setShowBleedGuides] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialPosX: 50, initialPosY: 50 });
  const previewBoxRef = useRef(null);

  useEffect(() => {
    if (open && bg) {
      setPosX(bg.position_x !== undefined ? Number(bg.position_x) : 50);
      setPosY(bg.position_y !== undefined ? Number(bg.position_y) : 50);
      setScale(bg.scale !== undefined ? Number(bg.scale) : 1);
      const rawFit = bg.fit_mode || "cover";
      setFitMode(rawFit === "100% 100%" ? "stretch" : rawFit);
    }
  }, [open, bg]);

  if (!bg || !bg.value) return null;

  const handleMouseDown = (e) => {
    if (fitMode === "stretch") return; // Stretch is fixed 100% x 100%
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: posX,
      initialPosY: posY,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || fitMode === "stretch") return;
    const box = previewBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaPctX = (deltaX / rect.width) * 100;
    const deltaPctY = (deltaY / rect.height) * 100;

    const nextX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosX - deltaPctX)));
    const nextY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosY - deltaPctY)));

    setPosX(nextX);
    setPosY(nextY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    onSave({
      ...bg,
      position_x: posX,
      position_y: posY,
      scale: fitMode === "stretch" ? 1 : scale,
      fit_mode: fitMode === "stretch" ? "100% 100%" : fitMode,
    });
    onClose();
  };

  const handleReset = () => {
    setPosX(50);
    setPosY(50);
    setScale(1);
    setFitMode("cover");
  };

  // Compute CSS aspect ratio from singlePageRatio or string
  const cssAspectRatio = sizeInfo?.singlePageRatio
    ? `${sizeInfo.singlePageRatio}`
    : typeof aspectRatio === "number"
    ? `${aspectRatio}`
    : String(aspectRatio).replace(":", " / ");

  // Background size CSS rule based on fit mode & zoom scale
  const getPreviewBackgroundSize = () => {
    if (fitMode === "stretch") {
      return "100% 100%";
    }
    if (fitMode === "contain") {
      return scale > 1 ? `${Math.round(scale * 100)}% auto` : "contain";
    }
    // cover mode
    return scale > 1 ? `${Math.round(scale * 100)}% auto` : "cover";
  };

  const isInterior = page?.page_type === "interior";
  const isEvenPage = (Number(page?.page_number) || 1) % 2 === 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={780}
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <MdCenterFocusStrong size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block">Select Background Visible Area & Pan</span>
              <span className="text-[11px] font-normal text-slate-400">
                Preview real photobook look under Cover, Contain, and Stretch modes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg text-xs text-slate-600">
              <span className="text-[11px] font-medium">Show Elements:</span>
              <Switch
                size="small"
                checked={showElements}
                onChange={setShowElements}
                className={showElements ? "!bg-teal-600" : ""}
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg text-xs text-slate-600">
              <span className="text-[11px] font-medium">Bleed & Spine:</span>
              <Switch
                size="small"
                checked={showBleedGuides}
                onChange={setShowBleedGuides}
                className={showBleedGuides ? "!bg-teal-600" : ""}
              />
            </div>
          </div>
        </div>
      }
    >
      <div
        className="flex flex-col gap-4 py-2 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Helper bar & quick reset */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <span className="flex items-center gap-1.5 font-medium">
            <MdPanTool className="text-teal-600 text-sm" />
            {fitMode === "stretch"
              ? "Stretch Mode: Image is stretched to fill 100% of photobook width and height without cropping."
              : fitMode === "contain"
              ? "Contain Mode: Entire image fits inside the page. Drag or use 9-point grid to align."
              : "Cover Mode: Image covers entire page. Drag on page to choose focal visible area."}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
          >
            <MdRefresh className="text-sm" /> Reset
          </button>
        </div>

        {/* ── Realistic Photobook Stage Simulation ─────────────────────── */}
        <div className="relative w-full h-[360px] bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
          {/* Subtle Ambient Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Paper Soft Shadow */}
          <div className="absolute bottom-5 w-[70%] h-8 bg-black/80 blur-xl rounded-full pointer-events-none" />

          {/* Actual Photobook Paper Sheet */}
          <div
            ref={previewBoxRef}
            onMouseDown={handleMouseDown}
            style={{
              aspectRatio: cssAspectRatio,
              maxHeight: "310px",
              maxWidth: "88%",
              containerType: "inline-size",
            }}
            className={`relative h-full overflow-hidden bg-white shadow-2xl rounded-xs border border-slate-300 transition-all select-none ${
              fitMode !== "stretch" && isDragging
                ? "cursor-grabbing ring-2 ring-teal-400"
                : fitMode !== "stretch"
                ? "cursor-grab hover:ring-1 hover:ring-teal-400/60"
                : "cursor-default"
            }`}
          >
            {/* ── Background Layer with Real Fit Mode & Position ────────── */}
            <div
              className="absolute inset-0 pointer-events-none select-none transition-all duration-150"
              style={{
                backgroundImage: `url("${bg.value}")`,
                backgroundPosition: `${posX}% ${posY}%`,
                backgroundSize: getPreviewBackgroundSize(),
                backgroundRepeat: "no-repeat",
                backgroundColor: bg.background_color || "#ffffff",
                opacity: bg.opacity ?? 1,
              }}
            />

            {/* ── Subtle Photobook Spine Shade (Interior Book Look) ─────── */}
            {showBleedGuides && isInterior && (
              <div
                className={`absolute top-0 bottom-0 w-8 pointer-events-none z-20 ${
                  isEvenPage
                    ? "right-0 bg-gradient-to-l from-black/25 via-black/10 to-transparent"
                    : "left-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent"
                }`}
              />
            )}

            {/* ── Safe Print Zone / 3mm Bleed Cut Guide Line ───────────── */}
            {showBleedGuides && (
              <div
                className="absolute inset-4 border border-dashed border-sky-400/40 pointer-events-none z-20 flex items-start justify-start p-1"
                title="3mm Safe Cut Printing Zone"
              >
                <span className="text-[8px] font-mono text-sky-400/80 bg-sky-950/60 px-1 py-0.2 rounded">
                  Safe Bleed Zone
                </span>
              </div>
            )}

            {/* ── Rule of Thirds Finder Grid (In Cover/Contain Mode) ───── */}
            {fitMode !== "stretch" && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 z-15">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div />
              </div>
            )}

            {/* ── Page Elements Overlay (Exact Photobook Look) ─────────── */}
            {showElements && Array.isArray(page?.elements) && page.elements.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {page.elements.map((el) => (
                  <ElementRenderer
                    key={el.id}
                    element={el}
                    previewMode={true}
                  />
                ))}
              </div>
            )}

            {/* ── Focal Point Marker (In Cover/Contain Mode) ───────────── */}
            {fitMode !== "stretch" && (
              <div
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute w-6 h-6 border-2 border-teal-300 rounded-full bg-teal-500/30 flex items-center justify-center pointer-events-none shadow-md backdrop-blur-xs z-30"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow" />
              </div>
            )}

            {/* ── Live Status Pill Badge ───────────────────────────────── */}
            <div className="absolute bottom-2 left-2 bg-slate-900/85 text-teal-300 font-mono text-[9px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-30 flex items-center gap-1.5 shadow">
              <span className="font-bold text-white uppercase tracking-wider">
                {fitMode === "stretch" ? "Stretch (100% × 100%)" : fitMode === "contain" ? "Contain (Uncropped)" : "Cover (Full Bleed)"}
              </span>
              {fitMode !== "stretch" && (
                <span>• Focus: {posX}% X, {posY}% Y {scale > 1 ? `• Zoom: ${Math.round(scale * 100)}%` : ""}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Interactive Fit Mode Selector Cards ──────────────────────── */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
            Select Display Fit Mode
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Cover */}
            <button
              type="button"
              onClick={() => setFitMode("cover")}
              className={`p-2.5 rounded-xl border flex flex-col items-start text-left transition-all cursor-pointer ${
                fitMode === "cover"
                  ? "bg-teal-50/70 border-teal-600 shadow-sm ring-1 ring-teal-500"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 mb-1">
                <MdOutlineCropFree className={fitMode === "cover" ? "text-teal-600" : "text-slate-500"} size={16} />
                <span>Cover (Fill Page)</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Fills the entire page edge-to-edge. No white bars. Drag image to choose visible crop.
              </p>
            </button>

            {/* 2. Contain */}
            <button
              type="button"
              onClick={() => setFitMode("contain")}
              className={`p-2.5 rounded-xl border flex flex-col items-start text-left transition-all cursor-pointer ${
                fitMode === "contain"
                  ? "bg-teal-50/70 border-teal-600 shadow-sm ring-1 ring-teal-500"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 mb-1">
                <MdOutlineFitScreen className={fitMode === "contain" ? "text-teal-600" : "text-slate-500"} size={16} />
                <span>Contain (Full Image)</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Shows the complete image without cropping any edges. Preserves original image ratio.
              </p>
            </button>

            {/* 3. Stretch */}
            <button
              type="button"
              onClick={() => {
                setFitMode("stretch");
                setScale(1);
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-start text-left transition-all cursor-pointer ${
                fitMode === "stretch"
                  ? "bg-teal-50/70 border-teal-600 shadow-sm ring-1 ring-teal-500"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 mb-1">
                <MdAspectRatio className={fitMode === "stretch" ? "text-teal-600" : "text-slate-500"} size={16} />
                <span>Stretch (Exact Fit)</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Stretches image to 100% width and 100% height of the page. No cropping, fills entire sheet.
              </p>
            </button>
          </div>
        </div>

        {/* ── Position & Zoom Fine-Tuning Controls ──────────────────────── */}
        {fitMode !== "stretch" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            {/* Left Column: 9-Point Alignment Grid */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Quick Focus Anchor (9-Point)
              </label>
              <div className="grid grid-cols-3 gap-1.5 max-w-[200px]">
                {POSITION_PRESETS.map((p) => {
                  const isActive = posX === p.x && posY === p.y;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPosX(p.x);
                        setPosY(p.y);
                      }}
                      className={`py-1.5 px-2 rounded border text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                      title={p.label}
                    >
                      <span className="text-sm leading-none">{p.icon}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Click preset anchors or drag the page canvas directly above.
              </div>
            </div>

            {/* Right Column: Sliders for X, Y & Zoom */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-medium text-slate-600">Horizontal Pan (X)</span>
                  <span className="font-mono text-slate-500">{posX}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={posX}
                  onChange={setPosX}
                  className="my-1"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-medium text-slate-600">Vertical Pan (Y)</span>
                  <span className="font-mono text-slate-500">{posY}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={posY}
                  onChange={setPosY}
                  className="my-1"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-medium text-slate-600 flex items-center gap-1">
                    <MdZoomIn /> Zoom Scale
                  </span>
                  <span className="font-mono text-slate-500">{Math.round(scale * 100)}%</span>
                </div>
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={scale}
                  onChange={setScale}
                  className="my-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800 flex items-center gap-2">
            <MdAspectRatio size={20} className="text-sky-600 shrink-0" />
            <span>
              In <strong>Stretch Mode</strong>, the image is scaled to exactly 100% width and 100% height of this photobook page. Panning and cropping are disabled because the whole image is fully stretched across the paper.
            </span>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<MdCheck />}
            onClick={handleApply}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Apply Background Position
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BackgroundRepositionModal;
