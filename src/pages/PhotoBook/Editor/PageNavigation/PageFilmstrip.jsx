import React from "react";
import {
  MdAdd,
  MdContentCopy,
  MdDeleteOutline,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
} from "react-icons/md";
import { Select, Tag } from "antd";

const PageFilmstrip = ({
  pages = [],
  activePageIndex = 0,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onUpdatePageRule,
}) => {
  const getRuleBadge = (page) => {
    if (page.page_type === "front_cover") {
      return <Tag color="purple">Front Cover</Tag>;
    }
    if (page.page_type === "back_cover") {
      return <Tag color="purple">Back Cover</Tag>;
    }

    const rule = page.targeting_rule?.rule_type;
    switch (rule) {
      case "exact_page":
        return (
          <Tag color="blue">
            Page {page.targeting_rule?.page_number || 1} Only
          </Tag>
        );
      case "odd_interior":
        return <Tag color="cyan">Odd Pages</Tag>;
      case "even_interior":
        return <Tag color="geekblue">Even Pages</Tag>;
      case "all_interior":
        return <Tag color="green">All Interior</Tag>;
      case "all_pages":
        return <Tag color="gold">All Pages</Tag>;
      default:
        return <Tag>Interior</Tag>;
    }
  };

  return (
    <div className="h-44 bg-white border-t border-slate-200 flex flex-col z-20 shadow-md select-none">
      {/* Top Strip Toolbar */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <MdOutlineAutoStories className="text-teal-600" size={18} />
          <span className="text-xs font-semibold text-slate-800">
            Pages ({pages.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Active: {pages[activePageIndex]?.name || `Page ${activePageIndex + 1}`}
          </span>
        </div>

        {/* Targeting Rule Selector for Current Page */}
        {pages[activePageIndex]?.page_type === "interior" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-600">
              Targeting Rule:
            </span>
            <Select
              size="small"
              className="w-44"
              value={pages[activePageIndex]?.targeting_rule?.rule_type || "all_interior"}
              onChange={(rule_type) =>
                onUpdatePageRule(activePageIndex, {
                  ...pages[activePageIndex].targeting_rule,
                  rule_type,
                })
              }
              options={[
                { value: "all_interior", label: "All Interior Pages" },
                { value: "odd_interior", label: "Odd Interior Pages" },
                { value: "even_interior", label: "Even Interior Pages" },
                { value: "exact_page", label: "Exact Page Number" },
                { value: "all_pages", label: "All Pages (General)" },
              ]}
            />

            {pages[activePageIndex]?.targeting_rule?.rule_type === "exact_page" && (
              <input
                type="number"
                min={1}
                max={100}
                value={pages[activePageIndex]?.targeting_rule?.page_number || 1}
                onChange={(e) =>
                  onUpdatePageRule(activePageIndex, {
                    ...pages[activePageIndex].targeting_rule,
                    page_number: Number(e.target.value) || 1,
                  })
                }
                className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center"
                title="Target Page Number"
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDuplicatePage(activePageIndex)}
            title="Duplicate Page"
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-teal-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
          >
            <MdContentCopy size={14} />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => onDeletePage(activePageIndex)}
            disabled={pages.length <= 1}
            title="Delete Page"
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 disabled:opacity-40 transition-colors"
          >
            <MdDeleteOutline size={14} />
            <span>Delete</span>
          </button>
          <button
            onClick={() => onAddPage("interior")}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-lg transition-colors shadow-sm"
          >
            <MdAdd size={16} />
            <span>Add Interior Page</span>
          </button>
        </div>
      </div>

      {/* Page Thumbnails Carousel */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 overflow-x-auto">
        {pages.map((p, idx) => {
          const isActive = idx === activePageIndex;
          const bg = p.background || {};
          const bgStyle =
            bg.type === "gradient"
              ? { background: bg.value }
              : bg.type === "image" && bg.value
              ? {
                  backgroundImage: `url(${bg.value})`,
                  backgroundSize: "cover",
                }
              : { backgroundColor: bg.value || "#ffffff" };

          return (
            <div
              key={p.page_id || idx}
              onClick={() => onSelectPage(idx)}
              className={`flex-shrink-0 cursor-pointer flex flex-col items-center group transition-all ${
                isActive ? "scale-105" : "opacity-80 hover:opacity-100"
              }`}
            >
              {/* Miniature Canvas Card */}
              <div
                className={`w-24 h-24 rounded-lg relative overflow-hidden border-2 shadow-sm transition-all ${
                  isActive
                    ? "border-teal-500 ring-2 ring-teal-200 shadow-md"
                    : "border-slate-300 hover:border-slate-400"
                }`}
                style={bgStyle}
              >
                {/* Miniature elements layout */}
                {(p.elements || []).map((el, elIdx) => (
                  <div
                    key={elIdx}
                    className="absolute rounded-[1px]"
                    style={{
                      left: `${(el.x / 1000) * 100}%`,
                      top: `${(el.y / 1000) * 100}%`,
                      width: `${(el.width / 1000) * 100}%`,
                      height: `${(el.height / 1000) * 100}%`,
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

                <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                  {idx + 1}
                </span>
              </div>

              <span className="text-[11px] font-medium text-slate-700 truncate max-w-[100px] mt-1">
                {p.name}
              </span>
              <div className="scale-90 origin-top mt-0.5">{getRuleBadge(p)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageFilmstrip;
