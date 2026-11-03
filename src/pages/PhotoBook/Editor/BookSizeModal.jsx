import React from "react";
import { Modal, Tag } from "antd";
import { MdCheckCircle, MdAspectRatio } from "react-icons/md";
import { buildSizeInfo } from "../utils/sizeUtils";

const BookSizeModal = ({
  open,
  onClose,
  selectedSize,
  onSelectSize,
  templateSizes = [],
  supportedSizes = [],
}) => {
  // Only show sizes created and configured for this template — identical to customer side
  const resolvedSizes = React.useMemo(() => {
    if (Array.isArray(templateSizes) && templateSizes.length > 0) {
      return templateSizes;
    }
    const list = [];
    const seen = new Set();

    (supportedSizes || []).forEach((sz, idx) => {
      const info = buildSizeInfo(sz, idx);
      if (!seen.has(info.id.toLowerCase())) {
        seen.add(info.id.toLowerCase());
        list.push(info);
      }
    });

    if (selectedSize && !seen.has(String(selectedSize).toLowerCase())) {
      const currentInfo = buildSizeInfo(selectedSize);
      seen.add(currentInfo.id.toLowerCase());
      list.unshift(currentInfo);
    }

    return list;
  }, [templateSizes, supportedSizes, selectedSize]);

  const activeSizeInfo = React.useMemo(() => {
    const matched = resolvedSizes.find(
      (s) =>
        s.id.toLowerCase() === String(selectedSize).toLowerCase() ||
        s.name.toLowerCase() === String(selectedSize).toLowerCase()
    );
    return matched || buildSizeInfo(selectedSize);
  }, [resolvedSizes, selectedSize]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <MdAspectRatio className="text-teal-600 text-xl" />
          <span className="font-bold">Select Book Size & Paper Format</span>
        </div>
      }
      centered
    >
      <div className="py-2 flex flex-col gap-4 select-none">
        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span>
            Selecting a size adjusts the canvas aspect ratio and dimensions to match the paper format.
            All elements are stored as relative percentages and adapt automatically.
          </span>
          <Tag color="teal" className="font-mono">
            {resolvedSizes.length} Formats
          </Tag>
        </div>

        {/* Sizes Grid (Identical appearance to customer side studio) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {resolvedSizes.map((s) => {
            const isSelected =
              activeSizeInfo.id.toLowerCase() === s.id.toLowerCase() ||
              activeSizeInfo.name.toLowerCase() === s.name.toLowerCase() ||
              String(selectedSize).toLowerCase() === s.id.toLowerCase();

            const aspect = s.width && s.height ? s.width / s.height : 1;
            const boxHeight = 32;
            const boxWidth = Math.max(18, Math.min(52, Math.round(boxHeight * aspect)));

            return (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSize(s.id);
                  onClose();
                }}
                className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isSelected
                    ? "border-2 border-teal-600 text-teal-800 bg-teal-50/50 font-semibold shadow-md ring-2 ring-teal-500/20"
                    : "border-slate-200 hover:border-teal-400 text-slate-700 bg-white hover:bg-slate-50/80 hover:shadow-xs"
                }`}
              >
                {/* Popular or Configured Badge */}
                {s.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    POPULAR
                  </span>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-teal-600">
                    <MdCheckCircle size={16} />
                  </div>
                )}

                {/* Orientation Badge */}
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  {s.orientation}
                </span>

                {/* Dynamic Wireframe Box proportioned to actual width/height */}
                <div
                  className={`rounded-xs border-2 mb-2 transition-transform ${
                    isSelected ? "border-teal-600 bg-teal-100/50 scale-105" : "border-slate-400 bg-slate-100/60"
                  }`}
                  style={{
                    width: `${boxWidth}px`,
                    height: `${boxHeight}px`,
                  }}
                />

                {/* Size Name */}
                <span className="text-xs font-bold leading-tight text-slate-800">
                  {s.name}
                </span>

                {/* Explicit Dimensions Badge */}
                <span className="text-[10px] font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2 py-0.5 rounded leading-tight border border-slate-200">
                  {s.dimensions}
                </span>

                {/* Explicit Width & Height Breakdown */}
                <div className="flex flex-col text-[9px] text-slate-500 font-medium mt-1.5 leading-tight gap-0.5">
                  <span>
                    <strong>W:</strong> {s.width_in || s.width}″ ({s.width_cm || +(Number(s.width) * 2.54).toFixed(1)} cm)
                  </span>
                  <span>
                    <strong>H:</strong> {s.height_in || s.height}″ ({s.height_cm || +(Number(s.height) * 2.54).toFixed(1)} cm)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default BookSizeModal;
