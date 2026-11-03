import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPhotoBookTemplateById,
  updatePhotoBookTemplate,
  publishPhotoBookTemplate,
  validatePhotoBookTemplate,
  getPhotoBookLayouts,
  createPhotoBookLayout,
  getEligiblePhotoBookProducts,
  getAvailableProductTemplates,
} from "../../../api";
import {
  Button,
  Tag,
  Select,
  Spin,
  message,
  Dropdown,
  Modal,
  Tooltip,
  Alert,
  Popconfirm,
  Divider,
} from "antd";
import {
  MdArrowBack,
  MdSave,
  MdPublish,
  MdUndo,
  MdRedo,
  MdZoomIn,
  MdZoomOut,
  MdLayers,
  MdCheckCircle,
  MdOutlineAutoStories,
  MdFormatSize,
  MdVisibility,
  MdCloudUpload,
  MdEdit,
  MdCrop,
  MdFlip,
  MdMoreHoriz,
  MdFormatAlignCenter,
  MdFitScreen,
  MdDesktopWindows,
  MdContentCopy,
  MdDeleteOutline,
  MdLockOutline,
  MdLockOpen,
} from "react-icons/md";
import { FiRotateCw } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import LeftPanel from "./LeftSidebar/LeftPanel";
import Canvas from "./Canvas";
import PropertiesPanel from "./RightProperties/PropertiesPanel";
import PageFilmstrip from "./PageNavigation/PageFilmstrip";
import BookPreviewModal from "../BookPreviewModal";
import ValidationDrawer from "../ValidationDrawer";
import BookSizeModal from "./BookSizeModal";
import {
  buildSizeInfo,
  resolveTemplateSizes,
  PRESET_STUDIO_SIZES,
  getCanvasDimensionsForSize,
} from "../utils/sizeUtils";
import { calculateDynamicTextDimensions, normalizeElementToPaperCoords, getElementCoords } from "../utils/textUtils";

const parseSizeToAspectRatio = (sizeStr) => {
  if (!sizeStr) return "1:1";
  const str = String(sizeStr).trim().toLowerCase();
  if (str === "a4") return "707:1000";
  const parts = str.split(/[xX*×]/).map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] > 0) {
    const [w, h] = parts;
    if (w === h) return "1:1";
    if (Math.abs(w / h - 4 / 3) < 0.05) return "4:3";
    if (Math.abs(w / h - 3 / 4) < 0.05) return "3:4";
    if (Math.abs(w / h - 8.5 / 11) < 0.05) return "8.5:11";
    if (Math.abs(w / h - 11 / 8.5) < 0.05) return "11:8.5";
    return `${w}:${h}`;
  }
  return "1:1";
};

export const getDimensionsForSize = (sizeStr, aspectRatio = "1:1") => {
  const sz = (sizeStr || "").toLowerCase().trim();
  if (sz === "8x8") return { width: 900, height: 900 };
  if (sz === "10x10") return { width: 1000, height: 1000 };
  if (sz === "12x12") return { width: 1100, height: 1100 };
  if (sz === "6x6") return { width: 800, height: 800 };
  if (sz === "8.5x11") return { width: 772, height: 1000 };
  if (sz === "11x8.5") return { width: 1000, height: 772 };
  if (sz === "a4") return { width: 707, height: 1000 };
  if (sz === "6x8") return { width: 750, height: 1000 };
  if (sz === "8x6") return { width: 1000, height: 750 };

  switch (aspectRatio) {
    case "4:3":
      return { width: 1000, height: 750 };
    case "3:4":
      return { width: 750, height: 1000 };
    case "16:9":
      return { width: 1000, height: 562.5 };
    case "8.5:11":
      return { width: 772, height: 1000 };
    case "11:8.5":
      return { width: 1000, height: 772 };
    case "1:1":
    default:
      return { width: 1000, height: 1000 };
  }
};

export const normalizeTemplateForSave = (templateData) => {
  if (!templateData || !Array.isArray(templateData.pages)) return templateData;

  const currentSize = templateData.page_config?.selected_size || "8x8";
  const aspectRatio = templateData.page_config?.aspect_ratio || "1:1";
  const { width: refWidth, height: refHeight } = getDimensionsForSize(currentSize, aspectRatio);

  const normalizedPages = templateData.pages.map((p) => {
    const elements = (p.elements || []).map((el) => {
      const norm = normalizeElementToPaperCoords(el);
      return {
        ...norm,
        x: Math.round((norm.x_pct / 100) * refWidth),
        y: Math.round((norm.y_pct / 100) * refHeight),
        width: Math.round((norm.width_pct / 100) * refWidth),
        height: Math.round((norm.height_pct / 100) * refHeight),
      };
    });

    const bg = p.background || {};
    const normalizedBackground = {
      ...bg,
      type: bg.type || "color",
      value: bg.value || "#ffffff",
      opacity: bg.opacity !== undefined ? bg.opacity : 1,
      position_x: bg.position_x !== undefined ? Number(bg.position_x) : 50,
      position_y: bg.position_y !== undefined ? Number(bg.position_y) : 50,
      scale: bg.scale !== undefined ? Number(bg.scale) : 1,
      fit_mode: bg.fit_mode || "cover",
    };

    return {
      ...p,
      page_width: refWidth,
      page_height: refHeight,
      background: normalizedBackground,
      elements,
    };
  });

  return {
    ...templateData,
    page_config: {
      ...(templateData.page_config || {}),
      selected_size: currentSize,
      aspect_ratio: aspectRatio,
      page_width: refWidth,
      page_height: refHeight,
    },
    pages: normalizedPages,
  };
};

const PhotoBookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [template, setTemplate] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(0.65);
  const [panelTab, setPanelTab] = useState("page");
  const [layouts, setLayouts] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  useEffect(() => {
    if (template?.template_name) {
      setTitleValue(template.template_name);
    }
  }, [template?.template_name]);

  // Modals & Drawers
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  // Template Configuration Switching Modal State
  const [changeTemplateModalOpen, setChangeTemplateModalOpen] = useState(false);
  const [availableProductTemplates, setAvailableProductTemplates] = useState([]);
  const [loadingProductTemplates, setLoadingProductTemplates] = useState(false);

  const fetchAvailableProductTemplates = async () => {
    try {
      setLoadingProductTemplates(true);
      const res = await getAvailableProductTemplates();
      setAvailableProductTemplates(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching available product templates:", err);
    } finally {
      setLoadingProductTemplates(false);
    }
  };

  useEffect(() => {
    if (changeTemplateModalOpen) {
      fetchAvailableProductTemplates();
    }
  }, [changeTemplateModalOpen]);

  const handleChangeTemplate = async (selectedTpl) => {
    try {
      if (selectedTpl.has_design && String(selectedTpl.design_id) !== String(id)) {
        message.warning("Another visual design is already assigned to this template configuration.");
        return;
      }

      setSaving(true);
      const updatedTemplate = {
        ...template,
        product_id: selectedTpl.product_id,
        product_template_id: selectedTpl.product_template_id || selectedTpl.slug,
        template_name: selectedTpl.template_name || template.template_name,
        category: selectedTpl.category || template.category,
        badge: selectedTpl.badge || template.badge,
        description: selectedTpl.description || template.description,
        cover_image_url: selectedTpl.cover_image_url || template.cover_image_url,
        thumbnail_url: selectedTpl.thumbnail_url || template.thumbnail_url,
      };

      const normalized = normalizeTemplateForSave(updatedTemplate);
      await updatePhotoBookTemplate(id, normalized);
      setTemplate(normalized);
      setChangeTemplateModalOpen(false);
      message.success(`Linked to "${selectedTpl.template_name}". All visual elements preserved.`);
      fetchTemplate();
    } catch (err) {
      console.error("Failed to change template configuration:", err);
      message.error(err.response?.data?.message || "Failed to change template configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleUnselectTemplate = async () => {
    try {
      setSaving(true);
      const updatedTemplate = {
        ...template,
        product_id: null,
        product_template_id: "",
      };
      await updatePhotoBookTemplate(id, updatedTemplate);
      setTemplate(updatedTemplate);
      setChangeTemplateModalOpen(false);
      message.warning("Template configuration unselected. Visual designer is disabled until a configuration is linked.");
      fetchTemplate();
    } catch (err) {
      console.error("Failed to unselect template:", err);
      message.error("Failed to unselect template configuration");
    } finally {
      setSaving(false);
    }
  };

  // Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryAction = useRef(false);

  // Linked Product Data (for photobook_config.sizes, identical to customer side)
  const [productData, setProductData] = useState(null);

  // ── Template Sizes: Resolved using the EXACT same logic as customer side PhotoBookEditorPage.jsx ──
  const templateSizes = useMemo(() => {
    return resolveTemplateSizes({
      template,
      product: productData,
      configSizes: productData?.photobook_config?.sizes || [],
    });
  }, [template, productData]);

  const currentSize = useMemo(() => {
    if (template?.page_config?.selected_size) {
      const matched = templateSizes.find(
        (s) =>
          String(s.id).toLowerCase() === String(template.page_config.selected_size).toLowerCase() ||
          String(s.name).toLowerCase() === String(template.page_config.selected_size).toLowerCase()
      );
      if (matched) return matched.id;
    }
    return templateSizes[0]?.id || "A4";
  }, [template?.page_config?.selected_size, templateSizes]);

  const currentSizeInfo = useMemo(() => {
    const tplMatch = templateSizes.find(
      (s) =>
        String(s.id).toLowerCase() === String(currentSize).toLowerCase() ||
        String(s.name).toLowerCase() === String(currentSize).toLowerCase()
    );
    return tplMatch || buildSizeInfo(currentSize, 0, productData?.photobook_config?.sizes || []);
  }, [currentSize, templateSizes, productData]);

  const handleSizeChange = (val) => {
    const sizeObj =
      templateSizes.find(
        (s) =>
          String(s.id).toLowerCase() === String(val).toLowerCase() ||
          String(s.name).toLowerCase() === String(val).toLowerCase()
      ) || buildSizeInfo(val, 0, productData?.photobook_config?.sizes || []);

    setTemplate((prev) => ({
      ...prev,
      page_config: {
        ...prev.page_config,
        selected_size: sizeObj.id,
        aspect_ratio: `${sizeObj.singlePageRatio}`,
        page_width: sizeObj.width,
        page_height: sizeObj.height,
        width_in: sizeObj.width_in,
        height_in: sizeObj.height_in,
        width_cm: sizeObj.width_cm,
        height_cm: sizeObj.height_cm,
        orientation: sizeObj.orientation,
        dimensions: sizeObj.dimensions,
      },
    }));
  };

  // Fetch Template Data and associated Product Data
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await getPhotoBookTemplateById(id);
      const rawData = res.data?.data;
      if (rawData) {
        const data = normalizeTemplateForSave(rawData);
        setTemplate(data);
        setHistory([JSON.parse(JSON.stringify(data.pages || []))]);
        setHistoryIndex(0);

        // Fetch eligible products to extract photobook_config.sizes (identical to customer side)
        try {
          const prodRes = await getEligiblePhotoBookProducts();
          const allProds = prodRes.data?.data || [];
          const matchedProd =
            allProds.find((p) => {
              if (data.eligible_product_ids?.some((ep) => String(ep._id || ep) === String(p._id))) {
                return true;
              }
              const templates = p.photobook_config?.templates || [];
              return templates.some(
                (t) =>
                  String(t.template_name || "").toLowerCase() === String(data.template_name || "").toLowerCase() ||
                  String(t.template_id || "") === String(data.template_id || "") ||
                  String(t._id || "") === String(data._id || "")
              );
            }) ||
            allProds.find((p) => Array.isArray(p.photobook_config?.sizes) && p.photobook_config.sizes.length > 0) ||
            null;

          if (matchedProd) {
            setProductData(matchedProd);
          }
        } catch (e) {
          console.warn("Could not fetch eligible products:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      message.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Layouts
  const fetchLayouts = async () => {
    try {
      const res = await getPhotoBookLayouts();
      setLayouts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching layouts:", err);
    }
  };

  useEffect(() => {
    fetchTemplate();
    fetchLayouts();
  }, [id]);

  // Ensure Google Fonts Suite is actively injected for seamless typography preview & canvas parity
  useEffect(() => {
    const fontLinkId = "photobook-template-fonts";
    let link = document.getElementById(fontLinkId);
    if (!link) {
      link = document.createElement("link");
      link.id = fontLinkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Dancing+Script:wght@400..700&family=Great+Vibes&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Jost:ital,wght@0,100..900;1,100..900&family=Merriweather:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap";
  }, []);

  // Push State to History
  const pushHistory = (newPages) => {
    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }
    const cloned = JSON.parse(JSON.stringify(newPages));
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(cloned);
    // Limit history stack to 25 items
    if (nextHistory.length > 25) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Undo & Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const targetIndex = historyIndex - 1;
      const targetPages = JSON.parse(JSON.stringify(history[targetIndex]));
      setTemplate((prev) => ({ ...prev, pages: targetPages }));
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const targetIndex = historyIndex + 1;
      const targetPages = JSON.parse(JSON.stringify(history[targetIndex]));
      setTemplate((prev) => ({ ...prev, pages: targetPages }));
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Current Active Page
  const currentPage = template?.pages?.[activePageIndex] || null;
  const currentElements = currentPage?.elements || [];
  const selectedElement = currentElements.find((el) => el.id === selectedElementId);

  // Update Page Elements
  const updateCurrentPageElements = (newElements) => {
    setTemplate((prev) => {
      if (!prev || !prev.pages) return prev;
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: newElements,
      };
      return { ...prev, pages: updatedPages };
    });
    if (template?.pages) {
      const updatedPages = [...template.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: newElements,
      };
      pushHistory(updatedPages);
    }
  };

  // Element Actions
  const handleAddPhotoFrame = (shape = "rectangle", testImageUrl = "") => {
    const frameCount =
      currentElements.filter((el) => el.type === "photo_frame").length + 1;
    const is1to1Shape = ["circle", "heart", "star", "scallop", "hexagon"].includes(shape);

    const dims = getCanvasDimensionsForSize(currentSizeInfo, productData?.photobook_config?.sizes || []);
    const canvasW = dims.width || 707;
    const canvasH = dims.height || 1000;

    let width_pct = 50;
    let height_pct = 50;

    if (is1to1Shape) {
      width_pct = 45;
      // Height % focuses on width % value so height in pixels === width in pixels
      height_pct = Number((width_pct * (canvasW / canvasH)).toFixed(2));
    }

    const x_pct = Number(((100 - width_pct) / 2).toFixed(2));
    const y_pct = Number(((100 - height_pct) / 2).toFixed(2));

    const pixelW = Math.round((width_pct / 100) * canvasW);
    const pixelH = is1to1Shape ? pixelW : Math.round((height_pct / 100) * canvasH);

    const newElement = {
      id: uuidv4(),
      type: "photo_frame",
      frame_id: `frame_${frameCount}_${Date.now().toString().slice(-4)}`,
      shape,
      x_pct,
      y_pct,
      width_pct,
      height_pct,
      unit: "%",
      is_percentage: true,
      x_str: `${x_pct}%`,
      y_str: `${y_pct}%`,
      width_str: `${width_pct}%`,
      height_str: `${height_pct}%`,
      x: Math.round((x_pct / 100) * canvasW),
      y: Math.round((y_pct / 100) * canvasH),
      width: pixelW,
      height: pixelH,
      rotation: 0,
      z_index: currentElements.length + 1,
      fit_mode: "cover",
      border: { width: 0, color: "#ffffff", radius: shape === "rectangle" ? 4 : 0 },
      shadow: { blur: 10, color: "rgba(0,0,0,0.15)", offsetX: 0, offsetY: 4 },
      is_required: true,
      test_image_url: testImageUrl,
      crop: { zoom: 1, offsetX: 0, offsetY: 0 },
    };
    const nextElements = [...currentElements, newElement];
    updateCurrentPageElements(nextElements);
    setSelectedElementId(newElement.id);
  };

  const handleAddText = (customProps = {}) => {
    const textContent = customProps.content !== undefined ? customProps.content : "Heading";
    const fontSize = customProps.font_size || 32;
    const fontFamily = customProps.font_family || "Inter";
    const fontWeight = customProps.font_weight || "bold";
    const fontStyle = customProps.font_style || "normal";
    const color = customProps.color || "#1f2937";

    const dimsInfo = getCanvasDimensionsForSize(currentSizeInfo, productData?.photobook_config?.sizes || []);
    const canvasW = dimsInfo.width || 707;
    const canvasH = dimsInfo.height || 1000;

    const textDims = calculateDynamicTextDimensions({
      content: textContent,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
    });

    const width_pct = textDims.width_pct;
    const height_pct = textDims.height_pct;
    const x_pct = Number(((100 - width_pct) / 2).toFixed(2));
    const y_pct = 40;

    const newElement = {
      id: uuidv4(),
      type: "text",
      content: textContent,
      font_family: fontFamily,
      font_size: fontSize,
      font_size_rem: `${(fontSize / 16).toFixed(2)}rem`,
      font_size_cqmin: `${(fontSize / 10).toFixed(2)}cqmin`,
      font_weight: fontWeight,
      font_style: fontStyle,
      color: color,
      align: "center",
      x_pct,
      y_pct,
      width_pct,
      height_pct,
      unit: "%",
      is_percentage: true,
      x_str: `${x_pct}%`,
      y_str: `${y_pct}%`,
      width_str: `${width_pct}%`,
      height_str: `${height_pct}%`,
      x: Math.round((x_pct / 100) * canvasW),
      y: Math.round((y_pct / 100) * canvasH),
      width: Math.round((width_pct / 100) * canvasW),
      height: Math.round((height_pct / 100) * canvasH),
      rotation: 0,
      z_index: currentElements.length + 1,
      is_customer_editable: Boolean(customProps.is_customer_editable),
      placeholder: "Enter title here...",
    };
    const nextElements = [...currentElements, newElement];
    updateCurrentPageElements(nextElements);
    setSelectedElementId(newElement.id);
  };

  const handleAddDecoration = (dec) => {
    const dims = getCanvasDimensionsForSize(currentSizeInfo, productData?.photobook_config?.sizes || []);
    const canvasW = dims.width || 707;
    const canvasH = dims.height || 1000;

    const imgRatio = dec.aspect_ratio || (dec.natural_width && dec.natural_height ? dec.natural_width / dec.natural_height : 1);

    // Initial width on paper: 30% of canvas width
    const width_pct = 30;
    const pixelW = (width_pct / 100) * canvasW;
    // Compute pixel height to maintain natural image proportions
    const pixelH = pixelW / imgRatio;
    // Compute height % relative to canvas height
    const height_pct = Number(((pixelH / canvasH) * 100).toFixed(2));

    const x_pct = Number(((100 - width_pct) / 2).toFixed(2));
    const y_pct = Number(((100 - height_pct) / 2).toFixed(2));

    const newElement = {
      id: uuidv4(),
      type: "decoration",
      preset_id: dec.id || "",
      name: dec.name || "Decoration",
      svg: dec.svg || "",
      asset_url: dec.asset_url || "",
      asset_type: dec.asset_type || (dec.svg ? "svg" : "png"),
      aspect_ratio: imgRatio,
      natural_width: dec.natural_width || 100,
      natural_height: dec.natural_height || 100,
      fit_mode: "contain",
      x_pct,
      y_pct,
      width_pct,
      height_pct,
      unit: "%",
      is_percentage: true,
      x_str: `${x_pct}%`,
      y_str: `${y_pct}%`,
      width_str: `${width_pct}%`,
      height_str: `${height_pct}%`,
      x: Math.round((x_pct / 100) * canvasW),
      y: Math.round((y_pct / 100) * canvasH),
      width: Math.round(pixelW),
      height: Math.round(pixelH),
      rotation: 0,
      z_index: currentElements.length + 1,
      opacity: 1,
      tint: dec.svg ? (dec.tint || "#334155") : "",
    };
    const nextElements = [...currentElements, newElement];
    updateCurrentPageElements(nextElements);
    setSelectedElementId(newElement.id);
  };

  const handleUpdateElement = (elId, patch) => {
    const nextElements = currentElements.map((el) =>
      el.id === elId ? { ...el, ...patch } : el
    );
    updateCurrentPageElements(nextElements);
  };

  const handleDuplicateElement = (elId) => {
    const source = currentElements.find((el) => el.id === elId);
    if (!source) return;
    const xPct = source.x_pct !== undefined ? source.x_pct : (source.x ? source.x / 10 : 20);
    const yPct = source.y_pct !== undefined ? source.y_pct : (source.y ? source.y / 10 : 20);
    const newXPct = Math.min(95, xPct + 3);
    const newYPct = Math.min(95, yPct + 3);

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: uuidv4(),
      x_pct: Number(newXPct.toFixed(2)),
      y_pct: Number(newYPct.toFixed(2)),
      x_str: `${newXPct.toFixed(2)}%`,
      y_str: `${newYPct.toFixed(2)}%`,
      x: Math.round(newXPct * 10),
      y: Math.round(newYPct * 10),
      z_index: currentElements.length + 1,
      frame_id:
        source.type === "photo_frame"
          ? `${source.frame_id}_copy`
          : undefined,
    };
    const nextElements = [...currentElements, cloned];
    updateCurrentPageElements(nextElements);
    setSelectedElementId(cloned.id);
  };

  const handleDeleteElement = (elId) => {
    const nextElements = currentElements.filter((el) => el.id !== elId);
    updateCurrentPageElements(nextElements);
    if (selectedElementId === elId) setSelectedElementId(null);
  };

  const handleBringForward = (elId) => {
    const target = currentElements.find((el) => el.id === elId);
    if (!target) return;
    const currentZ = target.z_index || 1;
    handleUpdateElement(elId, { z_index: currentZ + 1 });
  };

  const handleSendBackward = (elId) => {
    const target = currentElements.find((el) => el.id === elId);
    if (!target) return;
    const currentZ = target.z_index || 1;
    handleUpdateElement(elId, { z_index: Math.max(1, currentZ - 1) });
  };

  // Set Page Background
  const handleSetBackground = (bg) => {
    setTemplate((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        background: bg,
      };
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
  };

  // Apply Reusable Layout
  const handleApplyLayout = (layout) => {
    const frames = (layout.frames || []).map((f) => {
      const xPct = f.x_pct !== undefined ? f.x_pct : (f.x !== undefined ? (f.x > 1 ? f.x / 10 : f.x * 100) : 10);
      const yPct = f.y_pct !== undefined ? f.y_pct : (f.y !== undefined ? (f.y > 1 ? f.y / 10 : f.y * 100) : 10);
      const wPct = f.width_pct !== undefined ? f.width_pct : (f.width !== undefined ? (f.width > 1 ? f.width / 10 : f.width * 100) : 80);
      const hPct = f.height_pct !== undefined ? f.height_pct : (f.height !== undefined ? (f.height > 1 ? f.height / 10 : f.height * 100) : 80);

      const x_pct = Number(Number(xPct).toFixed(2));
      const y_pct = Number(Number(yPct).toFixed(2));
      const width_pct = Number(Number(wPct).toFixed(2));
      const height_pct = Number(Number(hPct).toFixed(2));

      return {
        id: uuidv4(),
        type: "photo_frame",
        frame_id: `frame_${uuidv4().slice(0, 6)}`,
        shape: f.shape || "rectangle",
        x_pct,
        y_pct,
        width_pct,
        height_pct,
        unit: "%",
        is_percentage: true,
        x_str: `${x_pct}%`,
        y_str: `${y_pct}%`,
        width_str: `${width_pct}%`,
        height_str: `${height_pct}%`,
        x: Math.round(x_pct * 10),
        y: Math.round(y_pct * 10),
        width: Math.round(width_pct * 10),
        height: Math.round(height_pct * 10),
        rotation: f.rotation || 0,
        z_index: 1,
        fit_mode: f.fit_mode || "cover",
        border: f.border || { width: 0, color: "#ffffff", radius: 4 },
        shadow: { blur: 8, color: "rgba(0,0,0,0.1)", offsetX: 0, offsetY: 4 },
        is_required: true,
        crop: { zoom: 1, offsetX: 0, offsetY: 0 },
      };
    });

    // Preserve non-frame elements (text, decorations) on current page!
    const nonFrameElements = currentElements.filter(
      (el) => el.type !== "photo_frame"
    );
    const combined = [...frames, ...nonFrameElements];
    updateCurrentPageElements(combined);
    message.success(`Applied layout "${layout.layout_name}"`);
  };

  // Save Current Page Frames as Reusable Layout
  const handleSaveCurrentAsLayout = async (layoutName, category) => {
    try {
      const frames = currentElements
        .filter((el) => el.type === "photo_frame")
        .map((f) => {
          const xPct = f.x_pct !== undefined ? f.x_pct : (f.x !== undefined ? (f.x > 1 ? f.x / 10 : f.x * 100) : 10);
          const yPct = f.y_pct !== undefined ? f.y_pct : (f.y !== undefined ? (f.y > 1 ? f.y / 10 : f.y * 100) : 10);
          const wPct = f.width_pct !== undefined ? f.width_pct : (f.width !== undefined ? (f.width > 1 ? f.width / 10 : f.width * 100) : 80);
          const hPct = f.height_pct !== undefined ? f.height_pct : (f.height !== undefined ? (f.height > 1 ? f.height / 10 : f.height * 100) : 80);

          const x_pct = Number(Number(xPct).toFixed(2));
          const y_pct = Number(Number(yPct).toFixed(2));
          const width_pct = Number(Number(wPct).toFixed(2));
          const height_pct = Number(Number(hPct).toFixed(2));

          return {
            id: f.id,
            shape: f.shape,
            x_pct,
            y_pct,
            width_pct,
            height_pct,
            unit: "%",
            is_percentage: true,
            x_str: `${x_pct}%`,
            y_str: `${y_pct}%`,
            width_str: `${width_pct}%`,
            height_str: `${height_pct}%`,
            x: Math.round(x_pct * 10),
            y: Math.round(y_pct * 10),
            width: Math.round(wPct * 10),
            height: Math.round(height_pct * 10),
            rotation: f.rotation || 0,
            fit_mode: f.fit_mode || "cover",
            border: f.border,
          };
        });

      if (frames.length === 0) {
        message.warning("No photo frames on this page to save as a layout.");
        return;
      }

      await createPhotoBookLayout({
        layout_name: layoutName,
        category,
        photo_count: frames.length,
        supported_sizes:
          Array.isArray(template?.supported_sizes) && template.supported_sizes.length > 0
            ? template.supported_sizes
            : (template?.page_config?.selected_size ? [template.page_config.selected_size] : []),
        frames,
      });

      message.success(`Saved "${layoutName}" as a reusable layout!`);
      fetchLayouts();
    } catch (err) {
      console.error("Error saving layout:", err);
      message.error("Failed to save layout");
    }
  };

  // Blank Page Toggle (Saved on template & page_config for customer side)
  const handleToggleBlankPage = (checked) => {
    setTemplate((prev) => ({
      ...prev,
      include_blank_page: checked,
      page_config: {
        ...(prev.page_config || {}),
        include_blank_page: checked,
      },
    }));
    message.success(checked ? "Blank Page toggle is ON (visible on customer side)" : "Blank Page toggle is OFF (hidden from customer side)");
  };

  // Drag and Drop Page Reordering with Photobook Rule Enforcement
  const handleReorderPages = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const pages = template?.pages || [];
    const sourcePage = pages[fromIdx];

    // Rule 1: Front Cover must always be page 1 (index 0)
    if (sourcePage?.page_type === "front_cover" && toIdx !== 0) {
      message.error("Rule: Front Cover must always remain the first page!");
      return;
    }
    if (toIdx === 0 && sourcePage?.page_type !== "front_cover") {
      message.error("Rule: Front Cover must remain the first page! You cannot move interior pages before Front Cover.");
      return;
    }

    // Rule 2: Back Cover must always be the last page
    const lastIdx = pages.length - 1;
    if (sourcePage?.page_type === "back_cover" && toIdx !== lastIdx) {
      message.error("Rule: Back Cover must always remain the last page!");
      return;
    }
    if (toIdx === lastIdx && sourcePage?.page_type !== "back_cover") {
      message.error("Rule: Back Cover must remain the last page! You cannot move interior pages after Back Cover.");
      return;
    }

    setTemplate((prev) => {
      const newPages = [...prev.pages];
      const [moved] = newPages.splice(fromIdx, 1);
      newPages.splice(toIdx, 0, moved);
      pushHistory(newPages);
      return { ...prev, pages: newPages };
    });
    setActivePageIndex(toIdx);
    message.success("Pages reordered! Book follows rules: Front Cover → Interior Pages → Back Cover");
  };

  // Page Operations with Rule Exclusivity
  const handleAddPage = (pageType = "interior") => {
    const existingRules = (template?.pages || []).map((p) => p.targeting_rule?.rule_type).filter(Boolean);
    let nextRule = "all_interior";
    if (!existingRules.includes("odd_interior")) {
      nextRule = "odd_interior";
    } else if (!existingRules.includes("even_interior")) {
      nextRule = "even_interior";
    } else if (!existingRules.includes("all_interior")) {
      nextRule = "all_interior";
    } else {
      nextRule = "exact_page";
    }

    const usedPageNumbers = (template?.pages || [])
      .filter((p) => p.targeting_rule?.rule_type === "exact_page")
      .map((p) => p.targeting_rule?.page_number)
      .filter(Boolean);
    let nextNum = 1;
    while (usedPageNumbers.includes(nextNum)) {
      nextNum++;
    }

    const pageIndex = (template?.pages?.length || 0) + 1;
    const newPage = {
      page_id: uuidv4(),
      name: `Interior Page ${pageIndex}`,
      page_type: pageType,
      targeting_rule: { rule_type: nextRule, page_number: nextNum },
      background: { type: "color", value: "#ffffff", opacity: 1 },
      elements: [],
    };
    setTemplate((prev) => {
      const updatedPages = [...prev.pages, newPage];
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
    setActivePageIndex(template.pages.length);
    message.success(`Added page with rule: ${nextRule.replace("_", " ")}`);
  };

  const handleDuplicatePage = (idx) => {
    const source = template.pages[idx];
    if (!source) return;

    // Check if source rule is odd_interior or even_interior or all_interior
    // Duplicate CANNOT duplicate an already-assigned odd/even rule!
    let clonedRule = { ...(source.targeting_rule || { rule_type: "exact_page", page_number: 1 }) };
    if (["odd_interior", "even_interior", "all_interior"].includes(clonedRule.rule_type)) {
      const usedPageNumbers = (template?.pages || [])
        .filter((p) => p.targeting_rule?.rule_type === "exact_page")
        .map((p) => p.targeting_rule?.page_number)
        .filter(Boolean);
      let nextNum = 1;
      while (usedPageNumbers.includes(nextNum)) {
        nextNum++;
      }
      clonedRule = { rule_type: "exact_page", page_number: nextNum };
      message.info(`Duplicated page assigned as Exact Page ${nextNum} (odd/even rules must be unique).`);
    }

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      page_id: uuidv4(),
      name: `${source.name} (Copy)`,
      targeting_rule: clonedRule,
      elements: (source.elements || []).map((el) => ({
        ...el,
        id: uuidv4(),
      })),
    };
    setTemplate((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages.splice(idx + 1, 0, cloned);
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
    setActivePageIndex(idx + 1);
  };

  const handleDeletePage = (idx) => {
    if (template.pages.length <= 1) {
      message.error("A template must contain at least one page.");
      return;
    }
    setTemplate((prev) => {
      const updatedPages = prev.pages.filter((_, i) => i !== idx);
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
    setActivePageIndex(Math.max(0, idx - 1));
  };

  const handleUpdatePageRule = (idx, newRule) => {
    // Validate uniqueness: odd_interior, even_interior, all_interior cannot be duplicated
    if (["odd_interior", "even_interior", "all_interior"].includes(newRule.rule_type)) {
      const conflict = (template.pages || []).some(
        (p, i) => i !== idx && p.targeting_rule?.rule_type === newRule.rule_type
      );
      if (conflict) {
        message.warning(`Rule "${newRule.rule_type.replace('_', ' ')}" is already assigned to another page! Each rule must be unique.`);
        return;
      }
    }
    setTemplate((prev) => {
      const updatedPages = [...prev.pages];
      updatedPages[idx] = {
        ...updatedPages[idx],
        targeting_rule: newRule,
      };
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!template?.product_template_id) {
      message.error("Cannot save: No template configuration is selected. Please select a template configuration first.");
      setChangeTemplateModalOpen(true);
      return;
    }
    try {
      setSaving(true);
      const normalizedTemplate = normalizeTemplateForSave(template);
      setTemplate(normalizedTemplate);
      await updatePhotoBookTemplate(id, normalizedTemplate);
      message.success("Template draft saved successfully (all elements normalized to paper size)!");
    } catch (err) {
      console.error("Save error:", err);
      message.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Publish Template
  const handlePublish = async () => {
    if (!template?.product_template_id) {
      message.error("Cannot publish: No template configuration is selected. Please select a template configuration first.");
      setChangeTemplateModalOpen(true);
      return;
    }
    try {
      setPublishing(true);
      const normalizedTemplate = normalizeTemplateForSave(template);
      setTemplate(normalizedTemplate);
      // Validate first
      const valRes = await validatePhotoBookTemplate(normalizedTemplate);
      const valData = valRes.data?.data;
      setValidationResult(valData);

      if (!valData?.isValid) {
        setValidationOpen(true);
        message.warning("Please fix all validation issues before publishing.");
        return;
      }

      // Save normalized draft then publish
      await updatePhotoBookTemplate(id, normalizedTemplate);
      const pubRes = await publishPhotoBookTemplate(id);
      message.success(pubRes.data?.message || "Template published successfully!");
      fetchTemplate();
    } catch (err) {
      console.error("Publish error:", err);
      if (err.response?.data?.validation) {
        setValidationResult(err.response.data.validation);
        setValidationOpen(true);
      } else {
        message.error(err.response?.data?.message || "Publishing failed");
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <Spin size="large" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 space-y-4">
        <p className="text-slate-600">Template not found</p>
        <Button onClick={() => navigate("/photobook-templates")}>
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 select-none">
      {/* ==================== EXACT CANVA-STYLE TOP STUDIO HEADER ==================== */}
      <header className="h-14 bg-[#0f172a] text-white border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-md">
        {/* Left Section: Logo, Divider, Title, Editable Doc Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-teal-400/30">
              P
            </div>
            <span className="font-extrabold text-white text-base tracking-wide font-sans">
              Printe
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700/80 mx-1" />

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Photo Book Editor
          </span>

          <button
            type="button"
            onClick={() => navigate("/photobook-templates")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Back to Templates"
          >
            <MdArrowBack size={18} />
          </button>

          {/* Editable Document Title with Pencil */}
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <input
                autoFocus
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => {
                  setEditingTitle(false);
                  if (titleValue.trim() && titleValue !== template.template_name) {
                    setTemplate((prev) => ({ ...prev, template_name: titleValue.trim() }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingTitle(false);
                    if (titleValue.trim() && titleValue !== template.template_name) {
                      setTemplate((prev) => ({ ...prev, template_name: titleValue.trim() }));
                    }
                  }
                }}
                className="bg-slate-800 text-white px-2 py-0.5 rounded text-sm font-semibold border border-sky-500 outline-none max-w-[200px]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-1.5 hover:bg-slate-800/80 px-2 py-1 rounded text-left transition-colors cursor-pointer group"
                title="Click to rename template"
              >
                <span className="text-sm font-semibold text-white tracking-wide truncate max-w-[200px]">
                  {template.template_name || "Vintage Wedding Book"}
                </span>
                <MdEdit size={13} className="text-slate-400 group-hover:text-sky-400 transition-colors" />
              </button>
            )}

            <Tag color={template.status === "published" ? "green" : "orange"} className="font-semibold text-[10px]">
              {template.status?.toUpperCase() || "DRAFT"}
            </Tag>
            <Tag color="blue" className="font-semibold text-[10px]">v{template.version || 1}</Tag>

            {/* Linked Template Configuration Indicator */}
            {template.product_template_id ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-teal-500/50 px-2.5 py-1 rounded-lg text-xs ml-1">
                <span className="text-slate-400">Linked Config:</span>
                <span className="text-teal-300 font-bold max-w-[130px] truncate" title={template.product_template_id}>
                  {template.template_name || template.product_template_id}
                </span>
                <button
                  type="button"
                  onClick={() => setChangeTemplateModalOpen(true)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold ml-1 cursor-pointer"
                >
                  Change
                </button>
                {template.product_id && (
                  <button
                    type="button"
                    onClick={() => window.open(`/edit-product/${template.product_id}`, "_blank")}
                    className="text-[11px] text-teal-400 hover:text-teal-300 underline font-semibold ml-1 cursor-pointer"
                    title="Edit commercial pricing, sizes & editions in Admin Products"
                  >
                    Product Config ↗
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/60 px-2.5 py-1 rounded-lg text-xs text-red-200 ml-1">
                <span className="font-semibold">⚠️ Unlinked Config</span>
                <button
                  type="button"
                  onClick={() => setChangeTemplateModalOpen(true)}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Select Template
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Undo, Redo, Size pill, Zoom, View modes */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 border border-slate-700/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <MdUndo size={17} />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <MdRedo size={17} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Book Size Pill */}
          <button
            type="button"
            onClick={() => setSizeModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs hover:border-sky-500 hover:bg-slate-800 transition-all cursor-pointer"
            title="Click to view all available sizes with width and height"
          >
            <span className="text-slate-400">Size:</span>
            <span className="text-sky-400 font-bold">{currentSizeInfo.name}</span>
            <span className="text-[10px] text-slate-300 font-normal">
              ({currentSizeInfo.dimensions})
            </span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Zoom Controls Pill */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2 py-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="text-slate-300 hover:text-white p-0.5 rounded hover:bg-slate-700 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <MdZoomOut size={16} />
            </button>
            <span className="w-11 text-center font-mono font-medium text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="text-slate-300 hover:text-white p-0.5 rounded hover:bg-slate-700 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <MdZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const ratio = currentSizeInfo?.singlePageRatio || 1;
                setZoom(ratio < 0.9 ? 0.65 : ratio > 1.1 ? 0.75 : 0.65);
              }}
              className="text-[10px] bg-slate-700/80 hover:bg-slate-600 px-1.5 py-0.5 rounded text-slate-200 ml-1 cursor-pointer flex items-center gap-1 transition-colors"
              title="Fit paper to screen"
            >
              <MdFitScreen size={12} />
              <span>Fit</span>
            </button>
          </div>

          <button
            type="button"
            className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Desktop View Mode"
          >
            <MdDesktopWindows size={16} />
          </button>
        </div>

        {/* Right Section: Save Draft, Preview, Validate & Publish */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !template.product_template_id}
            title={!template.product_template_id ? "Select a template configuration to enable saving" : "Save Draft"}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/90 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdSave size={16} />
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/90 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <MdVisibility size={16} className="text-teal-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || !template.product_template_id}
            title={!template.product_template_id ? "Select a template configuration to enable publishing" : "Validate & Publish"}
            className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdCloudUpload size={17} />
            <span>{publishing ? "Publishing..." : "Publish"}</span>
          </button>
        </div>
      </header>

      {/* ==================== CANVA SUB-TOOLBAR STRIP ==================== */}
      <div className="min-h-10 py-1 bg-[#0b1120] border-b border-slate-800 text-xs text-slate-300 flex items-center px-4 justify-between select-none z-20 overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          {/* Quick Transform and Arrangement Tools */}
          <button
            type="button"
            onClick={() => {
              if (selectedElement) {
                handleUpdateElement(selectedElement.id, {
                  flip_h: !selectedElement.flip_h,
                });
                message.info(selectedElement.flip_h ? "Flipped normal" : "Flipped horizontal");
              } else {
                message.info("Select an element to flip");
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-300"
            title="Flip horizontally"
          >
            <MdFlip size={15} />
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedElement) {
                const nextRot = ((selectedElement.rotation || 0) + 90) % 360;
                handleUpdateElement(selectedElement.id, { rotation: nextRot });
              } else {
                message.info("Select an element to rotate");
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-300"
            title="Rotate 90 degrees"
          >
            <FiRotateCw size={14} />
            <span>Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedElement) {
                const w = selectedElement.width_pct || 40;
                handleUpdateElement(selectedElement.id, {
                  x_pct: Number(((100 - w) / 2).toFixed(2)),
                });
                message.success("Centered horizontally");
              } else {
                message.info("Select an element to align");
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-slate-300"
            title="Align Center"
          >
            <MdFormatAlignCenter size={15} />
            <span>Align</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedElementId(null);
              setPanelTab((t) => (t === "layers" ? "page" : "layers"));
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              panelTab === "layers" && !selectedElementId
                ? "bg-sky-600/30 text-sky-400 font-semibold border border-sky-500/40"
                : "hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Toggle Layers in Right Panel"
          >
            <MdLayers size={15} />
            <span>Layers</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {selectedElement && (
            <div className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded">
              <span className="font-semibold uppercase tracking-wider">{selectedElement.type?.replace('_', ' ')}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">z: {selectedElement.z_index || 1}</span>
            </div>
          )}
        </div>

        {/* Right Info in Sub-Toolbar */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{template.pages?.length || 1} Pages Total</span>
          <span className="text-slate-600">•</span>
          <span>Active: {currentPage?.name || `Page ${activePageIndex + 1}`}</span>
        </div>
      </div>

      {/* ==================== WORKSPACE LAYOUT ==================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Elements Sidebar */}
        <LeftPanel
          onAddPhotoFrame={handleAddPhotoFrame}
          onAddText={handleAddText}
          onAddDecoration={handleAddDecoration}
          onSetBackground={handleSetBackground}
          onApplyLayout={handleApplyLayout}
          onSaveCurrentAsLayout={handleSaveCurrentAsLayout}
          onOpenSizeModal={() => setSizeModalOpen(true)}
          currentSizeInfo={currentSizeInfo}
          templateSizes={templateSizes}
          onSelectSize={handleSizeChange}
          selectedSize={currentSize}
          page={currentPage}
          layouts={layouts}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
        />

        {/* Central Editable Canvas */}
        <Canvas
          page={currentPage}
          selectedElementId={selectedElementId}
          onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          zoom={zoom}
          aspectRatio={`${currentSizeInfo.singlePageRatio}`}
          selectedSize={currentSize}
          sizeInfo={currentSizeInfo}
          configSizes={productData?.photobook_config?.sizes || []}
        />

        {/* Right Properties Panel (Single Unified Panel with Page Settings & Layers) */}
        <PropertiesPanel
          selectedElement={selectedElement}
          page={currentPage}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onSetBackground={handleSetBackground}
          onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
          currentSizeInfo={currentSizeInfo}
          onOpenSizeModal={() => setSizeModalOpen(true)}
          elements={currentElements}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onReorderElements={(updatedElements) => {
            updateCurrentPageElements(updatedElements);
          }}
          panelTab={panelTab}
          onPanelTabChange={setPanelTab}
        />

        {/* Disabled Overlay if Template Configuration is Unselected */}
        {!template.product_template_id && (
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl border border-slate-200 text-slate-800">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Template Configuration Required
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                This visual template design is not linked to any active template configuration from the Custom Photo Book product. The visual designer, canvas editing, saving, and publishing are disabled until a template configuration is linked.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  type="primary"
                  className="!bg-teal-600 !border-teal-600 font-semibold"
                  onClick={() => setChangeTemplateModalOpen(true)}
                >
                  Select Template Configuration
                </Button>
                <Button onClick={() => navigate("/photobook-templates")}>
                  Back to Templates
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== BOTTOM PAGE NAVIGATION STRIP ==================== */}
      <PageFilmstrip
        pages={template.pages || []}
        activePageIndex={activePageIndex}
        sizeInfo={currentSizeInfo}
        includeBlankPage={Boolean(template.include_blank_page || template.page_config?.include_blank_page)}
        onToggleBlankPage={handleToggleBlankPage}
        onSelectPage={(idx) => {
          setActivePageIndex(idx);
          setSelectedElementId(null);
        }}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onUpdatePageRule={handleUpdatePageRule}
        onReorderPages={handleReorderPages}
      />

      {/* Complete Book Simulation Preview Modal */}
      <BookPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template={template}
        configSizes={productData?.photobook_config?.sizes || []}
      />

      {/* Pre-Publish Validation Drawer */}
      <ValidationDrawer
        open={validationOpen}
        onClose={() => setValidationOpen(false)}
        validationResult={validationResult}
      />

      {/* Available Book Sizes Modal (Matching Customer Side Visual Selection) */}
      <BookSizeModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        selectedSize={currentSize}
        onSelectSize={handleSizeChange}
        templateSizes={templateSizes}
      />

      {/* ==================== CHANGE / UNSELECT TEMPLATE CONFIGURATION MODAL ==================== */}
      <Modal
        title="Manage Linked Product Template Configuration"
        open={changeTemplateModalOpen}
        onCancel={() => setChangeTemplateModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500">
            Every visual template design must be linked to a template configuration from the Custom Photo Book product. Changing the linked template configuration <strong>preserves all existing page layouts, elements, coordinates, backgrounds, and photo frames</strong>.
          </p>

          {/* Current Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              template.product_template_id
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">
                {template.product_template_id
                  ? "Currently Linked Configuration:"
                  : "Status: No Configuration Linked"}
              </span>
              <span className="text-sm font-semibold">
                {template.template_name} ({template.product_template_id || "None"})
              </span>
              {template.product_id && (
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Product ID: {template.product_id}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {template.product_id && (
                <Button
                  size="small"
                  onClick={() => window.open(`/edit-product/${template.product_id}`, "_blank")}
                >
                  Product Config ↗
                </Button>
              )}
              {template.product_template_id && (
                <Popconfirm
                  title="Unselect Template Configuration?"
                  description="Unselecting will disable the visual template designer until another template configuration is linked. All visual layouts and pages will be preserved."
                  onConfirm={handleUnselectTemplate}
                  okText="Yes, Unselect"
                  cancelText="Cancel"
                >
                  <Button danger size="small">
                    Unselect Template
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>

          <Divider className="my-2" />

          {/* List of Available Product Template Configurations */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              Available Template Configurations from Products:
            </h4>

            {loadingProductTemplates ? (
              <div className="p-8 text-center">
                <Spin size="default" />
              </div>
            ) : availableProductTemplates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No product template configurations found. Please create template configurations in Admin → Products first.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2.5">
                {availableProductTemplates.map((tpl) => {
                  const isCurrent =
                    String(tpl.product_template_id) === String(template.product_template_id) ||
                    String(tpl.slug) === String(template.product_template_id) ||
                    String(tpl.design_id) === String(id);

                  const isAssignedToOther = tpl.has_design && String(tpl.design_id) !== String(id);

                  return (
                    <div
                      key={tpl.product_template_id || tpl.slug}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-emerald-50/80 border-emerald-400"
                          : isAssignedToOther
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {tpl.cover_image_url || tpl.thumbnail_url ? (
                          <img
                            src={tpl.cover_image_url || tpl.thumbnail_url}
                            alt={tpl.template_name}
                            className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 text-[10px] shrink-0 font-medium">
                            Cover
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-xs truncate">
                              {tpl.template_name}
                            </span>
                            {tpl.badge && (
                              <Tag color="orange" className="text-[9px] m-0 leading-tight">
                                {tpl.badge}
                              </Tag>
                            )}
                            {tpl.category && (
                              <Tag color="cyan" className="text-[9px] m-0 leading-tight">
                                {tpl.category}
                              </Tag>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                            <span>slug: {tpl.slug}</span>
                            <span>•</span>
                            <span className="font-sans">Product: {tpl.product_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isCurrent ? (
                          <Tag color="green" className="m-0 font-semibold text-xs">
                            Current
                          </Tag>
                        ) : isAssignedToOther ? (
                          <Tooltip title="Another visual design is already assigned to this template configuration. Duplicate designs are restricted.">
                            <Tag color="orange" className="m-0 text-[10px]">
                              Already Assigned
                            </Tag>
                          </Tooltip>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleChangeTemplate(tpl)}
                            className="!bg-teal-600 hover:!bg-teal-700 !border-teal-600 text-xs font-semibold"
                          >
                            Link This Config
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setChangeTemplateModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PhotoBookEditor;
