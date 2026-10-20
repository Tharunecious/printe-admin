import React, { useState } from "react";
import { Modal, Button, Tag, Select } from "antd";
import { resolveCompleteBook } from "./utils/pageResolver";
import ElementRenderer from "./Editor/ElementRenderer";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
  MdClose,
} from "react-icons/md";

const BookPreviewModal = ({ open, onClose, template }) => {
  const [totalInteriorPages, setTotalInteriorPages] = useState(
    template?.page_config?.default_pages || 20
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!open || !template) return null;

  const resolvedBookPages = resolveCompleteBook(template, totalInteriorPages);
  const currentItem = resolvedBookPages[currentSlideIndex] || resolvedBookPages[0];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) =>
      Math.min(resolvedBookPages.length - 1, prev + 1)
    );
  };

  const bg = currentItem?.page?.background || {};
  const bgStyle =
    bg.type === "gradient"
      ? { background: bg.value, opacity: bg.opacity ?? 1 }
      : bg.type === "image" && bg.value
      ? {
          backgroundImage: `url(${bg.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bg.opacity ?? 1,
        }
      : { backgroundColor: bg.value || "#ffffff", opacity: bg.opacity ?? 1 };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={null}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      <div className="bg-slate-900 text-white rounded-xl overflow-hidden flex flex-col h-[780px]">
        {/* Top Preview Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdOutlineAutoStories className="text-teal-400" size={22} />
            <div>
              <h3 className="text-sm font-semibold text-white">
                {template.template_name} — Complete Book Preview
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic page resolution simulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span>Book Length:</span>
              <Select
                size="small"
                value={totalInteriorPages}
                onChange={setTotalInteriorPages}
                className="w-24"
                options={[
                  { value: 10, label: "10 Pages" },
                  { value: 20, label: "20 Pages" },
                  { value: 30, label: "30 Pages" },
                  { value: 40, label: "40 Pages" },
                ]}
              />
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>

        {/* Central Page Presentation Area */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="absolute left-4 p-3 rounded-full bg-slate-800/80 hover:bg-teal-600 text-white disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all z-30 shadow-lg"
          >
            <MdChevronLeft size={24} />
          </button>

          {/* Scaled Rendered Page */}
          <div
            className="w-[540px] h-[540px] rounded shadow-2xl relative overflow-hidden transition-all duration-300 border border-slate-700"
            style={bgStyle}
          >
            {/* Render elements scaled to container (540 / 1000 = 0.54 scale) */}
            <div
              className="absolute inset-0 origin-top-left"
              style={{ transform: "scale(0.54)" }}
            >
              <div className="w-[1000px] h-[1000px] relative">
                {(currentItem?.page?.elements || []).map((el) => (
                  <ElementRenderer
                    key={el.id}
                    element={el}
                    previewMode={true}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlideIndex === resolvedBookPages.length - 1}
            className="absolute right-4 p-3 rounded-full bg-slate-800/80 hover:bg-teal-600 text-white disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all z-30 shadow-lg"
          >
            <MdChevronRight size={24} />
          </button>
        </div>

        {/* Bottom Navigation & Resolution Details */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag color="cyan">
              {currentItem?.displayPageNumber || "Page"}
            </Tag>
            <span className="text-xs text-slate-300">
              Template Design: <strong>{currentItem?.page?.name}</strong>
            </span>
            <Tag color="purple">
              Resolved via: {currentItem?.resolution?.ruleType?.replace("_", " ")}
            </Tag>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {currentSlideIndex + 1} of {resolvedBookPages.length} Pages
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BookPreviewModal;
