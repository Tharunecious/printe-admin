/**
 * SVG Clip Paths and Shapes for Photo Book Photo Frames
 * Normalized to [0, 1] x [0, 1] space for clipPathUnits="objectBoundingBox"
 */

export const FRAME_SHAPES = [
  { id: "rectangle", name: "Rectangle", icon: "square", isDefault: true },
  { id: "circle", name: "Circle / Oval", icon: "circle" },
  { id: "heart", name: "Heart", icon: "heart" },
  { id: "star", name: "Star", icon: "star" },
  { id: "hexagon", name: "Hexagon", icon: "hexagon" },
  { id: "arch", name: "Arched Window", icon: "arch" },
  { id: "scallop", name: "Scalloped Flower", icon: "flower" },
];

export const getShapeClipPathDefinition = (shape, cornerRadiusPercent = 0) => {
  switch (shape) {
    case "circle":
    case "round":
      return {
        type: "ellipse",
        attrs: { cx: "0.5", cy: "0.5", rx: "0.5", ry: "0.5" },
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

    case "hexagon":
      return {
        type: "polygon",
        attrs: {
          points: "0.5,0 1,0.25 1,0.75 0.5,1 0,0.75 0,0.25",
        },
      };

    case "arch":
      return {
        type: "path",
        attrs: {
          d: "M 0,1 L 0,0.45 C 0,0.2 0.22,0 0.5,0 C 0.78,0 1,0.2 1,0.45 L 1,1 Z",
        },
      };

    case "scallop":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,0.05 C 0.58,0 0.68,0.03 0.72,0.1 C 0.77,0.08 0.86,0.12 0.88,0.18 C 0.94,0.21 0.98,0.3 0.97,0.37 C 1.01,0.43 1,0.52 0.96,0.57 C 1,0.63 0.98,0.72 0.92,0.77 C 0.92,0.84 0.86,0.91 0.79,0.92 C 0.76,0.98 0.68,1 0.61,0.98 C 0.56,1.02 0.46,1.02 0.41,0.98 C 0.34,1 0.26,0.98 0.23,0.92 C 0.16,0.91 0.1,0.84 0.1,0.77 C 0.04,0.72 0.02,0.63 0.06,0.57 C 0.02,0.52 0.01,0.43 0.05,0.37 C 0.04,0.3 0.08,0.21 0.14,0.18 C 0.16,0.12 0.25,0.08 0.3,0.1 C 0.34,0.03 0.44,0 0.5,0.05 Z",
        },
      };

    case "rectangle":
    default:
      return {
        type: "rect",
        attrs: {
          x: "0",
          y: "0",
          width: "1",
          height: "1",
          rx: cornerRadiusPercent > 0 ? (cornerRadiusPercent / 100).toFixed(3) : "0",
          ry: cornerRadiusPercent > 0 ? (cornerRadiusPercent / 100).toFixed(3) : "0",
        },
      };
  }
};

/**
 * 0..100 Coordinate Space definitions for SVG viewBox="0 0 100 100"
 * Guarantees uniform SVG masking and stroke border across arbitrary shapes
 */
export const getShape100Definition = (shape, cornerRadiusPercent = 0) => {
  switch (shape) {
    case "circle":
    case "round":
      return {
        type: "ellipse",
        attrs: { cx: "50", cy: "50", rx: "50", ry: "50" },
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

    case "hexagon":
      return {
        type: "polygon",
        attrs: {
          points: "50,0 100,25 100,75 50,100 0,75 0,25",
        },
      };

    case "arch":
      return {
        type: "path",
        attrs: {
          d: "M 0,100 L 0,45 C 0,20 22,0 50,0 C 78,0 100,20 100,45 L 100,100 Z",
        },
      };

    case "scallop":
      return {
        type: "path",
        attrs: {
          d: "M 50,5 C 58,0 68,3 72,10 C 77,8 86,12 88,18 C 94,21 98,30 97,37 C 101,43 100,52 96,57 C 100,63 98,72 92,77 C 92,84 86,91 79,92 C 76,98 68,100 61,98 C 56,102 46,102 41,98 C 34,100 26,98 23,92 C 16,91 10,84 10,77 C 4,72 2,63 6,57 C 2,52 1,43 5,37 C 4,30 8,21 14,18 C 16,12 25,8 30,10 C 34,3 44,0 50,5 Z",
        },
      };

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


