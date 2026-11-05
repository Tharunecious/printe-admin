import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Modal,
  Switch,
  DatePicker,
  Tooltip,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LockOutlined,
  ShoppingOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import moment from 'moment';

import { addCoupen, getSingleCoupen, getAllCoupens, deleteCoupen, editCoupen, getProduct } from '../../api';
import { canEditPage, canDeletePage, isSuperAdmin } from '../../helper/permissionHelper';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ─── API helper ──────────────────────────────────────────────────────────────
// Fetches products from your existing product endpoint.
async function fetchAllProducts() {
  try {
    const res = await getProduct('', '', true);
    const data = res?.data?.data || res?.data || [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.printe.in/api';
    const res = await fetch(`${BASE_URL}/product/get_product?isAdmin=true`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
const Coupon = () => {
  const { user } = useSelector(state => state.authSlice);
  const [form] = Form.useForm();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatedCouponsId, setUpdatedCouponsId] = useState('');

  // Product list state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Permissions
  const hasEditPermission =
    isSuperAdmin(user.role) || canEditPage(user.pagePermissions, 'coupons');
  const hasDeletePermission =
    isSuperAdmin(user.role) || canDeletePage(user.pagePermissions, 'coupons');

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCoupons();
    loadProducts();
  }, []);

  // ── Fetch coupons ───────────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await getAllCoupens();
      setTimeout(() => {
        setCoupons(response.data.data);
        setLoading(false);
      }, 1000);
    } catch {
      message.error('Failed to fetch coupons');
      setLoading(false);
    }
  };

  // ── Load products for the product selector ──────────────────────────────────
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await fetchAllProducts();
      // Only list products where visibility is true
      const visibleProducts = (Array.isArray(data) ? data : []).filter(
        p => p.is_visible === true || p.is_visible === 'true'
      );
      setProducts(visibleProducts);
    } catch {
      message.error('Failed to load products list');
    } finally {
      setProductsLoading(false);
    }
  };

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const handleCreate = async values => {
    if (!hasEditPermission) {
      message.error("You don't have permission to create coupons");
      return;
    }
    try {
      setLoading(true);
      await addCoupen(values);
      message.success('Coupon created successfully');
      setModalVisible(false);
      fetchCoupons();
      form.resetFields();
    } catch {
      message.error('Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values, id) => {
    if (!hasEditPermission) {
      message.error("You don't have permission to edit coupons");
      return;
    }
    try {
      setLoading(true);
      await editCoupen(values, id);
      setCoupons(prev =>
        prev.map(c => (c._id === editingCoupon._id ? { ...c, ...values } : c))
      );
      message.success('Coupon updated successfully');
      setModalVisible(false);
      setEditingCoupon(null);
      form.resetFields();
    } catch {
      message.error('Failed to update coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = couponId => {
    if (!hasDeletePermission) {
      message.error("You don't have permission to delete coupons");
      return;
    }
    Modal.confirm({
      title: 'Are you sure you want to delete this coupon?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await deleteCoupen(couponId);
          setCoupons(prev => prev.filter(c => c._id !== couponId));
          message.success('Coupon deleted successfully');
        } catch {
          message.error('Failed to delete coupon');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const toggleCouponStatus = async (couponId, currentStatus) => {
    if (!hasEditPermission) {
      message.error("You don't have permission to modify coupon status");
      return;
    }
    try {
      await editCoupen({ isActive: !currentStatus }, couponId);
      setCoupons(prev =>
        prev.map(c => (c._id === couponId ? { ...c, isActive: !currentStatus } : c))
      );
      message.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch {
      message.error('Failed to update coupon status');
    }
  };

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const showCreateModal = () => {
    if (!hasEditPermission) {
      message.error("You don't have permission to create coupons");
      return;
    }
    setEditingCoupon(null);
    setModalVisible(true);
    form.resetFields();
  };

  const showEditModal = coupon => {
    if (!hasEditPermission) {
      message.error("You don't have permission to edit coupons");
      return;
    }
    setUpdatedCouponsId(coupon._id);
    setEditingCoupon(coupon);
    setModalVisible(true);

    // applicableProducts from the API may be populated objects or raw IDs
    const applicableProductIds = (coupon.applicableProducts || []).map(p =>
      typeof p === 'object' ? p._id : p
    );

    form.setFieldsValue({
      ...coupon,
      dateRange: [moment(coupon.startDate), moment(coupon.endDate)],
      applicableProducts: applicableProductIds,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCoupon(null);
    form.resetFields();
    setProductSearch('');
  };

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleFormSubmit = async values => {
    const formattedValues = {
      ...values,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      // Ensure applicableProducts is always an array (may be undefined if untouched)
      applicableProducts: values.applicableProducts || [],
    };
    delete formattedValues.dateRange;

    if (editingCoupon) {
      await handleUpdate(formattedValues, updatedCouponsId);
    } else {
      await handleCreate(formattedValues);
    }
  };

  const handleDiscountTypeChange = value => {
    if (value === 'tiered_quantity') {
      form.setFieldsValue({
        Customer_discountValue: 0,
        Dealer_discountValue: 0,
        Corporate_discountValue: 0,
      });
    }
  };

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchText.toLowerCase());
    const isGiveaway = Boolean(c.is_giveaway || (c.code && c.code.startsWith('PHONESTAND-')));
    
    let matchesType = true;
    if (typeFilter === 'giveaway') matchesType = isGiveaway;
    if (typeFilter === 'regular') matchesType = !isGiveaway;

    let matchesStatus = true;
    const isRedeemed = (c.usedCount || 0) >= (c.usageLimit || 1);
    if (statusFilter === 'available') matchesStatus = !isRedeemed;
    if (statusFilter === 'redeemed') matchesStatus = isRedeemed;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Products available in the selector (client-side search)
  const filteredProducts = products.filter(p => {
    const q = productSearch.toLowerCase();
    const code =
      p.product_code ||
      p.product_codeS_NO ||
      p.productCode ||
      p.variants_price?.[0]?.product_code ||
      '';
    return (
      (p.name || '').toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    );
  });

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <Space>
          <Text strong copyable>{code}</Text>
          {record.is_giveaway && <Tag color="purple">Phone Stand</Tag>}
        </Space>
      ),
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType',
      render: type => (
        <Tag
          color={
            type === 'percentage'
              ? 'blue'
              : type === 'fixed'
              ? 'green'
              : type === 'tiered_quantity'
              ? 'purple'
              : 'orange'
          }
        >
          {type === 'tiered_quantity' ? 'TIERED' : type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Discount Value',
      key: 'discountValue',
      render: (_, record) => {
        if (record.discountType === 'tiered_quantity') {
          return <Text>Tiered Pricing</Text>;
        }
        const fmt = v =>
          record.discountType === 'percentage' ? `${v}%` : `₹${v}`;
        return (
          <div>
            <Text>Customer: {fmt(record.Customer_discountValue)}</Text>
            <br />
            <Text>Dealer: {fmt(record.Dealer_discountValue)}</Text>
            <br />
            <Text>Corporate: {fmt(record.Corporate_discountValue)}</Text>
          </div>
        );
      },
    },
    {
      title: 'Applicable Products',
      key: 'applicableProducts',
      render: (_, record) => {
        const prods = record.applicableProducts || [];
        if (prods.length === 0) {
          return <Tag color="default">All Products</Tag>;
        }
        return (
          <Tooltip
            title={prods
              .map(p => (typeof p === 'object' ? p.name : p))
              .join(', ')}
          >
            <Tag color="volcano" icon={<ShoppingOutlined />}>
              {prods.length} product{prods.length > 1 ? 's' : ''}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => (
        <Text>
          {record.usedCount || 0} / {record.usageLimit || '∞'}
        </Text>
      ),
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_, record) => (
        <Text>
          {new Date(record.startDate).toLocaleDateString()} -{' '}
          {new Date(record.endDate).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Tooltip
          title={
            hasEditPermission
              ? isActive
                ? 'Active'
                : 'Inactive'
              : 'No permission to modify'
          }
        >
          <Switch
            checked={isActive}
            onChange={() => toggleCouponStatus(record._id, isActive)}
            disabled={!hasEditPermission}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Redemption Status',
      key: 'redemptionStatus',
      render: (_, record) => {
        const isRedeemed = (record.usedCount || 0) >= (record.usageLimit || 1);
        if (record.is_giveaway) {
          return isRedeemed ? (
            <Tag color="red" style={{ fontWeight: 600 }}>REDEEMED</Tag>
          ) : (
            <Tag color="green" style={{ fontWeight: 600 }}>AVAILABLE</Tag>
          );
        }
        return isRedeemed ? (
          <Tag color="default">USED</Tag>
        ) : (
          <Tag color="blue">AVAILABLE</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {hasEditPermission ? (
            <Tooltip title="Edit Coupon">
              <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                Edit
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="No permission to edit">
              <Button type="link" icon={<LockOutlined />} disabled>
                Edit
              </Button>
            </Tooltip>
          )}

          {hasDeletePermission ? (
            <Tooltip title="Delete Coupon">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record._id)}
              >
                Delete
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="No permission to delete">
              <Button type="link" icon={<LockOutlined />} disabled>
                Delete
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header row */}
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={2}>Coupon Management</Title>
          {hasEditPermission ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
              Add Coupon
            </Button>
          ) : (
            <Tooltip title="No permission to create coupons">
              <Button icon={<LockOutlined />} disabled>
                Add Coupon
              </Button>
            </Tooltip>
          )}
        </div>

        {/* View-only warning */}
        {!hasEditPermission && !hasDeletePermission && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#fa8c16' }}>
              <LockOutlined /> You have view-only access to coupons. Contact an administrator to
              request edit permissions.
            </Text>
          </div>
        )}

        {/* Search & Filters */}
        <div style={{ marginBottom: 16, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Search coupons by code..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 220 }}
          >
            <Option value="all">All Coupon Types</Option>
            <Option value="giveaway">Phone Stand Giveaway Only</Option>
            <Option value="regular">Regular Coupons Only</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="available">Available (Unused)</Option>
            <Option value="redeemed">Redeemed (Used)</Option>
          </Select>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            Showing {filteredCoupons.length} of {coupons.length} coupons
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredCoupons}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
        />

        {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
        {hasEditPermission && (
          <Modal
            title={
              <span style={{ fontSize: 18, fontWeight: 600 }}>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </span>
            }
            open={modalVisible}
            onCancel={closeModal}
            footer={null}
            width={860}
            destroyOnClose
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              initialValues={{
                isActive: true,
                singleUse: false,
                discountType: 'percentage',
                minimumOrderAmount: 0,
                Customer_discountValue: 0,
                Dealer_discountValue: 0,
                Corporate_discountValue: 0,
                applicableProducts: [],
              }}
            >
              {/* Row 1: Code + Discount Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="code"
                  label={<span style={{ fontWeight: 600 }}>Coupon Code</span>}
                  rules={[{ required: true, message: 'Please enter coupon code' }]}
                >
                  <Input placeholder="e.g., WELCOME10" style={{ textTransform: 'uppercase' }} />
                </Form.Item>

                <Form.Item
                  name="discountType"
                  label={<span style={{ fontWeight: 600 }}>Discount Type</span>}
                  rules={[{ required: true, message: 'Please select discount type' }]}
                >
                  <Select placeholder="Select discount type" onChange={handleDiscountTypeChange}>
                    <Option value="percentage">Percentage</Option>
                    <Option value="fixed">Fixed Amount</Option>
                    <Option value="shipping">Free Shipping</Option>
                    <Option value="tiered_quantity">Tiered Quantity</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* ── Applicable Products selector ──────────────────────────────── */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 16,
                  backgroundColor: '#f0f5ff',
                  borderRadius: 8,
                  border: '1px solid #adc6ff',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 14 }}>
                    <ShoppingOutlined style={{ marginRight: 6 }} />
                    Applicable Products
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: 'block', fontSize: 12, marginTop: 2 }}
                  >
                    Leave empty to apply the coupon to <strong>all products</strong>. Select one or
                    more products to restrict this coupon to those items only.
                  </Text>
                </div>

                <Form.Item name="applicableProducts" style={{ marginBottom: 0 }}>
                  <Select
                    mode="multiple"
                    placeholder={
                      productsLoading ? 'Loading products…' : 'Select products (optional)'
                    }
                    loading={productsLoading}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={val => setProductSearch(val)}
                    onBlur={() => setProductSearch('')}
                    style={{ width: '100%' }}
                    optionLabelProp="label"
                    maxTagCount={4}
                    maxTagPlaceholder={omitted => `+${omitted.length} more`}
                    notFoundContent={
                      productsLoading ? (
                        <Spin size="small" />
                      ) : (
                        <Text type="secondary">No products found</Text>
                      )
                    }
                  >
                    {filteredProducts.map(product => (
                      <Option
                        key={product._id}
                        value={product._id}
                        label={product.name}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Product thumbnail if available */}
                          {product.images && product.images.length > 0 ? (
                            <Avatar
                              size={28}
                              src={product.images[0]}
                              shape="square"
                              style={{ flexShrink: 0 }}
                            />
                          ) : (
                            <Avatar
                              size={28}
                              icon={<ShoppingOutlined />}
                              shape="square"
                              style={{ flexShrink: 0, backgroundColor: '#d6e4ff' }}
                            />
                          )}
                          <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{product.name}</div>
                            {(product.product_code || product.product_codeS_NO || product.variants_price?.[0]?.product_code) && (
                              <div style={{ fontSize: 11, color: '#888' }}>
                                Code: {product.product_code || product.product_codeS_NO || product.variants_price?.[0]?.product_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* ── Per-user-type discount values ─────────────────────────────── */}
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const discountType = form.getFieldValue('discountType');
                  if (discountType === 'tiered_quantity') return null;
                  return (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                      }}
                    >
                      <h4 style={{ marginBottom: 16, fontWeight: 600 }}>
                        Discount Values by User Type
                      </h4>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 16,
                        }}
                      >
                        <Form.Item
                          name="Customer_discountValue"
                          label="Customer Discount"
                          rules={[{ required: true, message: 'Please enter customer discount' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 10'}
                            addonAfter={discountType === 'percentage' ? '%' : '₹'}
                          />
                        </Form.Item>

                        <Form.Item
                          name="Dealer_discountValue"
                          label="Dealer Discount"
                          rules={[{ required: true, message: 'Please enter dealer discount' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={discountType === 'percentage' ? 'e.g., 15' : 'e.g., 15'}
                            addonAfter={discountType === 'percentage' ? '%' : '₹'}
                          />
                        </Form.Item>

                        <Form.Item
                          name="Corporate_discountValue"
                          label="Corporate Discount"
                          rules={[{ required: true, message: 'Please enter corporate discount' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 20'}
                            addonAfter={discountType === 'percentage' ? '%' : '₹'}
                          />
                        </Form.Item>
                      </div>
                    </div>
                  );
                }}
              </Form.Item>

              {/* ── Tiered quantity section ───────────────────────────────────── */}
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const discountType = form.getFieldValue('discountType');
                  if (discountType !== 'tiered_quantity') return null;
                  return (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                      }}
                    >
                      <h4 style={{ marginBottom: 16, fontWeight: 600 }}>
                        Tiered Quantity Discounts
                      </h4>
                      <Form.List name="discountTiers">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <div
                                key={key}
                                style={{
                                  marginBottom: 16,
                                  padding: 16,
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 8,
                                  backgroundColor: 'white',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                    gap: 16,
                                    alignItems: 'end',
                                  }}
                                >
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'minimumQuantity']}
                                    label="Min Quantity"
                                    rules={[
                                      { required: true, message: 'Enter minimum quantity' },
                                    ]}
                                  >
                                    <InputNumber
                                      min={1}
                                      placeholder="e.g., 10"
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    {...restField}
                                    name={[name, 'Customer_discountValue']}
                                    label="Customer"
                                    rules={[{ required: true, message: 'Enter discount' }]}
                                  >
                                    <InputNumber
                                      min={0}
                                      placeholder="Discount"
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    {...restField}
                                    name={[name, 'Dealer_discountValue']}
                                    label="Dealer"
                                    rules={[{ required: true, message: 'Enter discount' }]}
                                  >
                                    <InputNumber
                                      min={0}
                                      placeholder="Discount"
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    {...restField}
                                    name={[name, 'Corporate_discountValue']}
                                    label="Corporate"
                                    rules={[{ required: true, message: 'Enter discount' }]}
                                  >
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <InputNumber
                                        min={0}
                                        placeholder="Discount"
                                        style={{ flex: 1 }}
                                      />
                                      {fields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          onClick={() => remove(name)}
                                          icon={<DeleteOutlined />}
                                        />
                                      )}
                                    </div>
                                  </Form.Item>
                                </div>
                              </div>
                            ))}
                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                              >
                                Add Tier
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  );
                }}
              </Form.Item>

              {/* Row: Min order + Max discount + Usage limit + Per-product switch */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="minimumOrderAmount"
                  label={<span style={{ fontWeight: 600 }}>Minimum Order Amount</span>}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                    prefix="₹"
                  />
                </Form.Item>

                <Form.Item
                  name="maximumDiscount"
                  label={<span style={{ fontWeight: 600 }}>Maximum Discount</span>}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="No limit"
                    prefix="₹"
                  />
                </Form.Item>

                <Form.Item
                  name="usageLimit"
                  label={<span style={{ fontWeight: 600 }}>Usage Limit</span>}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="No limit" />
                </Form.Item>

                <Form.Item
                  name="isPerProductDiscount"
                  label={<span style={{ fontWeight: 600 }}>Apply Per Product</span>}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              {/* Date range */}
              <Form.Item
                name="dateRange"
                label={<span style={{ fontWeight: 600 }}>Validity Period</span>}
                rules={[{ required: true, message: 'Please select validity period' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              {/* Active + Single-use toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="isActive"
                  label={<span style={{ fontWeight: 600 }}>Active Status</span>}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="singleUse"
                  label={<span style={{ fontWeight: 600 }}>Single Use</span>}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              {/* Footer buttons */}
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        )}
      </Card>
    </div>
  );
};

export default Coupon;