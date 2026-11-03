import React, { useState } from "react";
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
  MdDragIndicator,
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
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Sort descending by z_index so top layer appears at top of list
  const sortedElements = [...elements].sort(
    (a, b) => (b.z_index || 1) - (a.z_index || 1)
  );

  const reassignZIndexes = (newSortedList) => {
    // newSortedList is ordered from top (highest z_index) to bottom (lowest z_index)
    const total = newSortedList.length;
    const updated = newSortedList.map((el, idx) => ({
      ...el,
      z_index: total - idx,
    }));
    if (onReorderElements) {
      onReorderElements(updated);
    } else {
      updated.forEach((el) => onUpdateElement(el.id, { z_index: el.z_index }));
    }
  };

  const handleDragStart = (e, el) => {
    if (el.is_locked) {
      e.preventDefault();
      return;
    }
    setDraggedId(el.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", el.id);
  };

  const handleDragOver = (e, targetEl) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== targetEl.id) {
      setDragOverId(targetEl.id);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetEl) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetEl.id) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentList = [...sortedElements];
    const fromIdx = currentList.findIndex((el) => el.id === draggedId);
    const toIdx = currentList.findIndex((el) => el.id === targetEl.id);

    if (fromIdx !== -1 && toIdx !== -1) {
      const [movedItem] = currentList.splice(fromIdx, 1);
      currentList.splice(toIdx, 0, movedItem);
      reassignZIndexes(currentList);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleMoveUp = (elId) => {
    const currentList = [...sortedElements];
    const idx = currentList.findIndex((el) => el.id === elId);
    if (idx > 0) {
      // Swap with layer above (which has higher z_index)
      const temp = currentList[idx - 1];
      currentList[idx - 1] = currentList[idx];
      currentList[idx] = temp;
      reassignZIndexes(currentList);
    } else if (onBringForward) {
      onBringForward(elId);
    }
  };

  const handleMoveDown = (elId) => {
    const currentList = [...sortedElements];
    const idx = currentList.findIndex((el) => el.id === elId);
    if (idx < currentList.length - 1 && idx !== -1) {
      // Swap with layer below (which has lower z_index)
      const temp = currentList[idx + 1];
      currentList[idx + 1] = currentList[idx];
      currentList[idx] = temp;
      reassignZIndexes(currentList);
    } else if (onSendBackward) {
      onSendBackward(elId);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "photo_frame":
        return <MdCropOriginal className="text-teal-600 shrink-0" size={16} />;
      case "text":
        return <MdTextFields className="text-indigo-600 shrink-0" size={16} />;
      case "decoration":
        return <MdAutoAwesome className="text-amber-500 shrink-0" size={16} />;
      default:
        return <MdLayers className="text-slate-500 shrink-0" size={16} />;
    }
  };

  return (
    <div className="w-68 bg-white border-l border-slate-200 flex flex-col h-full z-10 select-none shadow-sm">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <MdLayers className="text-teal-600" size={18} />
          <span>Layers ({elements.length})</span>
        </div>
        <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
          Drag to Reorder
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        onDragOver={(e) => e.preventDefault()}
      >
        {sortedElements.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No elements on this page. Add frames, text, or artwork from the left panel.
          </div>
        ) : (
          sortedElements.map((el, idx) => {
            const isSelected = el.id === selectedElementId;
            const isDragging = el.id === draggedId;
            const isDragOver = el.id === dragOverId && !isDragging;

            return (
              <div
                key={el.id}
                draggable={!el.is_locked}
                onDragStart={(e) => handleDragStart(e, el)}
                onDragOver={(e) => handleDragOver(e, el)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, el)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onClick={() => onSelectElement(el)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all border group relative ${
                  isDragging
                    ? "opacity-40 border-dashed border-teal-500 bg-teal-50/50"
                    : isDragOver
                    ? "border-t-2 border-teal-600 bg-teal-50/40 shadow-xs"
                    : isSelected
                    ? "bg-teal-50 border-teal-500 shadow-xs text-teal-900 font-medium"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                {/* Drag Handle & Type & Label */}
                <div className="flex items-center gap-1.5 truncate mr-1">
                  <span
                    className={`cursor-grab active:cursor-grabbing text-slate-400 hover:text-teal-600 p-0.5 rounded ${
                      el.is_locked ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                    title={el.is_locked ? "Layer is locked" : "Drag to change stacking order (z-index)"}
                  >
                    <MdDragIndicator size={16} />
                  </span>
                  {getTypeIcon(el.type)}
                  <div className="flex flex-col truncate">
                    <span className="truncate max-w-[85px] leading-tight font-medium">
                      {el.frame_id ||
                        (el.type === "text"
                          ? el.content?.slice(0, 15) || "Text"
                          : el.name || el.type)}
                    </span>
                    <span className="text-[9px] text-slate-400 leading-none">
                      z: {el.z_index || 1}
                    </span>
                  </div>
                </div>

                {/* Layer Quick Controls */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleMoveUp(el.id)}
                    title="Bring Forward (Higher Z-Index)"
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <MdArrowUpward size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(el.id)}
                    title="Send Backward (Lower Z-Index)"
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <MdArrowDownward size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(el.id, { is_hidden: !el.is_hidden })
                    }
                    title={el.is_hidden ? "Show" : "Hide"}
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    {el.is_hidden ? (
                      <MdVisibilityOff className="text-rose-400" size={14} />
                    ) : (
                      <MdVisibility size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(el.id, { is_locked: !el.is_locked })
                    }
                    title={el.is_locked ? "Unlock" : "Lock"}
                    className="p-1 hover:text-teal-600 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    {el.is_locked ? (
                      <MdLockOutline className="text-amber-500" size={14} />
                    ) : (
                      <MdLockOpen size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteElement(el.id)}
                    title="Delete"
                    className="p-1 hover:text-rose-500 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <MdDeleteOutline size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-slate-200 text-[10px] text-slate-500 text-center bg-slate-50 flex items-center justify-center gap-1 font-medium">
        <span>Top layer renders in front • Bottom layer renders behind</span>
      </div>
    </div>
  );
};

export default LayersPanel;
