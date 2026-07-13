import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Empty,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addInterestedPerson,
  updateInterestedPerson,
  deleteInterestedPerson,
} from "../../api/index";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const INTEREST_CONFIG = {
  Low:    { color: "default",  badge: "default",  label: "Low" },
  Medium: { color: "gold",     badge: "warning",  label: "Medium" },
  High:   { color: "volcano",  badge: "error",    label: "High" },
};

// ─── tiny helpers ──────────────────────────────────────────────────────────────

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── component ────────────────────────────────────────────────────────────────

const CampaignEntries = () => {
  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState("");

  // campaign modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign,   setEditingCampaign]   = useState(null);
  const [saving,            setSaving]            = useState(false);
  const [campaignForm]                            = Form.useForm();

  // person modal
  const [personModalOpen,  setPersonModalOpen]  = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [editingPerson,    setEditingPerson]    = useState(null);
  const [savingPerson,     setSavingPerson]     = useState(false);
  const [personForm]                            = Form.useForm();

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await getAllCampaigns(search);
      setCampaigns(res?.data?.data || []);
    } catch {
      message.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCampaigns(value);
  };

  // ── campaign CRUD ──────────────────────────────────────────────────────────

  const openCreateCampaign = () => {
    setEditingCampaign(null);
    campaignForm.resetFields();
    setCampaignModalOpen(true);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    campaignForm.setFieldsValue({ campaign_name: campaign.campaign_name });
    setCampaignModalOpen(true);
  };

  const handleCampaignSubmit = async () => {
    try {
      const values = await campaignForm.validateFields();
      setSaving(true);

      if (editingCampaign) {
        await updateCampaign(editingCampaign._id, values);
        message.success("Campaign updated");
      } else {
        await createCampaign(values);
        message.success("Campaign created");
      }

      setCampaignModalOpen(false);
      fetchCampaigns(searchText);
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      await deleteCampaign(id);
      message.success("Campaign deleted");
      fetchCampaigns(searchText);
    } catch {
      message.error("Failed to delete campaign");
    }
  };

  // ── person CRUD ────────────────────────────────────────────────────────────

  const openAddPerson = (campaignId) => {
    setActiveCampaignId(campaignId);
    setEditingPerson(null);
    personForm.resetFields();
    personForm.setFieldsValue({ interest_scale: "Medium" });
    setPersonModalOpen(true);
  };

  const openEditPerson = (campaignId, person) => {
    setActiveCampaignId(campaignId);
    setEditingPerson(person);
    personForm.setFieldsValue({
      name:           person.name,
      phone:          person.phone,
      place:          person.place,
      interest_scale: person.interest_scale,
    });
    setPersonModalOpen(true);
  };

  const handlePersonSubmit = async () => {
    try {
      const values = await personForm.validateFields();
      setSavingPerson(true);

      if (editingPerson) {
        await updateInterestedPerson(activeCampaignId, editingPerson._id, values);
        message.success("Contact updated");
      } else {
        await addInterestedPerson(activeCampaignId, values);
        message.success("Contact added");
      }

      setPersonModalOpen(false);
      fetchCampaigns(searchText);
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to save contact");
    } finally {
      setSavingPerson(false);
    }
  };

  const handleDeletePerson = async (campaignId, personId) => {
    try {
      await deleteInterestedPerson(campaignId, personId);
      message.success("Contact removed");
      fetchCampaigns(searchText);
    } catch {
      message.error("Failed to remove contact");
    }
  };

  // ── derived stats ──────────────────────────────────────────────────────────

  const totalContacts = campaigns.reduce(
    (sum, c) => sum + (c.interested_people?.length || 0),
    0
  );
  const highInterest = campaigns.reduce(
    (sum, c) =>
      sum + (c.interested_people?.filter((p) => p.interest_scale === "High").length || 0),
    0
  );

  // ── table columns ──────────────────────────────────────────────────────────

  const campaignColumns = [
    {
      title: "Campaign",
      dataIndex: "campaign_name",
      key: "campaign_name",
      render: (name) => (
        <Space>
          <FlagOutlined style={{ color: "#6366f1" }} />
          <Text strong style={{ textTransform: "capitalize" }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: "Contacts",
      key: "count",
      width: 110,
      align: "center",
      render: (_, r) => {
        const count = r.interested_people?.length || 0;
        return (
          <Badge
            count={count}
            showZero
            style={{ backgroundColor: count ? "#6366f1" : "#d9d9d9" }}
          />
        );
      },
    },
    {
      title: "High Interest",
      key: "high",
      width: 120,
      align: "center",
      render: (_, r) => {
        const n = r.interested_people?.filter((p) => p.interest_scale === "High").length || 0;
        return n ? (
          <Tag color="volcano">{n} high</Tag>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: fmtDate,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Add contact">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<UserAddOutlined />}
              onClick={() => openAddPerson(record._id)}
            />
          </Tooltip>
          <Tooltip title="Edit name">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditCampaign(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete campaign?"
            description="All contacts under it will also be deleted."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteCampaign(record._id)}
          >
            <Tooltip title="Delete">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const personColumns = (campaignId) => [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (n) => <Text strong>{n}</Text>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (p) => <Text copyable>{p}</Text>,
    },
    {
      title: "Place",
      dataIndex: "place",
      key: "place",
      render: (p) => p || <Text type="secondary">—</Text>,
    },
    {
      title: "Interest",
      dataIndex: "interest_scale",
      key: "interest_scale",
      width: 110,
      render: (scale) => {
        const cfg = INTEREST_CONFIG[scale] || INTEREST_CONFIG.Medium;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Added",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: fmtDate,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, person) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditPerson(campaignId, person)}
          />
          <Popconfirm
            title="Remove this contact?"
            okText="Remove"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeletePerson(campaignId, person._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <div style={{ padding: "8px 0" }}>
      <Table
        rowKey="_id"
        size="small"
        columns={personColumns(record._id)}
        dataSource={record.interested_people || []}
        pagination={
          record.interested_people?.length > 5
            ? { pageSize: 5, size: "small" }
            : false
        }
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  No contacts yet.{" "}
                  <Button
                    type="link"
                    size="small"
                    onClick={() => openAddPerson(record._id)}
                  >
                    Add one
                  </Button>
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 2 }}>
            Campaign Entries
          </Title>
          <Text type="secondary">
            Track outreach campaigns and interested contacts
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateCampaign}
          style={{ backgroundColor: "#6366f1", borderColor: "#6366f1" }}
        >
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ background: "#f5f3ff" }}>
            <Statistic
              title="Total Campaigns"
              value={campaigns.length}
              prefix={<FlagOutlined style={{ color: "#6366f1" }} />}
              valueStyle={{ color: "#6366f1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ background: "#f0fdf4" }}>
            <Statistic
              title="Total Contacts"
              value={totalContacts}
              prefix={<TeamOutlined style={{ color: "#22c55e" }} />}
              valueStyle={{ color: "#22c55e" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ background: "#fff7ed" }}>
            <Statistic
              title="High Interest"
              value={highInterest}
              prefix={<span style={{ color: "#f97316" }}>🔥</span>}
              valueStyle={{ color: "#f97316" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search + refresh */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Search
          placeholder="Search campaigns…"
          allowClear
          prefix={<SearchOutlined />}
          style={{ maxWidth: 320 }}
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch("")}
        />
        <Tooltip title="Refresh">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchCampaigns(searchText)}
          />
        </Tooltip>
      </div>

      {/* Main table */}
      <Table
        rowKey="_id"
        columns={campaignColumns}
        dataSource={campaigns}
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  No campaigns yet.{" "}
                  <Button type="link" onClick={openCreateCampaign}>
                    Create your first
                  </Button>
                </span>
              }
            />
          ),
        }}
        scroll={{ x: 700 }}
      />

      {/* ── Campaign modal ── */}
      <Modal
        title={
          <Space>
            <FlagOutlined />
            {editingCampaign ? "Edit Campaign" : "New Campaign"}
          </Space>
        }
        open={campaignModalOpen}
        onOk={handleCampaignSubmit}
        onCancel={() => setCampaignModalOpen(false)}
        okText={editingCampaign ? "Save Changes" : "Create Campaign"}
        okButtonProps={{
          loading: saving,
          style: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
        }}
        destroyOnClose
        width={420}
      >
        <Form form={campaignForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="campaign_name"
            label="Campaign Name"
            rules={[{ required: true, message: "Campaign name is required" }]}
          >
            <Input
              placeholder="e.g. whatsapp, instagram, email-blast"
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Person modal ── */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            {editingPerson ? "Edit Contact" : "Add Contact"}
          </Space>
        }
        open={personModalOpen}
        onOk={handlePersonSubmit}
        onCancel={() => setPersonModalOpen(false)}
        okText={editingPerson ? "Save Changes" : "Add Contact"}
        okButtonProps={{
          loading: savingPerson,
          style: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
        }}
        destroyOnClose
        width={460}
      >
        <Form form={personForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
              >
                <Input placeholder="e.g. Santhosh" autoFocus />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Phone is required" },
                  {
                    pattern: /^[0-9+\-\s()]{7,15}$/,
                    message: "Enter a valid phone number",
                  },
                ]}
              >
                <Input placeholder="e.g. 737361000" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="place" label="Place">
                <Input placeholder="e.g. Trichy" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="interest_scale"
                label="Interest Level"
                initialValue="Medium"
              >
                <Select>
                  <Option value="Low">
                    <Tag color="default">Low</Tag>
                  </Option>
                  <Option value="Medium">
                    <Tag color="gold">Medium</Tag>
                  </Option>
                  <Option value="High">
                    <Tag color="volcano">High</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CampaignEntries;