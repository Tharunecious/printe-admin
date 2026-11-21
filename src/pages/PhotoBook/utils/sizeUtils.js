// ── Preset Standard Studio Photobook Sizes (Matching Customer Side & Print Standards) ───
export const PRESET_STUDIO_SIZES = [
  {
    id: "A4",
    name: "A4",
    orientation: "VERTICAL",
    width: 8.27,
    height: 11.69,
    width_in: 8.27,
    height_in: 11.69,
    width_cm: 21.0,
    height_cm: 29.7,
    unit: "in",
    dimensions: "8.27 × 11.69 in (21.0 × 29.7 cm)",
    singlePageRatio: +(8.27 / 11.69).toFixed(4),
    spreadRatio: +((8.27 * 2) / 11.69).toFixed(4),
    popular: true,
  },
  {
    id: "A5",
    name: "A5",
    orientation: "VERTICAL",
    width: 5.83,
    height: 8.27,
    width_in: 5.83,
    height_in: 8.27,
    width_cm: 14.8,
    height_cm: 21.0,
    unit: "in",
    dimensions: "5.83 × 8.27 in (14.8 × 21.0 cm)",
    singlePageRatio: +(5.83 / 8.27).toFixed(4),
    spreadRatio: +((5.83 * 2) / 8.27).toFixed(4),
    popular: false,
  },
  {
    id: "12x12 inch",
    name: "12x12 inch",
    orientation: "SQUARE",
    width: 12.0,
    height: 12.0,
    width_in: 12.0,
    height_in: 12.0,
    width_cm: 30.5,
    height_cm: 30.5,
    unit: "in",
    dimensions: "12 × 12 in (30.5 × 30.5 cm)",
    singlePageRatio: 1.0,
    spreadRatio: 2.0,
    popular: false,
  },
  {
    id: "A3",
    name: "A3",
    orientation: "VERTICAL",
    width: 11.69,
    height: 16.54,
    width_in: 11.69,
    height_in: 16.54,
    width_cm: 29.7,
    height_cm: 42.0,
    unit: "in",
    dimensions: "11.69 × 16.54 in (29.7 × 42.0 cm)",
    singlePageRatio: +(11.69 / 16.54).toFixed(4),
    spreadRatio: +((11.69 * 2) / 16.54).toFixed(4),
    popular: false,
  },
  {
    id: "A4 Landscape",
    name: "A4 Landscape",
    orientation: "HORIZONTAL",
    width: 11.69,
    height: 8.27,
    width_in: 11.69,
    height_in: 8.27,
    width_cm: 29.7,
    height_cm: 21.0,
    unit: "in",
    dimensions: "11.69 × 8.27 in (29.7 × 21.0 cm)",
    singlePageRatio: +(11.69 / 8.27).toFixed(4),
    spreadRatio: +((11.69 * 2) / 8.27).toFixed(4),
    popular: false,
  },
  {
    id: "Square",
    name: "Square",
    orientation: "SQUARE",
    width: 8.5,
    height: 8.5,
    width_in: 8.5,
    height_in: 8.5,
    width_cm: 21.6,
    height_cm: 21.6,
    unit: "in",
    dimensions: "8.5 × 8.5 in (21.6 × 21.6 cm)",
    singlePageRatio: 1.0,
    spreadRatio: 2.0,
    popular: false,
  },
];

/**
 * Resolves any size item (object, string, custom size) into a complete size object
 * with width, height (in & cm), orientation, dimensions, and aspect ratio.
 * Identical logic to customer side buildSizeObject.
 */
export const buildSizeInfo = (szItem, fallbackIndex = 0, configSizes = []) => {
  // If already a complete size object, return as-is
  if (
    typeof szItem === "object" &&
    szItem !== null &&
    szItem.singlePageRatio !== undefined &&
    szItem.width_in !== undefined &&
    szItem.height_in !== undefined
  ) {
    return szItem;
  }

  if (typeof szItem === "object" && szItem !== null) {
    const name = szItem.name || szItem.title || szItem.label || `Size ${fallbackIndex + 1}`;
    const id = szItem._id || szItem.id || name;
    let width_in = Number(szItem.width_in || szItem.width);
    let height_in = Number(szItem.height_in || szItem.height);
    let width_cm = Number(szItem.width_cm);
    let height_cm = Number(szItem.height_cm);

    // Derive cm from in or in from cm
    if ((!width_in || !height_in) && width_cm && height_cm) {
      width_in = +(width_cm / 2.54).toFixed(2);
      height_in = +(height_cm / 2.54).toFixed(2);
    } else if ((!width_cm || !height_cm) && width_in && height_in) {
      width_cm = +(width_in * 2.54).toFixed(1);
      height_cm = +(height_in * 2.54).toFixed(1);
    }

    // Fallback parsing from name if needed
    if (!width_in || !height_in) {
      const match = String(name).match(/([0-9.]+)\s*[xX*×]\s*([0-9.]+)/);
      if (match) {
        width_in = parseFloat(match[1]);
        height_in = parseFloat(match[2]);
        width_cm = +(width_in * 2.54).toFixed(1);
        height_cm = +(height_in * 2.54).toFixed(1);
      } else {
        // Standard A4 default
        width_in = 8.27;
        height_in = 11.69;
        width_cm = 21.0;
        height_cm = 29.7;
      }
    }

    const orientation =
      Math.abs(width_in - height_in) < 0.2
        ? "SQUARE"
        : width_in > height_in
        ? "HORIZONTAL"
        : "VERTICAL";

    const singlePageRatio = +(width_in / height_in).toFixed(4);
    const spreadRatio = +((width_in * 2) / height_in).toFixed(4);
    const dimensions = `${width_in} × ${height_in} in (${width_cm} × ${height_cm} cm)`;

    return {
      id: String(id),
      name,
      orientation,
      width: width_in,
      height: height_in,
      width_in,
      height_in,
      width_cm,
      height_cm,
      unit: "in",
      dimensions,
      singlePageRatio,
      spreadRatio,
      is_available: szItem.is_available !== false,
      popular: fallbackIndex === 0 || szItem.popular === true,
    };
  }

  const strVal = String(szItem || "A4").trim();

  // 1. Check match in configSizes (product sizes)
  if (Array.isArray(configSizes) && configSizes.length > 0) {
    const matchedConfig = configSizes.find(
      (cs) =>
        cs &&
        (String(cs._id) === strVal ||
          String(cs.id) === strVal ||
          String(cs.name).trim().toLowerCase() === strVal.toLowerCase())
    );
    if (matchedConfig) {
      return buildSizeInfo(matchedConfig, fallbackIndex, configSizes);
    }
  }

  // 2. Check match against preset studio sizes
  const matchedPreset = PRESET_STUDIO_SIZES.find(
    (ps) =>
      ps.id.toLowerCase() === strVal.toLowerCase() ||
      ps.name.toLowerCase() === strVal.toLowerCase()
  );
  if (matchedPreset) {
    const width_in = matchedPreset.width_in || matchedPreset.width;
    const height_in = matchedPreset.height_in || matchedPreset.height;
    const singlePageRatio = matchedPreset.singlePageRatio || +(width_in / height_in).toFixed(4);
    const spreadRatio = matchedPreset.spreadRatio || +((width_in * 2) / height_in).toFixed(4);
    const width_cm = matchedPreset.width_cm || +(width_in * 2.54).toFixed(1);
    const height_cm = matchedPreset.height_cm || +(height_in * 2.54).toFixed(1);
    return {
      ...matchedPreset,
      id: matchedPreset.id,
      width_in,
      height_in,
      width_cm,
      height_cm,
      singlePageRatio,
      spreadRatio,
      dimensions: `${width_in} × ${height_in} in (${width_cm} × ${height_cm} cm)`,
      is_available: true,
      popular: matchedPreset.popular,
    };
  }

  // 3. Parse dimensional string: "8x8", "10x10", "12x12", "8.27x11.69", etc.
  const match = strVal.match(/([0-9.]+)\s*[xX*×]\s*([0-9.]+)/);
  if (match) {
    const width_in = parseFloat(match[1]);
    const height_in = parseFloat(match[2]);
    const width_cm = +(width_in * 2.54).toFixed(1);
    const height_cm = +(height_in * 2.54).toFixed(1);
    const orientation =
      Math.abs(width_in - height_in) < 0.2
        ? "SQUARE"
        : width_in > height_in
        ? "HORIZONTAL"
        : "VERTICAL";
    const singlePageRatio = +(width_in / height_in).toFixed(4);
    const spreadRatio = +((width_in * 2) / height_in).toFixed(4);
    return {
      id: strVal,
      name: `${width_in} × ${height_in}`,
      orientation,
      width: width_in,
      height: height_in,
      width_in,
      height_in,
      width_cm,
      height_cm,
      unit: "in",
      dimensions: `${width_in} × ${height_in} in (${width_cm} × ${height_cm} cm)`,
      singlePageRatio,
      spreadRatio,
      is_available: true,
      popular: fallbackIndex === 0,
    };
  }

  // 4. Fallback default matching A4 standard
  return {
    id: strVal,
    name: strVal,
    orientation: "VERTICAL",
    width: 8.27,
    height: 11.69,
    width_in: 8.27,
    height_in: 11.69,
    width_cm: 21.0,
    height_cm: 29.7,
    unit: "in",
    dimensions: `${strVal} (8.27 × 11.69 in)`,
    singlePageRatio: +(8.27 / 11.69).toFixed(4),
    spreadRatio: +((8.27 * 2) / 11.69).toFixed(4),
    is_available: true,
    popular: fallbackIndex === 0,
  };
};

/**
 * Master Resolver for Template Sizes
 * Replicates customer side templateSizes useMemo logic 1:1
 */
export const resolveTemplateSizes = ({ template, product, configSizes = [] }) => {
  const prodSizes = product?.photobook_config?.sizes || configSizes || [];

  // 1. If product has photobook_config sizes, return those!
  if (Array.isArray(prodSizes) && prodSizes.length > 0) {
    return prodSizes.map((cs, idx) => buildSizeInfo(cs, idx, prodSizes));
  }

  // 2. From template supported_sizes
  const rawTplSizes =
    Array.isArray(template?.supported_sizes) && template.supported_sizes.length > 0
      ? template.supported_sizes
      : Array.isArray(template?.published_snapshot?.supported_sizes) &&
        template.published_snapshot.supported_sizes.length > 0
      ? template.published_snapshot.supported_sizes
      : null;

  if (rawTplSizes && rawTplSizes.length > 0) {
    return rawTplSizes.map((sz, idx) => buildSizeInfo(sz, idx, prodSizes));
  }

  // 3. Fallback to PRESET_STUDIO_SIZES
  return PRESET_STUDIO_SIZES.map((ps, idx) => buildSizeInfo(ps, idx));
};

/**
 * Computes responsive canvas width & height for the admin editor
 * ensuring the single page aspect ratio and proportions match the actual paper size!
 */
export const getCanvasDimensionsForSize = (selectedSize, configSizes = []) => {
  let sizeInfo = null;
  if (
    selectedSize &&
    typeof selectedSize === "object" &&
    selectedSize.singlePageRatio !== undefined
  ) {
    sizeInfo = selectedSize;
  } else {
    sizeInfo = buildSizeInfo(selectedSize, 0, configSizes);
  }

  const ratio = Number(sizeInfo.singlePageRatio) || 1;

  let width = 1000;
  let height = 1000;

  if (ratio >= 1) {
    // Landscape or Square paper: width is reference 1000px
    width = 1000;
    height = Math.max(300, Math.round(1000 / ratio));
  } else {
    // Portrait paper: height is reference 1000px
    height = 1000;
    width = Math.max(300, Math.round(1000 * ratio));
  }

  return {
    width,
    height,
    label: sizeInfo.name,
    orientation: sizeInfo.orientation,
    dimensions: sizeInfo.dimensions,
    width_in: sizeInfo.width_in,
    height_in: sizeInfo.height_in,
    width_cm: sizeInfo.width_cm,
    height_cm: sizeInfo.height_cm,
    singlePageRatio: ratio,
    spreadRatio: sizeInfo.spreadRatio,
    sizeInfo,
  };
};

export const getCleanSizeName = (name) => {
  if (!name) return "";
  return String(name).replace(/\s*\([^)]*\).*/g, "").trim().toLowerCase();
};

/**
 * Normalizes size string or object to a canonical identifier key
 * (e.g. "8x8", "10x10", "12x12", "a4", "portrait", "landscape")
 */
export const normalizeSizeKey = (size) => {
  if (!size) return "default";
  if (typeof size === "object") {
    if (size.id) return String(size.id).trim().toLowerCase();
    if (size.name) return String(size.name).trim().toLowerCase();
  }
  return String(size).trim().toLowerCase();
};

/**
 * Resolves the independent size-specific pages array for a given template and size.
 * Returns { pages, isSizeSpecific, matchedSizeKey, sizeConfig }
 * 
 * Strict Isolation & Orientation Intelligence:
 * 1. Matches exact size ID, key, full name, or clean name (e.g. "Landscape", "Portrait").
 * 2. Matches exact dimensions (e.g. "8.5x5.5").
 * 3. Matches dedicated orientation design (e.g. Landscape book matches landscape/horizontal design,
 *    Portrait book matches portrait/vertical design).
 * 4. Fallback to root template pages ONLY if the root design has the matching orientation.
 *    Never bleeds Portrait elements onto Landscape or vice-versa!
 */
export const resolveTemplatePagesForSize = (template, size) => {
  if (!template) return { pages: [], isSizeSpecific: false, matchedSizeKey: null };

  const sizeObj =
    typeof size === "object" && size !== null
      ? size
      : buildSizeInfo(size);

  const targetId = String(sizeObj.id || sizeObj._id || "").trim().toLowerCase();
  const targetName = String(sizeObj.name || "").trim().toLowerCase();
  const targetCleanName = getCleanSizeName(sizeObj.name);
  const targetOrientation = String(sizeObj.orientation || "").trim().toLowerCase();

  const isLandscape =
    targetOrientation === "horizontal" ||
    targetOrientation === "landscape" ||
    targetCleanName === "landscape" ||
    targetName.includes("landscape") ||
    targetName.includes("horizontal") ||
    (Number(sizeObj.width_in) > Number(sizeObj.height_in)) ||
    (Number(sizeObj.singlePageRatio) > 1.05);

  const isPortrait =
    targetOrientation === "vertical" ||
    targetOrientation === "portrait" ||
    targetCleanName === "portrait" ||
    (targetName.includes("portrait") && !targetName.includes("landscape")) ||
    targetName.includes("vertical") ||
    (Number(sizeObj.width_in) < Number(sizeObj.height_in)) ||
    (Number(sizeObj.singlePageRatio) < 0.95);

  const isSquare =
    targetOrientation === "square" ||
    targetCleanName === "square" ||
    targetName.includes("square") ||
    (!isLandscape && !isPortrait);

  let targetDim = null;
  if (sizeObj.width_in && sizeObj.height_in) {
    targetDim = `${parseFloat(sizeObj.width_in)}x${parseFloat(sizeObj.height_in)}`;
  } else {
    const dMatch = String(sizeObj.dimensions || targetName).match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
    if (dMatch) {
      targetDim = `${parseFloat(dMatch[1])}x${parseFloat(dMatch[2])}`;
    }
  }

  const sizeDesigns =
    template.size_designs ||
    template.published_snapshot?.size_designs ||
    {};

  const entries = Object.entries(sizeDesigns);
  if (entries.length > 0) {
    // ── Tier 1: Exact Match on ID, Key, Full Name, or Clean Name ──
    for (const [key, design] of entries) {
      if (!design || !Array.isArray(design.pages) || design.pages.length === 0) continue;
      const keyLower = key.toLowerCase().trim();
      const designIdLower = String(design.size_id || "").toLowerCase().trim();
      const designNameLower = String(design.size_name || "").toLowerCase().trim();
      const designCleanName = getCleanSizeName(design.size_name);

      if (
        (targetId && (keyLower === targetId || designIdLower === targetId)) ||
        (targetName && (keyLower === targetName || designNameLower === targetName)) ||
        (targetCleanName && (keyLower === targetCleanName || designCleanName === targetCleanName)) ||
        (targetId && keyLower.replace(/\s+/g, "") === targetId.replace(/\s+/g, "")) ||
        (targetName && keyLower.replace(/\s+/g, "") === targetName.replace(/\s+/g, ""))
      ) {
        return {
          pages: design.pages,
          isSizeSpecific: true,
          matchedSizeKey: key,
          sizeConfig: design,
        };
      }
    }

    // ── Tier 2: Match on Dimensions (e.g. "8.5x5.5" vs "8.5x5.5") ──
    if (targetDim) {
      for (const [key, design] of entries) {
        if (!design || !Array.isArray(design.pages) || design.pages.length === 0) continue;
        const dimStr = [
          design.dimensions || "",
          design.size_name || "",
          key,
          design.page_width && design.page_height ? `${design.page_width}x${design.page_height}` : "",
        ].join(" ");
        const dMatch = dimStr.match(/(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
        if (dMatch && `${parseFloat(dMatch[1])}x${parseFloat(dMatch[2])}` === targetDim) {
          return {
            pages: design.pages,
            isSizeSpecific: true,
            matchedSizeKey: key,
            sizeConfig: design,
          };
        }
      }
    }

    // ── Tier 3: Match on Perspective / Orientation Design ──
    for (const [key, design] of entries) {
      if (!design || !Array.isArray(design.pages) || design.pages.length === 0) continue;
      const keyLower = key.toLowerCase().trim();
      const dOrient = String(design.orientation || "").toLowerCase().trim();
      const dName = String(design.size_name || "").toLowerCase().trim();
      const dClean = getCleanSizeName(design.size_name);

      if (isLandscape) {
        if (
          keyLower === "landscape" || keyLower === "horizontal" ||
          dOrient === "horizontal" || dOrient === "landscape" ||
          dClean === "landscape" || dClean === "horizontal" ||
          dName.includes("landscape") || dName.includes("horizontal") ||
          (design.page_width && design.page_height && Number(design.page_width) > Number(design.page_height))
        ) {
          return {
            pages: design.pages,
            isSizeSpecific: true,
            matchedSizeKey: key,
            sizeConfig: design,
          };
        }
      } else if (isPortrait) {
        if (
          keyLower === "portrait" || keyLower === "vertical" ||
          dOrient === "vertical" || dOrient === "portrait" ||
          dClean === "portrait" || dClean === "vertical" ||
          (dName.includes("portrait") && !dName.includes("landscape")) || dName.includes("vertical") ||
          (design.page_width && design.page_height && Number(design.page_height) > Number(design.page_width))
        ) {
          return {
            pages: design.pages,
            isSizeSpecific: true,
            matchedSizeKey: key,
            sizeConfig: design,
          };
        }
      } else if (isSquare) {
        if (
          keyLower === "square" || dOrient === "square" || dClean === "square" || dName.includes("square") ||
          (design.page_width && design.page_height && Number(design.page_width) === Number(design.page_height))
        ) {
          return {
            pages: design.pages,
            isSizeSpecific: true,
            matchedSizeKey: key,
            sizeConfig: design,
          };
        }
      }
    }
  }

  // ── Tier 4: Fallback to template root pages ONLY if orientation matches ──
  const rootPages =
    template.pages && template.pages.length > 0
      ? template.pages
      : template.published_snapshot?.pages || [];

  if (rootPages.length > 0) {
    const rootRatio = Number(template.page_config?.aspect_ratio) || 1;
    const rootOrient = String(template.page_config?.orientation || "").toLowerCase();
    const isRootLandscape = rootOrient === "horizontal" || rootOrient === "landscape" || rootRatio > 1.05;
    const isRootPortrait = rootOrient === "vertical" || rootOrient === "portrait" || rootRatio < 0.95;
    const isRootSquare = !isRootLandscape && !isRootPortrait;

    if (
      (isLandscape && isRootLandscape) ||
      (isPortrait && isRootPortrait) ||
      (isSquare && isRootSquare)
    ) {
      return {
        pages: rootPages,
        isSizeSpecific: true,
        matchedSizeKey: "root",
      };
    }
  }

  // Strictly return empty pages with isSizeSpecific: false so callers create a clean independent layout
  return {
    pages: [],
    isSizeSpecific: false,
    matchedSizeKey: null,
  };
};
