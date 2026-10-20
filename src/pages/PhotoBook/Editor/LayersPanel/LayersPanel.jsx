import React from "react";
import {
  MdLayers,
  MdVisibility,
  MdVisibilityOff,
  MdLockOutline,
  MdLockOpen,
  MdArrowUpward,
  MdArrowDownward,
  MdCropOriginal,
  MdTextFields,
  MdAutoAwesome,
  MdDeleteOutline,
} from "react-icons/md";

const LayersPanel = ({
  elements = [],
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onBringForward,
  onSendBackward,
  onReorderElements,
}) => {
  // Sort descending by z_index so top layer appears at top of list
  const sortedElements = [...elements].sort(
    (a, b) => (b.z_index || 1) - (a.z_index || 1)
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case "photo_frame":
        return <MdCropOriginal className="text-teal-600" size={16} />;
      case "text":
        return <MdTextFields className="text-indigo-600" size={16} />;
      case "decoration":
        return <MdAutoAwesome className="text-amber-500" size={16} />;
      default:
        return <MdLayers className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 flex flex-col h-full z-10 select-none shadow-sm">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <MdLayers className="text-teal-600" size={18} />
          <span>Layers ({elements.length})</span>
        </div>
        <span className="text-[10px] text-slate-400">Top to Bottom</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedElements.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No elements on this page. Add frames, text, or artwork from the left
            panel.
          </div>
        ) : (
          sortedElements.map((el, idx) => {
            const isSelected = el.id === selectedElementId;
            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-teal-50 border-teal-500 shadow-sm text-teal-900 font-medium"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate mr-1">
                  {getTypeIcon(el.type)}
                  <span className="truncate max-w-[100px]">
                    {el.frame_id ||
                      (el.type === "text"
                        ? el.content?.slice(0, 15) || "Text"
                        : el.name || el.type)}
                  </span>
                </div>

                {/* Layer Quick Controls */}
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onBringForward(el.id)}
                    title="Bring Forward"
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100"
                  >
                    <MdArrowUpward size={14} />
                  </button>
                  <button
                    onClick={() => onSendBackward(el.id)}
                    title="Send Backward"
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100"
                  >
                    <MdArrowDownward size={14} />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(el.id, { is_hidden: !el.is_hidden })
                    }
                    title={el.is_hidden ? "Show" : "Hide"}
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100"
                  >
                    {el.is_hidden ? (
                      <MdVisibilityOff className="text-rose-400" size={14} />
                    ) : (
                      <MdVisibility size={14} />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(el.id, { is_locked: !el.is_locked })
                    }
                    title={el.is_locked ? "Unlock" : "Lock"}
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100"
                  >
                    {el.is_locked ? (
                      <MdLockOutline className="text-amber-500" size={14} />
                    ) : (
                      <MdLockOpen size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteElement(el.id)}
                    title="Delete"
                    className="p-1 hover:text-rose-500 rounded text-slate-400 hover:bg-slate-100"
                  >
                    <MdDeleteOutline size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-slate-200 text-[10px] text-slate-400 text-center bg-slate-50">
        Stacking order dictates what appears above photos or decorations.
      </div>
    </div>
  );
};

export default LayersPanel;
