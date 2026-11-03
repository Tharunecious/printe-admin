import React, { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Select, Tag, Switch } from "antd";
import { resolveCompleteBook } from "./utils/pageResolver";
import ElementRenderer from "./Editor/ElementRenderer";
import { buildSizeInfo, resolveTemplateSizes } from "./utils/sizeUtils";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAutoStories,
  MdClose,
  MdLayers,
} from "react-icons/md";

// ── Embedded CSS for authentic 3D photobook page turns ─────────────────────────
const BOOK_ANIMATION_STYLES = `
@keyframes bookFlipNext3D {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(-180deg);
  }
}

@keyframes bookFlipPrev3D {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(180deg);
  }
}

@keyframes shadowSweepNextFront {
  0% {
    opacity: 0;
  }
  45% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes shadowSweepNextBack {
  0% {
    opacity: 0.8;
  }
  55% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}

@keyframes shadowSweepPrevFront {
  0% {
    opacity: 0;
  }
  45% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes shadowSweepPrevBack {
  0% {
    opacity: 0.8;
  }
  55% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}

.book-leaf-turning-next {
  animation: bookFlipNext3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.book-leaf-turning-prev {
  animation: bookFlipPrev3D 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.book-shadow-next-front {
  animation: shadowSweepNextFront 0.65s ease-in-out forwards;
}

.book-shadow-next-back {
  animation: shadowSweepNextBack 0.65s ease-in-out forwards;
}

.book-shadow-prev-front {
  animation: shadowSweepPrevFront 0.65s ease-in-out forwards;
}

.book-shadow-prev-back {
  animation: shadowSweepPrevBack 0.65s ease-in-out forwards;
}
`;

const BookPreviewModal = ({ open, onClose, template, configSizes = [] }) => {
  const [totalInteriorPages, setTotalInteriorPages] = useState(
    template?.page_config?.default_pages || 20
  );
  const [includeBlank, setIncludeBlank] = useState(() =>
    Boolean(template?.include_blank_page || template?.page_config?.include_blank_page)
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState("next"); // "next" | "prev"
  const [transitionData, setTransitionData] = useState(null);

  // Sync state when modal opens or template changes
  useEffect(() => {
    if (open) {
      setIncludeBlank(Boolean(template?.include_blank_page || template?.page_config?.include_blank_page));
      setCurrentStepIndex(0);
      setIsTurning(false);
      setTransitionData(null);
    }
  }, [open, template?._id, template?.include_blank_page, template?.page_config?.include_blank_page]);

  // Available book sizes from template, product, and studio presets
  const availableSizes = useMemo(() => {
    return resolveTemplateSizes({ template, configSizes });
  }, [template, configSizes]);

  const [selectedSizeId, setSelectedSizeId] = useState(
    template?.page_config?.selected_size || "A4"
  );

  useEffect(() => {
    if (template?.page_config?.selected_size) {
      setSelectedSizeId(template.page_config.selected_size);
    }
  }, [template?.page_config?.selected_size, open]);

  // Derive size parameters
  const sizeInfo = useMemo(() => {
    const matched = availableSizes.find(
      (s) =>
        String(s.id).toLowerCase() === String(selectedSizeId).toLowerCase() ||
        String(s.name).toLowerCase() === String(selectedSizeId).toLowerCase()
    );
    return matched || buildSizeInfo(selectedSizeId || "A4", 0, configSizes);
  }, [selectedSizeId, availableSizes, configSizes]);

  // Resolve sequential book items
  const resolvedBookPages = useMemo(() => {
    if (!template) return [];
    return resolveCompleteBook(template, totalInteriorPages);
  }, [template, totalInteriorPages]);

  // Build authentic 2-page photobook spreads reflecting blank page toggle
  const steps = useMemo(() => {
    if (!resolvedBookPages.length) return [];
    const frontCover = resolvedBookPages.find(
      (p) => p.page?.page_type === "front_cover" || (p.type === "cover" && p.coverType === "front_cover")
    );
    const backCover = resolvedBookPages.find(
      (p) => p.page?.page_type === "back_cover" || (p.type === "cover" && p.coverType === "back_cover")
    );
    const interiorPages = resolvedBookPages.filter(
      (p) => p.page?.page_type === "interior" || p.type === "interior"
    );

    const list = [];

    // Step 0: Closed Front Cover
    list.push({
      type: "cover_front",
      title: "Front Cover",
      page: frontCover?.page,
      label: "Front Cover",
      displayPageNumber: "Cover",
    });

    if (includeBlank) {
      // MODE A: Blank Page Enabled (Inside Covers are Blank)
      // Spread 1: Inside Front Cover (left, blank) + Interior Page 1 (right)
      list.push({
        type: "spread",
        title: "Inside Cover (Blank) & Page 1",
        leftPage: { is_blank: true, label: "Inside Front Cover (Blank)", page: null },
        rightPage: interiorPages[0] || { is_blank: true, label: "Page 1", page: null },
        spreadNumber: 1,
      });

      // Subsequent pairs: Page 2 & 3, Page 4 & 5, ...
      let idx = 1;
      let spreadCount = 2;
      while (idx < interiorPages.length) {
        const left = interiorPages[idx];
        const right = interiorPages[idx + 1];
        list.push({
          type: "spread",
          title: right
            ? `Pages ${left.interiorNumber || idx + 1} & ${right.interiorNumber || idx + 2}`
            : `Page ${left.interiorNumber || idx + 1} & Inside Back Cover (Blank)`,
          leftPage: left || { is_blank: true, label: "Blank", page: null },
          rightPage: right || { is_blank: true, label: "Inside Back Cover (Blank)", page: null },
          spreadNumber: spreadCount++,
        });
        idx += 2;
      }
    } else {
      // MODE B: Blank Page Disabled (Continuous Pages - No blank inside covers)
      let idx = 0;
      let spreadCount = 1;
      while (idx < interiorPages.length) {
        const left = interiorPages[idx];
        const right = interiorPages[idx + 1];
        list.push({
          type: "spread",
          title: right
            ? `Pages ${left.interiorNumber || idx + 1} & ${right.interiorNumber || idx + 2}`
            : `Page ${left.interiorNumber || idx + 1}`,
          leftPage: left || { is_blank: true, label: "Blank", page: null },
          rightPage: right || { is_blank: true, label: "Blank", page: null },
          spreadNumber: spreadCount++,
        });
        idx += 2;
      }
    }

    // Step Last: Closed Back Cover
    list.push({
      type: "cover_back",
      title: "Back Cover",
      page: backCover?.page,
      label: "Back Cover",
      displayPageNumber: "Back",
    });

    return list;
  }, [resolvedBookPages, includeBlank]);

  // Reset to first spread when modal opens or template changes
  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
      setIsTurning(false);
      setTransitionData(null);
    }
  }, [open, template?._id]);

  // Keyboard navigation (ArrowLeft for Prev, ArrowRight for Next)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  // ── Next Page Turn Handler (Right to Left in 3D) ─────────────────────────────
  const handleNext = () => {
    if (isLast || isTurning || totalSteps <= 1) return;
    const nextIdx = currentStepIndex + 1;
    const curr = steps[currentStepIndex];
    const nxt = steps[nextIdx];

    // Determine what is rendered on each surface during the flip
    let leafFront = null;
    let leafBack = null;
    let stationaryLeft = null;
    let stationaryRight = null;

    if (curr.type === "cover_front") {
      // Opening front cover
      leafFront = curr;
      leafBack = nxt.leftPage;
      stationaryLeft = nxt.leftPage;
      stationaryRight = nxt.rightPage;
    } else if (nxt.type === "cover_back") {
      // Closing to back cover
      leafFront = curr.rightPage;
      leafBack = nxt;
      stationaryLeft = curr.leftPage;
      stationaryRight = { is_blank: true, label: "" };
    } else {
      // Normal spread to spread
      leafFront = curr.rightPage;
      leafBack = nxt.leftPage;
      stationaryLeft = curr.leftPage;
      stationaryRight = nxt.rightPage;
    }

    setTransitionData({
      leafFront,
      leafBack,
      stationaryLeft,
      stationaryRight,
    });
    setTurnDirection("next");
    setIsTurning(true);

    setTimeout(() => {
      setCurrentStepIndex(nextIdx);
      setIsTurning(false);
      setTransitionData(null);
    }, 650);
  };

  // ── Prev Page Turn Handler (Left to Right in 3D) ─────────────────────────────
  const handlePrev = () => {
    if (isFirst || isTurning || totalSteps <= 1) return;
    const prevIdx = currentStepIndex - 1;
    const curr = steps[currentStepIndex];
    const prv = steps[prevIdx];

    let leafFront = null;
    let leafBack = null;
    let stationaryLeft = null;
    let stationaryRight = null;

    if (curr.type === "cover_back") {
      // Opening back cover
      leafFront = curr;
      leafBack = prv.rightPage;
      stationaryLeft = prv.leftPage;
      stationaryRight = prv.rightPage;
    } else if (prv.type === "cover_front") {
      // Closing to front cover
      leafFront = curr.leftPage;
      leafBack = prv;
      stationaryLeft = { is_blank: true, label: "" };
      stationaryRight = curr.rightPage;
    } else {
      // Normal spread to spread
      leafFront = curr.leftPage;
      leafBack = prv.rightPage;
      stationaryLeft = prv.leftPage;
      stationaryRight = curr.rightPage;
    }

    setTransitionData({
      leafFront,
      leafBack,
      stationaryLeft,
      stationaryRight,
    });
    setTurnDirection("prev");
    setIsTurning(true);

    setTimeout(() => {
      setCurrentStepIndex(prevIdx);
      setIsTurning(false);
      setTransitionData(null);
    }, 650);
  };

  if (!open || !template) return null;

  // Single page aspect ratio
  const singleRatio = sizeInfo?.singlePageRatio || 1;
  // Calculate spread container sizing
  const maxSpreadWidth = 840;
  const spreadHeight = Math.min(500, Math.round((maxSpreadWidth / 2) / singleRatio));
  const singleWidth = Math.round(spreadHeight * singleRatio);
  const totalSpreadWidth = singleWidth * 2;

  // ── Helper to render a single photobook page face ──────────────────────────
  const renderSinglePage = (pageItem, isLeft = false, isCover = false) => {
    if (!pageItem || pageItem.is_blank) {
      return (
        <div className="w-full h-full bg-[#fbf9f5] flex flex-col items-center justify-center text-slate-300 select-none relative overflow-hidden">
          {/* Subtle paper grain texture */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000000 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <span className="text-[11px] uppercase tracking-widest font-serif text-slate-400 font-medium">
            {pageItem?.label || (isCover ? "Inside Cover" : "Blank Page")}
          </span>
        </div>
      );
    }

    const page = pageItem.page || pageItem;
    const bg = page?.background || {};
    const fitMode = bg.fit_mode || "cover";
    const bgSize =
      fitMode === "stretch" || fitMode === "100% 100%"
        ? "100% 100%"
        : fitMode === "contain"
        ? (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "contain")
        : (bg.scale && bg.scale > 1 ? `${Math.round(bg.scale * 100)}%` : "cover");

    const bgStyle =
      bg.type === "gradient"
        ? { background: bg.value, opacity: bg.opacity ?? 1 }
        : bg.type === "image" && bg.value
        ? {
            backgroundImage: `url(${bg.value})`,
            backgroundSize: bgSize,
            backgroundPosition: `${bg.position_x ?? 50}% ${bg.position_y ?? 50}%`,
            backgroundRepeat: "no-repeat",
            backgroundColor: bg.background_color || "#ffffff",
            opacity: bg.opacity ?? 1,
          }
        : { backgroundColor: bg.value || "#ffffff", opacity: bg.opacity ?? 1 };

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-white"
        style={{
          ...bgStyle,
          containerType: "inline-size",
        }}
      >
        {/* Render elements relative to page width and height */}
        {(page?.elements || []).map((el) => (
          <ElementRenderer
            key={el.id}
            element={el}
            previewMode={true}
          />
        ))}

        {/* Page Number indicator if interior */}
        {pageItem.displayPageNumber && !isCover && (
          <div
            className={`absolute bottom-2.5 ${
              isLeft ? "left-3.5" : "right-3.5"
            } text-[10px] text-slate-400 font-mono pointer-events-none z-30 opacity-75 bg-white/70 px-1.5 py-0.5 rounded shadow-2xs`}
          >
            {pageItem.displayPageNumber}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      centered
      title={null}
      closable={false}
      styles={{ body: { padding: 0 } }}
    >
      <style>{BOOK_ANIMATION_STYLES}</style>

      <div className="bg-slate-900 text-white rounded-xl overflow-hidden flex flex-col h-[780px] select-none">
        {/* ── Top Header Bar ─────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <MdOutlineAutoStories size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {template.template_name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {sizeInfo.name} ({sizeInfo.dimensions})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive 3D Photobook Flip Preview • Use Left/Right keys or click pages to turn
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Book Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-600/50">
              <span className="text-slate-400 font-medium">Book Size:</span>
              <Select
                size="small"
                value={sizeInfo.id}
                onChange={(val) => {
                  setSelectedSizeId(val);
                  setCurrentStepIndex(0);
                }}
                className="w-40"
                options={availableSizes.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.width_in}×${s.height_in} in)`,
                }))}
              />
            </div>

            {/* Blank Page Toggle */}
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-600/50">
              <span className="text-slate-400">Blank Pages:</span>
              <Switch
                size="small"
                checked={includeBlank}
                onChange={(checked) => {
                  setIncludeBlank(checked);
                  setCurrentStepIndex(0);
                }}
                className={includeBlank ? "!bg-teal-500" : ""}
              />
              <span className={`text-[10px] font-bold ${includeBlank ? "text-teal-300" : "text-slate-400"}`}>
                {includeBlank ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-600/50">
              <span className="text-slate-400">Length:</span>
              <Select
                size="small"
                value={totalInteriorPages}
                onChange={(val) => {
                  setTotalInteriorPages(val);
                  setCurrentStepIndex(0);
                }}
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
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview (Esc)"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>

        {/* ── Main 3D Book Stage ────────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center p-6 relative overflow-visible bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
          style={{ perspective: "2600px" }}
        >
          {/* Subtle Ambient Stage Table Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Soft Book Drop Shadow on the Table */}
          <div
            className="absolute bottom-6 h-10 bg-black/80 blur-2xl rounded-full pointer-events-none transition-all duration-300"
            style={{
              width: currentStep.type.startsWith("cover") && !isTurning ? `${singleWidth}px` : `${totalSpreadWidth}px`,
            }}
          />

          {/* Left Arrow Button (Turn Prev) */}
          <button
            onClick={handlePrev}
            disabled={isFirst || isTurning}
            className={`absolute left-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-slate-800/90 hover:bg-teal-600 text-white shadow-2xl flex items-center justify-center transition-all border border-slate-700/60 ${
              isFirst || isTurning ? "opacity-20 cursor-not-allowed" : "hover:scale-110 active:scale-95 cursor-pointer"
            }`}
            title="Previous Page (ArrowLeft)"
          >
            <MdChevronLeft size={26} />
          </button>

          {/* Right Arrow Button (Turn Next) */}
          <button
            onClick={handleNext}
            disabled={isLast || isTurning}
            className={`absolute right-5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-slate-800/90 hover:bg-teal-600 text-white shadow-2xl flex items-center justify-center transition-all border border-slate-700/60 ${
              isLast || isTurning ? "opacity-20 cursor-not-allowed" : "hover:scale-110 active:scale-95 cursor-pointer"
            }`}
            title="Next Page (ArrowRight)"
          >
            <MdChevronRight size={26} />
          </button>

          {/* ════════════════════════════════════════════════════════════════
              CASE 1: ACTIVE TURNING ANIMATION (3D Flipping Leaf in motion)
             ════════════════════════════════════════════════════════════════ */}
          {isTurning && transitionData && (
            <div
              className="relative select-none"
              style={{
                width: `${totalSpreadWidth}px`,
                height: `${spreadHeight}px`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Stationary Left Half */}
              <div
                className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden bg-white rounded-l-lg shadow-xl"
                style={{
                  borderLeft: "3px solid #cbd5e1",
                  borderTop: "1px solid rgba(0,0,0,0.15)",
                  borderBottom: "2px solid rgba(0,0,0,0.25)",
                }}
              >
                {renderSinglePage(transitionData.stationaryLeft, true)}
              </div>

              {/* Stationary Right Half */}
              <div
                className="absolute top-0 bottom-0 right-0 w-1/2 overflow-hidden bg-white rounded-r-lg shadow-xl"
                style={{
                  borderRight: "3px solid #cbd5e1",
                  borderTop: "1px solid rgba(0,0,0,0.15)",
                  borderBottom: "2px solid rgba(0,0,0,0.25)",
                }}
              >
                {renderSinglePage(transitionData.stationaryRight, false)}
              </div>

              {/* ── THE 3D FLIPPING LEAF (Double-Sided Turning Sheet) ──── */}
              <div
                className={`absolute top-0 bottom-0 ${
                  turnDirection === "next"
                    ? "left-1/2 w-1/2 origin-left book-leaf-turning-next"
                    : "left-0 w-1/2 origin-right book-leaf-turning-prev"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  zIndex: 60,
                }}
              >
                {/* Front Face (Outgoing Page) */}
                <div
                  className="absolute inset-0 overflow-hidden bg-white rounded-r-lg"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    borderRight: turnDirection === "next" ? "2px solid #cbd5e1" : "none",
                    borderLeft: turnDirection === "prev" ? "2px solid #cbd5e1" : "none",
                  }}
                >
                  {renderSinglePage(transitionData.leafFront, turnDirection === "prev")}
                  {/* Dynamic Curvature Lighting Shadow */}
                  <div
                    className={`absolute inset-0 pointer-events-none ${
                      turnDirection === "next"
                        ? "book-shadow-next-front bg-gradient-to-r from-black/40 via-black/20 to-transparent"
                        : "book-shadow-prev-front bg-gradient-to-l from-black/40 via-black/20 to-transparent"
                    }`}
                  />
                </div>

                {/* Back Face (Incoming Page) */}
                <div
                  className="absolute inset-0 overflow-hidden bg-white rounded-l-lg"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderLeft: turnDirection === "next" ? "2px solid #cbd5e1" : "none",
                    borderRight: turnDirection === "prev" ? "2px solid #cbd5e1" : "none",
                  }}
                >
                  {renderSinglePage(transitionData.leafBack, turnDirection === "next")}
                  {/* Dynamic Curvature Lighting Shadow */}
                  <div
                    className={`absolute inset-0 pointer-events-none ${
                      turnDirection === "next"
                        ? "book-shadow-next-back bg-gradient-to-l from-black/40 via-black/20 to-transparent"
                        : "book-shadow-prev-back bg-gradient-to-r from-black/40 via-black/20 to-transparent"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              CASE 2: STATIC CLOSED FRONT COVER (Single hardcover on right)
             ════════════════════════════════════════════════════════════════ */}
          {!isTurning && currentStep.type === "cover_front" && (
            <div
              onClick={handleNext}
              className="relative cursor-pointer group transition-transform duration-300 hover:scale-[1.01]"
              style={{
                width: `${singleWidth}px`,
                height: `${spreadHeight}px`,
                aspectRatio: `${singleRatio}`,
                boxShadow:
                  "-16px 0 28px -6px rgba(0,0,0,0.8), 20px 24px 44px rgba(0,0,0,0.6), inset 3px 0 6px rgba(255,255,255,0.3)",
                borderTop: "2px solid rgba(255,255,255,0.2)",
                borderRight: "4px solid #cbd5e1",
                borderBottom: "4px solid #94a3b8",
                borderRadius: "2px 10px 10px 2px",
              }}
              title="Click to Open Photobook"
            >
              {/* Hardcover Spine Ridge on Left */}
              <div className="absolute top-0 bottom-0 left-0 w-7 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none z-30" />
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-black/40 shadow-xs pointer-events-none z-30" />

              {/* Cover Artwork */}
              <div className="w-full h-full relative overflow-hidden rounded-r-lg">
                {renderSinglePage(currentStep, false, true)}
              </div>

              {/* Stacked Pages Texture on the Right Edge */}
              <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 opacity-90 pointer-events-none z-20 border-l border-slate-300" />

              {/* Hover Invitation Overlay */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-40 pointer-events-none backdrop-blur-2xs rounded-r-lg">
                <MdOutlineAutoStories className="text-4xl mb-2 text-teal-400 animate-pulse" />
                <span className="font-bold text-xs tracking-wider uppercase bg-black/70 px-4 py-1.5 rounded-full border border-white/20">
                  Click to Open Book 📖
                </span>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              CASE 3: STATIC OPEN SPREAD (2-Page Open Book)
             ════════════════════════════════════════════════════════════════ */}
          {!isTurning && currentStep.type === "spread" && (
            <div
              className="relative flex select-none"
              style={{
                width: `${totalSpreadWidth}px`,
                height: `${spreadHeight}px`,
                boxShadow:
                  "0 30px 70px -15px rgba(0,0,0,0.8), inset 0 0 12px rgba(0,0,0,0.15)",
                borderRadius: "8px",
              }}
            >
              {/* Left Page (Click to Turn Prev) */}
              <div
                onClick={handlePrev}
                className="w-1/2 h-full relative overflow-hidden bg-white cursor-pointer group rounded-l-lg"
                style={{
                  borderLeft: "4px solid #cbd5e1",
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  borderBottom: "2px solid rgba(0,0,0,0.2)",
                }}
                title="Click left page to turn backward"
              >
                {renderSinglePage(currentStep.leftPage, true)}
                {/* Hover Cue */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-80 transition-opacity z-30 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MdChevronLeft size={14} /> Turn Prev
                </div>
              </div>

              {/* Right Page (Click to Turn Next) */}
              <div
                onClick={handleNext}
                className="w-1/2 h-full relative overflow-hidden bg-white cursor-pointer group rounded-r-lg"
                style={{
                  borderRight: "4px solid #cbd5e1",
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  borderBottom: "2px solid rgba(0,0,0,0.2)",
                }}
                title="Click right page to turn forward"
              >
                {renderSinglePage(currentStep.rightPage, false)}
                {/* Hover Cue */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-80 transition-opacity z-30 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  Turn Next <MdChevronRight size={14} />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              CASE 4: STATIC CLOSED BACK COVER (Single hardcover on left)
             ════════════════════════════════════════════════════════════════ */}
          {!isTurning && currentStep.type === "cover_back" && (
            <div
              onClick={handlePrev}
              className="relative cursor-pointer group transition-transform duration-300 hover:scale-[1.01]"
              style={{
                width: `${singleWidth}px`,
                height: `${spreadHeight}px`,
                aspectRatio: `${singleRatio}`,
                boxShadow:
                  "16px 0 28px -6px rgba(0,0,0,0.8), -20px 24px 44px rgba(0,0,0,0.6), inset -3px 0 6px rgba(255,255,255,0.3)",
                borderTop: "2px solid rgba(255,255,255,0.2)",
                borderLeft: "4px solid #cbd5e1",
                borderBottom: "4px solid #94a3b8",
                borderRadius: "10px 2px 2px 10px",
              }}
              title="Click to Open Photobook Backward"
            >
              {/* Hardcover Spine Ridge on Right */}
              <div className="absolute top-0 bottom-0 right-0 w-7 bg-gradient-to-l from-black/60 via-black/25 to-transparent pointer-events-none z-30" />
              <div className="absolute top-0 bottom-0 right-6 w-0.5 bg-black/40 shadow-xs pointer-events-none z-30" />

              {/* Back Cover Artwork */}
              <div className="w-full h-full relative overflow-hidden rounded-l-lg">
                {renderSinglePage(currentStep, true, true)}
              </div>

              {/* Stacked Pages Texture on the Left Edge */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-l from-slate-200 via-slate-100 to-slate-300 opacity-90 pointer-events-none z-20 border-r border-slate-300" />

              {/* Hover Invitation Overlay */}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-40 pointer-events-none backdrop-blur-2xs rounded-l-lg">
                <MdOutlineAutoStories className="text-4xl mb-2 text-teal-400 animate-pulse" />
                <span className="font-bold text-xs tracking-wider uppercase bg-black/70 px-4 py-1.5 rounded-full border border-white/20">
                  Click to Open Book Backward 📖
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Controls & Progress Filmstrip ──────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Tag color={currentStep.type.startsWith("cover") ? "gold" : "teal"}>
              {currentStep.type === "cover_front"
                ? "Front Cover (Closed)"
                : currentStep.type === "cover_back"
                ? "Back Cover (Closed)"
                : currentStep.title}
            </Tag>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>

          {/* Spread Jump Quick Dots / Pills */}
          <div className="flex items-center gap-1.5 max-w-[420px] overflow-x-auto py-1">
            {steps.map((st, idx) => {
              const isActive = idx === currentStepIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isTurning || idx === currentStepIndex) return;
                    setTurnDirection(idx > currentStepIndex ? "next" : "prev");
                    setCurrentStepIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    isActive
                      ? "w-6 bg-teal-400 shadow-xs"
                      : "w-2 bg-slate-600 hover:bg-slate-400"
                  }`}
                  title={st.title}
                />
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {currentStepIndex === 0
              ? "Closed Front"
              : currentStepIndex === totalSteps - 1
              ? "Closed Back"
              : `Spread ${currentStep.spreadNumber || currentStepIndex}`}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BookPreviewModal;
