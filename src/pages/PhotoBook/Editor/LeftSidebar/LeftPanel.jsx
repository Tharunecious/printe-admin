import React, { useState, useMemo, useEffect } from "react";
import {
  MdCropOriginal,
  MdTextFields,
  MdPalette,
  MdGridView,
  MdCloudUpload,
  MdAspectRatio,
  MdCropSquare,
  MdCheck,
  MdLayers,
  MdClose,
} from "react-icons/md";
import { FRAME_SHAPES } from "../../utils/clipPaths";
import {
  PRESET_SOLID_COLORS,
  PRESET_GRADIENTS,
  PRESET_FONTS,
  getFontFamilyFallback,
} from "../../utils/presetAssets";
import { Input, Button, Modal, message, Switch, Tooltip, Slider, Tag } from "antd";
import { uploadImage } from "../../../../api";
import { buildSizeInfo } from "../../utils/sizeUtils";

// Standard Built-In Layout Presets with layout UI wireframes
const STANDARD_LAYOUT_PRESETS = [
  {
    id: "layout_1_full",
    name: "Full Bleed Single",
    category: "1-photo",
    frames: [
      { x_pct: 0, y_pct: 0, width_pct: 100, height_pct: 100, shape: "rectangle" },
    ],
  },
  {
    id: "layout_1_margin",
    name: "Framed Single",
    category: "1-photo",
    frames: [
      { x_pct: 10, y_pct: 10, width_pct: 80, height_pct: 80, shape: "rectangle" },
    ],
  },
  {
    id: "layout_2_split_v",
    name: "Two Photos Split",
    category: "2-photo",
    frames: [
      { x_pct: 6, y_pct: 8, width_pct: 42, height_pct: 84, shape: "rectangle" },
      { x_pct: 52, y_pct: 8, width_pct: 42, height_pct: 84, shape: "rectangle" },
    ],
  },
  {
    id: "layout_2_split_h",
    name: "Top & Bottom",
    category: "2-photo",
    frames: [
      { x_pct: 8, y_pct: 6, width_pct: 84, height_pct: 42, shape: "rectangle" },
      { x_pct: 8, y_pct: 52, width_pct: 84, height_pct: 42, shape: "rectangle" },
    ],
  },
  {
    id: "layout_3_collage",
    name: "3-Photo Collage",
    category: "3-photo",
    frames: [
      { x_pct: 6, y_pct: 8, width_pct: 48, height_pct: 84, shape: "rectangle" },
      { x_pct: 58, y_pct: 8, width_pct: 36, height_pct: 40, shape: "rectangle" },
      { x_pct: 58, y_pct: 52, width_pct: 36, height_pct: 40, shape: "rectangle" },
    ],
  },
  {
    id: "layout_4_grid",
    name: "4-Photo Grid",
    category: "4-photo",
    frames: [
      { x_pct: 6, y_pct: 8, width_pct: 42, height_pct: 40, shape: "rectangle" },
      { x_pct: 52, y_pct: 8, width_pct: 42, height_pct: 40, shape: "rectangle" },
      { x_pct: 6, y_pct: 52, width_pct: 42, height_pct: 40, shape: "rectangle" },
      { x_pct: 52, y_pct: 52, width_pct: 42, height_pct: 40, shape: "rectangle" },
    ],
  },
  {
    id: "layout_circle_spotlight",
    name: "Circle Spotlight",
    category: "1-photo",
    frames: [
      { x_pct: 20, y_pct: 20, width_pct: 60, height_pct: 60, shape: "circle" },
    ],
  },
  {
    id: "layout_heart_feature",
    name: "Heart Feature",
    category: "1-photo",
    frames: [
      { x_pct: 15, y_pct: 15, width_pct: 70, height_pct: 70, shape: "heart" },
    ],
  },
];

const LeftPanel = ({
  onAddPhotoFrame,
  onAddText,
  onAddDecoration,
  onSetBackground,
  onApplyLayout,
  onSaveCurrentAsLayout,
  currentSizeInfo,
  templateSizes = [],
  supportedSizes = [],
  onSelectSize,
  selectedSize,
  page,
  layouts = [],
  selectedElement,
  onUpdateElement,
}) => {
  const [activeTab, setActiveTab] = useState("shapes"); // Default to shapes
  const [customizeByCustomer, setCustomizeByCustomer] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingDec, setUploadingDec] = useState(false);
  const [uploadedElements, setUploadedElements] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_uploaded_elements") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setUploadedElements(e.detail);
      } else {
        try {
          setUploadedElements(JSON.parse(localStorage.getItem("admin_uploaded_elements") || "[]"));
        } catch {}
      }
    };
    window.addEventListener("admin_elements_updated", handleUpdate);
    return () => window.removeEventListener("admin_elements_updated", handleUpdate);
  }, []);

  // Background state: Solid color selector & linear gradient controls
  const [customSolidColor, setCustomSolidColor] = useState("#ffffff");
  const [gradColor1, setGradColor1] = useState("#0f172a");
  const [gradColor2, setGradColor2] = useState("#0284c7");
  const [gradAngle, setGradAngle] = useState(135);

  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [layoutCategory, setLayoutCategory] = useState("1-photo");

  // Only display sizes created and configured for this template — identical to customer side
  const sizesList = useMemo(() => {
    if (Array.isArray(templateSizes) && templateSizes.length > 0) {
      return templateSizes;
    }
    if (Array.isArray(supportedSizes) && supportedSizes.length > 0) {
      return supportedSizes.map((s, idx) => buildSizeInfo(s, idx));
    }
    return [];
  }, [templateSizes, supportedSizes]);

  // Canva Rail Tabs (Elements and Photos removed per user request)
  const RAIL_TABS = [
    { id: "shapes", label: "Shapes", icon: MdCropSquare },
    { id: "templates", label: "Templates", icon: MdGridView },
    { id: "text", label: "Text", icon: MdTextFields },
    { id: "background", label: "Background", icon: MdPalette },
    { id: "uploads", label: "Upload", icon: MdCloudUpload },
    { id: "size", label: "Size", icon: MdAspectRatio },
  ];

  const handleSaveLayout = () => {
    if (!layoutName.trim()) {
      message.error("Please enter a layout name");
      return;
    }
    onSaveCurrentAsLayout(layoutName, layoutCategory);
    setLayoutName("");
    setLayoutModalVisible(false);
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Please upload a valid image file");
      return;
    }
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadImage(formData);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        onSetBackground({
          type: "image",
          value: url,
          image_url: url,
          opacity: 1,
          position_x: 50,
          position_y: 50,
          scale: 1,
          fit_mode: "cover",
        });

        // Also add to Uploads gallery so it appears in the Upload section:
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
          setUploadedElements(next);
          window.dispatchEvent(new CustomEvent("admin_elements_updated", { detail: next }));
        } catch (storageErr) {
          console.warn("Storage sync error:", storageErr);
        }

        message.success("Background uploaded & added to Upload section!");
      } else {
        message.error("Failed to get uploaded image URL");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to upload background image");
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  };

  const handleUploadElement = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isImage = file.type.startsWith("image/");
    if (!isSvg && !isImage) {
      message.error("Please upload a valid SVG or image file (PNG, JPG, WebP)");
      return;
    }

    setUploadingDec(true);
    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      let svgContent = "";
      let naturalWidth = 100;
      let naturalHeight = 100;
      let aspectRatio = 1;

      if (isSvg) {
        svgContent = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result || "");
          reader.onerror = () => resolve("");
          reader.readAsText(file);
        });
      } else {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            naturalWidth = img.naturalWidth || 100;
            naturalHeight = img.naturalHeight || 100;
            aspectRatio = +(naturalWidth / naturalHeight).toFixed(4);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = URL.createObjectURL(file);
        });
      }

      let uploadedUrl = "";
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await uploadImage(formData);
        uploadedUrl = res?.data?.data?.url || res?.data?.url || "";
      } catch (err) {
        console.warn("Upload image API error, falling back to local svg:", err);
      }

      const newDec = {
        id: `custom_dec_${Date.now()}`,
        name: cleanName,
        svg: svgContent,
        asset_url: uploadedUrl,
        asset_type: isSvg ? "svg" : "png",
        natural_width: naturalWidth,
        natural_height: naturalHeight,
        aspect_ratio: aspectRatio,
      };

      onAddDecoration(newDec);

      const nextUploaded = [newDec, ...uploadedElements.filter((x) => x.name !== cleanName)].slice(0, 20);
      setUploadedElements(nextUploaded);
      try {
        localStorage.setItem("admin_uploaded_elements", JSON.stringify(nextUploaded));
      } catch (err) {}

      message.success(`Uploaded "${cleanName}"!`);
    } catch (err) {
      console.error(err);
      message.error("Failed to upload element");
    } finally {
      setUploadingDec(false);
      e.target.value = "";
    }
  };

  // Helper to render layout wireframe box
  const renderLayoutThumbnail = (layout) => {
    const rawFrames = layout.frames || [];
    return (
      <div className="w-full h-24 bg-white border border-slate-300 rounded-lg relative overflow-hidden shadow-2xs group-hover:border-sky-500 transition-colors">
        {rawFrames.map((f, idx) => {
          const xPct = f.x_pct !== undefined ? f.x_pct : (f.x !== undefined ? (f.x > 1 ? f.x / 10 : f.x * 100) : 10);
          const yPct = f.y_pct !== undefined ? f.y_pct : (f.y !== undefined ? (f.y > 1 ? f.y / 10 : f.y * 100) : 10);
          const wPct = f.width_pct !== undefined ? f.width_pct : (f.width !== undefined ? (f.width > 1 ? f.width / 10 : f.width * 100) : 80);
          const hPct = f.height_pct !== undefined ? f.height_pct : (f.height !== undefined ? (f.height > 1 ? f.height / 10 : f.height * 100) : 80);

          return (
            <div
              key={idx}
              className={`absolute bg-sky-100 border border-sky-400 group-hover:bg-sky-200 transition-colors flex items-center justify-center ${
                f.shape === "circle" ? "rounded-full" : f.shape === "rounded" ? "rounded-xs" : "rounded-none"
              }`}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                width: `${wPct}%`,
                height: `${hPct}%`,
              }}
            >
              <span className="text-[8px] font-bold text-sky-700">{idx + 1}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to render SVG graphic of a shape
  const renderShapeIcon = (shapeId) => {
    return (
      <svg viewBox="0 0 100 100" className="w-12 h-12 fill-sky-100 stroke-sky-600 stroke-[2.5] group-hover:fill-sky-200 group-hover:stroke-sky-700 transition-all">
        {shapeId === "rectangle" && <rect x="12" y="12" width="76" height="76" rx="4" />}
        {shapeId === "rounded" && <rect x="12" y="12" width="76" height="76" rx="22" />}
        {shapeId === "circle" && <circle cx="50" cy="50" r="38" />}
        {shapeId === "heart" && (
          <path d="M50 85 C15 55 5 35 15 20 C25 5 45 10 50 30 C55 10 75 5 85 20 C95 35 85 55 50 85 Z" />
        )}
        {shapeId === "star" && (
          <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" />
        )}
        {shapeId === "scallop" && <circle cx="50" cy="50" r="38" strokeDasharray="6 3" />}
        {shapeId === "hexagon" && <polygon points="50,6 92,28 92,72 50,94 8,72 8,28" />}
        {shapeId === "arch" && <path d="M12 88 L12 48 C12 20 88 20 88 48 L88 88 Z" />}
        {shapeId === "stamp" && <rect x="12" y="12" width="76" height="76" rx="2" strokeDasharray="4 2" />}
        {shapeId === "polaroid" && (
          <>
            <rect x="12" y="8" width="76" height="84" rx="2" />
            <rect x="20" y="16" width="60" height="54" />
          </>
        )}
        {shapeId === "filmstrip" && (
          <>
            <rect x="8" y="18" width="84" height="64" rx="3" />
            <circle cx="18" cy="26" r="3" fill="currentColor" />
            <circle cx="82" cy="26" r="3" fill="currentColor" />
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="flex h-full z-20 shrink-0 select-none shadow-md">
      {/* ==================== 1. SLIM LEFT ICON RAIL (72px) ==================== */}
      <div className="w-[72px] bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-2.5 gap-1 shrink-0">
        {RAIL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab((prev) => (prev === tab.id ? null : tab.id))}
              className={`w-14 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0284c7] text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
              title={tab.label}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================== 2. SECONDARY FLYOUT DRAWER (300-340px) ==================== */}
      {activeTab && (
        <div className="w-[300px] sm:w-[340px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 shadow-lg relative">
          {/* Close Panel Button */}
          <div className="flex items-center justify-end px-3 pt-2.5 pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close panel"
            >
              <MdClose size={18} />
            </button>
          </div>

          {/* ==================== SHAPES TAB (ONLY SHAPES, NO NAMES, SHOW WITH SHAPE) ==================== */}
          {activeTab === "shapes" && (
            <div className="flex flex-col h-full overflow-y-auto p-4 pt-1 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                  Shapes
                </h2>
                <p className="text-xs text-slate-500">
                  Click a shape to add a photo frame to the active canvas page.
                </p>
              </div>

            <div className="grid grid-cols-3 gap-2.5">
              {FRAME_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => onAddPhotoFrame(shape.id)}
                  className="h-24 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl flex items-center justify-center p-2 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                  title={shape.name}
                >
                  {renderShapeIcon(shape.id)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TEMPLATES TAB (SHOW WITH LAYOUT UI) ==================== */}
        {activeTab === "templates" && (
          <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Page Layouts
                </h2>
                <p className="text-xs text-slate-500">
                  Select a layout with visual UI wireframe.
                </p>
              </div>
              <Button
                size="small"
                type="primary"
                onClick={() => setLayoutModalVisible(true)}
                className="!bg-teal-600 hover:!bg-teal-700"
              >
                Save Current
              </Button>
            </div>

            {/* Custom Saved Layouts */}
            {layouts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Saved Custom Layouts
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {layouts.map((l) => (
                    <button
                      key={l._id || l.id}
                      type="button"
                      onClick={() => onApplyLayout(l)}
                      className="p-2.5 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 group shadow-2xs"
                      title={l.layout_name}
                    >
                      {renderLayoutThumbnail(l)}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {l.layout_name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {l.frames?.length || l.photo_count || 0}P
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in Standard Layout Presets with Layout UI */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Standard Page Layouts
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {STANDARD_LAYOUT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onApplyLayout(p)}
                    className="p-2.5 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 group shadow-2xs"
                    title={`Apply ${p.name}`}
                  >
                    {renderLayoutThumbnail(p)}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-sky-600 font-bold bg-sky-100 px-1 rounded">
                        {p.frames.length}P
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TEXT TAB ==================== */}
        {activeTab === "text" && (
          <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                Add Text
              </h2>
              <p className="text-xs text-slate-500">
                Click a text preset to add it to the active canvas page.
              </p>
            </div>

            {/* CUSTOMIZE BY CUSTOMER SWITCH (CRITICAL ADMIN FEATURE) */}
            <div className="p-3 bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-200 rounded-xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Customize by customer
                  </span>
                  <Tooltip title="When turned ON, customers can edit the text wording, resize, and re-position it in their photo book. When turned OFF, this text remains fixed and protected.">
                    <span className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs">ℹ</span>
                  </Tooltip>
                </div>
                <Switch
                  checked={customizeByCustomer}
                  onChange={(checked) => setCustomizeByCustomer(checked)}
                  className={customizeByCustomer ? "!bg-teal-600" : ""}
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {customizeByCustomer ? (
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    <MdCheck size={14} /> Customer can edit, resize & style this text
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Text is fixed by default (customer cannot edit or change)
                  </span>
                )}
              </p>
            </div>

            {/* Preset Text Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  onAddText({
                    content: "Add a heading",
                    font_size: 42,
                    font_weight: "bold",
                    font_family: "Playfair Display",
                    color: "#0f172a",
                    is_customer_editable: customizeByCustomer,
                  })
                }
                className="w-full py-3.5 px-4 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-xl font-bold text-slate-900 block font-serif">
                  Add a heading
                </span>
                <span className="text-[10px] text-slate-400">Playfair Display • 42px</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onAddText({
                    content: "Add a subheading",
                    font_size: 26,
                    font_weight: "600",
                    font_family: "Montserrat",
                    color: "#334155",
                    is_customer_editable: customizeByCustomer,
                  })
                }
                className="w-full py-3 px-4 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-sm font-semibold text-slate-800 block">
                  Add a subheading
                </span>
                <span className="text-[10px] text-slate-400">Montserrat • 26px</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onAddText({
                    content: "Add a little bit of body text",
                    font_size: 16,
                    font_weight: "normal",
                    font_family: "Inter",
                    color: "#475569",
                    is_customer_editable: customizeByCustomer,
                  })
                }
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-xs text-slate-700 block">
                  Add a little bit of body text
                </span>
                <span className="text-[10px] text-slate-400">Inter • 16px</span>
              </button>
            </div>

            {/* Typography Styles Gallery */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Font Combinations
                </h3>
                {selectedElement && selectedElement.type === "text" && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-medium">
                    Changes selected text
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {PRESET_FONTS.map((font) => (
                  <button
                    key={font.family}
                    type="button"
                    onClick={() => {
                      if (selectedElement && selectedElement.type === "text" && onUpdateElement) {
                        onUpdateElement(selectedElement.id, {
                          font_family: font.family,
                          font_weight: font.category === "serif" ? "bold" : (selectedElement.font_weight || "normal"),
                        });
                        message.success(`Applied ${font.name} font style`);
                      } else {
                        onAddText({
                          content: font.name,
                          font_size: 28,
                          font_family: font.family,
                          font_weight: font.category === "serif" ? "bold" : "normal",
                          color: "#0f172a",
                          is_customer_editable: customizeByCustomer,
                        });
                      }
                    }}
                    className={`w-full p-2.5 bg-slate-50 hover:bg-sky-50 border rounded-lg text-left transition-all cursor-pointer flex items-center justify-between ${
                      selectedElement && selectedElement.type === "text" && selectedElement.font_family === font.family
                        ? "border-teal-500 bg-teal-50/80 ring-1 ring-teal-400 font-bold"
                        : "border-slate-200 hover:border-sky-400"
                    }`}
                  >
                    <span
                      style={{ fontFamily: getFontFamilyFallback(font.family) }}
                      className="text-sm text-slate-900"
                    >
                      {font.name}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                      {font.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== BACKGROUND TAB (COLOR SELECTOR + LINEAR GRADIENT BUILDER & DEGREE) ==================== */}
        {activeTab === "background" && (
          <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                Background
              </h2>
              <p className="text-xs text-slate-500">
                Solid colors, linear gradients with custom degree, or custom background image.
              </p>
            </div>

            {/* 1. SOLID COLOR SELECTOR */}
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Color Selector
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  {customSolidColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customSolidColor}
                  onChange={(e) => setCustomSolidColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  title="Pick a solid color"
                />
                <Input
                  size="small"
                  value={customSolidColor}
                  onChange={(e) => setCustomSolidColor(e.target.value)}
                  className="font-mono text-xs uppercase"
                  placeholder="#FFFFFF"
                />
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    onSetBackground({ type: "color", value: customSolidColor, opacity: 1 });
                    message.success(`Set background color to ${customSolidColor}`);
                  }}
                  className="!bg-teal-600 hover:!bg-teal-700 text-xs shrink-0 font-bold"
                >
                  Apply
                </Button>
              </div>

              {/* Preset Solid Colors */}
              <div className="grid grid-cols-8 gap-1.5 pt-2 border-t border-slate-200">
                {PRESET_SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCustomSolidColor(c);
                      onSetBackground({ type: "color", value: c, opacity: 1 });
                    }}
                    className="w-7 h-7 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* 2. LINEAR GRADIENT BUILDER (WITH DEGREE AND ALL DETAILS) */}
            <div className="space-y-3.5 p-3.5 bg-gradient-to-br from-sky-50/60 to-slate-50 border border-sky-200 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linear Gradient Builder
                </h3>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  {gradAngle}° Degree
                </span>
              </div>

              {/* Gradient Live Preview Box */}
              <div
                className="w-full h-14 rounded-xl border border-slate-300 shadow-inner flex items-center justify-center text-center p-2"
                style={{
                  background: `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`,
                }}
              >
                <span className="text-[10px] font-bold text-slate-900 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-md shadow-xs">
                  {gradAngle}° • {gradColor1} ➔ {gradColor2}
                </span>
              </div>

              {/* Degree Slider Control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Gradient Angle:</span>
                  <span className="font-mono font-bold text-sky-700">{gradAngle}°</span>
                </div>
                <Slider
                  min={0}
                  max={360}
                  step={5}
                  value={gradAngle}
                  onChange={(val) => setGradAngle(val)}
                  className="my-1"
                />
              </div>

              {/* Colors Pickers for Start and End Color */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-600 block text-[11px]">Start Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={gradColor1}
                      onChange={(e) => setGradColor1(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 bg-white cursor-pointer"
                    />
                    <Input
                      size="small"
                      value={gradColor1}
                      onChange={(e) => setGradColor1(e.target.value)}
                      className="font-mono text-[11px] uppercase p-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-600 block text-[11px]">End Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={gradColor2}
                      onChange={(e) => setGradColor2(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 bg-white cursor-pointer"
                    />
                    <Input
                      size="small"
                      value={gradColor2}
                      onChange={(e) => setGradColor2(e.target.value)}
                      className="font-mono text-[11px] uppercase p-1"
                    />
                  </div>
                </div>
              </div>

              {/* Apply Linear Gradient Button */}
              <Button
                type="primary"
                block
                onClick={() => {
                  const gradientValue = `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`;
                  onSetBackground({ type: "gradient", value: gradientValue, opacity: 1 });
                  message.success(`Applied linear gradient (${gradAngle}deg)!`);
                }}
                className="!bg-sky-600 hover:!bg-sky-700 font-bold text-xs"
              >
                Apply Custom Linear Gradient
              </Button>

              {/* Preset Gradients List */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Preset Linear Gradients
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => onSetBackground({ type: "gradient", value: g.value, opacity: 1 })}
                      className="h-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center p-1 shadow-2xs hover:scale-102 transition-transform cursor-pointer"
                      style={{ background: g.value }}
                    >
                      <span className="text-[9px] font-bold text-slate-900 bg-white/85 px-2 py-0.5 rounded shadow-2xs">
                        {g.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. UPLOAD CUSTOM BACKGROUND IMAGE */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Custom Background Image
              </h3>
              <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                <MdCloudUpload size={24} className="text-teal-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-slate-800">
                  {uploadingBg ? "Uploading..." : "Upload Background Image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingBg}
                  onChange={handleBgUpload}
                />
              </label>
            </div>
          </div>
        )}

        {/* ==================== UPLOAD TAB (NO TEST IMAGES) ==================== */}
        {activeTab === "uploads" && (
          <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                Upload
              </h2>
              <p className="text-xs text-slate-500">
                Upload your custom SVG artwork, illustrations, or graphics.
              </p>
            </div>

            {/* Upload Dropzone */}
            <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
              <MdCloudUpload size={32} className="text-sky-600 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-xs font-bold text-slate-800">
                {uploadingDec ? "Uploading..." : "Upload SVG or Image"}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                SVG, PNG, JPG supported
              </span>
              <input
                type="file"
                accept="image/*,.svg"
                className="hidden"
                disabled={uploadingDec}
                onChange={handleUploadElement}
              />
            </label>

            {/* Uploaded Elements Gallery */}
            {uploadedElements.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Your Uploaded Items ({uploadedElements.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Art & Backgrounds
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedElements.map((el) => (
                    <div
                      key={el.id}
                      className="p-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl flex flex-col items-center justify-between transition-all group text-center relative shadow-2xs"
                    >
                      {el.is_background && (
                        <span className="absolute top-1 left-1 bg-teal-600 text-white text-[8px] font-bold px-1 rounded-sm shadow-xs">
                          BG
                        </span>
                      )}
                      <div
                        onClick={() => onAddDecoration(el)}
                        className="cursor-pointer flex flex-col items-center w-full pt-1"
                        title="Click to add to canvas"
                      >
                        {el.svg ? (
                          <div
                            className="w-10 h-10 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform"
                            dangerouslySetInnerHTML={{ __html: el.svg }}
                          />
                        ) : (
                          <img src={el.asset_url} alt="" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform rounded" />
                        )}
                        <span className="text-[9px] font-semibold text-slate-600 truncate w-full mt-1">
                          {el.name}
                        </span>
                      </div>
                      {el.asset_url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetBackground({
                              type: "image",
                              value: el.asset_url,
                              image_url: el.asset_url,
                              opacity: 1,
                              position_x: 50,
                              position_y: 50,
                              scale: 1,
                              fit_mode: "cover",
                            });
                            message.success(`Set "${el.name}" as page background!`);
                          }}
                          className="w-full mt-1 py-0.5 text-[8px] font-bold bg-white hover:bg-teal-600 text-teal-700 hover:text-white rounded border border-teal-300 hover:border-teal-600 transition-colors cursor-pointer"
                          title="Apply as page background"
                        >
                          Set as BG
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SIZE TAB (BROWSE ALL BUTTON REMOVED) ==================== */}
        {activeTab === "size" && (
          <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                Book Size
              </h2>
              <p className="text-xs text-slate-500">
                Current format active on this template.
              </p>
            </div>

            {currentSizeInfo && (
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide">
                    Active Format
                  </span>
                  <span className="text-[9px] bg-sky-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                    {currentSizeInfo.orientation}
                  </span>
                </div>
                <span className="text-base font-bold text-slate-900 block">
                  {currentSizeInfo.name}
                </span>
                <span className="text-xs text-sky-700 font-semibold block">
                  {currentSizeInfo.dimensions}
                </span>
              </div>
            )}

            {/* Grid of sizes */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              {sizesList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSize && onSelectSize(s.id)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    currentSizeInfo?.id?.toLowerCase() === s.id?.toLowerCase()
                      ? "border-2 border-sky-600 bg-sky-50 font-bold"
                      : "border-slate-200 hover:border-sky-300 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold block">{s.name}</span>
                  <span className="text-[10px] text-slate-500">{s.dimensions}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {/* Save Layout Modal */}
      <Modal
        title="Save Current Layout"
        open={layoutModalVisible}
        onOk={handleSaveLayout}
        onCancel={() => setLayoutModalVisible(false)}
        okText="Save Layout"
      >
        <div className="space-y-3 py-2">
          <Input
            placeholder="Layout Name (e.g., 3-Photo Modern Collage)"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default LeftPanel;
