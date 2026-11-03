import React, { useState, useMemo } from "react";
import {
  Button,
  Card,
  Input,
  InputNumber,
  Tag,
  Modal,
  Form,
  Spin,
  Popconfirm,
  message,
  Switch,
  Tooltip,
  Tabs,
  Badge,
  Empty,
  Divider,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  UploadOutlined,
  PictureOutlined,
  DollarOutlined,
  BookOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  StarOutlined,
  CheckCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { uploadImage } from "../../api";

export const PhotoBookTemplateManager = ({
  sizes = [],
  templates = [],
  onChange,
  onSyncVariants,
}) => {
  // Selected template for detail view/drawer (null = grid view)
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  // Template Create/Edit Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm] = Form.useForm();
  const [uploadingCover, setUploadingCover] = useState(false);

  // Edition Create/Edit Modal State
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState(null);
  const [editionForm] = Form.useForm();

  // Active Size tab inside the Image Studio
  const [activeSizeId, setActiveSizeId] = useState(() => sizes[0]?._id || "");

  // Live Preview selector state
  const [previewSizeId, setPreviewSizeId] = useState(() => sizes[0]?._id || null);
  const [previewEditionId, setPreviewEditionId] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Image upload loading state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Active template reference
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.template_id === activeTemplateId) || null;
  }, [templates, activeTemplateId]);

  // Ensure activeSizeId and previewSizeId point to valid sizes
  useMemo(() => {
    if (sizes.length > 0) {
      if (!sizes.some((s) => s._id === activeSizeId)) {
        setActiveSizeId(sizes[0]._id);
      }
      if (!sizes.some((s) => s._id === previewSizeId)) {
        setPreviewSizeId(sizes[0]._id);
      }
    }
  }, [sizes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE CRUD (100% Manual Entry)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddTemplateModal = () => {
    setEditingTemplate(null);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      template_name: "",
      slug: "",
      template_code: "",
      category: "",
      badge: "",
      description: "",
      supported_sizes: sizes.map((s) => s._id || s.name),
      cover_image_url: "",
      thumbnail_url: "",
      storefront_visibility: true,
      default_pages: 20,
      min_pages: 10,
      max_pages: 60,
      price_per_extra_page: 15,
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplateModal = (tpl, e) => {
    if (e) e.stopPropagation();
    setEditingTemplate(tpl);
    const coverUrl = tpl.cover_image_url || tpl.thumbnail_url || "";
    const isVisible = tpl.storefront_visibility !== undefined ? Boolean(tpl.storefront_visibility) : (tpl.is_active !== false);
    const supportedSizes = Array.isArray(tpl.supported_sizes) && tpl.supported_sizes.length > 0
      ? tpl.supported_sizes
      : sizes.map((s) => s._id || s.name);
    templateForm.setFieldsValue({
      template_name: tpl.template_name || "",
      slug: tpl.slug || tpl.template_code || tpl.template_id || "",
      template_code: tpl.slug || tpl.template_code || tpl.template_id || "",
      category: tpl.category || "",
      badge: tpl.badge || "",
      description: tpl.description || "",
      supported_sizes: supportedSizes,
      cover_image_url: coverUrl,
      thumbnail_url: coverUrl,
      storefront_visibility: isVisible,
      default_pages: Number(tpl.default_pages || tpl.page_config?.default_pages || 20),
      min_pages: Number(tpl.min_pages || tpl.page_config?.min_pages || 10),
      max_pages: Number(tpl.max_pages || tpl.page_config?.max_pages || 60),
      price_per_extra_page: Number(tpl.price_per_extra_page ?? tpl.page_config?.price_per_extra_page ?? 15),
    });
    setIsTemplateModalOpen(true);
  };

  const handleTemplateNameChange = (e) => {
    const val = e.target.value;
    if (!editingTemplate) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      templateForm.setFieldsValue({ slug: generatedSlug, template_code: generatedSlug });
    }
  };

  const handleCoverUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadImage(formData);
      const url = _.get(res, "data.data.url", "");
      if (url) {
        templateForm.setFieldsValue({ cover_image_url: url, thumbnail_url: url });
        message.success("Cover image uploaded successfully");
      } else {
        message.error("Failed to get uploaded image URL");
      }
    } catch (err) {
      console.error(err);
      message.error("Image upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveTemplateModal = async () => {
    try {
      const values = await templateForm.validateFields();
      const rawSlug = (values.slug || values.template_code || values.template_name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!rawSlug) {
        message.error("Please enter a valid unique slug");
        return;
      }

      // Check unique slug across product's templates
      const isDuplicate = templates.some(
        (t) =>
          (!editingTemplate || t.template_id !== editingTemplate.template_id) &&
          (t.slug?.toLowerCase() === rawSlug ||
            t.template_id?.toLowerCase() === rawSlug ||
            t.template_code?.toLowerCase() === rawSlug)
      );

      if (isDuplicate) {
        message.error(`Unique slug "${rawSlug}" already exists in this product. Slugs must be unique.`);
        return;
      }

      const coverUrl = values.cover_image_url || values.thumbnail_url || "";
      const isVisible = values.storefront_visibility !== false;

      const pageLimits = {
        default_pages: Number(values.default_pages) || 20,
        min_pages: Number(values.min_pages) || 10,
        max_pages: Number(values.max_pages) || 60,
        price_per_extra_page: Number(values.price_per_extra_page) || 15,
      };

      if (editingTemplate) {
        // Edit existing template
        const updated = templates.map((t) =>
          t.template_id === editingTemplate.template_id
            ? {
                ...t,
                ...values,
                supported_sizes: values.supported_sizes || [],
                ...pageLimits,
                page_config: {
                  ...(t.page_config || {}),
                  ...pageLimits,
                },
                slug: rawSlug,
                template_code: rawSlug,
                cover_image_url: coverUrl,
                thumbnail_url: coverUrl,
                storefront_visibility: isVisible,
                is_active: isVisible,
              }
            : t
        );
        onChange(updated);
        message.success(`Template "${values.template_name}" updated`);
      } else {
        // Add new template (manual entry)
        const newTemplateId = rawSlug;
        const newTemplate = {
          _id: newTemplateId,
          template_id: newTemplateId,
          slug: rawSlug,
          template_name: values.template_name,
          template_code: rawSlug,
          category: values.category || "",
          badge: values.badge || "",
          description: values.description || "",
          supported_sizes: values.supported_sizes || sizes.map((s) => s._id || s.name),
          cover_image_url: coverUrl,
          thumbnail_url: coverUrl,
          storefront_visibility: isVisible,
          is_active: isVisible,
          ...pageLimits,
          page_config: {
            ...pageLimits,
          },
          editions: [],
          size_images: {},
          size_pricing: {},
        };
        const updated = [...templates, newTemplate];
        onChange(updated);
        setActiveTemplateId(newTemplateId);
        message.success(`Template "${values.template_name}" created`);
      }
      setIsTemplateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = (templateId, e) => {
    if (e) e.stopPropagation();
    const updated = templates.filter((t) => t.template_id !== templateId);
    onChange(updated);
    if (activeTemplateId === templateId) {
      setActiveTemplateId(null);
    }
    message.success("Template deleted");
  };

  const handleDuplicateTemplate = (tpl, e) => {
    if (e) e.stopPropagation();
    const clonedId = `${tpl.slug || tpl.template_id || "tpl"}-copy-${Date.now().toString().slice(-4)}`;
    const cloned = {
      ..._.cloneDeep(tpl),
      _id: clonedId,
      template_id: clonedId,
      slug: clonedId,
      template_name: `${tpl.template_name} (Copy)`,
      template_code: clonedId,
    };
    const updated = [...templates, cloned];
    onChange(updated);
    message.success(`Duplicated "${tpl.template_name}"`);
  };

  const handleToggleTemplateActive = (templateId, checked, e) => {
    if (e) e.stopPropagation();
    const updated = templates.map((t) =>
      t.template_id === templateId
        ? { ...t, storefront_visibility: checked, is_active: checked }
        : t
    );
    onChange(updated);
    message.info(`Template storefront visibility set to ${checked ? "Visible" : "Hidden"}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EDITION CRUD (100% Manual Entry)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddEditionModal = () => {
    setEditingEdition(null);
    editionForm.resetFields();
    editionForm.setFieldsValue({
      edition_name: "",
      default_pages: null,
      min_pages: null,
      max_pages: null,
      price_per_extra_page: null,
    });
    setIsEditionModalOpen(true);
  };

  const handleOpenEditEditionModal = (edition) => {
    setEditingEdition(edition);
    editionForm.setFieldsValue({
      edition_name: edition.edition_name || "",
      default_pages: edition.default_pages || null,
      min_pages: edition.min_pages || null,
      max_pages: edition.max_pages || null,
      price_per_extra_page: edition.price_per_extra_page ?? null,
    });
    setIsEditionModalOpen(true);
  };

  const handleSaveEditionModal = async () => {
    try {
      const values = await editionForm.validateFields();
      if (!activeTemplate) return;

      const currentEditions = activeTemplate.editions || [];
      let updatedEditions = [];

      if (editingEdition) {
        updatedEditions = currentEditions.map((ed) =>
          ed._id === editingEdition._id
            ? { ...ed, ...values }
            : ed
        );
        message.success(`Edition "${values.edition_name}" updated`);
      } else {
        const newEdition = {
          _id: `ed-${Date.now()}-${uuidv4().substring(0, 5)}`,
          edition_name: values.edition_name,
          price_per_extra_page: Number(values.price_per_extra_page) || 0,
          default_pages: Number(values.default_pages) || 20,
          min_pages: Number(values.min_pages) || 10,
          max_pages: Number(values.max_pages) || 60,
          pricing_by_size: {},
        };
        // Initialize pricing entry for each size
        sizes.forEach((s) => {
          newEdition.pricing_by_size[s._id] = {
            mrp: 0,
            customer_price: 0,
            dealer_price: 0,
            corporate_price: 0,
            extra_page_price: Number(values.price_per_extra_page) || 0,
            product_code: "",
          };
        });
        updatedEditions = [...currentEditions, newEdition];
        message.success(`Edition "${values.edition_name}" added`);
      }

      const updatedTemplates = templates.map((t) =>
        t.template_id === activeTemplate.template_id
          ? { ...t, editions: updatedEditions }
          : t
      );
      onChange(updatedTemplates);
      setIsEditionModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEdition = (editionId) => {
    if (!activeTemplate) return;
    const updatedEditions = (activeTemplate.editions || []).filter(
      (ed) => ed._id !== editionId
    );
    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? { ...t, editions: updatedEditions }
        : t
    );
    onChange(updatedTemplates);
    message.success("Edition removed");
  };

  // Direct manual inline price update for an edition and size (Includes Extra Page Price per size)
  const handleUpdateEditionSizePrice = (editionId, sizeId, field, value) => {
    if (!activeTemplate) return;
    const num = parseFloat(value) || 0;

    const updatedEditions = (activeTemplate.editions || []).map((ed) => {
      if (ed._id !== editionId) return ed;
      const currentPricing = ed.pricing_by_size || {};
      const currentSizePricing = currentPricing[sizeId] || {
        mrp: 0,
        customer_price: 0,
        dealer_price: 0,
        corporate_price: 0,
        extra_page_price: 0,
        product_code: "",
      };

      return {
        ...ed,
        pricing_by_size: {
          ...currentPricing,
          [sizeId]: {
            ...currentSizePricing,
            [field]: field === "product_code" ? value : num,
          },
        },
      };
    });

    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? { ...t, editions: updatedEditions }
        : t
    );
    onChange(updatedTemplates);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SIZE-SPECIFIC IMAGE STUDIO
  // ─────────────────────────────────────────────────────────────────────────────

  const handleUploadImagesForSize = async (e, sizeId) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeTemplate) return;

    try {
      setUploadingImage(true);
      const newImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          message.warning(`"${file.name}" is not an image`);
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          message.warning(`"${file.name}" is too large (max 8MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append("image", file);
        const result = await uploadImage(formData);
        const url = _.get(result, "data.data.url", "");

        if (url) {
          newImages.push({
            _id: `img-${Date.now()}-${uuidv4().substring(0, 5)}`,
            url,
            path: url,
            caption: newImages.length === 0 ? "Cover View" : `Page View ${newImages.length + 1}`,
            is_cover: false,
          });
        }
      }

      if (newImages.length > 0) {
        const currentSizeImages = activeTemplate.size_images?.[sizeId] || [];
        const combined = [...currentSizeImages, ...newImages];
        if (combined.length > 0 && !combined.some((img) => img.is_cover)) {
          combined[0].is_cover = true;
        }

        const updatedTemplates = templates.map((t) =>
          t.template_id === activeTemplate.template_id
            ? {
                ...t,
                size_images: {
                  ...(t.size_images || {}),
                  [sizeId]: combined,
                },
                thumbnail_url: t.thumbnail_url || combined[0]?.url || "",
              }
            : t
        );
        onChange(updatedTemplates);
        message.success(`Uploaded ${newImages.length} image(s) for this size`);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to upload image(s)");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteSizeImage = (sizeId, imageId) => {
    if (!activeTemplate) return;
    const currentSizeImages = activeTemplate.size_images?.[sizeId] || [];
    const filtered = currentSizeImages.filter((img) => img._id !== imageId);
    if (filtered.length > 0 && !filtered.some((img) => img.is_cover)) {
      filtered[0].is_cover = true;
    }

    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? {
            ...t,
            size_images: {
              ...(t.size_images || {}),
              [sizeId]: filtered,
            },
          }
        : t
    );
    onChange(updatedTemplates);
    message.success("Image removed");
  };

  const handleSetCoverImage = (sizeId, imageId) => {
    if (!activeTemplate) return;
    const currentSizeImages = activeTemplate.size_images?.[sizeId] || [];
    const targetImage = currentSizeImages.find((img) => img._id === imageId);
    const updatedImages = currentSizeImages.map((img) => ({
      ...img,
      is_cover: img._id === imageId,
    }));

    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? {
            ...t,
            thumbnail_url: targetImage ? targetImage.url : t.thumbnail_url,
            size_images: {
              ...(t.size_images || {}),
              [sizeId]: updatedImages,
            },
          }
        : t
    );
    onChange(updatedTemplates);
    message.success("Set as primary cover image");
  };

  const handleMoveImage = (sizeId, fromIndex, toIndex) => {
    if (!activeTemplate) return;
    const currentSizeImages = [...(activeTemplate.size_images?.[sizeId] || [])];
    if (toIndex < 0 || toIndex >= currentSizeImages.length) return;

    const [moved] = currentSizeImages.splice(fromIndex, 1);
    currentSizeImages.splice(toIndex, 0, moved);

    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? {
            ...t,
            size_images: {
              ...(t.size_images || {}),
              [sizeId]: currentSizeImages,
            },
          }
        : t
    );
    onChange(updatedTemplates);
  };

  const handleCopyImagesToAnotherSize = (sourceSizeId, targetSizeId) => {
    if (!activeTemplate || !sourceSizeId || !targetSizeId) return;
    const sourceImages = activeTemplate.size_images?.[sourceSizeId] || [];
    if (sourceImages.length === 0) {
      message.warning("Source size has no images to copy");
      return;
    }

    const clonedImages = sourceImages.map((img) => ({
      ...img,
      _id: `img-${Date.now()}-${uuidv4().substring(0, 5)}`,
    }));

    const updatedTemplates = templates.map((t) =>
      t.template_id === activeTemplate.template_id
        ? {
            ...t,
            size_images: {
              ...(t.size_images || {}),
              [targetSizeId]: clonedImages,
            },
          }
        : t
    );
    onChange(updatedTemplates);
    message.success(`Copied ${clonedImages.length} images to target size`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: GRID VIEW OF TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────

  if (!activeTemplate) {
    return (
      <div className="space-y-4">
        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-teal-50/70 border border-teal-200 rounded-xl">
          <div>
            <h4 className="text-base font-semibold text-teal-950 m-0 flex items-center gap-2">
              <BookOutlined className="text-teal-600" />
              Photo Book Templates &amp; Editions Studio
            </h4>
            <p className="text-xs text-teal-700 m-0 mt-0.5">
              Manual entry for templates, editions, per-size extra page rates, and size-specific images.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onSyncVariants && (
              <Button
                type="default"
                icon={<SwapOutlined />}
                onClick={onSyncVariants}
                className="!border-teal-600 !text-teal-700 hover:!bg-teal-50"
                size="middle"
              >
                Sync to Pricing Matrix
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddTemplateModal}
              className="!bg-teal-600 hover:!bg-teal-700 text-white font-medium"
              size="middle"
            >
              Add New Template
            </Button>
          </div>
        </div>

        {/* Template Cards Grid */}
        {templates.length === 0 ? (
          <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-1">
                  <span className="text-gray-700 font-medium">No Templates Added Yet</span>
                  <p className="text-xs text-gray-500">
                    Click &quot;Add New Template&quot; to manually enter template details, editions, and upload mockups.
                  </p>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenAddTemplateModal}
                className="!bg-teal-600 hover:!bg-teal-700"
              >
                Add New Template
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const editionsCount = (tpl.editions || []).length;
              const configuredSizesCount = Object.keys(tpl.size_images || {}).filter(
                (szId) => (tpl.size_images[szId] || []).length > 0
              ).length;

              return (
                <Card
                  key={tpl.template_id}
                  hoverable
                  onClick={() => setActiveTemplateId(tpl.template_id)}
                  className={`border transition-all duration-200 cursor-pointer overflow-hidden ${
                    tpl.is_active ? "border-gray-200 hover:border-teal-500 shadow-sm" : "border-gray-200 opacity-60 bg-gray-50"
                  }`}
                  bodyStyle={{ padding: "16px" }}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {tpl.cover_image_url || tpl.thumbnail_url ? (
                        <img
                          src={tpl.cover_image_url || tpl.thumbnail_url}
                          alt={tpl.template_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PictureOutlined className="text-2xl text-gray-300" />
                      )}
                      {tpl.badge && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {tpl.badge}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate m-0" title={tpl.template_name}>
                          {tpl.template_name}
                        </h4>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            size="small"
                            checked={tpl.storefront_visibility !== false && tpl.is_active !== false}
                            onChange={(chk, e) => handleToggleTemplateActive(tpl.template_id, chk, e)}
                            title="Toggle storefront visibility"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Tag
                          color={tpl.storefront_visibility !== false && tpl.is_active !== false ? "green" : "default"}
                          className="text-[10px] m-0 font-medium"
                        >
                          {tpl.storefront_visibility !== false && tpl.is_active !== false
                            ? "Storefront: Visible"
                            : "Storefront: Hidden"}
                        </Tag>
                        {tpl.category && (
                          <Tag color="cyan" className="text-[10px] m-0 font-medium">
                            {tpl.category}
                          </Tag>
                        )}
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          slug: {tpl.slug || tpl.template_code || tpl.template_id}
                        </span>
                      </div>

                      {/* Supported Sizes */}
                      {Array.isArray(tpl.supported_sizes) && tpl.supported_sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tpl.supported_sizes.map((szId) => {
                            const matchedSz = sizes.find((s) => s._id === szId || s.name === szId);
                            return (
                              <Tag key={szId} className="text-[10px] m-0 bg-slate-100 text-slate-600 border-slate-200">
                                {matchedSz?.name || szId}
                              </Tag>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>
                          <strong>{editionsCount}</strong> Edition{editionsCount !== 1 ? "s" : ""}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{configuredSizesCount}</strong> / {sizes.length} Sizes Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div
                    className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handleOpenEditTemplateModal(tpl, e)}
                      className="!p-0 text-blue-600 text-xs"
                    >
                      Settings
                    </Button>
                    <div className="flex items-center gap-1">
                      <Tooltip title="Duplicate Template">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={(e) => handleDuplicateTemplate(tpl, e)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete this template?"
                        description="All configured editions and size images for this template will be removed."
                        onConfirm={(e) => handleDeleteTemplate(tpl.template_id, e)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setActiveTemplateId(tpl.template_id)}
                        className="!bg-teal-600 hover:!bg-teal-700 text-white text-xs ml-1"
                      >
                        Manage &rarr;
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Template Modal */}
        <Modal
          title={editingTemplate ? "Edit Photo Book Template" : "Add New Photo Book Template"}
          open={isTemplateModalOpen}
          onOk={handleSaveTemplateModal}
          onCancel={() => setIsTemplateModalOpen(false)}
          okText={editingTemplate ? "Update Template" : "Create Template"}
          okButtonProps={{ className: "!bg-teal-600 hover:!bg-teal-700" }}
          destroyOnClose
        >
          <Form form={templateForm} layout="vertical" className="mt-4">
            <Form.Item
              name="template_name"
              label={<span className="font-semibold text-gray-800">Template Name</span>}
              rules={[{ required: true, message: "Please enter template name" }]}
            >
              <Input
                placeholder="Enter template name (e.g. Royal Wedding, Baby Milestone)"
                className="h-10"
                onChange={handleTemplateNameChange}
              />
            </Form.Item>

            <Form.Item
              name="slug"
              label={
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800">Unique Slug</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    (Unique identifier used across product and editor)
                  </span>
                </div>
              }
              rules={[
                { required: true, message: "Please enter unique slug" },
                {
                  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: "Slug must be lowercase alphanumeric with hyphens (e.g. royal-wedding)",
                },
              ]}
              extra="Auto-generated from template name. Must be unique for this product."
            >
              <Input placeholder="e.g. royal-wedding, modern-baby-story" className="h-10 font-mono text-sm" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="category" label={<span className="font-semibold text-gray-800">Category / Theme</span>}>
                <Select
                  placeholder="Select or type category"
                  showSearch
                  allowClear
                  options={[
                    { value: "Wedding", label: "Wedding" },
                    { value: "Baby & Kids", label: "Baby & Kids" },
                    { value: "Travel", label: "Travel" },
                    { value: "Family", label: "Family" },
                    { value: "Anniversary", label: "Anniversary" },
                    { value: "Portfolio", label: "Portfolio" },
                    { value: "Graduation", label: "Graduation" },
                    { value: "General", label: "General" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="badge" label={<span className="font-semibold text-gray-800">Promo Badge (Optional)</span>}>
                <Input placeholder="e.g. Popular, Wedding, New, Bestseller" className="h-10" />
              </Form.Item>
            </div>

            {/* Cover Image URL + Upload */}
            <Form.Item
              label={<span className="font-semibold text-gray-800">Cover Image URL</span>}
              extra="Image shown to customer in template selection and preview."
            >
              <div className="flex gap-2">
                <Form.Item name="cover_image_url" noStyle>
                  <Input placeholder="https://..." className="h-10 flex-1" />
                </Form.Item>
                <label className="cursor-pointer px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  {uploadingCover ? <Spin size="small" /> : <UploadOutlined />}
                  <span>{uploadingCover ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUploadFile}
                    disabled={uploadingCover}
                  />
                </label>
              </div>
            </Form.Item>

            <Form.Item name="description" label={<span className="font-semibold text-gray-800">Description</span>}>
              <Input.TextArea
                rows={2}
                placeholder="Enter description shown on storefront preview..."
              />
            </Form.Item>

            {/* Supported Book Sizes */}
            <Form.Item
              name="supported_sizes"
              label={<span className="font-semibold text-gray-800">Supported Book Sizes</span>}
              extra="Select which book sizes from Section 1 are compatible with this template."
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Select compatible book sizes..."
                className="w-full"
                options={sizes.map((s) => ({
                  label: `${s.name} ${s.dimensions ? `(${s.dimensions})` : ""}`,
                  value: s._id || s.name,
                }))}
              />
            </Form.Item>

            {/* Template Page Limits & Pricing */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800 text-xs block">Page Limits & Extra Page Surcharge</span>
                  <span className="text-[11px] text-gray-500">
                    Template-specific default pages, min/max limits and extra page surcharge
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <Form.Item
                  name="default_pages"
                  label={<span className="text-[11px] font-medium text-gray-700">Default Pages</span>}
                  initialValue={20}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber min={4} max={200} className="w-full h-9" />
                </Form.Item>
                <Form.Item
                  name="min_pages"
                  label={<span className="text-[11px] font-medium text-gray-700">Min Pages</span>}
                  initialValue={10}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber min={4} max={100} className="w-full h-9" />
                </Form.Item>
                <Form.Item
                  name="max_pages"
                  label={<span className="text-[11px] font-medium text-gray-700">Max Pages</span>}
                  initialValue={60}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber min={10} max={300} className="w-full h-9" />
                </Form.Item>
                <Form.Item
                  name="price_per_extra_page"
                  label={<span className="text-[11px] font-medium text-gray-700">Extra Page (₹)</span>}
                  initialValue={15}
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber min={0} step={1} className="w-full h-9" />
                </Form.Item>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-800 text-xs block">Storefront Visibility</span>
                <span className="text-[11px] text-gray-500">
                  When enabled, customers can select this template in the storefront. Hidden templates remain accessible in admin.
                </span>
              </div>
              <Form.Item name="storefront_visibility" valuePropName="checked" noStyle>
                <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: DETAIL WORKSPACE FOR ACTIVE TEMPLATE
  // ─────────────────────────────────────────────────────────────────────────────

  const activeSizeImages = activeTemplate.size_images?.[activeSizeId] || [];
  const currentActiveSize = sizes.find((s) => s._id === activeSizeId) || sizes[0];

  return (
    <div className="space-y-5">
      {/* Detail Header Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setActiveTemplateId(null)}
            className="!border-teal-600 !text-teal-700 hover:!bg-teal-100"
          >
            Back to Templates
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-teal-950 m-0">
                {activeTemplate.template_name}
              </h3>
              {activeTemplate.badge && (
                <Tag color="orange" className="font-semibold text-xs">
                  {activeTemplate.badge}
                </Tag>
              )}
              {activeTemplate.category && (
                <Tag color="cyan" className="text-xs">
                  {activeTemplate.category}
                </Tag>
              )}
            </div>
            <p className="text-xs text-teal-700 m-0 mt-0.5">
              Code: <span className="font-mono">{activeTemplate.template_code || "N/A"}</span> • Configure editions, pricing &amp; extra page rates per size, and size-specific images.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={(e) => handleOpenEditTemplateModal(activeTemplate, e)}
            size="small"
          >
            Edit Template Info
          </Button>
        </div>
      </div>

      {/* Main Tabs Workspace */}
      <Tabs
        type="card"
        defaultActiveKey="editions"
        items={[
          // TAB 1: EDITIONS & PRICING MATRIX (With Extra Page Price Per Size)
          {
            key: "editions",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <DollarOutlined />
                1. Editions, Pricing &amp; Extra Page Price per Size
                <Badge count={(activeTemplate.editions || []).length} className="ml-1" />
              </span>
            ),
            children: (
              <div className="space-y-4 pt-1">
                {/* Editions Header */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Add custom editions (e.g. <strong>Softcover</strong>, <strong>Hardcover</strong>, <strong>Layflat</strong>). For each edition and for each size, manually set base price, dealer price, corporate price, and <strong>extra page price</strong>.
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddEditionModal}
                    className="!bg-teal-600 hover:!bg-teal-700 text-white"
                    size="small"
                  >
                    Add Edition
                  </Button>
                </div>

                {/* Editions List */}
                {(activeTemplate.editions || []).length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm mb-3">No editions added for this template yet.</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenAddEditionModal}
                      className="!bg-teal-600 hover:!bg-teal-700"
                    >
                      Add Edition
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(activeTemplate.editions || []).map((edition, edIndex) => (
                      <Card
                        key={edition._id}
                        size="small"
                        className="border border-gray-200 shadow-sm overflow-hidden"
                        title={
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 text-sm">
                                #{edIndex + 1}. {edition.edition_name}
                              </span>
                              {edition.default_pages && (
                                <Tag color="blue" className="text-xs">
                                  Default: {edition.default_pages} Pages
                                </Tag>
                              )}
                              {(edition.min_pages || edition.max_pages) && (
                                <Tag color="purple" className="text-xs">
                                  Limits: {edition.min_pages || 10} - {edition.max_pages || 60} Pages
                                </Tag>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="text"
                                icon={<EditOutlined className="text-blue-500" />}
                                onClick={() => handleOpenEditEditionModal(edition)}
                                size="small"
                              >
                                Edit Limits
                              </Button>
                              <Popconfirm
                                title="Remove this edition?"
                                onConfirm={() => handleDeleteEdition(edition._id)}
                                okText="Yes, Remove"
                                okButtonProps={{ danger: true }}
                              >
                                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                              </Popconfirm>
                            </div>
                          </div>
                        }
                      >
                        {sizes.length === 0 ? (
                          <div className="p-4 text-center text-xs text-amber-700 bg-amber-50 rounded-lg">
                            No Photo Book sizes created yet in Section 1. Please add sizes above first to configure pricing per size.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                                  <th className="p-2.5 font-semibold">Size</th>
                                  <th className="p-2.5 font-semibold">Dimensions</th>
                                  <th className="p-2.5 font-semibold">MRP / Cost (₹)</th>
                                  <th className="p-2.5 font-semibold">Customer Price (₹)</th>
                                  <th className="p-2.5 font-semibold">Dealer Price (₹)</th>
                                  <th className="p-2.5 font-semibold">Corporate Price (₹)</th>
                                  <th className="p-2.5 font-semibold bg-amber-50 text-amber-900 border-x border-amber-200">
                                    ★ Extra Page Price (₹)
                                  </th>
                                  <th className="p-2.5 font-semibold">Product SKU</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sizes.map((sz) => {
                                  const pricing = edition.pricing_by_size?.[sz._id] || {};
                                  return (
                                    <tr key={sz._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                      <td className="p-2.5 font-medium text-gray-900">
                                        {sz.name}
                                        {sz.is_available === false && (
                                          <Tag color="default" className="text-[10px] ml-1">Hidden</Tag>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-gray-500 font-mono text-[11px]">
                                        {sz.width_in}&quot; × {sz.height_in}&quot; ({sz.width_cm} × {sz.height_cm} cm)
                                      </td>
                                      <td className="p-2">
                                        <InputNumber
                                          min={0}
                                          value={pricing.mrp || 0}
                                          onChange={(v) => handleUpdateEditionSizePrice(edition._id, sz._id, "mrp", v)}
                                          className="w-24 h-8 text-xs"
                                          prefix="₹"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <InputNumber
                                          min={0}
                                          value={pricing.customer_price || 0}
                                          onChange={(v) => handleUpdateEditionSizePrice(edition._id, sz._id, "customer_price", v)}
                                          className="w-24 h-8 text-xs"
                                          prefix="₹"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <InputNumber
                                          min={0}
                                          value={pricing.dealer_price || 0}
                                          onChange={(v) => handleUpdateEditionSizePrice(edition._id, sz._id, "dealer_price", v)}
                                          className="w-24 h-8 text-xs"
                                          prefix="₹"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <InputNumber
                                          min={0}
                                          value={pricing.corporate_price || 0}
                                          onChange={(v) => handleUpdateEditionSizePrice(edition._id, sz._id, "corporate_price", v)}
                                          className="w-24 h-8 text-xs"
                                          prefix="₹"
                                        />
                                      </td>
                                      {/* Per-Size Extra Page Price Column */}
                                      <td className="p-2 bg-amber-50/50 border-x border-amber-200">
                                        <InputNumber
                                          min={0}
                                          step={1}
                                          value={pricing.extra_page_price ?? edition.price_per_extra_page ?? 0}
                                          onChange={(v) => handleUpdateEditionSizePrice(edition._id, sz._id, "extra_page_price", v)}
                                          className="w-24 h-8 text-xs font-semibold"
                                          prefix="₹"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          placeholder="SKU"
                                          value={pricing.product_code || ""}
                                          onChange={(e) => handleUpdateEditionSizePrice(edition._id, sz._id, "product_code", e.target.value)}
                                          className="w-28 h-8 text-xs font-mono"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },

          // TAB 2: SIZE-SPECIFIC IMAGE STUDIO
          {
            key: "images",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <PictureOutlined />
                2. Size-Specific Images Studio
                <Tag color="cyan" className="ml-1 text-[11px] font-mono">
                  {Object.values(activeTemplate.size_images || {}).flat().length} Total Imgs
                </Tag>
              </span>
            ),
            children: (
              <div className="space-y-4 pt-1">
                {sizes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-amber-700 bg-amber-50 rounded-lg">
                    No sizes created yet in Section 1. Please add sizes above first to upload images for each size.
                  </div>
                ) : (
                  <>
                    {/* Size Selection Pill Bar */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-700">
                          Step 1: Select Size to manage renders &amp; mockups:
                        </span>
                        {sizes.length > 1 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-500">Copy to {currentActiveSize?.name} from:</span>
                            <Select
                              size="small"
                              placeholder="Choose source size"
                              className="w-36"
                              onChange={(sourceId) => handleCopyImagesToAnotherSize(sourceId, activeSizeId)}
                              options={sizes
                                .filter((s) => s._id !== activeSizeId)
                                .map((s) => ({
                                  value: s._id,
                                  label: `${s.name} (${(activeTemplate.size_images?.[s._id] || []).length} imgs)`,
                                }))}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {sizes.map((sz) => {
                          const count = (activeTemplate.size_images?.[sz._id] || []).length;
                          const isSelected = sz._id === activeSizeId;
                          return (
                            <button
                              key={sz._id}
                              type="button"
                              onClick={() => setActiveSizeId(sz._id)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                                isSelected
                                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <span>{sz.name}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                  isSelected
                                    ? "bg-teal-700 text-teal-100"
                                    : count > 0
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {count} img{count !== 1 ? "s" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Upload Section for Selected Size */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm m-0 flex items-center gap-2">
                            <span>Mockups for: <strong>{currentActiveSize?.name}</strong></span>
                            <span className="text-xs text-gray-400 font-mono">
                              ({currentActiveSize?.width_in}&quot; × {currentActiveSize?.height_in}&quot; aspect)
                            </span>
                          </h4>
                          <p className="text-xs text-gray-500 m-0 mt-0.5">
                            Rendered on the storefront when the customer selects <strong>{activeTemplate.template_name}</strong> and <strong>{currentActiveSize?.name}</strong>.
                          </p>
                        </div>

                        <label
                          htmlFor={`size-upload-${activeSizeId}`}
                          className="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                        >
                          {uploadingImage ? <Spin size="small" /> : <UploadOutlined />}
                          Upload {currentActiveSize?.name} Images
                        </label>
                        <input
                          id={`size-upload-${activeSizeId}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleUploadImagesForSize(e, activeSizeId)}
                          disabled={uploadingImage}
                        />
                      </div>

                      {/* Image Thumbnails Gallery */}
                      {activeSizeImages.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <PictureOutlined className="text-3xl text-gray-300 mb-2" />
                          <p className="text-xs text-gray-500 m-0">
                            No images uploaded yet for <strong>{currentActiveSize?.name}</strong>.
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Upload cover mockups, open 2-page spreads, and sample pages for this size.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {activeSizeImages.map((img, index) => (
                            <div
                              key={img._id}
                              className={`group relative rounded-xl border-2 overflow-hidden bg-gray-50 flex flex-col transition-all ${
                                img.is_cover ? "border-amber-500 ring-2 ring-amber-200 shadow-md" : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img
                                  src={img.url}
                                  alt={img.caption || `Mockup ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-0 bottom-0 left-0 w-2 bg-black/25 pointer-events-none" />

                                {img.is_cover && (
                                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                    Cover
                                  </span>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                                  {index > 0 && (
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<ArrowLeftOutlined className="text-white" />}
                                      onClick={() => handleMoveImage(activeSizeId, index, index - 1)}
                                    />
                                  )}
                                  {!img.is_cover && (
                                    <Tooltip title="Set as primary cover">
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<StarOutlined className="text-amber-400" />}
                                        onClick={() => handleSetCoverImage(activeSizeId, img._id)}
                                      />
                                    </Tooltip>
                                  )}
                                  {index < activeSizeImages.length - 1 && (
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<ArrowRightOutlined className="text-white" />}
                                      onClick={() => handleMoveImage(activeSizeId, index, index + 1)}
                                    />
                                  )}
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined className="text-red-400" />}
                                    onClick={() => handleDeleteSizeImage(activeSizeId, img._id)}
                                  />
                                </div>
                              </div>

                              <div className="p-1.5 text-center bg-white border-t border-gray-100">
                                <span className="text-[11px] font-medium text-gray-700 truncate block">
                                  {img.is_cover ? "★ Cover View" : `View #${index + 1}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ),
          },

          // TAB 3: LIVE STOREFRONT SIMULATION / PREVIEW
          {
            key: "preview",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <EyeOutlined />
                3. Live Customer View Preview
              </span>
            ),
            children: (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white m-0 flex items-center gap-2">
                      <CheckCircleOutlined className="text-teal-400" />
                      Storefront Rendering Inspector
                    </h4>
                    <p className="text-xs text-slate-300 m-0 mt-0.5">
                      Select a Size and Edition to test the exact mockups and price calculation rendered to customers:
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Select Size:</span>
                      <Select
                        size="small"
                        value={previewSizeId}
                        onChange={(sz) => {
                          setPreviewSizeId(sz);
                          setPreviewImageIndex(0);
                        }}
                        className="w-36"
                        options={sizes.map((s) => ({ value: s._id, label: s.name }))}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Select Edition:</span>
                      <Select
                        size="small"
                        value={previewEditionId || (activeTemplate.editions?.[0]?._id ?? null)}
                        onChange={(ed) => setPreviewEditionId(ed)}
                        className="w-44"
                        options={(activeTemplate.editions || []).map((e) => ({
                          value: e._id,
                          label: e.edition_name,
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const targetSize = sizes.find((s) => s._id === previewSizeId) || sizes[0];
                  const targetEdition =
                    (activeTemplate.editions || []).find(
                      (e) => e._id === (previewEditionId || activeTemplate.editions?.[0]?._id)
                    ) || null;

                  const renderedImages =
                    activeTemplate.size_images?.[targetSize?._id] || [];

                  const sizePricing = targetEdition?.pricing_by_size?.[targetSize?._id] || {};
                  const baseCustomerPrice = sizePricing.customer_price || 0;
                  const extraPageCost = sizePricing.extra_page_price ?? targetEdition?.price_per_extra_page ?? 0;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {/* Left: Book Mockup Simulation */}
                      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl border border-gray-300">
                        {renderedImages.length > 0 ? (
                          <div className="space-y-4 w-full flex flex-col items-center">
                            <div
                              className="relative max-w-xs w-full rounded-lg overflow-hidden shadow-2xl border-4 border-white ring-1 ring-black/10 bg-white"
                              style={{
                                aspectRatio: `${targetSize?.width_in || 1} / ${targetSize?.height_in || 1}`,
                              }}
                            >
                              <img
                                src={renderedImages[previewImageIndex]?.url || renderedImages[0]?.url}
                                alt="Storefront render"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                              {renderedImages.map((img, i) => (
                                <button
                                  key={img._id}
                                  type="button"
                                  onClick={() => setPreviewImageIndex(i)}
                                  className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 ${
                                    previewImageIndex === i ? "border-teal-600 ring-2 ring-teal-200" : "border-gray-300 opacity-60"
                                  }`}
                                >
                                  <img src={img.url} alt="Thumb" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              Showing mockup {previewImageIndex + 1} of {renderedImages.length} for <strong>{targetSize?.name}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-400">
                            <PictureOutlined className="text-4xl mb-2 text-gray-300" />
                            <p className="text-xs">No mockups uploaded yet for {targetSize?.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Price & Specs Breakdown */}
                      <div className="space-y-4 flex flex-col justify-center">
                        <div>
                          <Tag color="cyan" className="font-semibold text-xs">
                            {activeTemplate.template_name}
                          </Tag>
                          <h3 className="text-lg font-bold text-gray-900 mt-1 mb-0">
                            {targetEdition?.edition_name || "Select Edition"} ({targetSize?.name || "Size"})
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Customer aspect: {targetSize?.width_in}&quot; × {targetSize?.height_in}&quot; ({targetSize?.width_cm} × {targetSize?.height_cm} cm)
                          </p>
                        </div>

                        <Divider className="my-2" />

                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200 text-xs">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Base Price (Includes {targetEdition?.default_pages || 20} Pages):</span>
                            <span className="text-sm font-bold text-teal-700">₹{baseCustomerPrice}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Per-Size Extra Page Surcharge:</span>
                            <span className="font-semibold text-amber-700">₹{extraPageCost} / sheet</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Dealer Price:</span>
                            <span className="font-semibold text-blue-700">₹{sizePricing.dealer_price || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Corporate Price:</span>
                            <span className="font-semibold text-purple-700">₹{sizePricing.corporate_price || 0}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900">
                          <strong>Formula Verified:</strong> If ordered in <strong>{targetSize?.name}</strong> with <strong>30 pages</strong> (+10 extra pages):
                          <div className="mt-1 font-mono font-bold text-sm text-teal-800">
                            ₹{baseCustomerPrice} + (10 × ₹{extraPageCost}) = ₹{baseCustomerPrice + 10 * extraPageCost}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ),
          },
        ]}
      />

      {/* Edition Create/Edit Modal (100% Manual Entry) */}
      <Modal
        title={editingEdition ? "Edit Edition" : "Add New Edition"}
        open={isEditionModalOpen}
        onOk={handleSaveEditionModal}
        onCancel={() => setIsEditionModalOpen(false)}
        okText={editingEdition ? "Update Edition" : "Add Edition"}
        okButtonProps={{ className: "!bg-teal-600 hover:!bg-teal-700" }}
        destroyOnClose
      >
        <Form form={editionForm} layout="vertical" className="mt-4">
          <Form.Item
            name="edition_name"
            label="Edition Name"
            rules={[{ required: true, message: "Please enter edition name" }]}
          >
            <Input placeholder="Enter edition name (e.g. Softcover, Hardcover, Layflat)" className="h-10" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="price_per_extra_page"
              label="Default Extra Page Price (₹)"
            >
              <InputNumber min={0} step={1} className="w-full h-10" prefix="₹" placeholder="Default surcharge" />
            </Form.Item>
            <Form.Item
              name="default_pages"
              label="Default Included Pages"
            >
              <InputNumber min={1} max={500} className="w-full h-10" placeholder="e.g. 20" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="min_pages" label="Minimum Allowed Pages">
              <InputNumber min={1} max={500} className="w-full h-10" placeholder="e.g. 10" />
            </Form.Item>
            <Form.Item name="max_pages" label="Maximum Allowed Pages">
              <InputNumber min={1} max={500} className="w-full h-10" placeholder="e.g. 80" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PhotoBookTemplateManager;
