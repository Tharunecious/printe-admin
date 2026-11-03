import { getFontFamilyFallback } from "./presetAssets";

/**
 * Accurately calculates text width % and height % based on letters typed,
 * font family, font size, letter spacing, and canvas dimensions.
 *
 * Rule:
 * - If there are no letters (empty or whitespace), width is low (~1%).
 * - As letters are typed, width increases dynamically based on character metrics.
 */
export const calculateDynamicTextDimensions = ({
  content = "",
  fontSize = 24,
  fontFamily = "Inter",
  fontWeight = "normal",
  fontStyle = "normal",
  letterSpacing = 0,
  lineHeight = 1.2,
  canvasWidth = 707,
  canvasHeight = 1000,
}) => {
  const text = String(content ?? "");
  const numFontSize = Number(fontSize) || 24;
  const numCanvasW = Number(canvasWidth) || 707;
  const numCanvasH = Number(canvasHeight) || 1000;
  const numLetterSpacing = Number(letterSpacing) || 0;
  const numLineHeight = Number(lineHeight) || 1.2;

  // 1. If there is no letter, width is low (1%)
  if (!text || text.trim().length === 0) {
    const minWidthPct = 1.0; // 1%
    const minHeightPx = Math.max(16, Math.round(numFontSize * 1.2));
    const minHeightPct = Number(((minHeightPx / numCanvasH) * 100).toFixed(2));
    return {
      width_pct: minWidthPct,
      height_pct: Math.max(1.0, minHeightPct),
      width: Math.max(10, Math.round((minWidthPct / 100) * numCanvasW)),
      height: minHeightPx,
      width_str: `${minWidthPct}%`,
      height_str: `${Math.max(1.0, minHeightPct)}%`,
    };
  }

  // 2. Measure width based on characters typed
  const lines = text.split("\n");
  let maxLineWidthPx = 0;

  try {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const fallback = getFontFamilyFallback(fontFamily);
        ctx.font = `${fontStyle || "normal"} ${fontWeight || "normal"} ${numFontSize}px ${fallback}`;
        
        for (const line of lines) {
          const metrics = ctx.measureText(line || " ");
          let w = metrics.width;
          if (numLetterSpacing && line.length > 1) {
            w += (line.length - 1) * numLetterSpacing;
          }
          if (w > maxLineWidthPx) {
            maxLineWidthPx = w;
          }
        }
      }
    }
  } catch (err) {
    // Fallback if canvas context is unavailable
  }

  // Fallback estimation if canvas measurement returned 0
  if (maxLineWidthPx <= 0) {
    const avgCharW = numFontSize * 0.58;
    for (const line of lines) {
      const w = (line.length * avgCharW) + (line.length * numLetterSpacing);
      if (w > maxLineWidthPx) maxLineWidthPx = w;
    }
  }

  // Add generous breathing room (padding) so cursive / italic letter flourishes don't clip
  const paddingPx = Math.max(20, Math.round(numFontSize * 0.5));
  const totalWidthPx = maxLineWidthPx + paddingPx;

  // Convert to % of canvas width
  const calcWidthPct = Number(((totalWidthPx / numCanvasW) * 100).toFixed(2));
  const finalWidthPct = Math.min(100, Math.max(1.0, calcWidthPct));

  // Compute height based on number of lines
  const totalHeightPx = Math.max(
    Math.round(lines.length * (numFontSize * numLineHeight) + 4),
    Math.round(numFontSize * 1.2)
  );
  const calcHeightPct = Number(((totalHeightPx / numCanvasH) * 100).toFixed(2));
  const finalHeightPct = Math.min(100, Math.max(1.0, calcHeightPct));

  return {
    width_pct: finalWidthPct,
    height_pct: finalHeightPct,
    width: Math.round((finalWidthPct / 100) * numCanvasW),
    height: totalHeightPx,
    width_str: `${finalWidthPct}%`,
    height_str: `${finalHeightPct}%`,
  };
};

/**
 * Unified Responsive Paper Coordinate Resolver
 * Resolves element left, top, width, height as clean percentages (%) with respect to the selected paper size.
 * Handles % fields, string percentages, legacy 1000-scale coordinates, and decimal ratios.
 * Identical single source of truth matching customer storefront PhotoBookEditorPage.jsx.
 */
export const getElementCoords = (el) => {
  if (!el) return { left: 0, top: 0, width: 100, height: 100 };

  const parseCoord = (val, pctVal, normVal, defaultPct = 0) => {
    // 1. Prioritize canonical percentage fields
    if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) {
      return Number(pctVal);
    }
    // 2. Canonical normalized (0.0 to 1.0)
    if (normVal !== undefined && normVal !== null && !isNaN(Number(normVal))) {
      return +(Number(normVal) * 100).toFixed(4);
    }
    // 3. String percentages (e.g. "25.5%")
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) return num;
      }
      const num = parseFloat(trimmed);
      if (!isNaN(num)) val = num;
    }
    // 4. Numeric parsing
    if (typeof val === "number" && !isNaN(val)) {
      if ((el.unit === "%" || el.is_percentage) && val <= 100) {
        return val;
      }
      // Legacy 1000-scale coordinates (e.g. 500 = 50%, 100 = 10%)
      if (val > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      // Normalized decimal (0 to 1)
      if (val > 0 && val <= 1) {
        return +(val * 100).toFixed(4);
      }
      // For val between 1 and 100: if sibling dimensions are > 100, this is legacy 1000-scale
      if (Number(el.width) > 100 || Number(el.height) > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      // Otherwise it's already a percentage
      return val;
    }
    return defaultPct;
  };

  const parseDimension = (val, pctVal, normVal, defaultPct = 100) => {
    if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) {
      return Number(pctVal);
    }
    if (normVal !== undefined && normVal !== null && !isNaN(Number(normVal))) {
      return +(Number(normVal) * 100).toFixed(4);
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) return num;
      }
      const num = parseFloat(trimmed);
      if (!isNaN(num)) val = num;
    }
    if (typeof val === "number" && !isNaN(val)) {
      if ((el.unit === "%" || el.is_percentage) && val <= 100) {
        return val;
      }
      if (val > 100) {
        return +((val / 1000) * 100).toFixed(4);
      }
      if (val > 0 && val <= 1) {
        return +(val * 100).toFixed(4);
      }
      return val;
    }
    return defaultPct;
  };

  const isText = el.type === "text";
  let left = parseCoord(el.x, el.x_pct, el.x_norm, 0);
  let top = parseCoord(el.y, el.y_pct, el.y_norm, 0);
  let width = parseDimension(el.width, el.width_pct, el.w_norm, 100);
  let height = parseDimension(el.height, el.height_pct, el.h_norm, 100);

  // For text elements: width & height are dynamically calculated based on typed characters
  if (isText) {
    const dynamicDims = calculateDynamicTextDimensions({
      content: el.content,
      fontSize: el.font_size,
      fontFamily: el.font_family,
      fontWeight: el.font_weight,
      fontStyle: el.font_style,
      letterSpacing: el.letter_spacing,
      lineHeight: el.line_height,
      canvasWidth: 707,
      canvasHeight: 1000,
    });

    width = Math.max(width, dynamicDims.width_pct);
    height = Math.max(height, dynamicDims.height_pct);

    // Only for legacy template elements lacking explicit percentage coordinate, anchor them centered
    if (el.x_pct === undefined && (typeof el.x === "number" && el.x > 1)) {
      const oldWidth = width;
      if ((el.align || "center") === "center") {
        const originalCenter = left + (oldWidth / 2);
        left = Math.max(0, Math.min(100 - width, Number((originalCenter - (width / 2)).toFixed(2))));
      } else if (el.align === "right") {
        const originalRight = left + oldWidth;
        left = Math.max(0, Math.min(100 - width, Number((originalRight - width).toFixed(2))));
      }
    }
  }

  // For text and decoration elements, return exact percentage width and height without bounding box clamping
  if (el.type === "decoration" || el.type === "text") {
    return { left, top, width, height };
  }

  // Allow coordinates to extend beyond 0..100% for full bleed and off-canvas elements
  left = Math.max(-100, Math.min(200, left));
  top = Math.max(-100, Math.min(200, top));
  width = Math.max(1, width);
  height = Math.max(1, height);

  return { left, top, width, height };
};

/**
 * Normalizes an element into canonical page coordinates (percentages and normalized [0,1] floats)
 * ensuring exact cross-device, preview, and print reproduction without drift.
 */
export const normalizeElementToPaperCoords = (el) => {
  if (!el) return el;
  const coords = getElementCoords(el);
  const fontSize = Number(el.font_size) || 24;
  return {
    ...el,
    x_pct: coords.left,
    y_pct: coords.top,
    width_pct: coords.width,
    height_pct: coords.height,
    x_norm: +(coords.left / 100).toFixed(6),
    y_norm: +(coords.top / 100).toFixed(6),
    w_norm: +(coords.width / 100).toFixed(6),
    h_norm: +(coords.height / 100).toFixed(6),
    x_str: `${coords.left}%`,
    y_str: `${coords.top}%`,
    width_str: `${coords.width}%`,
    height_str: `${coords.height}%`,
    unit: "%",
    is_percentage: true,
    font_size_rem: `${(fontSize / 16).toFixed(2)}rem`,
    font_size_cqmin: `${(fontSize / 10).toFixed(2)}cqmin`,
    // Backward compatibility with legacy 1000-scale schema / backend
    x: Math.round(coords.left * 10),
    y: Math.round(coords.top * 10),
    width: Math.round(coords.width * 10),
    height: Math.round(coords.height * 10),
  };
};

/**
 * Calculates new x_pct position to preserve alignment anchor (center, left, right)
 * when width changes dynamically.
 */
export const adjustTextPositionForNewWidth = ({
  oldXPct = 0,
  oldWidthPct = 50,
  newWidthPct = 50,
  align = "center",
}) => {
  const oldX = Number(oldXPct) || 0;
  const oldW = Number(oldWidthPct) || 0;
  const newW = Number(newWidthPct) || 0;

  if (align === "center") {
    const currentCenterX = oldX + (oldW / 2);
    const nextX = currentCenterX - (newW / 2);
    return Math.max(0, Math.min(100 - newW, Number(nextX.toFixed(2))));
  }

  if (align === "right") {
    const currentRightX = oldX + oldW;
    const nextX = currentRightX - newW;
    return Math.max(0, Math.min(100 - newW, Number(nextX.toFixed(2))));
  }

  // "left" align remains anchored at oldX
  return Math.max(0, Math.min(100 - newW, oldX));
};
