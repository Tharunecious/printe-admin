import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPhotoBookTemplateById,
  updatePhotoBookTemplate,
  publishPhotoBookTemplate,
  validatePhotoBookTemplate,
  getPhotoBookLayouts,
  createPhotoBookLayout,
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
} from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import LeftPanel from "./LeftSidebar/LeftPanel";
import Canvas from "./Canvas";
import PropertiesPanel from "./RightProperties/PropertiesPanel";
import LayersPanel from "./LayersPanel/LayersPanel";
import PageFilmstrip from "./PageNavigation/PageFilmstrip";
import BookPreviewModal from "../BookPreviewModal";
import ValidationDrawer from "../ValidationDrawer";

const PhotoBookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [template, setTemplate] = useState(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(0.85);
  const [showLayers, setShowLayers] = useState(true);
  const [layouts, setLayouts] = useState([]);

  // Modals & Drawers
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Undo / Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryAction = useRef(false);

  // Fetch Template Data
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await getPhotoBookTemplateById(id);
      const data = res.data?.data;
      if (data) {
        setTemplate(data);
        setHistory([JSON.parse(JSON.stringify(data.pages || []))]);
        setHistoryIndex(0);
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
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: newElements,
      };
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
  };

  // Element Actions
  const handleAddPhotoFrame = (shape = "rectangle", testImageUrl = "") => {
    const frameCount =
      currentElements.filter((el) => el.type === "photo_frame").length + 1;
    const newElement = {
      id: uuidv4(),
      type: "photo_frame",
      frame_id: `frame_${frameCount}_${Date.now().toString().slice(-4)}`,
      shape,
      x: 300,
      y: 300,
      width: 400,
      height: 400,
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
    const newElement = {
      id: uuidv4(),
      type: "text",
      content: customProps.content || "Heading",
      font_family: customProps.font_family || "Inter",
      font_size: customProps.font_size || 32,
      font_weight: customProps.font_weight || "bold",
      font_style: customProps.font_style || "normal",
      color: "#1f2937",
      align: "center",
      x: 200,
      y: 400,
      width: 600,
      height: 60,
      rotation: 0,
      z_index: currentElements.length + 1,
      is_customer_editable: true,
      placeholder: "Enter title here...",
    };
    const nextElements = [...currentElements, newElement];
    updateCurrentPageElements(nextElements);
    setSelectedElementId(newElement.id);
  };

  const handleAddDecoration = (dec) => {
    const newElement = {
      id: uuidv4(),
      type: "decoration",
      name: dec.name,
      svg: dec.svg,
      x: 350,
      y: 350,
      width: 300,
      height: 300,
      rotation: 0,
      z_index: currentElements.length + 1,
      opacity: 1,
      tint: "#334155",
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
    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: uuidv4(),
      x: source.x + 30,
      y: source.y + 30,
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
    const frames = (layout.frames || []).map((f) => ({
      id: uuidv4(),
      type: "photo_frame",
      frame_id: `frame_${uuidv4().slice(0, 6)}`,
      shape: f.shape || "rectangle",
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      rotation: f.rotation || 0,
      z_index: 1,
      fit_mode: f.fit_mode || "cover",
      border: f.border || { width: 0, color: "#ffffff", radius: 4 },
      shadow: { blur: 8, color: "rgba(0,0,0,0.1)", offsetX: 0, offsetY: 4 },
      is_required: true,
      crop: { zoom: 1, offsetX: 0, offsetY: 0 },
    }));

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
        .map((f) => ({
          id: f.id,
          shape: f.shape,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          rotation: f.rotation,
          fit_mode: f.fit_mode,
          border: f.border,
        }));

      if (frames.length === 0) {
        message.warning("No photo frames on this page to save as a layout.");
        return;
      }

      await createPhotoBookLayout({
        layout_name: layoutName,
        category,
        photo_count: frames.length,
        supported_sizes: template?.supported_sizes || ["8x8", "10x10"],
        frames,
      });

      message.success(`Saved "${layoutName}" as a reusable layout!`);
      fetchLayouts();
    } catch (err) {
      console.error("Error saving layout:", err);
      message.error("Failed to save layout");
    }
  };

  // Page Operations
  const handleAddPage = (pageType = "interior") => {
    const pageIndex = (template?.pages?.length || 0) + 1;
    const newPage = {
      page_id: uuidv4(),
      name: `Interior Page ${pageIndex}`,
      page_type: pageType,
      targeting_rule: { rule_type: "all_interior", page_number: pageIndex },
      background: { type: "color", value: "#ffffff", opacity: 1 },
      elements: [],
    };
    setTemplate((prev) => {
      const updatedPages = [...prev.pages, newPage];
      pushHistory(updatedPages);
      return { ...prev, pages: updatedPages };
    });
    setActivePageIndex(template.pages.length);
  };

  const handleDuplicatePage = (idx) => {
    const source = template.pages[idx];
    if (!source) return;
    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      page_id: uuidv4(),
      name: `${source.name} (Copy)`,
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
    try {
      setSaving(true);
      await updatePhotoBookTemplate(id, template);
      message.success("Template draft saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      message.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Publish Template
  const handlePublish = async () => {
    try {
      setPublishing(true);
      // Validate first
      const valRes = await validatePhotoBookTemplate(template);
      const valData = valRes.data?.data;
      setValidationResult(valData);

      if (!valData?.isValid) {
        setValidationOpen(true);
        message.warning("Please fix all validation issues before publishing.");
        return;
      }

      // Save draft then publish
      await updatePhotoBookTemplate(id, template);
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
      {/* ==================== CANVA-STYLE TOP TOOLBAR ==================== */}
      <header className="h-14 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<MdArrowBack className="text-white text-lg" />}
            onClick={() => navigate("/photobook-templates")}
            className="hover:!bg-slate-800 !text-white flex items-center"
          >
            <span className="text-xs font-semibold">Templates</span>
          </Button>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px]">
              {template.template_name}
            </h1>
            <Tag color={template.status === "published" ? "green" : "orange"}>
              {template.status?.toUpperCase()}
            </Tag>
            <Tag color="blue">v{template.version || 1}</Tag>
          </div>
        </div>

        {/* Center: Book Size, Undo, Redo, Zoom */}
        <div className="flex items-center gap-2">
          {/* Supported size selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-400">Size:</span>
            <Select
              size="small"
              className="w-24"
              value={template.page_config?.aspect_ratio || "1:1"}
              onChange={(val) =>
                setTemplate((prev) => ({
                  ...prev,
                  page_config: { ...prev.page_config, aspect_ratio: val },
                }))
              }
              options={[
                { value: "1:1", label: "8x8 / 10x10" },
                { value: "4:3", label: "Landscape" },
                { value: "3:4", label: "Portrait" },
                { value: "8.5:11", label: "Letter" },
              ]}
            />
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <MdUndo size={18} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <MdRedo size={18} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <MdZoomOut size={16} />
            </button>
            <span className="w-12 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <MdZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="text-[10px] bg-slate-700 px-1 rounded text-slate-300 hover:text-white ml-1"
            >
              Fit
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Layers Toggle Button */}
          <Button
            size="small"
            type={showLayers ? "primary" : "default"}
            icon={<MdLayers />}
            onClick={() => setShowLayers(!showLayers)}
            className={showLayers ? "!bg-teal-600" : ""}
          >
            Layers
          </Button>
        </div>

        {/* Right Actions: Preview, Save, Publish */}
        <div className="flex items-center gap-2">
          <Button
            icon={<MdOutlineAutoStories />}
            onClick={() => setPreviewOpen(true)}
            className="hover:!text-teal-400"
          >
            Book Preview
          </Button>

          <Button
            icon={<MdSave />}
            loading={saving}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>

          <Button
            type="primary"
            icon={<MdPublish />}
            loading={publishing}
            onClick={handlePublish}
            className="!bg-teal-600 hover:!bg-teal-700 !border-teal-600 font-semibold"
          >
            Validate & Publish
          </Button>
        </div>
      </header>

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
          page={currentPage}
          layouts={layouts}
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
          aspectRatio={template.page_config?.aspect_ratio || "1:1"}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          page={currentPage}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onSetBackground={handleSetBackground}
          onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
        />

        {/* Layers Panel (Dockable) */}
        {showLayers && (
          <LayersPanel
            elements={currentElements}
            selectedElementId={selectedElementId}
            onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
          />
        )}
      </div>

      {/* ==================== BOTTOM PAGE NAVIGATION STRIP ==================== */}
      <PageFilmstrip
        pages={template.pages || []}
        activePageIndex={activePageIndex}
        onSelectPage={(idx) => {
          setActivePageIndex(idx);
          setSelectedElementId(null);
        }}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onUpdatePageRule={handleUpdatePageRule}
      />

      {/* Complete Book Simulation Preview Modal */}
      <BookPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template={template}
      />

      {/* Pre-Publish Validation Drawer */}
      <ValidationDrawer
        open={validationOpen}
        onClose={() => setValidationOpen(false)}
        validationResult={validationResult}
      />
    </div>
  );
};

export default PhotoBookEditor;
