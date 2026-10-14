import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import DefaultTile from "../../components/DefaultTile";
import { Button, Card, Divider, Empty, Form, Image, Input, Modal, Select, Spin, Switch, Tag, message, DatePicker, Badge, Tooltip } from "antd";
import ShowImages from "../../helper/ShowImages";
import UploadHelper from "../../helper/UploadHelper";
import VideoUploadHelper from "../../helper/VideoUploadHelper";
import { formValidation } from "../../helper/formvalidation";
import CustomLabel from "../../components/CustomLabel";
import { CUSTOM_ERROR_NOTIFICATION, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from "../../helper/notification_helper";
import { addBanner, CLIENT_URL, deleteBanner, editBanner, getAllBannerProducts, getAllBanners, reorderBanners, toggleBannerVisibility } from "../../api";
import _ from "lodash";
import { ICON_HELPER } from "../../helper/iconhelper";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined, EyeOutlined, EyeInvisibleOutlined, ClockCircleOutlined, LockOutlined, VideoCameraOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { canEditPage, canDeletePage, isSuperAdmin } from "../../helper/permissionHelper";

// Sortable Card Component
const SortableCard = ({ id, children, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'move',
  };

  return (
    <div ref={setNodeRef} style={style} {...(disabled ? {} : { ...attributes, ...listeners })}>
      {children}
    </div>
  );
};

const Banner = () => {
  const { user } = useSelector((state) => state.authSlice);
  const [formStatus, setFormStatus] = useState(false);
  const [id, setId] = useState(null);
  const [productData, setProductData] = useState([]);
  const [banners, setAllBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState(null);

  const [form] = Form.useForm();

  // Check permissions
  const hasEditPermission = isSuperAdmin(user.role) || canEditPage(user.pagePermissions, "banners");
  const hasDeletePermission = isSuperAdmin(user.role) || canDeletePage(user.pagePermissions, "banners");

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const result = await getAllBannerProducts();
      const data = _.get(result, "data.data", "");
      setProductData(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const handleFinish = async (values) => {
    if (!hasEditPermission) {
      ERROR_NOTIFICATION({ message: "You don't have permission to modify banners" });
      return;
    }

    try {
      setSubmitting(true);
      
      if (!values.banner_image) {
        CUSTOM_ERROR_NOTIFICATION("Please Upload Banner image");
        return;
      }

      // Convert features string to array if it's a string
      if (typeof values.feature === 'string' && values.feature.trim()) {
        values.feature = values.feature.split(',').map(item => item.trim()).filter(item => item);
      } else if (Array.isArray(values.feature)) {
        values.feature = values.feature.filter(item => item && item.trim());
      } else {
        values.feature = [];
      }

      // Format expiry date
      if (values.expiry_date) {
        values.expiry_date = values.expiry_date.toISOString();
      }

      // Format description and videoUrl
      values.banner_description = values.banner_description ? values.banner_description.trim() : null;
      values.videoUrl = values.videoUrl ? values.videoUrl.trim() : null;

      let result = "";

      if (id) {
        result = await editBanner(values, id);
      } else {
        result = await addBanner(values);
      }
      
      form.resetFields();
      handleCancel();
      SUCCESS_NOTIFICATION(result);
      setFormStatus(false);
      collectBanners();
    } catch (err) {
      console.log(err);
      ERROR_NOTIFICATION(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormStatus(false);
    setId(null);
    form.resetFields();
  };

  const collectBanners = async () => {
    try {
      const result = await getAllBanners();
      console.log(result.data.data,"basnear");
      
      setAllBanners(_.get(result, "data.data", []));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    collectBanners();
  }, []);

  const handleEdit = (res) => {
    if (!hasEditPermission) {
      ERROR_NOTIFICATION({ message: "You don't have permission to edit banners" });
      return;
    }

    try {
      // Extract product IDs - handle both populated and non-populated cases
      let productIds = [];
      if (res?.banner_products) {
        productIds = res.banner_products.map(product => {
          if (typeof product === 'object' && product._id) {
            return product._id;
          }
          return product;
        });
      }

      // Prepare initial values for form
      const initialValues = {
        banner_name: res?.banner_name || "",
        banner_slug: res?.banner_slug || "",
        tag: res?.tag || "",
        banner_products: productIds,
        banner_image: res?.banner_image || null,
        banner_description: res?.banner_description || "",
        videoUrl: res?.videoUrl || null,
        feature: res?.feature ? res.feature.join(', ') : "",
        is_reward: res?.is_reward || false,
        is_visible: res?.is_visible !== undefined ? res.is_visible : true,
        rating: res?.rating || "",
        expiry_date: res?.expiry_date ? dayjs(res.expiry_date) : null
      };

      form.setFieldsValue(initialValues);
      setId(res?._id);
      setFormStatus(true);
    } catch (err) {
      ERROR_NOTIFICATION(err);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!hasDeletePermission) {
      ERROR_NOTIFICATION({ message: "You don't have permission to delete banners" });
      return;
    }

    Modal.confirm({
      title: 'Delete Banner',
      content: 'Are you sure you want to delete this banner?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deleteBanner(bannerId);
          SUCCESS_NOTIFICATION(result);
          collectBanners();
        } catch (err) {
          ERROR_NOTIFICATION(err);
        }
      }
    });
  };

  const handleToggleVisibility = async (bannerId, currentVisibility) => {
    if (!hasEditPermission) {
      ERROR_NOTIFICATION({ message: "You don't have permission to modify banner visibility" });
      return;
    }

    try {
      const result = await toggleBannerVisibility(bannerId);
      SUCCESS_NOTIFICATION(result);
      collectBanners();
    } catch (err) {
      ERROR_NOTIFICATION(err);
    }
  };

  const handleView = () => {
    window.open(`${CLIENT_URL}/`);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    if (!hasEditPermission) {
      ERROR_NOTIFICATION({ message: "You don't have permission to reorder banners" });
      return;
    }

    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = banners.findIndex((banner) => banner._id === active.id);
      const newIndex = banners.findIndex((banner) => banner._id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setAllBanners(newBanners);

      try {
        const orderedIds = newBanners.map((banner) => banner._id);
        const result = await reorderBanners({ order: orderedIds });
        message.success('Banner order updated successfully');
        collectBanners();
      } catch (err) {
        console.log(err);
        ERROR_NOTIFICATION(err);
        collectBanners();
      }
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days < 0) {
      return { color: 'red', text: 'Expired', icon: '🔴' };
    } else if (days === 0) {
      return { color: 'orange', text: 'Expires Today', icon: '⚠️' };
    } else if (days <= 3) {
      return { color: 'orange', text: `${days} days left`, icon: '⚠️' };
    } else if (days <= 7) {
      return { color: 'gold', text: `${days} days left`, icon: '⏰' };
    } else {
      return { color: 'blue', text: `${days} days left`, icon: '📅' };
    }
  };

  return (
    <Spin spinning={loading}>
      <div className="w-full">
        <DefaultTile 
          title={"Banner Management"} 
          add={hasEditPermission} 
          addText="Banner" 
          formStatus={formStatus} 
          setFormStatus={setFormStatus} 
        />
        
        {/* Permission Warning */}
        {!hasEditPermission && !hasDeletePermission && (
          <div className="mb-4 mx-14 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium flex items-center gap-2">
              <LockOutlined />
              You have view-only access to banners. Contact an administrator to request edit permissions.
            </p>
          </div>
        )}

        {/* Statistics Bar */}
        <div className="bg-white rounded-lg p-4 mb-4 mx-14">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total:</span>
              <Tag color="blue">{banners.length}</Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Visible:</span>
              <Tag color="green">{banners.filter(b => b.is_visible).length}</Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Hidden:</span>
              <Tag color="red">{banners.filter(b => !b.is_visible).length}</Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Auto-Hidden:</span>
              <Tag color="orange">{banners.filter(b => b.auto_hidden).length}</Tag>
            </div>
          </div>
        </div>

        {_.isEmpty(banners) ? (
          <div className="!mx-auto !h-[600px] center_div">
            <Empty description="No banners found. Create your first banner to get started!" />
          </div>
        ) : (
          <>
            {hasEditPermission && (
              <div className="mb-4 px-14">
                <Tag color="blue" icon={<HolderOutlined />}>
                  Drag and drop cards to reorder banners
                </Tag>
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={banners.map((banner) => banner._id)}
                strategy={rectSortingStrategy}
              >
                <div className="w-full max-h-fit bg-white rounded-lg grid grid-cols-4 p-14 gap-x-4 gap-y-4">
                  {banners.map((res, index) => {
                    const expiryStatus = getExpiryStatus(res.expiry_date);
                    const isExpired = res.expiry_date && new Date(res.expiry_date) < new Date();
                    
                    return (
                      <SortableCard 
                        key={res._id} 
                        id={res._id}
                        disabled={!hasEditPermission}
                      >
                        <Badge.Ribbon 
                          text={res.is_visible ? "Visible" : "Hidden"} 
                          color={res.is_visible ? "green" : "red"}
                        >
                          <Card
                            hoverable
                            className={`!w-full !h-fit ${!res.is_visible ? 'opacity-60' : ''}`}
                            actions={[
                              <div className="center_div justify-between px-6 group" key="actions">
                                {hasEditPermission ? (
                                  <Tooltip title={res.is_visible ? "Hide Banner" : "Show Banner"}>
                                    {res.is_visible ? (
                                      <EyeOutlined
                                        onClick={() => handleToggleVisibility(res._id, res.is_visible)}
                                        className="!text-xl group-hover:text-gray-500 hover:!text-green-500 cursor-pointer"
                                      />
                                    ) : (
                                      <EyeInvisibleOutlined
                                        onClick={() => handleToggleVisibility(res._id, res.is_visible)}
                                        className="!text-xl group-hover:text-gray-500 hover:!text-red-500 cursor-pointer"
                                      />
                                    )}
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="No permission to modify visibility">
                                    <LockOutlined className="!text-xl text-gray-400" />
                                  </Tooltip>
                                )}
                                <Divider type="vertical" />
                                {hasEditPermission ? (
                                  <Tooltip title="Edit Banner">
                                    <ICON_HELPER.EDIT_ICON
                                      onClick={() => handleEdit(res)}
                                      className="!text-xl group-hover:text-gray-500 hover:!text-primary cursor-pointer"
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="No permission to edit">
                                    <LockOutlined className="!text-xl text-gray-400" />
                                  </Tooltip>
                                )}
                                <Divider type="vertical" />
                                <Tooltip title="View on Site">
                                  <ICON_HELPER.EYE_ICON
                                    className="!text-xl group-hover:text-gray-500 hover:!text-primary cursor-pointer"
                                    onClick={() => handleView(res)}
                                  />
                                </Tooltip>
                                <Divider type="vertical" />
                                {hasDeletePermission ? (
                                  <Tooltip title="Delete Banner">
                                    <ICON_HELPER.DELETE_ICON
                                      onClick={() => handleDelete(res?._id)}
                                      className="!text-xl group-hover:text-gray-500 hover:!text-primary cursor-pointer"
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="No permission to delete">
                                    <LockOutlined className="!text-xl text-gray-400" />
                                  </Tooltip>
                                )}
                              </div>,
                            ]}
                            cover={
                              <div className="relative">
                                <Image 
                                  className="!h-[300px] !rounded-t-lg" 
                                  src={res.banner_image}
                                  preview={true}
                                />
                                {hasEditPermission && (
                                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                                    <HolderOutlined className="text-gray-500" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-black/70 text-white rounded-full px-2 py-1 text-xs font-bold">
                                  #{res.position !== undefined ? res.position : index}
                                </div>
                                {isExpired && (
                                  <div className="absolute top-12 left-2 bg-red-500 text-white rounded px-2 py-1 text-xs font-bold">
                                    EXPIRED
                                  </div>
                                )}
                                {res.videoUrl && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVideoModalUrl(res.videoUrl);
                                    }}
                                    className="absolute bottom-2 right-2 bg-black/80 hover:bg-black text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md z-10"
                                    title="Click to play video"
                                  >
                                    <PlayCircleOutlined className="text-red-400 text-sm" />
                                    <span>Watch Video</span>
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <Card.Meta 
                              title={<h1 className="!font-medium !text-sm">{res?.banner_name}</h1>}
                              description={
                                <div className="mt-2">
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    <Tag color="blue">{res.tag}</Tag>
                                    {res.is_reward && <Tag color="gold">Reward</Tag>}
                                    {res.rating && <Tag color="green">⭐ {res.rating}</Tag>}
                                    {res.auto_hidden && <Tag color="orange">Auto-Hidden</Tag>}
                                    {res.videoUrl && (
                                      <Tag 
                                        color="purple" 
                                        icon={<VideoCameraOutlined />} 
                                        className="cursor-pointer"
                                        onClick={() => setVideoModalUrl(res.videoUrl)}
                                      >
                                        Video
                                      </Tag>
                                    )}
                                  </div>
                                  
                                  {res.banner_slug && (
                                    <div className="mt-1">
                                      <Tag color="purple" className="text-xs">/{res.banner_slug}</Tag>
                                    </div>
                                  )}
                                  
                                  {res.banner_description && (
                                    <div className="mt-2 text-xs text-gray-600 line-clamp-2" title={res.banner_description}>
                                      {res.banner_description}
                                    </div>
                                  )}
                                  
                                  {expiryStatus && (
                                    <div className="mt-2">
                                      <Tag 
                                        color={expiryStatus.color} 
                                        icon={<ClockCircleOutlined />}
                                      >
                                        {expiryStatus.icon} {expiryStatus.text}
                                      </Tag>
                                    </div>
                                  )}
                                  
                                  <div className="mt-2">
                                    {res.feature?.slice(0, 2).map((feat, i) => (
                                      <Tag key={i} className="mb-1">{feat}</Tag>
                                    ))}
                                    {res.feature?.length > 2 && (
                                      <Tag>+{res.feature.length - 2} more</Tag>
                                    )}
                                  </div>
                                </div>
                              }
                            />
                          </Card>
                        </Badge.Ribbon>
                      </SortableCard>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
        
        {hasEditPermission && (
          <Modal 
            open={formStatus} 
            footer={false} 
            closable={true} 
            title={
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">
                  {id ? "Update" : "Add"} Banner
                </span>
              </div>
            }
            onCancel={handleCancel}
            width={700}
          >
            <Form 
              layout="vertical" 
              form={form} 
              onFinish={handleFinish}
              initialValues={{
                is_reward: false,
                is_visible: true,
                feature: "",
                banner_description: "",
                videoUrl: null
              }}
            >
              {/* Image Upload Field */}
              <Form.Item 
                label={<CustomLabel name="Banner Image" />}
                name="banner_image"
                rules={[formValidation("Please upload banner image")]}
              >
                <UploadHelper 
                  setImagePath={(path) => {
                    form.setFieldsValue({ banner_image: path });
                  }}
                />
              </Form.Item>

              {/* Show uploaded image */}
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const image = form.getFieldValue('banner_image');
                  return image ? (
                    <div className="mb-4">
                      <Image 
                        src={image} 
                        alt="Banner preview" 
                        className="max-h-40 object-contain rounded"
                      />
                    </div>
                  ) : null;   
                }}
              </Form.Item>

              {/* Video Upload Field */}
              <Form.Item 
                label={<span className="font-semibold">Banner Video (Optional)</span>}
                name="videoUrl"
                tooltip="Upload an optional video for this banner (MP4, WebM, MOV - Max 100MB)"
              >
                <VideoUploadHelper 
                  setVideoPath={(path) => {
                    form.setFieldsValue({ videoUrl: path });
                  }}
                />
              </Form.Item>

              {/* Show uploaded video preview */}
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const video = form.getFieldValue('videoUrl');
                  return video ? (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <VideoCameraOutlined className="text-blue-500" /> Uploaded Video Preview
                        </span>
                        <Button 
                          danger 
                          type="link" 
                          size="small" 
                          icon={<DeleteOutlined />}
                          onClick={() => form.setFieldsValue({ videoUrl: null })}
                        >
                          Remove Video
                        </Button>
                      </div>
                      <video 
                        src={video} 
                        controls 
                        className="w-full max-h-48 rounded bg-black object-contain"
                      />
                      <div className="mt-1 text-xs text-gray-400 truncate" title={video}>
                        {video}
                      </div>
                    </div>
                  ) : null;
                }}
              </Form.Item>

              {/* Banner Name */}
              <Form.Item 
                label={<span className="font-semibold">Banner Name</span>}
                name="banner_name" 
                rules={[formValidation("Enter Banner Name")]}
              >
                <Input 
                  className="h-[45px]" 
                  placeholder="Enter Banner Name"
                />
              </Form.Item>

              {/* Banner Slug */}
              <Form.Item 
                label={<span className="font-semibold">Banner Slug</span>}
                name="banner_slug"
                tooltip="URL-friendly version of the banner name"
              >
                <Input 
                  className="h-[45px]" 
                  placeholder="e.g., summer-sale-2024"
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                {/* Tag */}
                <Form.Item 
                  label={<span className="font-semibold">Tag</span>}
                  name="tag" 
                  rules={[formValidation("Enter Tag")]}
                >
                  <Input className="h-[45px]" placeholder="Enter Tag" />
                </Form.Item>

                {/* Rating */}
                <Form.Item 
                  label={<span className="font-semibold">Rating</span>}
                  name="rating"
                >
                  <Input 
                    className="h-[45px]" 
                    placeholder="Enter Rating" 
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                  />
                </Form.Item>
              </div>

              {/* Expiry Date */}
              <Form.Item 
                label={<span className="font-semibold">Expiry Date</span>}
                name="expiry_date"
                tooltip="Banner will automatically hide after this date"
              >
                <DatePicker 
                  className="w-full h-[45px]"
                  format="YYYY-MM-DD HH:mm"
                  showTime
                  placeholder="Select expiry date and time"
                />
              </Form.Item>

              {/* Banner Description */}
              <Form.Item 
                label={<span className="font-semibold">Banner Description</span>}
                name="banner_description"
                tooltip="Short promotional summary displayed on the banner (up to 250 characters)"
              >
                <Input.TextArea 
                  placeholder="Enter banner description to be shown on the storefront..."
                  rows={3}
                  maxLength={250}
                  showCount
                />
              </Form.Item>

              {/* Features */}
              <Form.Item 
                label={<span className="font-semibold">Features</span>}
                name="feature"
                tooltip="Enter features separated by commas"
                rules={[formValidation("Enter at least one feature")]}
              >
                <Input.TextArea 
                  placeholder="e.g., Free Shipping, 24/7 Support, Money Back Guarantee"
                  rows={3}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                {/* Visibility Switch */}
                <Form.Item 
                  label={<span className="font-semibold">Visible on Site?</span>}
                  name="is_visible"
                  valuePropName="checked"
                  tooltip="Control whether this banner is shown to users"
                >
                  <Switch 
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Form.Item>

                {/* Reward Switch */}
                <Form.Item 
                  label={<span className="font-semibold">Is Reward?</span>}
                  name="is_reward"
                  valuePropName="checked"
                  tooltip="Reward banners require login"
                >
                  <Switch />
                </Form.Item>
              </div>

              {/* Products Selection */}
              <Form.Item 
                label={<span className="font-semibold">Products</span>}
                name="banner_products" 
                rules={[formValidation("Select Products")]}
              >
                <Select 
                  mode="multiple" 
                  className="w-full" 
                  allowClear 
                  maxTagCount={2}
                  placeholder="Select products"
                  optionLabelProp="label"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {productData
                    .filter((res) => !res.is_cloned)
                    .map((res, index) => {
                      return (
                        <Select.Option 
                          key={index} 
                          value={res._id}
                          label={res.name}
                        >
                          <div className="flex items-center justify-between">
                            <span>{res.name}</span>
                            <img 
                              src={_.get(res, "images[0].path", "")} 
                              className="!size-[30px] rounded-full ml-2" 
                              alt={res.name}
                            />
                          </div>
                        </Select.Option>
                      );
                    })}
                </Select>
              </Form.Item>

              {/* Submit Button */}
              <Form.Item>
                <Button 
                  htmlType="submit" 
                  className="button !w-full !h-[50px]" 
                  loading={submitting}
                  type="primary"
                >
                  {id ? "Update" : "Add"} Banner
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        )}

        {/* Video Preview Modal */}
        <Modal
          open={Boolean(videoModalUrl)}
          title="Banner Video Preview"
          footer={null}
          onCancel={() => setVideoModalUrl(null)}
          destroyOnClose
          width={720}
        >
          {videoModalUrl && (
            <div className="py-2">
              <video 
                src={videoModalUrl} 
                controls 
                autoPlay 
                className="w-full max-h-[480px] rounded bg-black object-contain"
              />
              <div className="mt-2 text-xs text-gray-500 break-all">
                Source: <a href={videoModalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">{videoModalUrl}</a>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default Banner;