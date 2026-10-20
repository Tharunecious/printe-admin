import React from "react";
import {
  Input,
  InputNumber,
  Slider,
  Switch,
  Select,
  Radio,
  Button,
  Divider,
} from "antd";
import { FRAME_SHAPES } from "../../utils/clipPaths";
import { PRESET_FONTS, SAMPLE_TEST_PHOTOS } from "../../utils/presetAssets";
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
} from "react-icons/md";

const PropertiesPanel = ({
  selectedElement,
  page,
  onUpdateElement,
  onDeleteElement,
  onSetBackground,
  onSelectElement,
}) => {
  if (!selectedElement) {
    // Show Page Background & Canvas Properties
    const bg = page?.background || {};
    return (
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full z-10 p-4 space-y-4 overflow-y-auto select-none shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Page Properties
          </h3>
          <p className="text-xs text-slate-500">
            {page?.name || "Selected Page"}
          </p>
        </div>

        <Divider className="my-2" />

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Background Type
            </label>
            <Radio.Group
              size="small"
              value={bg.type || "color"}
              onChange={(e) =>
                onSetBackground({
                  ...bg,
                  type: e.target.value,
                  value:
                    e.target.value === "color"
                      ? "#ffffff"
                      : e.target.value === "gradient"
                      ? "linear-gradient(135deg, #1e1e2d 0%, #0f172a 100%)"
                      : "",
                })
              }
            >
              <Radio.Button value="color">Color</Radio.Button>
              <Radio.Button value="gradient">Gradient</Radio.Button>
              <Radio.Button value="image">Image</Radio.Button>
            </Radio.Group>
          </div>

          {bg.type === "color" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg.value || "#ffffff"}
                  onChange={(e) =>
                    onSetBackground({ ...bg, value: e.target.value })
                  }
                  className="w-9 h-9 p-0.5 rounded border border-slate-300 cursor-pointer"
                />
                <Input
                  size="small"
                  value={bg.value || "#ffffff"}
                  onChange={(e) =>
                    onSetBackground({ ...bg, value: e.target.value })
                  }
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {bg.type === "image" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Background Image URL
              </label>
              <Input
                size="small"
                placeholder="https://..."
                value={bg.value || ""}
                onChange={(e) =>
                  onSetBackground({ ...bg, value: e.target.value })
                }
              />
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
    );
  }

  const { id, type, is_locked } = selectedElement;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-10 p-4 space-y-4 overflow-y-auto select-none shadow-sm">
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
              onChange={(shape) => onUpdateElement(id, { shape })}
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Default Image Fitting Mode
            </label>
            <Radio.Group
              size="small"
              value={selectedElement.fit_mode || "cover"}
              onChange={(e) => onUpdateElement(id, { fit_mode: e.target.value })}
            >
              <Radio.Button value="cover">Cover (Fill & Crop)</Radio.Button>
              <Radio.Button value="contain">Contain (Fit Whole)</Radio.Button>
            </Radio.Group>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Sample Photo (Preview Clipping)
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
      {type === "text" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Text Content
            </label>
            <Input.TextArea
              rows={3}
              value={selectedElement.content || ""}
              onChange={(e) => onUpdateElement(id, { content: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Font Family
            </label>
            <Select
              size="small"
              className="w-full"
              value={selectedElement.font_family || "Inter"}
              onChange={(font_family) => onUpdateElement(id, { font_family })}
              options={PRESET_FONTS.map((f) => ({
                value: f.family,
                label: f.label,
              }))}
            />
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
                onChange={(font_size) => onUpdateElement(id, { font_size })}
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

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Styling & Alignment
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(id, {
                    font_weight:
                      selectedElement.font_weight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1.5 rounded flex-1 flex justify-center ${
                  selectedElement.font_weight === "bold"
                    ? "bg-white shadow text-teal-600 font-bold"
                    : "text-slate-600"
                }`}
              >
                <MdFormatBold size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(id, {
                    font_style:
                      selectedElement.font_style === "italic" ? "normal" : "italic",
                  })
                }
                className={`p-1.5 rounded flex-1 flex justify-center ${
                  selectedElement.font_style === "italic"
                    ? "bg-white shadow text-teal-600 italic"
                    : "text-slate-600"
                }`}
              >
                <MdFormatItalic size={16} />
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <button
                type="button"
                onClick={() => onUpdateElement(id, { align: "left" })}
                className={`p-1.5 rounded flex-1 flex justify-center ${
                  selectedElement.align === "left"
                    ? "bg-white shadow text-teal-600"
                    : "text-slate-600"
                }`}
              >
                <MdFormatAlignLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(id, { align: "center" })}
                className={`p-1.5 rounded flex-1 flex justify-center ${
                  (selectedElement.align || "center") === "center"
                    ? "bg-white shadow text-teal-600"
                    : "text-slate-600"
                }`}
              >
                <MdFormatAlignCenter size={16} />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(id, { align: "right" })}
                className={`p-1.5 rounded flex-1 flex justify-center ${
                  selectedElement.align === "right"
                    ? "bg-white shadow text-teal-600"
                    : "text-slate-600"
                }`}
              >
                <MdFormatAlignRight size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-xs font-semibold text-teal-900 block">
                  Customer Editable
                </span>
                <span className="text-[10px] text-teal-700">
                  Customer can modify this text
                </span>
              </div>
              <Switch
                size="small"
                checked={selectedElement.is_customer_editable !== false}
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
      )}

      {/* ==================== DECORATION PROPERTIES ==================== */}
      {type === "decoration" && (
        <div className="space-y-4">
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
        <label className="text-xs font-semibold text-slate-700 block mb-2">
          Position & Dimensions (Canvas Units)
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">X POS</span>
            <InputNumber
              size="small"
              value={selectedElement.x}
              onChange={(x) => onUpdateElement(id, { x: x || 0 })}
            />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Y POS</span>
            <InputNumber
              size="small"
              value={selectedElement.y}
              onChange={(y) => onUpdateElement(id, { y: y || 0 })}
            />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">WIDTH</span>
            <InputNumber
              size="small"
              min={20}
              value={selectedElement.width}
              onChange={(w) => onUpdateElement(id, { width: w || 20 })}
            />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">HEIGHT</span>
            <InputNumber
              size="small"
              min={20}
              value={selectedElement.height}
              onChange={(h) => onUpdateElement(id, { height: h || 20 })}
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
  );
};

export default PropertiesPanel;
