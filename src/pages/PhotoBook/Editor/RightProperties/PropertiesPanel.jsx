import React, { useState, useEffect } from "react";
import {
  Input,
  InputNumber,
  Slider,
  Switch,
  Select,
  Radio,
  Button,
  Divider,
  message,
} from "antd";
import { uploadImage } from "../../../../api";
import { FRAME_SHAPES } from "../../utils/clipPaths";
import { PRESET_FONTS, AVAILABLE_FONTS, SAMPLE_TEST_PHOTOS, getFontFamilyFallback, PRESET_SOLID_COLORS, PRESET_GRADIENTS } from "../../utils/presetAssets";
import LayersPanel from "../LayersPanel/LayersPanel";
import {
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatItalic,
  MdLockOutline,
  MdLockOpen,
  MdDeleteOutline,
  MdImage,
  MdCloudUpload,
  MdChevronRight,
  MdExpandMore,
  MdLayers,
  MdAspectRatio,
  MdInfoOutline,
} from "react-icons/md";
import { FiRotateCw, FiZoomIn, FiMove, FiRefreshCw } from "react-icons/fi";

import { calculateDynamicTextDimensions, adjustTextPositionForNewWidth } from "../../utils/textUtils";
import BackgroundRepositionModal from "./BackgroundRepositionModal";
import { MdCenterFocusStrong } from "react-icons/md";

const PropertiesPanel = ({
  selectedElement,
  page,
  onUpdateElement,
  onDeleteElement,
  onSetBackground,
  onSelectElement,
  currentSizeInfo,
  onOpenSizeModal,
  elements = [],
  onBringForward,
  onSendBackward,
  onReorderElements,
  panelTab: controlledPanelTab,
  onPanelTabChange,
}) => {
  const [internalPanelTab, setInternalPanelTab] = useState("page"); // "page" or "layers"
  const panelTab = controlledPanelTab !== undefined ? controlledPanelTab : internalPanelTab;
  const setPanelTab = (t) => {
    if (onPanelTabChange) onPanelTabChange(t);
    else setInternalPanelTab(t);
  };
  const [pageSettingsOpen, setPageSettingsOpen] = useState(true);
  const [framePropsOpen, setFramePropsOpen] = useState(true);
  const [photoSettingsOpen, setPhotoSettingsOpen] = useState(true);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [isBgCropModalOpen, setIsBgCropModalOpen] = useState(false);

  // Background tab selection decoupled from page background mutation
  const [activeBgType, setActiveBgType] = useState(() => page?.background?.type || "color");
  const [gradAngle, setGradAngle] = useState(135);
  const [gradColor1, setGradColor1] = useState("#0f172a");
  const [gradColor2, setGradColor2] = useState("#0284c7");
  const [recentBgImages, setRecentBgImages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("admin_uploaded_elements") || "[]");
      return saved.filter((el) => el.is_background || el.asset_url);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (page?.background?.type) {
      setActiveBgType(page.background.type);
    }
  }, [page?.page_id, page?.background?.type]);

  useEffect(() => {
    const updateRecent = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("admin_uploaded_elements") || "[]");
        setRecentBgImages(saved.filter((el) => el.is_background || el.asset_url));
      } catch {}
    };
    window.addEventListener("admin_elements_updated", updateRecent);
    return () => window.removeEventListener("admin_elements_updated", updateRecent);
  }, []);

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Please select a valid image file");
      return;
    }
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadImage(formData);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        const bg = page?.background || {};
        onSetBackground({
          ...bg,
          type: "image",
          value: url,
          image_url: url,
          opacity: bg.opacity ?? 1,
          position_x: 50,
          position_y: 50,
          scale: 1,
          fit_mode: "cover",
        });

        // Also add to Uploads section for element reuse:
        try {
          const current = JSON.parse(localStorage.getItem("admin_uploaded_elements") || "[]");
          const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "Background Image";
          const newUpload = {
            id: "upload_bg_" + Date.now(),
            name: cleanName,
            type: "decoration",
            asset_type: "png",
            asset_url: url,
            is_background: true,
            category: "Uploads",
            created_at: new Date().toISOString(),
          };
          const next = [newUpload, ...current.filter((x) => x.asset_url !== url)].slice(0, 30);
          localStorage.setItem("admin_uploaded_elements", JSON.stringify(next));
          setRecentBgImages(next);
          window.dispatchEvent(new CustomEvent("admin_elements_updated", { detail: next }));
        } catch (storageErr) {
          console.warn("Storage sync error:", storageErr);
        }

        setIsBgCropModalOpen(true);
        message.success("Background uploaded and added to Upload section!");
      } else {
        message.error("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to upload image");
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  };

  if (!selectedElement) {
    // Show Page Background & Canvas Properties
    const bg = page?.background || {};
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 select-none shadow-sm overflow-hidden">
        {/* Top Tabs: Page & Layers */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setPanelTab("page")}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              panelTab === "page"
                ? "border-[#0284c7] text-[#0284c7] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Page
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("layers")}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
              panelTab === "layers"
                ? "border-[#0284c7] text-[#0284c7] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Layers</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-semibold">
              {elements?.length || 0}
            </span>
          </button>
        </div>

        {panelTab === "layers" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <LayersPanel
              elements={elements}
              selectedElementId={selectedElement?.id}
              onSelectElement={onSelectElement}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
              onBringForward={onBringForward}
              onSendBackward={onSendBackward}
              onReorderElements={onReorderElements}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ==================== ACCORDION 1: PAGE SETTINGS ==================== */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-2xs">
              <button
                type="button"
                onClick={() => setPageSettingsOpen((o) => !o)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <MdAspectRatio className="text-[#0284c7]" size={16} />
                  <span>Page Settings</span>
                </div>
                {pageSettingsOpen ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
              </button>

              {pageSettingsOpen && (
                <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-slate-100 border border-slate-300 rounded-md flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                      P. {page?.targeting_rule?.page_number || 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {currentSizeInfo?.name || "A4 Standard"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {currentSizeInfo?.dimensions || "8.27 x 11.69 in"}
                      </span>
                      <span className="text-[9px] font-bold text-teal-700 uppercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                        {currentSizeInfo?.orientation || "Portrait"}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="small"
                    block
                    onClick={onOpenSizeModal}
                    className="!text-xs font-semibold !border-slate-300 hover:!border-sky-500 hover:!text-sky-600 cursor-pointer"
                  >
                    Change Size
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Page Background
              </h3>
              <p className="text-xs text-slate-500">
                {page?.name || "Selected Page"}
              </p>
            </div>

            <Divider className="my-1" />

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Background Type
            </label>
            <Radio.Group
              size="small"
              className="w-full text-center"
              value={activeBgType}
              onChange={(e) => setActiveBgType(e.target.value)}
            >
              <Radio.Button value="color">Color</Radio.Button>
              <Radio.Button value="gradient">Gradient</Radio.Button>
              <Radio.Button value="image">Image</Radio.Button>
            </Radio.Group>
          </div>

          {/* 1. COLOR SECTION */}
          {activeBgType === "color" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg.type === "color" && bg.value ? bg.value : "#ffffff"}
                  onChange={(e) =>
                    onSetBackground({ ...bg, type: "color", value: e.target.value })
                  }
                  className="w-9 h-9 p-0.5 rounded border border-slate-300 cursor-pointer"
                />
                <Input
                  size="small"
                  value={bg.type === "color" && bg.value ? bg.value : "#ffffff"}
                  onChange={(e) =>
                    onSetBackground({ ...bg, type: "color", value: e.target.value })
                  }
                  className="flex-1 font-mono text-xs uppercase"
                  placeholder="#FFFFFF"
                />
              </div>

              {/* Preset Color Swatches */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Quick Palette Swatches
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {PRESET_SOLID_COLORS.slice(0, 21).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onSetBackground({ ...bg, type: "color", value: c })}
                      className="w-6 h-6 rounded-md border border-slate-300 hover:scale-115 transition-transform cursor-pointer shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. GRADIENT SECTION */}
          {activeBgType === "gradient" && (
            <div className="space-y-3 bg-gradient-to-br from-sky-50/50 to-slate-50 p-2.5 rounded-xl border border-sky-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Linear Gradient
                </label>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  {gradAngle}° Degree
                </span>
              </div>

              {/* Live Preview Box */}
              <div
                className="w-full h-11 rounded-lg border border-slate-300 shadow-inner flex items-center justify-center text-center p-1"
                style={{
                  background: `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`,
                }}
              >
                <span className="text-[9px] font-bold text-slate-800 bg-white/90 px-2 py-0.5 rounded shadow-2xs">
                  {gradAngle}° • {gradColor1} ➔ {gradColor2}
                </span>
              </div>

              {/* Degree Slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Gradient Angle</span>
                  <span className="font-mono text-sky-700 font-bold">{gradAngle}°</span>
                </div>
                <Slider
                  min={0}
                  max={360}
                  step={5}
                  value={gradAngle}
                  onChange={(v) => setGradAngle(v)}
                />
              </div>

              {/* Color Inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Start</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={gradColor1}
                      onChange={(e) => setGradColor1(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <Input
                      size="small"
                      value={gradColor1}
                      onChange={(e) => setGradColor1(e.target.value)}
                      className="font-mono text-[10px] p-1 uppercase"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">End</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={gradColor2}
                      onChange={(e) => setGradColor2(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <Input
                      size="small"
                      value={gradColor2}
                      onChange={(e) => setGradColor2(e.target.value)}
                      className="font-mono text-[10px] p-1 uppercase"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                size="small"
                block
                onClick={() => {
                  const gradientVal = `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`;
                  onSetBackground({
                    ...bg,
                    type: "gradient",
                    value: gradientVal,
                  });
                  message.success(`Applied linear gradient (${gradAngle}°)!`);
                }}
                className="!bg-sky-600 hover:!bg-sky-700 font-bold text-xs"
              >
                Apply Custom Gradient
              </Button>

              {/* Preset Gradients List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                  Preset Linear Gradients
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() =>
                        onSetBackground({
                          ...bg,
                          type: "gradient",
                          value: g.value,
                        })
                      }
                      className="h-9 rounded-lg border border-slate-300 shadow-2xs hover:scale-102 transition-transform cursor-pointer flex items-center justify-center p-1"
                      style={{ background: g.value }}
                    >
                      <span className="text-[8px] font-bold bg-white/90 text-slate-900 px-1 rounded shadow-2xs">
                        {g.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. IMAGE SECTION */}
          {activeBgType === "image" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Background Image
              </label>
              
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-lg p-2.5 cursor-pointer bg-teal-50/40 hover:bg-teal-50 transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  disabled={uploadingBg}
                  className="hidden"
                />
                <MdCloudUpload className="text-lg text-teal-600" />
                <span className="text-xs font-medium text-teal-700">
                  {uploadingBg ? "Uploading..." : "Upload from Device"}
                </span>
              </label>

              {/* Uploaded Background Library (Available for Instant Selection) */}
              {recentBgImages.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                    Select from Uploads ({recentBgImages.length})
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                    {recentBgImages.map((img) => {
                      const isApplied = bg.type === "image" && bg.value === img.asset_url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            onSetBackground({
                              ...bg,
                              type: "image",
                              value: img.asset_url,
                              image_url: img.asset_url,
                              opacity: bg.opacity ?? 1,
                              position_x: 50,
                              position_y: 50,
                              scale: 1,
                              fit_mode: "cover",
                            });
                            message.success("Applied uploaded image as background!");
                          }}
                          className={`h-11 rounded border overflow-hidden transition-all cursor-pointer relative group ${
                            isApplied ? "border-teal-600 ring-2 ring-teal-400" : "border-slate-300 hover:border-teal-500"
                          }`}
                          title={img.name}
                        >
                          <img src={img.asset_url} alt="" className="w-full h-full object-cover" />
                          {isApplied && (
                            <span className="absolute inset-0 bg-teal-600/30 flex items-center justify-center text-white text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bg.type === "image" && bg.value && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div
                    style={{
                      backgroundImage: `url("${bg.value}")`,
                      backgroundPosition: `${bg.position_x ?? 50}% ${bg.position_y ?? 50}%`,
                      backgroundSize:
                        bg.fit_mode === "stretch" || bg.fit_mode === "100% 100%"
                          ? "100% 100%"
                          : bg.fit_mode === "contain"
                          ? (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "contain")
                          : (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "cover"),
                      backgroundRepeat: "no-repeat",
                    }}
                    className="relative rounded-lg overflow-hidden border border-slate-300 h-24 bg-slate-100 flex items-center justify-center shadow-xs"
                  >
                    <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-teal-300 font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none flex items-center gap-1">
                      <span className="uppercase font-bold text-white">{bg.fit_mode === "100% 100%" ? "Stretch" : bg.fit_mode || "Cover"}</span>
                      {bg.fit_mode !== "stretch" && bg.fit_mode !== "100% 100%" && (
                        <span>• Focus: {bg.position_x ?? 50}% {bg.position_y ?? 50}%</span>
                      )}
                    </div>
                    <button
                      onClick={() => onSetBackground({ ...bg, value: "" })}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded p-1 text-xs transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <MdDeleteOutline size={14} />
                    </button>
                  </div>

                  {/* Button to Open Interactive Visible Area Pan & Zoom Modal */}
                  <Button
                    type="primary"
                    size="small"
                    icon={<MdCenterFocusStrong className="text-sm" />}
                    onClick={() => setIsBgCropModalOpen(true)}
                    className="w-full bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1 font-semibold text-xs h-7.5"
                  >
                    Select Visible Part & Pan
                  </Button>

                  {/* In-Panel Quick Position Presets */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 block">
                      Quick Focus Position
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: "Top-Left", x: 0, y: 0, icon: "↖" },
                        { label: "Top", x: 50, y: 0, icon: "⬆" },
                        { label: "Top-Right", x: 100, y: 0, icon: "↗" },
                        { label: "Left", x: 0, y: 50, icon: "⬅" },
                        { label: "Center", x: 50, y: 50, icon: "⏺" },
                        { label: "Right", x: 100, y: 50, icon: "➡" },
                        { label: "Bottom-Left", x: 0, y: 100, icon: "↙" },
                        { label: "Bottom", x: 50, y: 100, icon: "⬇" },
                        { label: "Bottom-Right", x: 100, y: 100, icon: "↘" },
                      ].map((pos) => {
                        const isCur = (bg.position_x ?? 50) === pos.x && (bg.position_y ?? 50) === pos.y;
                        return (
                          <button
                            key={pos.label}
                            type="button"
                            onClick={() =>
                              onSetBackground({
                                ...bg,
                                position_x: pos.x,
                                position_y: pos.y,
                              })
                            }
                            className={`py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                              isCur
                                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50"
                            }`}
                            title={pos.label}
                          >
                            {pos.icon}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                        <span>Horiz (X): {bg.position_x ?? 50}%</span>
                        <span>Vert (Y): {bg.position_y ?? 50}%</span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        value={bg.position_x ?? 50}
                        onChange={(val) => onSetBackground({ ...bg, position_x: val })}
                        className="my-1"
                      />
                      <Slider
                        min={0}
                        max={100}
                        value={bg.position_y ?? 50}
                        onChange={(val) => onSetBackground({ ...bg, position_y: val })}
                        className="my-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">
                  Or Direct Image URL
                </label>
                <div className="flex gap-1.5">
                  <Input
                    size="small"
                    placeholder="https://..."
                    value={bg.type === "image" ? bg.value || "" : ""}
                    onChange={(e) =>
                      onSetBackground({ ...bg, type: "image", value: e.target.value, image_url: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Opacity
              </label>
              <span className="text-xs text-slate-500">
                {Math.round((bg.opacity ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={bg.opacity ?? 1}
              onChange={(v) => onSetBackground({ ...bg, opacity: v })}
            />
          </div>
        </div>

        <Divider className="my-2" />

        <div className="text-xs text-slate-500 space-y-1">
          <p>
            <strong>Page Type:</strong> {page?.page_type}
          </p>
          <p>
            <strong>Elements Count:</strong> {page?.elements?.length || 0}
          </p>
          <p>
            <strong>Targeting:</strong>{" "}
            {page?.targeting_rule?.rule_type?.replace("_", " ")}
          </p>
        </div>
        </div>
      )}
    </div>
  );
}

  const { id, type, is_locked } = selectedElement;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 select-none shadow-sm overflow-hidden">
      {/* Top Tabs: Page & Layers */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={() => setPanelTab("page")}
          className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            panelTab === "page"
              ? "border-[#0284c7] text-[#0284c7] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Page
        </button>
        <button
          type="button"
          onClick={() => setPanelTab("layers")}
          className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
            panelTab === "layers"
              ? "border-[#0284c7] text-[#0284c7] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Layers</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-semibold">
            {elements?.length || 0}
          </span>
        </button>
      </div>

      {panelTab === "layers" ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <LayersPanel
            elements={elements}
            selectedElementId={selectedElement?.id}
            onSelectElement={onSelectElement}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            onBringForward={onBringForward}
            onSendBackward={onSendBackward}
            onReorderElements={onReorderElements}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ==================== ACCORDION 1: PAGE SETTINGS ==================== */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-2xs">
            <button
              type="button"
              onClick={() => setPageSettingsOpen((o) => !o)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <MdAspectRatio className="text-[#0284c7]" size={16} />
                <span>Page Settings</span>
              </div>
              {pageSettingsOpen ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
            </button>

            {pageSettingsOpen && (
              <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 bg-slate-100 border border-slate-300 rounded-md flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                    P. {page?.targeting_rule?.page_number || 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {currentSizeInfo?.name || "A4 Standard"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {currentSizeInfo?.dimensions || "8.27 x 11.69 in"}
                    </span>
                    <span className="text-[9px] font-bold text-teal-700 uppercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                      {currentSizeInfo?.orientation || "Portrait"}
                    </span>
                  </div>
                </div>

                <Button
                  size="small"
                  block
                  onClick={onOpenSizeModal}
                  className="!text-xs font-semibold !border-slate-300 hover:!border-sky-500 hover:!text-sky-600 cursor-pointer"
                >
                  Change Size
                </Button>
              </div>
            )}
          </div>
      {/* Top Header of Selected Element */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            {type.replace("_", " ")}
          </span>
          <h3 className="text-sm font-semibold text-slate-800 mt-1">
            {selectedElement.frame_id || selectedElement.name || type}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateElement(id, { is_locked: !is_locked })}
            title={is_locked ? "Unlock" : "Lock"}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          >
            {is_locked ? (
              <MdLockOutline className="text-amber-500" size={18} />
            ) : (
              <MdLockOpen size={18} />
            )}
          </button>
          <button
            onClick={() => onDeleteElement(id)}
            title="Delete"
            className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
          >
            <MdDeleteOutline size={18} />
          </button>
        </div>
      </div>

      <Divider className="my-1" />

      {/* ==================== PHOTO FRAME PROPERTIES ==================== */}
      {type === "photo_frame" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Frame Shape
            </label>
            <Select
              size="small"
              className="w-full"
              value={selectedElement.shape || "rectangle"}
              onChange={(shape) => {
                const is1to1 = ["circle", "heart", "star", "scallop", "hexagon"].includes(shape);
                const updates = { shape };
                if (is1to1) {
                  const wPct = selectedElement.width_pct !== undefined ? selectedElement.width_pct : 50;
                  updates.height_pct = wPct;
                  updates.height_str = `${wPct}%`;
                  updates.height = Math.round(wPct * 10);
                }
                onUpdateElement(id, updates);
              }}
              options={FRAME_SHAPES.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Stable Frame ID
            </label>
            <Input
              size="small"
              value={selectedElement.frame_id || ""}
              onChange={(e) => onUpdateElement(id, { frame_id: e.target.value })}
              placeholder="e.g. wedding_hero_1"
            />
            <span className="text-[10px] text-slate-400">
              Unique ID used by customer photo assignment engine.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Default Image Fitting Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onUpdateElement(id, { fit_mode: "cover" })}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                  (selectedElement.fit_mode || "cover") === "cover"
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cover (Fill & Crop)
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(id, { fit_mode: "contain" })}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-center ${
                  selectedElement.fit_mode === "contain"
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Contain (Fit Whole)
              </button>
            </div>
          </div>

          {/* Photo Placeholder Notice matching screenshot */}
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-900 leading-snug shadow-2xs">
            <span className="font-bold flex items-center gap-1.5 text-sky-800 mb-1">
              <MdInfoOutline size={15} /> Customer Photo Upload Frame
            </span>
            This frame is reserved for Customer Photo Uploads. The customer can drag and drop their photos into this frame.
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Admin Test Photo (Preview Clipping Only)
            </span>
            {selectedElement.test_image_url ? (
              <div className="space-y-2">
                <img
                  src={selectedElement.test_image_url}
                  alt="Test preview"
                  className="w-full h-24 object-cover rounded border border-slate-300"
                />
                <Button
                  size="small"
                  danger
                  block
                  onClick={() => onUpdateElement(id, { test_image_url: "" })}
                >
                  Remove Test Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  size="small"
                  placeholder="Paste test image URL..."
                  onPressEnter={(e) =>
                    onUpdateElement(id, { test_image_url: e.target.value })
                  }
                />
                <div className="flex gap-1 overflow-x-auto py-1">
                  {SAMPLE_TEST_PHOTOS.slice(0, 4).map((p, idx) => (
                    <img
                      key={idx}
                      src={p.url}
                      alt={p.name}
                      onClick={() =>
                        onUpdateElement(id, { test_image_url: p.url })
                      }
                      title={`Use "${p.name}"`}
                      className="w-9 h-9 rounded object-cover cursor-pointer hover:ring-2 hover:ring-teal-500 flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photoshop-like Photo Crop, Zoom & Pan Controls */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FiZoomIn className="text-teal-600" /> Photo Crop & Pan (Photoshop)
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(id, {
                    crop: { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 },
                  })
                }
                title="Reset Crop"
                className="text-[10px] text-slate-400 hover:text-teal-600 flex items-center gap-0.5"
              >
                <FiRefreshCw size={10} /> Reset
              </button>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Zoom Scale</span>
                <span className="font-mono font-semibold">
                  {((selectedElement.crop?.zoom || 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.05}
                value={selectedElement.crop?.zoom || 1}
                onChange={(z) =>
                  onUpdateElement(id, {
                    crop: {
                      ...(selectedElement.crop || {}),
                      zoom: z,
                    },
                  })
                }
              />
            </div>

            {/* Pan X Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Pan X (Horizontal)</span>
                <span className="font-mono font-semibold">
                  {selectedElement.crop?.offsetX || 0}%
                </span>
              </div>
              <Slider
                min={-50}
                max={50}
                step={1}
                value={selectedElement.crop?.offsetX || 0}
                onChange={(ox) =>
                  onUpdateElement(id, {
                    crop: {
                      ...(selectedElement.crop || {}),
                      offsetX: ox,
                    },
                  })
                }
              />
            </div>

            {/* Pan Y Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                <span>Pan Y (Vertical)</span>
                <span className="font-mono font-semibold">
                  {selectedElement.crop?.offsetY || 0}%
                </span>
              </div>
              <Slider
                min={-50}
                max={50}
                step={1}
                value={selectedElement.crop?.offsetY || 0}
                onChange={(oy) =>
                  onUpdateElement(id, {
                    crop: {
                      ...(selectedElement.crop || {}),
                      offsetY: oy,
                    },
                  })
                }
              />
            </div>

            {/* Rotate Photo Inside Frame */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-[11px] text-slate-600">Rotate Inside Frame</span>
              <Button
                size="small"
                icon={<FiRotateCw />}
                onClick={() => {
                  const currentRot = selectedElement.crop?.rotation || 0;
                  onUpdateElement(id, {
                    crop: {
                      ...(selectedElement.crop || {}),
                      rotation: (currentRot + 90) % 360,
                    },
                  });
                }}
              >
                Rotate 90°
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Border Width & Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.border?.color || "#ffffff"}
                onChange={(e) =>
                  onUpdateElement(id, {
                    border: {
                      ...(selectedElement.border || {}),
                      color: e.target.value,
                    },
                  })
                }
                className="w-7 h-7 p-0 rounded border border-slate-300"
              />
              <InputNumber
                size="small"
                min={0}
                max={40}
                value={selectedElement.border?.width || 0}
                onChange={(w) =>
                  onUpdateElement(id, {
                    border: {
                      ...(selectedElement.border || {}),
                      width: w || 0,
                    },
                  })
                }
                addonAfter="px"
              />
            </div>
          </div>

          {selectedElement.shape === "rectangle" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Corner Radius
              </label>
              <Slider
                min={0}
                max={50}
                value={selectedElement.border?.radius || 0}
                onChange={(r) =>
                  onUpdateElement(id, {
                    border: {
                      ...(selectedElement.border || {}),
                      radius: r,
                    },
                  })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                Required Photo
              </span>
              <span className="text-[10px] text-slate-400">
                Customer must provide a photo
              </span>
            </div>
            <Switch
              size="small"
              checked={selectedElement.is_required !== false}
              onChange={(checked) =>
                onUpdateElement(id, { is_required: checked })
              }
            />
          </div>
        </div>
      )}

      {/* ==================== TEXT PROPERTIES ==================== */}
      {type === "text" && (() => {
        const updateTextProperties = (patch) => {
          const merged = { ...selectedElement, ...patch };
          const canvasW = currentSizeInfo?.width || (currentSizeInfo?.singlePageRatio < 1 ? 707 : 1000);
          const canvasH = currentSizeInfo?.height || 1000;

          const dims = calculateDynamicTextDimensions({
            content: merged.content,
            fontSize: merged.font_size,
            fontFamily: merged.font_family,
            fontWeight: merged.font_weight,
            fontStyle: merged.font_style,
            letterSpacing: merged.letter_spacing,
            lineHeight: merged.line_height,
            canvasWidth: canvasW,
            canvasHeight: canvasH,
          });

          const newX = adjustTextPositionForNewWidth({
            oldXPct: selectedElement.x_pct,
            oldWidthPct: selectedElement.width_pct,
            newWidthPct: dims.width_pct,
            align: merged.align || "center",
          });

          onUpdateElement(id, {
            ...patch,
            width_pct: dims.width_pct,
            height_pct: dims.height_pct,
            width: dims.width,
            height: dims.height,
            width_str: dims.width_str,
            height_str: dims.height_str,
            x_pct: newX,
            x_str: `${newX}%`,
            x: Math.round((newX / 100) * canvasW),
          });
        };

        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Text Content
                </label>
                <span className="text-[10px] text-teal-600 font-mono font-medium">
                  Width: {selectedElement.width_pct ?? 1}%
                </span>
              </div>
              <Input.TextArea
                rows={3}
                placeholder="Type your text here..."
                value={selectedElement.content ?? ""}
                onChange={(e) => updateTextProperties({ content: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Font Family & Style
                </label>
                <span className="text-[10px] text-teal-600 font-mono font-medium">
                  {selectedElement.font_family || "Inter"}
                </span>
              </div>

              {/* Quick Dropdown with Font Typography Previews */}
              <Select
                size="small"
                className="w-full mb-2"
                value={selectedElement.font_family || "Inter"}
                onChange={(font_family) => updateTextProperties({ font_family })}
                options={PRESET_FONTS.map((f) => ({
                  value: f.family,
                  label: (
                    <div
                      data-photobook-font="true"
                      style={{
                        fontFamily: getFontFamilyFallback(f.family),
                        "--photobook-font": getFontFamilyFallback(f.family),
                      }}
                      className="flex items-center justify-between py-0.5"
                    >
                      <span className="text-sm font-medium">{f.family}</span>
                      <span className="text-[10px] text-slate-400 font-sans font-normal ml-2">{f.label}</span>
                    </div>
                  ),
                }))}
              />

              {/* Visual Font Style Cards Grid (Identical to Customer Side) */}
              <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                {PRESET_FONTS.map((f) => {
                  const isSelected = (selectedElement.font_family || "Inter") === f.family;
                  const fontFallback = getFontFamilyFallback(f.family);
                  return (
                    <button
                      key={f.family}
                      type="button"
                      data-photobook-font="true"
                      onClick={() => updateTextProperties({ font_family: f.family })}
                      style={{
                        fontFamily: fontFallback,
                        "--photobook-font": fontFallback,
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-2 border-teal-500 bg-teal-50/80 text-teal-900 font-bold shadow-xs ring-1 ring-teal-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm truncate w-full">{f.family}</span>
                      <span className="text-[9px] text-slate-400 font-sans font-normal truncate w-full mt-0.5">
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>

            {/* Live Typography Preview Box (Adaptive contrast for light/white text colors) */}
            {(() => {
              const fontCss = getFontFamilyFallback(selectedElement.font_family || "Inter");
              const textColor = selectedElement.color || "#1f2937";
              const isWhiteOrLight =
                textColor.toLowerCase() === "#ffffff" ||
                textColor.toLowerCase() === "#fff" ||
                textColor.toLowerCase().startsWith("#f") ||
                textColor.toLowerCase().startsWith("#e");

              return (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl border text-center shadow-xs overflow-hidden transition-all ${
                    isWhiteOrLight
                      ? "bg-slate-900 border-slate-700"
                      : "bg-gradient-to-br from-teal-50/50 to-white border-teal-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase ${
                        isWhiteOrLight ? "text-teal-400" : "text-teal-700"
                      }`}
                    >
                      Live Font Preview
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        isWhiteOrLight
                          ? "bg-slate-800 text-teal-300 border border-slate-700"
                          : "bg-teal-100/70 text-teal-700"
                      }`}
                    >
                      {selectedElement.font_family || "Inter"}
                    </span>
                  </div>
                  <div
                    data-photobook-font="true"
                    className="text-base truncate px-2 py-1.5 transition-all"
                    style={{
                      fontFamily: fontCss,
                      "--photobook-font": fontCss,
                      fontWeight: selectedElement.font_weight || "normal",
                      fontStyle: selectedElement.font_style || "normal",
                      color: textColor,
                      textShadow:
                        selectedElement.shadow?.blur || selectedElement.shadow?.offsetX || selectedElement.shadow?.offsetY
                          ? `${selectedElement.shadow.offsetX ?? 2}px ${selectedElement.shadow.offsetY ?? 2}px ${selectedElement.shadow.blur || 0}px ${selectedElement.shadow.color || "rgba(0,0,0,0.5)"}`
                          : undefined,
                      background:
                        selectedElement.background?.type !== "none" && selectedElement.background?.value
                          ? selectedElement.background.value
                          : selectedElement.bg_color || undefined,
                      padding:
                        selectedElement.background?.value || selectedElement.bg_color
                          ? `${selectedElement.background?.padding ?? 4}px ${(selectedElement.background?.padding ?? 4) * 1.5}px`
                          : undefined,
                      borderRadius:
                        selectedElement.background?.value || selectedElement.bg_color
                          ? `${selectedElement.background?.radius ?? 4}px`
                          : undefined,
                    }}
                  >
                    {selectedElement.content || "The quick brown fox jumps"}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Font Size
              </label>
              <InputNumber
                size="small"
                min={10}
                max={140}
                value={selectedElement.font_size || 24}
                onChange={(font_size) =>
                  updateTextProperties({
                    font_size,
                    font_size_rem: `${((font_size || 24) / 16).toFixed(2)}rem`,
                    font_size_cqmin: `${((font_size || 24) / 10).toFixed(2)}cqmin`,
                  })
                }
                addonAfter="px"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={selectedElement.color || "#1f2937"}
                  onChange={(e) => onUpdateElement(id, { color: e.target.value })}
                  className="w-7 h-7 p-0 rounded border border-slate-300"
                />
                <Input
                  size="small"
                  value={selectedElement.color || "#1f2937"}
                  onChange={(e) => onUpdateElement(id, { color: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Font Weight
              </label>
              <Select
                size="small"
                className="w-full"
                value={String(selectedElement.font_weight || "normal")}
                onChange={(font_weight) => updateTextProperties({ font_weight })}
                options={[
                  { value: "300", label: "300 Light" },
                  { value: "normal", label: "400 Regular" },
                  { value: "500", label: "500 Medium" },
                  { value: "600", label: "600 Semi-Bold" },
                  { value: "bold", label: "700 Bold" },
                  { value: "800", label: "800 Extra-Bold" },
                  { value: "900", label: "900 Black" },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Letter Spacing
              </label>
              <InputNumber
                size="small"
                min={-3}
                max={25}
                value={selectedElement.letter_spacing || 0}
                onChange={(ls) => updateTextProperties({ letter_spacing: ls || 0 })}
                addonAfter="px"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Line Height
              </label>
              <InputNumber
                size="small"
                min={0.8}
                max={3.0}
                step={0.1}
                value={selectedElement.line_height || 1.2}
                onChange={(lh) => updateTextProperties({ line_height: lh || 1.2 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Italic & Alignment
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    updateTextProperties({
                      font_style:
                        selectedElement.font_style === "italic" ? "normal" : "italic",
                    })
                  }
                  className={`p-1 rounded flex-1 flex justify-center ${
                    selectedElement.font_style === "italic"
                      ? "bg-white shadow text-teal-600 italic font-bold"
                      : "text-slate-600"
                  }`}
                  title="Italic"
                >
                  <MdFormatItalic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTextProperties({ align: "left" })}
                  className={`p-1 rounded flex-1 flex justify-center ${
                    selectedElement.align === "left"
                      ? "bg-white shadow text-teal-600"
                      : "text-slate-600"
                  }`}
                  title="Align Left"
                >
                  <MdFormatAlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTextProperties({ align: "center" })}
                  className={`p-1 rounded flex-1 flex justify-center ${
                    (selectedElement.align || "center") === "center"
                      ? "bg-white shadow text-teal-600"
                      : "text-slate-600"
                  }`}
                  title="Align Center"
                >
                  <MdFormatAlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTextProperties({ align: "right" })}
                  className={`p-1 rounded flex-1 flex justify-center ${
                    selectedElement.align === "right"
                      ? "bg-white shadow text-teal-600"
                      : "text-slate-600"
                  }`}
                  title="Align Right"
                >
                  <MdFormatAlignRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ==================== ADVANCED TEXT SHADOW ==================== */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Text Shadow</span>
              </label>
              <Switch
                size="small"
                checked={Boolean(selectedElement.shadow?.blur || selectedElement.shadow?.enable)}
                onChange={(enabled) =>
                  onUpdateElement(id, {
                    shadow: enabled
                      ? {
                          enable: true,
                          color: selectedElement.shadow?.color || "rgba(0,0,0,0.4)",
                          blur: selectedElement.shadow?.blur || 4,
                          offsetX: selectedElement.shadow?.offsetX ?? 2,
                          offsetY: selectedElement.shadow?.offsetY ?? 2,
                        }
                      : { enable: false, color: "#000000", blur: 0, offsetX: 0, offsetY: 0 },
                  })
                }
              />
            </div>

            {(selectedElement.shadow?.blur > 0 || selectedElement.shadow?.enable) && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Shadow Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.shadow?.color?.startsWith("#") ? selectedElement.shadow.color : "#000000"}
                      onChange={(e) =>
                        onUpdateElement(id, {
                          shadow: {
                            ...(selectedElement.shadow || {}),
                            enable: true,
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedElement.shadow?.color || "rgba(0,0,0,0.4)"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>Intensity / Blur</span>
                    <span className="font-mono text-teal-600 font-semibold">{selectedElement.shadow?.blur || 0}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={30}
                    value={selectedElement.shadow?.blur || 0}
                    onChange={(blur) =>
                      onUpdateElement(id, {
                        shadow: {
                          ...(selectedElement.shadow || {}),
                          enable: blur > 0,
                          blur,
                          color: selectedElement.shadow?.color || "rgba(0,0,0,0.4)",
                          offsetX: selectedElement.shadow?.offsetX ?? 2,
                          offsetY: selectedElement.shadow?.offsetY ?? 2,
                        },
                      })
                    }
                    className="my-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Offset X</label>
                    <InputNumber
                      size="small"
                      min={-20}
                      max={20}
                      value={selectedElement.shadow?.offsetX ?? 2}
                      onChange={(ox) =>
                        onUpdateElement(id, {
                          shadow: {
                            ...(selectedElement.shadow || {}),
                            offsetX: ox ?? 0,
                          },
                        })
                      }
                      addonAfter="px"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Offset Y</label>
                    <InputNumber
                      size="small"
                      min={-20}
                      max={20}
                      value={selectedElement.shadow?.offsetY ?? 2}
                      onChange={(oy) =>
                        onUpdateElement(id, {
                          shadow: {
                            ...(selectedElement.shadow || {}),
                            offsetY: oy ?? 0,
                          },
                        })
                      }
                      addonAfter="px"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================== ADVANCED TEXT BACKGROUND ==================== */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Text Background
              </label>
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[10px]">
                {["none", "color", "gradient"].map((mode) => {
                  const currentMode = selectedElement.background?.type || (selectedElement.bg_color ? "color" : "none");
                  const isActive = currentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        if (mode === "none") {
                          onUpdateElement(id, {
                            background: { type: "none", value: "" },
                            bg_color: undefined,
                          });
                        } else if (mode === "color") {
                          onUpdateElement(id, {
                            background: {
                              type: "color",
                              value: selectedElement.background?.value || "#ffffff",
                              padding: selectedElement.background?.padding ?? 6,
                              radius: selectedElement.background?.radius ?? 4,
                            },
                            bg_color: selectedElement.background?.value || "#ffffff",
                          });
                        } else {
                          onUpdateElement(id, {
                            background: {
                              type: "gradient",
                              value: PRESET_GRADIENTS[1]?.value || "linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)",
                              padding: selectedElement.background?.padding ?? 6,
                              radius: selectedElement.background?.radius ?? 4,
                            },
                            bg_color: PRESET_GRADIENTS[1]?.value || "linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)",
                          });
                        }
                      }}
                      className={`px-2 py-0.5 rounded capitalize font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-teal-700 font-bold shadow-xs"
                          : "text-slate-600 hover:text-black"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Solid Color Controls */}
            {(selectedElement.background?.type === "color" || (!selectedElement.background?.type && selectedElement.bg_color)) && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Solid Background</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.background?.value || selectedElement.bg_color || "#ffffff"}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateElement(id, {
                          background: {
                            ...(selectedElement.background || {}),
                            type: "color",
                            value: val,
                          },
                          bg_color: val,
                        });
                      }}
                      className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                    />
                    <Input
                      size="small"
                      value={selectedElement.background?.value || selectedElement.bg_color || "#ffffff"}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateElement(id, {
                          background: {
                            ...(selectedElement.background || {}),
                            type: "color",
                            value: val,
                          },
                          bg_color: val,
                        });
                      }}
                      className="w-20 font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Preset Solid Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_SOLID_COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        onUpdateElement(id, {
                          background: {
                            ...(selectedElement.background || {}),
                            type: "color",
                            value: c.value,
                          },
                          bg_color: c.value,
                        })
                      }
                      style={{ backgroundColor: c.value }}
                      className="w-5 h-5 rounded-md border border-slate-300 hover:scale-110 transition-transform cursor-pointer shadow-2xs"
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Controls */}
            {selectedElement.background?.type === "gradient" && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <span className="text-[11px] text-slate-600 font-medium block">Preset Gradients</span>
                <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {PRESET_GRADIENTS.map((g) => {
                    const isSelected = selectedElement.background?.value === g.value;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() =>
                          onUpdateElement(id, {
                            background: {
                              ...(selectedElement.background || {}),
                              type: "gradient",
                              value: g.value,
                            },
                            bg_color: g.value,
                          })
                        }
                        style={{ background: g.value }}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all h-9 flex items-end shadow-2xs ${
                          isSelected ? "ring-2 ring-teal-500 border-white" : "border-slate-200 hover:opacity-90"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-white bg-black/40 px-1 rounded truncate max-w-full">
                          {g.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <label className="text-[10px] text-slate-500 block mb-0.5">Custom CSS Gradient</label>
                  <Input
                    size="small"
                    value={selectedElement.background?.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateElement(id, {
                        background: {
                          ...(selectedElement.background || {}),
                          type: "gradient",
                          value: val,
                        },
                        bg_color: val,
                      });
                    }}
                    placeholder="linear-gradient(...)"
                    className="font-mono text-[10px]"
                  />
                </div>
              </div>
            )}

            {/* Padding & Corner Radius (if background is enabled) */}
            {selectedElement.background?.type && selectedElement.background.type !== "none" && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Padding</span>
                    <span className="font-mono">{selectedElement.background?.padding ?? 6}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={24}
                    value={selectedElement.background?.padding ?? 6}
                    onChange={(padding) =>
                      onUpdateElement(id, {
                        background: {
                          ...(selectedElement.background || {}),
                          padding,
                        },
                      })
                    }
                    className="my-1"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Radius</span>
                    <span className="font-mono">{selectedElement.background?.radius ?? 4}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={24}
                    value={selectedElement.background?.radius ?? 4}
                    onChange={(radius) =>
                      onUpdateElement(id, {
                        background: {
                          ...(selectedElement.background || {}),
                          radius,
                        },
                      })
                    }
                    className="my-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Customer Editable Settings */}
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-xs font-semibold text-teal-900 block">
                  Customize by customer
                </span>
                <span className="text-[10px] text-teal-700">
                  Allow customer to edit, resize or change this text
                </span>
              </div>
              <Switch
                size="small"
                checked={Boolean(selectedElement.is_customer_editable)}
                onChange={(checked) =>
                  onUpdateElement(id, { is_customer_editable: checked })
                }
              />
            </div>
            {selectedElement.is_customer_editable && (
              <div className="mt-2">
                <label className="text-[11px] font-medium text-teal-800 block mb-0.5">
                  Placeholder / Prompt Text
                </label>
                <Input
                  size="small"
                  placeholder="e.g. Write your wedding vows..."
                  value={selectedElement.placeholder || ""}
                  onChange={(e) =>
                    onUpdateElement(id, { placeholder: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        </div>
      );
    })()}

      {/* ==================== DECORATION / IMAGE PROPERTIES ==================== */}
      {type === "decoration" && (
        <div className="space-y-4">
          {selectedElement.asset_url ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  <img src={selectedElement.asset_url} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-slate-800 block truncate">
                    {selectedElement.name || "Uploaded Image"}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {selectedElement.width_pct}% W × {selectedElement.height_pct}% H
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Image Fitting Mode
                </label>
                <Radio.Group
                  size="small"
                  className="w-full"
                  value={selectedElement.fit_mode || "contain"}
                  onChange={(e) => onUpdateElement(id, { fit_mode: e.target.value })}
                >
                  <Radio.Button value="contain">Contain</Radio.Button>
                  <Radio.Button value="cover">Cover</Radio.Button>
                  <Radio.Button value="fill">Fill</Radio.Button>
                </Radio.Group>
              </div>

              {selectedElement.aspect_ratio && (
                <Button
                  size="small"
                  className="w-full text-xs"
                  onClick={() => {
                    const canvasW = 707;
                    const canvasH = 1000;
                    const wPct = selectedElement.width_pct || 30;
                    const pixelW = (wPct / 100) * canvasW;
                    const pixelH = pixelW / selectedElement.aspect_ratio;
                    const hPct = Number(((pixelH / canvasH) * 100).toFixed(2));
                    onUpdateElement(id, {
                      height_pct: hPct,
                      height_str: `${hPct}%`,
                      height: Math.round(pixelH),
                    });
                  }}
                >
                  Reset to Original Aspect Ratio
                </Button>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Artwork Tint Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedElement.tint || "#334155"}
                  onChange={(e) => onUpdateElement(id, { tint: e.target.value })}
                  className="w-7 h-7 p-0 rounded border border-slate-300"
                />
                <Input
                  size="small"
                  value={selectedElement.tint || "#334155"}
                  onChange={(e) => onUpdateElement(id, { tint: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Opacity
              </label>
              <span className="text-xs text-slate-500">
                {Math.round((selectedElement.opacity ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={selectedElement.opacity ?? 1}
              onChange={(opacity) => onUpdateElement(id, { opacity })}
            />
          </div>
        </div>
      )}

      {/* ==================== COMMON TRANSFORM PROPERTIES ==================== */}
      <Divider className="my-1" />

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Position & Dimensions (% of Paper)
        </label>
        <p className="text-[10px] text-slate-400 mb-2">
          Stored relative to page width and height across all book sizes.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium block text-[10px]">X POS (% WIDTH)</span>
            <InputNumber
              size="small"
              min={-100}
              max={200}
              step={0.5}
              addonAfter="%"
              value={selectedElement.x_pct !== undefined ? selectedElement.x_pct : (selectedElement.x ? Number((selectedElement.x / 10).toFixed(1)) : 0)}
              onChange={(val) => {
                const xPct = Number((val || 0).toFixed(2));
                onUpdateElement(id, {
                  x_pct: xPct,
                  x_str: `${xPct}%`,
                  x: Math.round(xPct * 10),
                  unit: "%",
                  is_percentage: true,
                });
              }}
            />
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px]">Y POS (% HEIGHT)</span>
            <InputNumber
              size="small"
              min={-100}
              max={200}
              step={0.5}
              addonAfter="%"
              value={selectedElement.y_pct !== undefined ? selectedElement.y_pct : (selectedElement.y ? Number((selectedElement.y / 10).toFixed(1)) : 0)}
              onChange={(val) => {
                const yPct = Number((val || 0).toFixed(2));
                onUpdateElement(id, {
                  y_pct: yPct,
                  y_str: `${yPct}%`,
                  y: Math.round(yPct * 10),
                  unit: "%",
                  is_percentage: true,
                });
              }}
            />
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px]">
              {selectedElement.type === "text"
                ? "WIDTH (AUTO FROM TEXT)"
                : "WIDTH (% WIDTH)"}
            </span>
            <InputNumber
              size="small"
              min={1}
              max={100}
              step={0.5}
              addonAfter="%"
              disabled={selectedElement.type === "text"}
              value={selectedElement.width_pct !== undefined ? selectedElement.width_pct : (selectedElement.width ? Number((selectedElement.width / 10).toFixed(1)) : 80)}
              onChange={(val) => {
                const wPct = Number((val || 1).toFixed(2));
                const is1to1Shape =
                  selectedElement.type === "photo_frame" &&
                  ["circle", "heart", "star", "scallop", "hexagon"].includes(selectedElement.shape);

                const updates = {
                  width_pct: wPct,
                  width_str: `${wPct}%`,
                  width: Math.round(wPct * 10),
                  unit: "%",
                  is_percentage: true,
                };

                if (is1to1Shape) {
                  // Height % strictly focuses on width % value for perfect shape
                  updates.height_pct = wPct;
                  updates.height_str = `${wPct}%`;
                  updates.height = Math.round(wPct * 10);
                }

                onUpdateElement(id, updates);
              }}
            />
          </div>
          <div>
            <span className="text-slate-500 font-medium block text-[10px]">
              {selectedElement.type === "photo_frame" && ["circle", "heart", "star", "scallop", "hexagon"].includes(selectedElement.shape)
                ? "HEIGHT (LOCKED 1:1 TO WIDTH)"
                : selectedElement.type === "text"
                ? "HEIGHT (AUTO FROM TEXT)"
                : "HEIGHT (% HEIGHT)"}
            </span>
            <InputNumber
              size="small"
              min={1}
              max={100}
              step={0.5}
              addonAfter="%"
              disabled={
                selectedElement.type === "text" ||
                (selectedElement.type === "photo_frame" && ["circle", "heart", "star", "scallop", "hexagon"].includes(selectedElement.shape))
              }
              value={selectedElement.type === "photo_frame" && ["circle", "heart", "star", "scallop", "hexagon"].includes(selectedElement.shape)
                ? (selectedElement.width_pct !== undefined ? selectedElement.width_pct : (selectedElement.width ? Number((selectedElement.width / 10).toFixed(1)) : 80))
                : (selectedElement.height_pct !== undefined ? selectedElement.height_pct : (selectedElement.height ? Number((selectedElement.height / 10).toFixed(1)) : 80))}
              onChange={(val) => {
                const hPct = Number((val || 1).toFixed(2));
                onUpdateElement(id, {
                  height_pct: hPct,
                  height_str: `${hPct}%`,
                  height: Math.round(hPct * 10),
                  unit: "%",
                  is_percentage: true,
                });
              }}
            />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">ROTATION</span>
            <InputNumber
              size="small"
              min={0}
              max={360}
              value={selectedElement.rotation || 0}
              onChange={(r) => onUpdateElement(id, { rotation: r || 0 })}
              addonAfter="°"
            />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Z-INDEX</span>
            <InputNumber
              size="small"
              min={1}
              value={selectedElement.z_index || 1}
              onChange={(z) => onUpdateElement(id, { z_index: z || 1 })}
            />
          </div>
        </div>
      </div>
      </div>
      )}

      <BackgroundRepositionModal
        open={isBgCropModalOpen}
        onClose={() => setIsBgCropModalOpen(false)}
        bg={page?.background || {}}
        onSave={onSetBackground}
        aspectRatio={page?.aspect_ratio || currentSizeInfo?.singlePageRatio || "1:1"}
        page={page}
        sizeInfo={currentSizeInfo}
      />
    </div>
  );
};

export default PropertiesPanel;
