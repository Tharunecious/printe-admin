/**
 * SVG Clip Paths and Shapes for Photo Book Photo Frames
 * Normalized to [0, 1] x [0, 1] space for clipPathUnits="objectBoundingBox"
 * and [0, 100] x [0, 100] space for SVG viewBox="0 0 100 100"
 */

export const FRAME_SHAPES = [
  // Basic & Clean
  { id: "rectangle", name: "Rectangle", category: "Basic", isDefault: true },
  { id: "rounded", name: "Rounded Rectangle", category: "Basic" },
  { id: "circle", name: "Circle", category: "Basic" },
  { id: "oval", name: "Oval / Ellipse", category: "Basic" },
  { id: "capsule", name: "Capsule / Pill", category: "Basic" },
  { id: "arch", name: "Arched Window", category: "Basic" },

  // Geometric Polygons
  { id: "diamond", name: "Diamond", category: "Geometric" },
  { id: "triangle", name: "Triangle", category: "Geometric" },
  { id: "pentagon", name: "Pentagon", category: "Geometric" },
  { id: "hexagon", name: "Hexagon", category: "Geometric" },
  { id: "octagon", name: "Octagon", category: "Geometric" },

  // Romantic & Organic
  { id: "heart", name: "Heart", category: "Romantic" },
  { id: "star", name: "5-Point Star", category: "Creative" },
  { id: "star8", name: "8-Point Star", category: "Creative" },
  { id: "clover", name: "4-Leaf Clover", category: "Decorative" },
  { id: "flower", name: "Blooming Flower", category: "Decorative" },
  { id: "scallop", name: "Scalloped Flower", category: "Decorative" },
  { id: "leaf", name: "Botanical Leaf", category: "Nature" },
  { id: "cloud", name: "Puffy Cloud", category: "Creative" },

  // Vintage, Badges & Tags
  { id: "shield", name: "Crest / Shield", category: "Badges" },
  { id: "badge", name: "Rosette Badge", category: "Badges" },
  { id: "stamp", name: "Postage Stamp", category: "Vintage" },
  { id: "ticket", name: "Vintage Ticket", category: "Vintage" },
  { id: "tag", name: "Gift Tag", category: "Vintage" },
];

export const IS_1TO1_SHAPE_LIST = [
  "circle",
  "round",
  "heart",
  "star",
  "star8",
  "flower",
  "clover",
  "scallop",
  "diamond",
  "hexagon",
  "pentagon",
  "octagon",
  "badge",
  "stamp",
];

export const is1to1Shape = (shape) =>
  IS_1TO1_SHAPE_LIST.includes(String(shape || "").toLowerCase());

/**
 * 0..1 Coordinate Space definitions for SVG clipPathUnits="objectBoundingBox"
 */
export const getShapeClipPathDefinition = (shape, cornerRadiusPercent = 0) => {
  const normShape = String(shape || "rectangle").toLowerCase().replace(/[^a-z0-9_-]/g, "");

  switch (normShape) {
    case "circle":
    case "round":
      return {
        type: "ellipse",
        attrs: { cx: "0.5", cy: "0.5", rx: "0.5", ry: "0.5" },
      };

    case "oval":
    case "ellipse":
      return {
        type: "ellipse",
        attrs: { cx: "0.5", cy: "0.5", rx: "0.5", ry: "0.38" },
      };

    case "capsule":
    case "pill":
      return {
        type: "rect",
        attrs: { x: "0", y: "0", width: "1", height: "1", rx: "0.5", ry: "0.5" },
      };

    case "diamond":
    case "rhombus":
      return {
        type: "polygon",
        attrs: { points: "0.5,0 1,0.5 0.5,1 0,0.5" },
      };

    case "triangle":
      return {
        type: "polygon",
        attrs: { points: "0.5,0 1,1 0,1" },
      };

    case "pentagon":
      return {
        type: "polygon",
        attrs: { points: "0.5,0 1,0.38 0.81,1 0.19,1 0,0.38" },
      };

    case "hexagon":
      return {
        type: "polygon",
        attrs: { points: "0.5,0 1,0.25 1,0.75 0.5,1 0,0.75 0,0.25" },
      };

    case "octagon":
      return {
        type: "polygon",
        attrs: {
          points: "0.29,0 0.71,0 1,0.29 1,0.71 0.71,1 0.29,1 0,0.71 0,0.29",
        },
      };

    case "heart":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,1 C 0.08,0.66 0,0.43 0,0.28 C 0,0.11 0.12,0 0.27,0 C 0.38,0 0.46,0.07 0.5,0.18 C 0.54,0.07 0.62,0 0.73,0 C 0.88,0 1,0.11 1,0.28 C 1,0.43 0.92,0.66 0.5,1 Z",
        },
      };

    case "star":
      return {
        type: "polygon",
        attrs: {
          points:
            "0.5,0 0.63,0.36 1,0.38 0.72,0.63 0.81,1 0.5,0.79 0.19,1 0.28,0.63 0,0.38 0.37,0.36",
        },
      };

    case "star8":
    case "sparkle":
      return {
        type: "polygon",
        attrs: {
          points:
            "0.5,0 0.62,0.32 0.85,0.15 0.68,0.38 1,0.5 0.68,0.62 0.85,0.85 0.62,0.68 0.5,1 0.38,0.68 0.15,0.85 0.32,0.62 0,0.5 0.32,0.38 0.15,0.15 0.38,0.32",
        },
      };

    case "arch":
      return {
        type: "path",
        attrs: {
          d: "M 0,1 L 0,0.45 C 0,0.2 0.22,0 0.5,0 C 0.78,0 1,0.2 1,0.45 L 1,1 Z",
        },
      };

    case "shield":
      return {
        type: "path",
        attrs: {
          d: "M 0,0 L 1,0 L 1,0.55 C 1,0.82 0.5,1 0.5,1 C 0.5,1 0,0.82 0,0.55 Z",
        },
      };

    case "clover":
    case "quatrefoil":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,0.15 C 0.38,0 0.12,0 0.12,0.25 C 0.12,0.38 0,0.38 0,0.5 C 0,0.62 0.12,0.62 0.12,0.75 C 0.12,1 0.38,1 0.5,0.85 C 0.62,1 0.88,1 0.88,0.75 C 0.88,0.62 1,0.62 1,0.5 C 1,0.38 0.88,0.38 0.88,0.25 C 0.88,0 0.62,0 0.5,0.15 Z",
        },
      };

    case "scallop":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,0.05 C 0.58,0 0.68,0.03 0.72,0.1 C 0.77,0.08 0.86,0.12 0.88,0.18 C 0.94,0.21 0.98,0.3 0.97,0.37 C 1.01,0.43 1,0.52 0.96,0.57 C 1,0.63 0.98,0.72 0.92,0.77 C 0.92,0.84 0.86,0.91 0.79,0.92 C 0.76,0.98 0.68,1 0.61,0.98 C 0.56,1.02 0.46,1.02 0.41,0.98 C 0.34,1 0.26,0.98 0.23,0.92 C 0.16,0.91 0.1,0.84 0.1,0.77 C 0.04,0.72 0.02,0.63 0.06,0.57 C 0.02,0.52 0.01,0.43 0.05,0.37 C 0.04,0.3 0.08,0.21 0.14,0.18 C 0.16,0.12 0.25,0.08 0.3,0.1 C 0.34,0.03 0.44,0 0.5,0.05 Z",
        },
      };

    case "flower":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,0.2 C 0.55,0.05 0.65,0.05 0.7,0.2 C 0.85,0.15 0.95,0.25 0.9,0.4 C 1.05,0.45 1.05,0.55 0.9,0.6 C 0.95,0.75 0.85,0.85 0.7,0.8 C 0.65,0.95 0.55,0.95 0.5,0.8 C 0.35,0.85 0.25,0.75 0.3,0.6 C 0.15,0.55 0.15,0.45 0.3,0.4 C 0.25,0.25 0.35,0.15 0.5,0.2 Z",
        },
      };

    case "leaf":
      return {
        type: "path",
        attrs: {
          d: "M 0.05,0.05 C 0.45,0.05 0.95,0.45 0.95,0.95 C 0.55,0.95 0.05,0.55 0.05,0.05 Z",
        },
      };

    case "cloud":
      return {
        type: "path",
        attrs: {
          d: "M 0.2,0.85 C 0.08,0.85 0,0.74 0,0.61 C 0,0.49 0.07,0.39 0.18,0.36 C 0.2,0.17 0.35,0.05 0.52,0.05 C 0.68,0.05 0.81,0.16 0.85,0.31 C 0.94,0.33 1,0.42 1,0.53 C 1,0.65 0.92,0.75 0.81,0.77 C 0.8,0.83 0.74,0.85 0.68,0.85 Z",
        },
      };

    case "ticket":
      return {
        type: "path",
        attrs: {
          d: "M 0,0.15 C 0.1,0.15 0.15,0.1 0.15,0 L 0.85,0 C 0.85,0.1 0.9,0.15 1,0.15 L 1,0.85 C 0.9,0.85 0.85,0.9 0.85,1 L 0.15,1 C 0.15,0.9 0.1,0.85 0,0.85 Z",
        },
      };

    case "stamp":
      return {
        type: "path",
        attrs: {
          d: "M 0.06,0.06 Q 0.16,-0.02 0.26,0.06 Q 0.38,-0.02 0.50,0.06 Q 0.62,-0.02 0.74,0.06 Q 0.84,-0.02 0.94,0.06 Q 1.02,0.16 0.94,0.26 Q 1.02,0.38 0.94,0.50 Q 1.02,0.62 0.94,0.74 Q 1.02,0.84 0.94,0.94 Q 0.84,1.02 0.74,0.94 Q 0.62,1.02 0.50,0.94 Q 0.38,1.02 0.26,0.94 Q 0.16,1.02 0.06,0.94 Q -0.02,0.84 0.06,0.74 Q -0.02,0.62 0.06,0.50 Q -0.02,0.38 0.06,0.26 Q -0.02,0.16 0.06,0.06 Z",
        },
      };

    case "tag":
      return {
        type: "polygon",
        attrs: { points: "0.25,0 0.75,0 1,0.25 1,1 0,1 0,0.25" },
      };

    case "badge":
      return {
        type: "polygon",
        attrs: {
          points:
            "0.5,0 0.61,0.08 0.75,0.07 0.82,0.18 0.93,0.25 0.93,0.39 1,0.5 0.93,0.61 0.93,0.75 0.82,0.82 0.75,0.93 0.61,0.93 0.5,1 0.39,0.93 0.25,0.93 0.18,0.82 0.07,0.75 0.07,0.61 0,0.5 0.07,0.39 0.07,0.25 0.18,0.18 0.25,0.07 0.39,0.08",
        },
      };

    case "rounded":
    case "rounded_rectangle": {
      const rxVal = cornerRadiusPercent > 0 ? (Number(cornerRadiusPercent) / 100).toFixed(3) : "0.18";
      return {
        type: "rect",
        attrs: {
          x: "0",
          y: "0",
          width: "1",
          height: "1",
          rx: rxVal,
          ry: rxVal,
        },
      };
    }

    case "rectangle":
    default: {
      const rx = cornerRadiusPercent > 0 ? (Number(cornerRadiusPercent) / 100).toFixed(3) : "0";
      return {
        type: "rect",
        attrs: {
          x: "0",
          y: "0",
          width: "1",
          height: "1",
          rx,
          ry: rx,
        },
      };
    }
  }
};

/**
 * 0..100 Coordinate Space definitions for SVG viewBox="0 0 100 100"
 * Guarantees uniform SVG masking and stroke border across arbitrary shapes
 */
export const getShape100Definition = (shape, cornerRadiusPercent = 0) => {
  const normShape = String(shape || "rectangle").toLowerCase().replace(/[^a-z0-9_-]/g, "");

  switch (normShape) {
    case "circle":
    case "round":
      return {
        type: "ellipse",
        attrs: { cx: "50", cy: "50", rx: "50", ry: "50" },
      };

    case "oval":
    case "ellipse":
      return {
        type: "ellipse",
        attrs: { cx: "50", cy: "50", rx: "50", ry: "38" },
      };

    case "capsule":
    case "pill":
      return {
        type: "rect",
        attrs: { x: "0", y: "0", width: "100", height: "100", rx: "50", ry: "50" },
      };

    case "diamond":
    case "rhombus":
      return {
        type: "polygon",
        attrs: { points: "50,0 100,50 50,100 0,50" },
      };

    case "triangle":
      return {
        type: "polygon",
        attrs: { points: "50,0 100,100 0,100" },
      };

    case "pentagon":
      return {
        type: "polygon",
        attrs: { points: "50,0 100,38 81,100 19,100 0,38" },
      };

    case "hexagon":
      return {
        type: "polygon",
        attrs: { points: "50,0 100,25 100,75 50,100 0,75 0,25" },
      };

    case "octagon":
      return {
        type: "polygon",
        attrs: {
          points: "29,0 71,0 100,29 100,71 71,100 29,100 0,71 0,29",
        },
      };

    case "heart":
      return {
        type: "path",
        attrs: {
          d: "M 50,100 C 8,66 0,43 0,28 C 0,11 12,0 27,0 C 38,0 46,7 50,18 C 54,7 62,0 73,0 C 88,0 100,11 100,28 C 100,43 92,66 50,100 Z",
        },
      };

    case "star":
      return {
        type: "polygon",
        attrs: {
          points: "50,0 63,36 100,38 72,63 81,100 50,79 19,100 28,63 0,38 37,36",
        },
      };

    case "star8":
    case "sparkle":
      return {
        type: "polygon",
        attrs: {
          points:
            "50,0 62,32 85,15 68,38 100,50 68,62 85,85 62,68 50,100 38,68 15,85 32,62 0,50 32,38 15,15 38,32",
        },
      };

    case "arch":
      return {
        type: "path",
        attrs: {
          d: "M 0,100 L 0,45 C 0,20 22,0 50,0 C 78,0 100,20 100,45 L 100,100 Z",
        },
      };

    case "shield":
      return {
        type: "path",
        attrs: {
          d: "M 0,0 L 100,0 L 100,55 C 100,82 50,100 50,100 C 50,100 0,82 0,55 Z",
        },
      };

    case "clover":
    case "quatrefoil":
      return {
        type: "path",
        attrs: {
          d: "M 50,15 C 38,0 12,0 12,25 C 12,38 0,38 0,50 C 0,62 12,62 12,75 C 12,100 38,100 50,85 C 62,100 88,100 88,75 C 88,62 100,62 100,50 C 100,38 88,38 88,25 C 88,0 62,0 50,15 Z",
        },
      };

    case "scallop":
      return {
        type: "path",
        attrs: {
          d: "M 50,5 C 58,0 68,3 72,10 C 77,8 86,12 88,18 C 94,21 98,30 97,37 C 101,43 100,52 96,57 C 100,63 98,72 92,77 C 92,84 86,91 79,92 C 76,98 68,100 61,98 C 56,102 46,102 41,98 C 34,100 26,98 23,92 C 16,91 10,84 10,77 C 4,72 2,63 6,57 C 2,52 1,43 5,37 C 4,30 8,21 14,18 C 16,12 25,8 30,10 C 34,3 44,0 50,5 Z",
        },
      };

    case "flower":
      return {
        type: "path",
        attrs: {
          d: "M 50,20 C 55,5 65,5 70,20 C 85,15 95,25 90,40 C 105,45 105,55 90,60 C 95,75 85,85 70,80 C 65,95 55,95 50,80 C 35,85 25,75 30,60 C 15,55 15,45 30,40 C 25,25 35,15 50,20 Z",
        },
      };

    case "leaf":
      return {
        type: "path",
        attrs: {
          d: "M 5,5 C 45,5 95,45 95,95 C 55,95 5,55 5,5 Z",
        },
      };

    case "cloud":
      return {
        type: "path",
        attrs: {
          d: "M 20,85 C 8,85 0,74 0,61 C 0,49 7,39 18,36 C 20,17 35,5 52,5 C 68,5 81,16 85,31 C 94,33 100,42 100,53 C 100,65 92,75 81,77 C 80,83 74,85 68,85 Z",
        },
      };

    case "ticket":
      return {
        type: "path",
        attrs: {
          d: "M 0,15 C 10,15 15,10 15,0 L 85,0 C 85,10 90,15 100,15 L 100,85 C 90,85 85,90 85,100 L 15,100 C 15,90 10,85 0,85 Z",
        },
      };

    case "stamp":
      return {
        type: "path",
        attrs: {
          d: "M 6,6 Q 16,-2 26,6 Q 38,-2 50,6 Q 62,-2 74,6 Q 84,-2 94,6 Q 102,16 94,26 Q 102,38 94,50 Q 102,62 94,74 Q 102,84 94,94 Q 84,102 74,94 Q 62,102 50,94 Q 38,102 26,94 Q 16,102 6,94 Q -2,84 6,74 Q -2,62 6,50 Q -2,38 6,26 Q -2,16 6,6 Z",
        },
      };

    case "tag":
      return {
        type: "polygon",
        attrs: { points: "25,0 75,0 100,25 100,100 0,100 0,25" },
      };

    case "badge":
      return {
        type: "polygon",
        attrs: {
          points:
            "50,0 61,8 75,7 82,18 93,25 93,39 100,50 93,61 93,75 82,82 75,93 61,93 50,100 39,93 25,93 18,82 7,75 7,61 0,50 7,39 7,25 18,18 25,7 39,8",
        },
      };

    case "rounded":
    case "rounded_rectangle": {
      const rx = cornerRadiusPercent > 0 ? cornerRadiusPercent : 18;
      return {
        type: "rect",
        attrs: {
          x: "0",
          y: "0",
          width: "100",
          height: "100",
          rx,
          ry: rx,
        },
      };
    }

    case "rectangle":
    default:
      return {
        type: "rect",
        attrs: {
          x: "0",
          y: "0",
          width: "100",
          height: "100",
          rx: cornerRadiusPercent > 0 ? cornerRadiusPercent : 0,
          ry: cornerRadiusPercent > 0 ? cornerRadiusPercent : 0,
        },
      };
  }
};
