/**
 * Deterministic Page Targeting Precedence Engine for Photo Books
 * Precedence for interior pages:
 *   1. Exact page-specific rule (e.g., rule_type === "exact_page" && page_number === N)
 *   2. Odd/even interior rule (e.g., rule_type === "odd_interior" / "even_interior")
 *   3. All-interior-pages rule (e.g., rule_type === "all_interior")
 *   4. General all-pages default (e.g., rule_type === "all_pages")
 *   5. Fallback design
 *
 * Front and Back covers are resolved strictly and separately from interior pages.
 */

export const resolveCoverPages = (pages = []) => {
  const frontCover = pages.find((p) => p.page_type === "front_cover") || null;
  const backCover = pages.find((p) => p.page_type === "back_cover") || null;
  return { frontCover, backCover };
};

export const resolveInteriorPage = (interiorPageNumber, pages = []) => {
  const isOdd = interiorPageNumber % 2 !== 0;

  // Filter candidate designs
  const interiorPages = pages.filter((p) => p.page_type === "interior");

  // Priority 1: Exact page-specific rule
  const exactCandidates = interiorPages.filter(
    (p) =>
      p.targeting_rule?.rule_type === "exact_page" &&
      Number(p.targeting_rule?.page_number) === Number(interiorPageNumber)
  );
  if (exactCandidates.length > 0) {
    return {
      resolvedPage: exactCandidates[0],
      priority: 1,
      ruleType: "exact_page",
      hasConflict: exactCandidates.length > 1,
      candidates: exactCandidates,
    };
  }

  // Priority 2: Odd/Even interior rule
  const oddEvenCandidates = interiorPages.filter(
    (p) =>
      (isOdd && p.targeting_rule?.rule_type === "odd_interior") ||
      (!isOdd && p.targeting_rule?.rule_type === "even_interior")
  );
  if (oddEvenCandidates.length > 0) {
    return {
      resolvedPage: oddEvenCandidates[0],
      priority: 2,
      ruleType: isOdd ? "odd_interior" : "even_interior",
      hasConflict: oddEvenCandidates.length > 1,
      candidates: oddEvenCandidates,
    };
  }

  // Priority 3: All-interior-pages rule
  const allInteriorCandidates = interiorPages.filter(
    (p) => p.targeting_rule?.rule_type === "all_interior"
  );
  if (allInteriorCandidates.length > 0) {
    return {
      resolvedPage: allInteriorCandidates[0],
      priority: 3,
      ruleType: "all_interior",
      hasConflict: allInteriorCandidates.length > 1,
      candidates: allInteriorCandidates,
    };
  }

  // Priority 4: General all-pages default
  const allPagesCandidates = pages.filter(
    (p) => p.targeting_rule?.rule_type === "all_pages"
  );
  if (allPagesCandidates.length > 0) {
    return {
      resolvedPage: allPagesCandidates[0],
      priority: 4,
      ruleType: "all_pages",
      hasConflict: allPagesCandidates.length > 1,
      candidates: allPagesCandidates,
    };
  }

  // Priority 5: Fallback to first available interior page or blank design
  const fallback = interiorPages[0] || {
    page_id: `fallback_${interiorPageNumber}`,
    name: `Interior Page ${interiorPageNumber} (Default)`,
    page_type: "interior",
    background: { type: "color", value: "#ffffff", opacity: 1 },
    elements: [],
  };

  return {
    resolvedPage: fallback,
    priority: 5,
    ruleType: "fallback",
    hasConflict: false,
    candidates: [fallback],
  };
};

/**
 * Resolves the entire book sequence (front cover, N interior pages, back cover)
 */
export const resolveCompleteBook = (template, totalInteriorPages = 20) => {
  const pages = template?.pages || [];
  const { frontCover, backCover } = resolveCoverPages(pages);

  const bookPages = [];

  // 1. Front Cover
  if (frontCover) {
    bookPages.push({
      type: "cover",
      coverType: "front_cover",
      label: "Front Cover",
      displayPageNumber: "Cover",
      page: frontCover,
      resolution: { priority: 0, ruleType: "front_cover" },
    });
  }

  // 2. Interior Pages (1 to totalInteriorPages)
  for (let i = 1; i <= totalInteriorPages; i++) {
    const resolution = resolveInteriorPage(i, pages);
    bookPages.push({
      type: "interior",
      interiorNumber: i,
      displayPageNumber: `Page ${i}`,
      label: `Page ${i} (${resolution.ruleType.replace("_", " ")})`,
      page: resolution.resolvedPage,
      resolution,
    });
  }

  // 3. Back Cover
  if (backCover) {
    bookPages.push({
      type: "cover",
      coverType: "back_cover",
      label: "Back Cover",
      displayPageNumber: "Back",
      page: backCover,
      resolution: { priority: 0, ruleType: "back_cover" },
    });
  }

  return bookPages;
};

/**
 * Detects rule conflicts at the same priority level
 */
export const detectTargetingConflicts = (pages = []) => {
  const conflicts = [];
  const interiorPages = pages.filter((p) => p.page_type === "interior");

  // Check exact page collisions
  const exactMap = {};
  interiorPages.forEach((p) => {
    if (p.targeting_rule?.rule_type === "exact_page") {
      const num = p.targeting_rule.page_number;
      if (!exactMap[num]) exactMap[num] = [];
      exactMap[num].push(p);
    }
  });

  Object.entries(exactMap).forEach(([pageNo, list]) => {
    if (list.length > 1) {
      conflicts.push({
        severity: "error",
        priority: 1,
        message: `Multiple interior pages (${list.map((item) => `"${item.name}"`).join(", ")}) are targeting exact page ${pageNo}.`,
        pages: list,
      });
    }
  });

  // Check duplicate odd/even interior rules
  const oddList = interiorPages.filter((p) => p.targeting_rule?.rule_type === "odd_interior");
  if (oddList.length > 1) {
    conflicts.push({
      severity: "warning",
      priority: 2,
      message: `Multiple templates defined for Odd Pages (${oddList.map((item) => `"${item.name}"`).join(", ")}). The first one will be used.`,
      pages: oddList,
    });
  }

  const evenList = interiorPages.filter((p) => p.targeting_rule?.rule_type === "even_interior");
  if (evenList.length > 1) {
    conflicts.push({
      severity: "warning",
      priority: 2,
      message: `Multiple templates defined for Even Pages (${evenList.map((item) => `"${item.name}"`).join(", ")}). The first one will be used.`,
      pages: evenList,
    });
  }

  return conflicts;
};
