import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPhotoBookTemplates,
  createPhotoBookTemplate,
  duplicatePhotoBookTemplate,
  archivePhotoBookTemplate,
  deletePhotoBookTemplate,
  updatePhotoBookTemplate,
  getAvailableProductTemplates,
} from "../../api";
import {
  Button,
  Card,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Checkbox,
  Spin,
  Popconfirm,
  message,
  Dropdown,
  Tooltip,
  Alert,
} from "antd";
import {
  MdAdd,
  MdSearch,
  MdAutoAwesome,
  MdContentCopy,
  MdArchive,
  MdUnarchive,
  MdDeleteOutline,
  MdEdit,
  MdOutlineAutoStories,
  MdGridView,
  MdFilterList,
  MdOpenInNew,
} from "react-icons/md";
import BookPreviewModal from "./BookPreviewModal";

const CATEGORIES = [
  "All",
  "Wedding",
  "Baby & Kids",
  "Travel",
  "Family",
  "Anniversary",
  "Portfolio",
  "Graduation",
  "General",
];

const BOOK_SIZES = ["A4", "A5", "12x12 inch", "A3", "A4 V", "Square"];

const TemplateList = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [productTemplates, setProductTemplates] = useState([]);
  const [loadingProductTemplates, setLoadingProductTemplates] = useState(false);
  const [selectedProductTemplate, setSelectedProductTemplate] = useState(null);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Open Create Modal & load product templates
  const handleOpenCreateModal = async () => {
    setCreateModalOpen(true);
    setSelectedProductTemplate(null);
    createForm.resetFields();
    createForm.setFieldsValue({
      category: "Wedding",
      supported_sizes: ["A4", "A5", "12x12 inch", "A3"],
      default_pages: 20,
      min_pages: 10,
      max_pages: 60,
      aspect_ratio: "1:1",
    });

    try {
      setLoadingProductTemplates(true);
      const res = await getAvailableProductTemplates();
      setProductTemplates(res.data?.data || []);
    } catch (err) {
      console.error("Error loading product templates:", err);
      message.error("Failed to load available product template configurations");
    } finally {
      setLoadingProductTemplates(false);
    }
  };

  const handleSelectProductTemplate = (selectedVal) => {
    if (!selectedVal) {
      setSelectedProductTemplate(null);
      return;
    }
    const found = productTemplates.find(
      (t) =>
        String(t.product_template_id) === String(selectedVal) ||
        String(t.slug) === String(selectedVal) ||
        String(t.template_id) === String(selectedVal)
    );
    if (found) {
      setSelectedProductTemplate(found);
      createForm.setFieldsValue({
        template_name: found.template_name || "",
        template_id: found.slug || found.template_id || "",
        category: found.category || "General",
        description: found.description || "",
        supported_sizes:
          Array.isArray(found.supported_sizes) && found.supported_sizes.length > 0
            ? found.supported_sizes
            : ["A4", "A5", "12x12 inch", "A3"],
        default_pages: found.default_pages || 20,
        min_pages: found.min_pages || 10,
        max_pages: found.max_pages || 60,
        exact_pages: found.exact_pages || found.default_pages || 20,
      });
    }
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedStatus !== "All") params.status = selectedStatus;

      const res = await getPhotoBookTemplates(params);
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      message.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [search, selectedCategory, selectedStatus]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = templates.length;
    const published = templates.filter((t) => t.status === "published").length;
    const drafts = templates.filter((t) => t.status === "draft").length;
    const archived = templates.filter((t) => t.status === "archived").length;
    return { total, published, drafts, archived };
  }, [templates]);

  // Handle Create Template
  const handleCreate = async (values) => {
    if (!selectedProductTemplate) {
      message.error("Please select a template configuration from the Custom Photo Book product to proceed.");
      return;
    }

    if (selectedProductTemplate?.has_design) {
      message.warning("A visual design already exists for this template. Please open and edit the existing design.");
      return;
    }

    try {
      setCreating(true);
      const targetSlug =
        values.template_id ||
        selectedProductTemplate?.slug ||
        selectedProductTemplate?.template_id ||
        `pb_${values.template_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`;

      const isGiveaway = Boolean(selectedProductTemplate?.is_giveaway);
      const exactPages = Number(values.exact_pages || selectedProductTemplate?.exact_pages || selectedProductTemplate?.default_pages || values.default_pages || 20);

      const payload = {
        template_name: values.template_name || selectedProductTemplate.template_name,
        template_id: targetSlug,
        category: values.category || selectedProductTemplate?.category || "General",
        badge: selectedProductTemplate?.badge || "",
        description: values.description || selectedProductTemplate?.description || "",
        is_giveaway: isGiveaway,
        exact_pages: exactPages,
        thumbnail_url:
          selectedProductTemplate?.cover_image_url || selectedProductTemplate?.thumbnail_url || "",
        cover_image_url:
          selectedProductTemplate?.cover_image_url || selectedProductTemplate?.thumbnail_url || "",
        product_id: selectedProductTemplate?.product_id || null,
        product_template_id: selectedProductTemplate?.product_template_id || selectedProductTemplate?.slug || null,
        supported_sizes: values.supported_sizes || selectedProductTemplate?.supported_sizes || ["A4", "A5", "12x12 inch", "A3"],
        page_config: {
          is_giveaway: isGiveaway,
          exact_pages: exactPages,
          min_pages: isGiveaway ? exactPages : Number(values.min_pages || selectedProductTemplate?.min_pages || 10),
          max_pages: isGiveaway ? exactPages : Number(values.max_pages || selectedProductTemplate?.max_pages || 60),
          default_pages: isGiveaway ? exactPages : Number(values.default_pages || selectedProductTemplate?.default_pages || 20),
          aspect_ratio: values.aspect_ratio || "1:1",
        },
      };

      const res = await createPhotoBookTemplate(payload);
      message.success("Template design created successfully!");
      setCreateModalOpen(false);
      createForm.resetFields();
      setSelectedProductTemplate(null);
      fetchTemplates();

      // Open visual editor directly for the new template
      const newId = res.data?.data?._id;
      if (newId) {
        navigate(`/photobook-editor/${newId}`);
      }
    } catch (err) {
      console.error("Create template error:", err);
      message.error(err.response?.data?.message || "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (id) => {
    try {
      await duplicatePhotoBookTemplate(id);
      message.success("Template duplicated successfully!");
      fetchTemplates();
    } catch (err) {
      console.error("Duplicate error:", err);
      message.error("Failed to duplicate template");
    }
  };

  // Handle Archive / Restore
  const handleArchive = async (id) => {
    try {
      const res = await archivePhotoBookTemplate(id);
      message.success(res.data?.message || "Status updated");
      fetchTemplates();
    } catch (err) {
      console.error("Archive error:", err);
      message.error("Failed to update status");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await deletePhotoBookTemplate(id);
      message.success("Template deleted successfully");
      fetchTemplates();
    } catch (err) {
      console.error("Delete error:", err);
      message.error("Failed to delete template");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Photo Book Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Design multi-page reusable photo book templates with Canva-like visual
            editing and photo-frame clipping.
          </p>
        </div>

        <Button
          type="primary"
          icon={<MdAdd size={18} />}
          onClick={handleOpenCreateModal}
          className="!bg-teal-600 hover:!bg-teal-700 !border-teal-600 font-semibold shadow-sm"
        >
          Create New Template
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Templates
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">
            {stats.total}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Published & Active
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {stats.published}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
            Drafts in Progress
          </span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            {stats.drafts}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Archived
          </span>
          <span className="text-2xl font-bold text-slate-600 mt-1 block">
            {stats.archived}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex-1 w-full sm:w-auto relative">
          <Input
            placeholder="Search templates by name, ID or description..."
            prefix={<MdSearch className="text-slate-400 mr-1" size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            className="w-36"
            options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          />
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-32"
            options={[
              { value: "All", label: "All Status" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Spin size="large" />
        </div>
      ) : templates.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <MdAutoAwesome className="text-teal-600 text-4xl mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold text-slate-700">
            No Photo Book Templates Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create your first multi-page photo book template to get started.
          </p>
          <Button
            type="primary"
            onClick={() => setCreateModalOpen(true)}
            className="!bg-teal-600 !border-teal-600"
          >
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const frontCover =
              tpl.pages?.find((p) => p.page_type === "front_cover") ||
              tpl.pages?.[0];
            const coverBg = frontCover?.background || {};
            const coverBgStyle =
              coverBg.type === "gradient"
                ? { background: coverBg.value }
                : coverBg.type === "image" && coverBg.value
                ? {
                    backgroundImage: `url(${coverBg.value})`,
                    backgroundSize: "cover",
                  }
                : { backgroundColor: coverBg.value || "#1e1e2d" };

            const statusColors = {
              published: "green",
              draft: "orange",
              archived: "default",
            };

            return (
              <div
                key={tpl._id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Visual Cover Preview Thumbnail */}
                <div
                  onClick={() => navigate(`/photobook-editor/${tpl._id}`)}
                  className="h-48 relative overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-100"
                  style={coverBgStyle}
                >
                  {/* Miniature rendered cover title */}
                  <div className="text-center p-4">
                    <span className="text-white/90 text-sm font-serif font-bold uppercase tracking-wider drop-shadow block">
                      {tpl.template_name}
                    </span>
                    <span className="text-white/70 text-[10px] tracking-wide block mt-1">
                      {tpl.category} Edition • {tpl.pages?.length || 0} Pages
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Tag color={statusColors[tpl.status] || "default"}>
                      {tpl.status?.toUpperCase()}
                    </Tag>
                  </div>

                  {/* Version Badge */}
                  <div className="absolute top-3 right-3">
                    <Tag color="blue">v{tpl.version || 1}</Tag>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-800 truncate">
                        {tpl.template_name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tpl.template_id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {tpl.description || "No description provided."}
                    </p>
                  </div>

                  {/* Supported sizes & products tags */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {(tpl.supported_sizes || []).map((sz) => (
                        <span
                          key={sz}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        <strong>{tpl.pages?.length || 0}</strong> Designed Pages
                      </span>
                      {tpl.product_template_id ? (
                        <span
                          className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[160px]"
                          title={`Linked Template Config: ${tpl.product_template_id}`}
                        >
                          Config: {tpl.product_template_id}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unlinked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="primary"
                      size="small"
                      icon={<MdEdit size={14} />}
                      onClick={() => navigate(`/photobook-editor/${tpl._id}`)}
                      className="flex-1 !bg-teal-600 hover:!bg-teal-700 !border-teal-600 font-medium text-xs"
                    >
                      Edit Design
                    </Button>

                    {tpl.product_id && (
                      <Tooltip title="Edit commercial pricing, sizes & editions in Product">
                        <Button
                          size="small"
                          icon={<MdOpenInNew size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/edit-product/${tpl.product_id}`, "_blank");
                          }}
                        />
                      </Tooltip>
                    )}

                    <Tooltip title="Preview Book">
                      <Button
                        size="small"
                        icon={<MdOutlineAutoStories size={14} />}
                        onClick={() => setPreviewTemplate(tpl)}
                      />
                    </Tooltip>

                    <Tooltip title="Duplicate Template">
                      <Button
                        size="small"
                        icon={<MdContentCopy size={14} />}
                        onClick={() => handleDuplicate(tpl._id)}
                      />
                    </Tooltip>

                    <Tooltip
                      title={
                        tpl.status === "archived" ? "Restore to Draft" : "Archive"
                      }
                    >
                      <Button
                        size="small"
                        icon={
                          tpl.status === "archived" ? (
                            <MdUnarchive size={14} />
                          ) : (
                            <MdArchive size={14} />
                          )
                        }
                        onClick={() => handleArchive(tpl._id)}
                      />
                    </Tooltip>

                    <Popconfirm
                      title="Delete Template"
                      description="Are you sure you want to delete this template?"
                      onConfirm={() => handleDelete(tpl._id)}
                      okText="Yes, Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<MdDeleteOutline size={14} />}
                      />
                    </Popconfirm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE TEMPLATE MODAL ==================== */}
      <Modal
        title="Create New Photo Book Template Design"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <div className="space-y-4 pt-1">
          {/* Step 1: Assign to an existing Product Template record (Mandatory) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                1. Select Product Template Configuration <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Required to start designing
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Select an available template configuration created under <strong>Admin → Products</strong> to build its visual layout and pages.
            </p>

            <Select
              placeholder="Search and choose a product template configuration..."
              loading={loadingProductTemplates}
              allowClear
              className="w-full"
              onChange={handleSelectProductTemplate}
              value={selectedProductTemplate?.product_template_id || selectedProductTemplate?.slug || undefined}
              dropdownMatchSelectWidth={false}
              optionLabelProp="label"
            >
              {productTemplates.map((tpl) => (
                <Select.Option
                  key={tpl.product_template_id || tpl.slug}
                  value={tpl.product_template_id || tpl.slug}
                  label={`${tpl.template_name} (${tpl.slug}) - ${tpl.product_name}`}
                >
                  <div className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 text-xs">
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
                        <span className="text-slate-600 font-sans">Product: {tpl.product_name}</span>
                      </div>
                    </div>
                    <div>
                      {tpl.has_design ? (
                        <Tag color="purple" className="text-[10px] m-0 font-medium">
                          Design Exists ({tpl.design_status})
                        </Tag>
                      ) : (
                        <Tag color="green" className="text-[10px] m-0 font-medium">
                          Available
                        </Tag>
                      )}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {!selectedProductTemplate && (
            <Alert
              type="info"
              showIcon
              message="Template Configuration Required"
              description="Please select an available template configuration above to enable the visual template designer. Visual designs must be associated with an active template configuration from the Custom Photo Book product."
            />
          )}

          {/* Duplicate Detection Alert */}
          {selectedProductTemplate?.has_design && (
            <Alert
              type="warning"
              showIcon
              message="Visual Design Already Exists"
              description={
                <div className="space-y-2 mt-1">
                  <p className="text-xs text-slate-700 m-0">
                    A visual template design is already created for{" "}
                    <strong>{selectedProductTemplate.template_name}</strong> (Status:{" "}
                    <Tag
                      color={
                        selectedProductTemplate.design_status === "published"
                          ? "green"
                          : "orange"
                      }
                      className="text-[10px] font-semibold"
                    >
                      {selectedProductTemplate.design_status}
                    </Tag>
                    , Version: {selectedProductTemplate.design_version || 1}). Each template configuration can only have one active visual design to prevent discrepancies.
                  </p>
                  <Button
                    type="primary"
                    className="!bg-amber-600 hover:!bg-amber-700 text-xs font-semibold"
                    onClick={() => {
                      setCreateModalOpen(false);
                      navigate(`/photobook-editor/${selectedProductTemplate.design_id}`);
                    }}
                  >
                    Open & Edit Existing Design
                  </Button>
                </div>
              }
            />
          )}

          {/* Form - Only enabled when template configuration is selected and has no existing design */}
          {selectedProductTemplate && !selectedProductTemplate.has_design && (
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreate}
              className="space-y-3"
            >
              {/* Linked Configuration Summary Banner */}
              {selectedProductTemplate.is_giveaway ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Tag color="gold" className="m-0 text-[10px] font-bold">Giveaway Template</Tag>
                      Linked Product: {selectedProductTemplate.product_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-amber-800">
                    <span>Exact Pages: <strong>{selectedProductTemplate.exact_pages || selectedProductTemplate.default_pages || 20}</strong></span>
                    <span>•</span>
                    <span>No editions required</span>
                    <span>•</span>
                    <span>Free Giveaway</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span>Linked Commercial Configuration:</span>
                    <Tag color="green" className="m-0 text-[10px]">
                      Product: {selectedProductTemplate.product_name}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-emerald-800">
                    <span>Pages: {selectedProductTemplate.default_pages} default ({selectedProductTemplate.min_pages}–{selectedProductTemplate.max_pages})</span>
                    <span>•</span>
                    <span>Extra page: ₹{selectedProductTemplate.price_per_extra_page}</span>
                    <span>•</span>
                    <span>{selectedProductTemplate.editions?.length || 0} Edition(s)</span>
                  </div>
                </div>
              )}

              <Form.Item
                name="template_name"
                label="Template Name"
                rules={[{ required: true, message: "Template name is required" }]}
              >
                <Input placeholder="e.g. Royal Vintage Wedding Book" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="template_id"
                  label="Unique Identifier (Slug)"
                  extra="Must match the product template slug."
                >
                  <Input placeholder="e.g. wedding-book" />
                </Form.Item>

                <Form.Item name="category" label="Category">
                  <Select
                    options={CATEGORIES.filter((c) => c !== "All").map((c) => ({
                      value: c,
                      label: c,
                    }))}
                  />
                </Form.Item>
              </div>

              <Form.Item name="description" label="Description">
                <Input.TextArea
                  rows={2}
                  placeholder="Describe the aesthetic and recommended occasions for this book..."
                />
              </Form.Item>

              <Form.Item name="supported_sizes" label="Supported Book Sizes">
                <Checkbox.Group options={BOOK_SIZES} />
              </Form.Item>

              {selectedProductTemplate.is_giveaway ? (
                <Form.Item
                  name="exact_pages"
                  label={<span className="font-bold">Exact Book Pages</span>}
                  extra="Specified page count determines the exact number of pages available in the customer book."
                  initialValue={selectedProductTemplate.exact_pages || selectedProductTemplate.default_pages || 20}
                >
                  <Input type="number" min={4} max={100} step={2} />
                </Form.Item>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <Form.Item name="default_pages" label="Default Pages">
                    <Input type="number" min={10} max={100} />
                  </Form.Item>
                  <Form.Item name="min_pages" label="Min Pages">
                    <Input type="number" min={10} max={50} />
                  </Form.Item>
                  <Form.Item name="max_pages" label="Max Pages">
                    <Input type="number" min={20} max={100} />
                  </Form.Item>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creating}
                  className="!bg-teal-600 !border-teal-600"
                >
                  Create & Open Editor
                </Button>
              </div>
            </Form>
          )}

          {(!selectedProductTemplate || selectedProductTemplate.has_design) && (
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button onClick={() => setCreateModalOpen(false)}>Close</Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Complete Book Preview Modal */}
      <BookPreviewModal
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
      />
    </div>
  );
};

export default TemplateList;
