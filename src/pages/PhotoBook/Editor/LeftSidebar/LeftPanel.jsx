import React, { useState } from "react";
import {
  MdCropOriginal,
  MdTextFields,
  MdPalette,
  MdAutoAwesome,
  MdGridView,
  MdCloudUpload,
  MdAdd,
  MdBookmarkAdd,
} from "react-icons/md";
import { FRAME_SHAPES } from "../../utils/clipPaths";
import {
  PRESET_SOLID_COLORS,
  PRESET_GRADIENTS,
  PRESET_FONTS,
  PRESET_DECORATIONS,
  SAMPLE_TEST_PHOTOS,
} from "../../utils/presetAssets";
import { Input, Button, Modal, message } from "antd";

const LeftPanel = ({
  onAddPhotoFrame,
  onAddText,
  onAddDecoration,
  onSetBackground,
  onApplyLayout,
  onSaveCurrentAsLayout,
  page,
  layouts = [],
}) => {
  const [activeTab, setActiveTab] = useState("frames");
  const [customBgUrl, setCustomBgUrl] = useState("");
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [layoutCategory, setLayoutCategory] = useState("1-photo");

  const TABS = [
    { id: "frames", label: "Frames", icon: MdCropOriginal },
    { id: "layouts", label: "Layouts", icon: MdGridView },
    { id: "text", label: "Text", icon: MdTextFields },
    { id: "decorations", label: "Elements", icon: MdAutoAwesome },
    { id: "backgrounds", label: "Background", icon: MdPalette },
    { id: "uploads", label: "Photos", icon: MdCloudUpload },
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

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 select-none shadow-sm">
      {/* Top Icon Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors border-b-2 ${
                isActive
                  ? "border-teal-600 text-teal-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ==================== PHOTO FRAMES TAB ==================== */}
        {activeTab === "frames" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Photo Placeholders
              </h3>
              <p className="text-xs text-slate-500">
                Placeholders define where customer photos clip and render.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FRAME_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddPhotoFrame(shape.id)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50 hover:border-teal-400 hover:shadow-sm transition-all group text-left"
                >
                  <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 group-hover:border-teal-500 flex items-center justify-center mb-2 shadow-inner">
                    {shape.id === "circle" && (
                      <div className="w-10 h-10 rounded-full border-2 border-teal-600 bg-teal-50" />
                    )}
                    {shape.id === "heart" && (
                      <span className="text-2xl text-rose-500">♥</span>
                    )}
                    {shape.id === "star" && (
                      <span className="text-2xl text-amber-500">★</span>
                    )}
                    {shape.id === "hexagon" && (
                      <div className="w-9 h-9 border-2 border-teal-600 rotate-45 rounded-sm bg-teal-50" />
                    )}
                    {shape.id === "arch" && (
                      <div className="w-8 h-10 border-2 border-teal-600 rounded-t-full bg-teal-50" />
                    )}
                    {shape.id === "scallop" && (
                      <span className="text-2xl text-teal-600">✿</span>
                    )}
                    {shape.id === "rectangle" && (
                      <div className="w-10 h-8 border-2 border-teal-600 rounded bg-teal-50" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-700 group-hover:text-teal-700 capitalize">
                    {shape.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================== REUSABLE LAYOUTS TAB ==================== */}
        {activeTab === "layouts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Photo Layouts
                </h3>
                <p className="text-xs text-slate-500">
                  Predefined arrangements of photo frames.
                </p>
              </div>
              <Button
                size="small"
                type="dashed"
                icon={<MdBookmarkAdd />}
                onClick={() => setLayoutModalVisible(true)}
                title="Save current page photo frames as a layout"
              >
                Save Current
              </Button>
            </div>

            <div className="space-y-3">
              {layouts.map((layout) => (
                <div
                  key={layout.layout_id || layout._id}
                  onClick={() => onApplyLayout(layout)}
                  className="p-3 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                      {layout.layout_name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {layout.frames?.length || layout.photo_count || 1} Photos
                    </span>
                  </div>

                  {/* Visual miniature representation */}
                  <div className="w-full h-24 bg-slate-100 rounded-lg relative overflow-hidden border border-slate-200">
                    {(layout.frames || []).map((frame, idx) => (
                      <div
                        key={idx}
                        className="absolute bg-teal-200/80 border border-teal-600/40 rounded-sm"
                        style={{
                          left: `${(frame.x / 1000) * 100}%`,
                          top: `${(frame.y / 1000) * 100}%`,
                          width: `${(frame.width / 1000) * 100}%`,
                          height: `${(frame.height / 1000) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for saving current page as reusable layout */}
            <Modal
              title="Save Current Page as Reusable Layout"
              open={layoutModalVisible}
              onCancel={() => setLayoutModalVisible(false)}
              onOk={handleSaveLayout}
              okText="Save Layout"
            >
              <div className="space-y-3 py-2">
                <p className="text-xs text-slate-600">
                  This will extract all photo frames on the current page and save
                  their relative positions for reuse across any page or book.
                </p>
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Layout Name
                  </label>
                  <Input
                    placeholder="e.g. 3 Photo Diagonal Collage"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Category
                  </label>
                  <select
                    value={layoutCategory}
                    onChange={(e) => setLayoutCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  >
                    <option value="1-photo">1 Photo</option>
                    <option value="2-photo">2 Photos</option>
                    <option value="3-photo">3 Photos</option>
                    <option value="4-photo">4 Photos</option>
                    <option value="grid">Grid</option>
                    <option value="collage">Collage</option>
                  </select>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ==================== TEXT TAB ==================== */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Text Elements
              </h3>
              <p className="text-xs text-slate-500">
                Add book titles, chapter headings, and editable customer captions.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() =>
                  onAddText({
                    content: "Add a heading",
                    font_size: 44,
                    font_weight: "bold",
                    font_family: "Playfair Display",
                  })
                }
                className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-left font-serif font-bold text-lg text-slate-800 transition-all flex items-center justify-between"
              >
                <span>Add a heading</span>
                <MdAdd size={18} className="text-slate-400" />
              </button>

              <button
                onClick={() =>
                  onAddText({
                    content: "Add a subheading",
                    font_size: 26,
                    font_weight: "600",
                    font_family: "Inter",
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-left font-sans font-medium text-sm text-slate-700 transition-all flex items-center justify-between"
              >
                <span>Add a subheading</span>
                <MdAdd size={18} className="text-slate-400" />
              </button>

              <button
                onClick={() =>
                  onAddText({
                    content: "Add a little bit of body text or caption...",
                    font_size: 18,
                    font_weight: "normal",
                    font_family: "Inter",
                  })
                }
                className="w-full py-2 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-left font-sans text-xs text-slate-600 transition-all flex items-center justify-between"
              >
                <span>Add body text</span>
                <MdAdd size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Font Pairings & Styles
              </h4>
              <div className="space-y-2">
                {PRESET_FONTS.slice(0, 6).map((f) => (
                  <button
                    key={f.family}
                    onClick={() =>
                      onAddText({
                        content: `${f.family} Typography`,
                        font_family: f.family,
                        font_size: 32,
                        font_weight: "normal",
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-slate-50 text-left transition-colors"
                  >
                    <span
                      className="text-base block text-slate-800"
                      style={{ fontFamily: f.family }}
                    >
                      {f.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== DECORATIONS TAB ==================== */}
        {activeTab === "decorations" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Decorative Artwork & Stickers
              </h3>
              <p className="text-xs text-slate-500">
                Vector artwork that sits on its own layer above or below photos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_DECORATIONS.map((dec) => (
                <button
                  key={dec.id}
                  onClick={() => onAddDecoration(dec)}
                  className="p-3 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/50 flex flex-col items-center justify-center transition-all group"
                >
                  <div
                    className="w-16 h-16 text-slate-700 group-hover:text-teal-600 flex items-center justify-center p-2 mb-1"
                    dangerouslySetInnerHTML={{ __html: dec.svg }}
                  />
                  <span className="text-[11px] font-medium text-slate-600 group-hover:text-teal-700 text-center">
                    {dec.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================== BACKGROUNDS TAB ==================== */}
        {activeTab === "backgrounds" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Page Background
              </h3>
              <p className="text-xs text-slate-500">
                Set solid colors, modern gradients, or custom artwork.
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Solid Colors
              </span>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_SOLID_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      onSetBackground({ type: "color", value: c, opacity: 1 })
                    }
                    className="w-8 h-8 rounded-full border border-slate-300 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Modern Gradients
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() =>
                      onSetBackground({
                        type: "gradient",
                        value: g.value,
                        opacity: 1,
                      })
                    }
                    className="h-12 rounded-lg border border-slate-300 p-2 text-left hover:scale-105 transition-transform flex items-end shadow-sm"
                    style={{ background: g.value }}
                  >
                    <span className="text-[10px] font-semibold bg-white/80 px-1.5 py-0.5 rounded text-slate-800">
                      {g.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Custom Background Image URL
              </span>
              <div className="flex gap-2">
                <Input
                  size="small"
                  placeholder="https://..."
                  value={customBgUrl}
                  onChange={(e) => setCustomBgUrl(e.target.value)}
                />
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    if (customBgUrl) {
                      onSetBackground({
                        type: "image",
                        value: customBgUrl,
                        opacity: 1,
                      });
                      setCustomBgUrl("");
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PHOTOS / TEST IMAGES TAB ==================== */}
        {activeTab === "uploads" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Sample Test Photos
              </h3>
              <p className="text-xs text-slate-500">
                Click any photo to insert into selected frame or test clipping.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TEST_PHOTOS.map((photo) => (
                <div
                  key={photo.name}
                  onClick={() => onAddPhotoFrame("rectangle", photo.url)}
                  className="rounded-lg overflow-hidden border border-slate-200 hover:border-teal-500 cursor-pointer group relative shadow-sm"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-1 bg-white text-[10px] font-medium text-slate-700 truncate">
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
