import React, { useState } from "react";
import {
  MdAdd,
  MdContentCopy,
  MdDeleteOutline,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
  MdDragIndicator,
  MdInfoOutline,
} from "react-icons/md";
import { Select, Tag, Switch, Tooltip, message } from "antd";

const PageFilmstrip = ({
  pages = [],
  activePageIndex = 0,
  sizeInfo = null,
  includeBlankPage = false,
  onToggleBlankPage,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onUpdatePageRule,
  onReorderPages,
}) => {
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const getRuleBadge = (page) => {
    if (page.page_type === "front_cover") {
      return <Tag color="purple" className="m-0 text-[10px] font-semibold">Front Cover</Tag>;
    }
    if (page.page_type === "back_cover") {
      return <Tag color="purple" className="m-0 text-[10px] font-semibold">Back Cover</Tag>;
    }
    if (page.is_blank || page.page_type === "blank") {
      return <Tag color="default" className="m-0 text-[10px] font-semibold">Blank Page</Tag>;
    }

    const rule = page.targeting_rule?.rule_type;
    switch (rule) {
      case "exact_page":
        return (
          <Tag color="blue" className="m-0 text-[10px] font-semibold">
            Page {page.targeting_rule?.page_number || 1} Only
          </Tag>
        );
      case "odd_interior":
        return <Tag color="cyan" className="m-0 text-[10px] font-semibold">Odd Pages</Tag>;
      case "even_interior":
        return <Tag color="geekblue" className="m-0 text-[10px] font-semibold">Even Pages</Tag>;
      case "all_interior":
        return <Tag color="green" className="m-0 text-[10px] font-semibold">All Interior</Tag>;
      case "all_pages":
        return <Tag color="gold" className="m-0 text-[10px] font-semibold">All Pages</Tag>;
      default:
        return <Tag className="m-0 text-[10px]">Interior</Tag>;
    }
  };

  // Rule exclusivity check for the active page
  const otherPages = pages.filter((_, idx) => idx !== activePageIndex);
  const isOddInUse = otherPages.some((p) => p.targeting_rule?.rule_type === "odd_interior");
  const isEvenInUse = otherPages.some((p) => p.targeting_rule?.rule_type === "even_interior");
  const isAllInteriorInUse = otherPages.some((p) => p.targeting_rule?.rule_type === "all_interior");

  const currentPageNum = pages[activePageIndex]?.targeting_rule?.page_number;
  const isPageNumConflict =
    pages[activePageIndex]?.targeting_rule?.rule_type === "exact_page" &&
    otherPages.some(
      (p) =>
        p.targeting_rule?.rule_type === "exact_page" &&
        p.targeting_rule?.page_number === currentPageNum
    );

  // Drag and Drop Handlers with Photobook Rule Enforcement
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const sourceIdx = draggedIdx;
    setDraggedIdx(null);
    setDragOverIdx(null);

    if (sourceIdx === null || sourceIdx === undefined || sourceIdx === targetIdx) {
      return;
    }

    const sourcePage = pages[sourceIdx];
    const lastIdx = pages.length - 1;

    // RULE 1: Front Cover MUST always remain at index 0
    if (sourcePage?.page_type === "front_cover" && targetIdx !== 0) {
      message.warning("Rule: Front Cover must always be the first page of the photobook!");
      return;
    }
    if (targetIdx === 0 && sourcePage?.page_type !== "front_cover") {
      message.warning("Rule: Front Cover must always be page 1! Interior pages cannot precede Front Cover.");
      return;
    }

    // RULE 2: Back Cover MUST always remain at the last index
    if (sourcePage?.page_type === "back_cover" && targetIdx !== lastIdx) {
      message.warning("Rule: Back Cover must always be the last page of the photobook!");
      return;
    }
    if (targetIdx === lastIdx && sourcePage?.page_type !== "back_cover") {
      message.warning("Rule: Back Cover must always be the last page! Interior pages cannot follow Back Cover.");
      return;
    }

    if (onReorderPages) {
      onReorderPages(sourceIdx, targetIdx);
    }
  };

  return (
    <div className="h-44 bg-white border-t border-slate-200 flex flex-col z-20 shadow-md select-none">
      {/* Top Strip Toolbar */}
      <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <MdOutlineAutoStories className="text-[#0284c7]" size={18} />
            <span className="text-xs font-bold text-slate-800">
              Pages ({pages.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-200/80 px-2 py-0.5 rounded-full">
            Active: {pages[activePageIndex]?.name || `Page ${activePageIndex + 1}`}
          </span>

          {/* Blank Page Toggle Button */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-700">
              Blank Page:
            </span>
            <Tooltip title="If toggled ON, customer side displays a blank page inside front cover. If OFF, no blank page is shown.">
              <Switch
                size="small"
                checked={includeBlankPage}
                onChange={onToggleBlankPage}
                className={includeBlankPage ? "!bg-sky-600" : ""}
              />
            </Tooltip>
            {includeBlankPage ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ON (Customer Visible)
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                OFF
              </span>
            )}
          </div>
        </div>

        {/* Targeting Rule Selector for Current Page with Rule Exclusivity */}
        {pages[activePageIndex]?.page_type === "interior" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">
              Targeting Rule:
            </span>
            <Select
              size="small"
              className="w-52"
              value={pages[activePageIndex]?.targeting_rule?.rule_type || "all_interior"}
              onChange={(rule_type) => {
                // Prevent duplicate assignment
                if (rule_type === "odd_interior" && isOddInUse) {
                  message.warning("Odd Interior rule is already in use on another page!");
                  return;
                }
                if (rule_type === "even_interior" && isEvenInUse) {
                  message.warning("Even Interior rule is already in use on another page!");
                  return;
                }
                if (rule_type === "all_interior" && isAllInteriorInUse) {
                  message.warning("All Interior rule is already in use on another page!");
                  return;
                }
                onUpdatePageRule(activePageIndex, {
                  ...pages[activePageIndex].targeting_rule,
                  rule_type,
                });
              }}
              options={[
                {
                  value: "all_interior",
                  label: isAllInteriorInUse ? "All Interior (In Use)" : "All Interior Pages",
                  disabled: isAllInteriorInUse,
                },
                {
                  value: "odd_interior",
                  label: isOddInUse ? "Odd Pages (In Use)" : "Odd Interior Pages",
                  disabled: isOddInUse,
                },
                {
                  value: "even_interior",
                  label: isEvenInUse ? "Even Pages (In Use)" : "Even Interior Pages",
                  disabled: isEvenInUse,
                },
                { value: "exact_page", label: "Exact Page Number" },
                { value: "all_pages", label: "All Pages (General)" },
              ]}
            />

            {pages[activePageIndex]?.targeting_rule?.rule_type === "exact_page" && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={currentPageNum || 1}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value) || 1;
                    onUpdatePageRule(activePageIndex, {
                      ...pages[activePageIndex].targeting_rule,
                      page_number: nextVal,
                    });
                  }}
                  className={`w-14 border rounded px-1.5 py-0.5 text-xs text-center font-mono ${
                    isPageNumConflict
                      ? "border-rose-400 bg-rose-50 text-rose-700 font-bold ring-1 ring-rose-300"
                      : "border-slate-300"
                  }`}
                  title="Target Page Number"
                />
                {isPageNumConflict && (
                  <span className="text-[10px] text-rose-600 font-bold" title="Another page already targets this page number">
                    ⚠️ Taken
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDuplicatePage(activePageIndex)}
            title="Duplicate Page"
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-sky-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <MdContentCopy size={14} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => onDeletePage(activePageIndex)}
            disabled={pages.length <= 1}
            title="Delete Page"
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <MdDeleteOutline size={14} />
            <span>Delete</span>
          </button>
          <button
            type="button"
            onClick={() => onAddPage("interior")}
            className="flex items-center gap-1 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <MdAdd size={16} />
            <span>+ Add Page</span>
          </button>
        </div>
      </div>

      {/* Reorder Guidance Banner */}
      <div className="px-4 py-1 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <MdInfoOutline className="text-sky-600" size={13} />
          <span>
            <strong>Photobook Rules:</strong> Drag cards to reorder. <strong>Front Cover</strong> must be page 1; <strong>Back Cover</strong> must be last page. Odd/Even rules are strictly unique.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Drag & Drop to rearrange
        </span>
      </div>

      {/* Page Thumbnails Filmstrip with Drag & Drop */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 overflow-x-auto">
        {pages.map((p, idx) => {
          const isActive = idx === activePageIndex;
          const isDragging = idx === draggedIdx;
          const isDragOver = idx === dragOverIdx;
          const bg = p.background || {};
          const bgStyle =
            bg.type === "gradient"
              ? { background: bg.value }
              : bg.type === "image" && bg.value
              ? {
                  backgroundImage: `url(${bg.value})`,
                  backgroundSize: bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : (bg.fit_mode || "cover"),
                  backgroundPosition: `${bg.position_x ?? 50}% ${bg.position_y ?? 50}%`,
                  backgroundRepeat: "no-repeat",
                }
              : { backgroundColor: bg.value || "#ffffff" };

          return (
            <React.Fragment key={p.page_id || idx}>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => onSelectPage(idx)}
                className={`flex-shrink-0 cursor-pointer flex flex-col items-center group transition-all relative ${
                  isActive ? "scale-105" : "opacity-85 hover:opacity-100"
                } ${isDragging ? "opacity-35 scale-95" : ""} ${
                  isDragOver ? "border-l-4 border-l-sky-500 pl-1" : ""
                }`}
                title="Drag to reorder page"
              >
                {/* Miniature Canvas Card with Paper Aspect Ratio */}
                <div
                  className={`rounded-md relative overflow-hidden border-2 shadow-sm transition-all ${
                    isActive
                      ? "border-[#0284c7] ring-2 ring-sky-400/30 shadow-md scale-102"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  style={{
                    height: "86px",
                    width: `${Math.max(54, Math.min(140, Math.round(86 * (sizeInfo?.singlePageRatio || 1))))}px`,
                    ...bgStyle,
                  }}
                >
                  {/* Miniature elements layout */}
                  {(p.elements || []).map((el, elIdx) => (
                    <div
                      key={elIdx}
                      className="absolute rounded-[1px]"
                      style={{
                        left: `${el.x_pct !== undefined ? el.x_pct : (el.x / 1000) * 100}%`,
                        top: `${el.y_pct !== undefined ? el.y_pct : (el.y / 1000) * 100}%`,
                        width: `${el.width_pct !== undefined ? el.width_pct : (el.width / 1000) * 100}%`,
                        height: `${el.height_pct !== undefined ? el.height_pct : (el.height / 1000) * 100}%`,
                        backgroundColor:
                          el.type === "photo_frame"
                            ? "rgba(13, 148, 136, 0.45)"
                            : el.type === "text"
                            ? "rgba(99, 102, 241, 0.5)"
                            : "rgba(245, 158, 11, 0.5)",
                        border: "0.5px solid rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}

                  {/* Drag Grip Icon */}
                  <div className="absolute top-1 left-1 bg-black/40 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MdDragIndicator size={10} />
                  </div>

                  <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                    {idx + 1}
                  </span>
                </div>

                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[100px] mt-1">
                  {p.name}
                </span>
                <div className="scale-90 origin-top mt-0.5">{getRuleBadge(p)}</div>
              </div>

              {/* If Blank Page is toggled ON, display visual indicator right after Front Cover (index 0) */}
              {includeBlankPage && idx === 0 && (
                <div
                  className="flex-shrink-0 flex flex-col items-center opacity-70 group transition-all"
                  title="Blank Page (Inside Front Cover) - Active on Customer Side"
                >
                  <div
                    className="rounded-md relative overflow-hidden border-2 border-dashed border-sky-300 bg-sky-50/40 flex flex-col items-center justify-center shadow-2xs"
                    style={{
                      height: "86px",
                      width: `${Math.max(54, Math.min(140, Math.round(86 * (sizeInfo?.singlePageRatio || 1))))}px`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-sky-700">Blank</span>
                    <span className="text-[8px] text-sky-500">Inside Cover</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 mt-1">
                    Blank Page
                  </span>
                  <Tag color="cyan" className="m-0 mt-0.5 text-[9px]">Inside Front</Tag>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PageFilmstrip;
