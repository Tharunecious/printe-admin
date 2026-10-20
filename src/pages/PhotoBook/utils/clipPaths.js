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
      return {
        type: "ellipse",
        attrs: { cx: "0.5", cy: "0.5", rx: "0.5", ry: "0.5" },
      };

    case "heart":
      return {
        type: "path",
        attrs: {
          d: "M 0.5,0.88 C 0.08,0.58 0,0.38 0,0.25 C 0,0.1 0.12,0 0.27,0 C 0.38,0 0.46,0.06 0.5,0.16 C 0.54,0.06 0.62,0 0.73,0 C 0.88,0 1,0.1 1,0.25 C 1,0.38 0.92,0.58 0.5,0.88 Z",
        },
      };

    case "star":
      return {
        type: "polygon",
        attrs: {
          points:
            "0.5,0.02 0.63,0.36 0.98,0.38 0.71,0.61 0.79,0.96 0.5,0.77 0.21,0.96 0.29,0.61 0.02,0.38 0.37,0.36",
        },
      };

    case "hexagon":
      return {
        type: "polygon",
        attrs: {
          points: "0.5,0.02 0.95,0.26 0.95,0.74 0.5,0.98 0.05,0.74 0.05,0.26",
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
