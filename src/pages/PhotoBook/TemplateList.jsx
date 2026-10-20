import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPhotoBookTemplates,
  createPhotoBookTemplate,
  duplicatePhotoBookTemplate,
  archivePhotoBookTemplate,
  deletePhotoBookTemplate,
  getEligiblePhotoBookProducts,
  updateProductPhotoBookConfig,
  updatePhotoBookTemplate,
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
  MdLink,
  MdGridView,
  MdFilterList,
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

const BOOK_SIZES = ["8x8", "10x10", "12x12", "8.5x11", "A4"];

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

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Product Link Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [currentLinkingTemplate, setCurrentLinkingTemplate] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [savingLinks, setSavingLinks] = useState(false);

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

  // Fetch Products for Linking
  const fetchProducts = async () => {
    try {
      const res = await getEligiblePhotoBookProducts();
      setAllProducts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    try {
      setCreating(true);
      const payload = {
        template_name: values.template_name,
        template_id:
          values.template_id ||
          `pb_${values.template_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`,
        category: values.category || "General",
        description: values.description || "",
        supported_sizes: values.supported_sizes || ["8x8", "10x10", "12x12"],
        page_config: {
          min_pages: values.min_pages || 10,
          max_pages: values.max_pages || 60,
          default_pages: values.default_pages || 20,
          aspect_ratio: values.aspect_ratio || "1:1",
        },
      };

      const res = await createPhotoBookTemplate(payload);
      message.success("Template created successfully!");
      setCreateModalOpen(false);
      createForm.resetFields();
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

  // Open Link Products Modal
  const openLinkModal = (template) => {
    setCurrentLinkingTemplate(template);
    const linkedIds = (template.eligible_product_ids || []).map((p) =>
      typeof p === "object" ? p._id : p
    );
    setSelectedProductIds(linkedIds);
    setLinkModalOpen(true);
  };

  // Save Product Links
  const handleSaveProductLinks = async () => {
    if (!currentLinkingTemplate) return;
    try {
      setSavingLinks(true);
      await updatePhotoBookTemplate(currentLinkingTemplate._id, {
        eligible_product_ids: selectedProductIds,
      });

      // Also set is_photobook: true on selected products
      for (const prodId of selectedProductIds) {
        await updateProductPhotoBookConfig(prodId, {
          is_photobook: true,
          photobook_config: {
            eligible_template_ids: [currentLinkingTemplate.template_id],
          },
        });
      }

      message.success("Associated products updated successfully!");
      setLinkModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error("Link products error:", err);
      message.error("Failed to link products");
    } finally {
      setSavingLinks(false);
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
          onClick={() => {
            createForm.setFieldsValue({
              category: "Wedding",
              supported_sizes: ["8x8", "10x10", "12x12"],
              default_pages: 20,
              min_pages: 10,
              max_pages: 60,
              aspect_ratio: "1:1",
            });
            setCreateModalOpen(true);
          }}
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
                      <button
                        onClick={() => openLinkModal(tpl)}
                        className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 text-[11px]"
                      >
                        <MdLink size={14} />
                        <span>
                          {tpl.eligible_product_ids?.length || 0} Linked Products
                        </span>
                      </button>
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
                      Design
                    </Button>

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
        title="Create New Photo Book Template"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={550}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          className="space-y-3 pt-2"
        >
          <Form.Item
            name="template_name"
            label="Template Name"
            rules={[{ required: true, message: "Template name is required" }]}
          >
            <Input placeholder="e.g. Royal Vintage Wedding Book" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="template_id" label="Unique Identifier (Slug)">
              <Input placeholder="e.g. pb_wedding_royal_01" />
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

          <div className="flex justify-end gap-2 pt-3">
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
      </Modal>

      {/* ==================== PRODUCT LINK MODAL ==================== */}
      <Modal
        title={`Associate Products with "${currentLinkingTemplate?.template_name}"`}
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        onOk={handleSaveProductLinks}
        confirmLoading={savingLinks}
        okText="Save Product Associations"
        width={600}
      >
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-500">
            Select which Photo Book products in the store can use this published
            template.
          </p>

          <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
            {allProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No products found.
              </p>
            ) : (
              allProducts.map((prod) => {
                const isChecked = selectedProductIds.includes(prod._id);
                return (
                  <div
                    key={prod._id}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedProductIds((prev) =>
                          prev.filter((id) => id !== prod._id)
                        );
                      } else {
                        setSelectedProductIds((prev) => [...prev, prod._id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-teal-50 border-teal-500 text-teal-900"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} />
                      <div>
                        <span className="text-xs font-semibold block">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Code: {prod.product_code || "N/A"} • Price: ₹
                          {prod.MRP_price || 0}
                        </span>
                      </div>
                    </div>
                    {prod.is_photobook && (
                      <Tag color="cyan">Photo Book</Tag>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
