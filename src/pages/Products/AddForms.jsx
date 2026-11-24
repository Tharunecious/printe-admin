/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import {
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Image,
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
  ColorPicker,
} from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteFilled,
  PlusOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import JoditEditor from "jodit-react";
import moment from "moment";
import { DndContext } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper imports
import {
  addproduct,
  editProduct,
  getAllVendor,
  getMainCategory,
  getSubCategory,
  uploadImage,
} from "../../api";
import _ from "lodash";
import {
  CUSTOM_ERROR_NOTIFICATION,
  ERROR_NOTIFICATION,
  SUCCESS_NOTIFICATION,
} from "../../helper/notification_helper";
import { formValidation } from "../../helper/formvalidation";
import { ICON_HELPER } from "../../helper/iconhelper";

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Constants
const PRODUCT_TYPE = [
  { value: "Stand Alone Product" },
  { value: "Variable Product" },
];

const TAX_PREFERENCE = [
  { value: "Taxable" },
  { value: "Non-Taxable" },
  { value: "Out of Scope" },
  { value: "Non-GST Apply" },
];

const GST_PREFERENCE = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

const PRODUCT_STOCK_TYPE = [{ value: "Limited" }, { value: "Unlimited" }];
const UNIT_TYPE = [
  { value: "pcs" }, { value: "Box" }, { value: "cm" }, { value: "dozen" },
  { value: "gm" }, { value: "kg" }, { value: "lbs" }, { value: "meter" },
  { value: "inches" }, { value: "ft" }, { value: "Nos" }, { value: "Sqft" },
];

const VARIANT_TYPES = [
  { value: "text_box_variant", label: "Text Box Variant" },
  { value: "image_variant", label: "Image Variant (Upload 6 images per option)" },
  { value: "color_variant", label: "Color Variant (With Color Picker)" },
];

const INITIAL_VARIANT_OPTION = {
  value: "",
  _id: Date.now() + 1,
  variant_type: "text_box_variant",
  image_names: [],
  color_code: "#000000",
};

const INITIAL_VARIANT = {
  variant_name: "",
  variant_type: "text_box_variant",
  options: [{ ...INITIAL_VARIANT_OPTION }],
  variant_images: [],
  _id: Date.now(),
};

const INITIAL_SEO_DATA = {
  title: "",
  keywords: "",
  description: "",
  url: "",
};

// Helper Functions
const createImageObject = (url, existingId = null) => ({
  _id: existingId || uuidv4(),
  path: url,
  url: url,
  type: 'image',
  uploadedAt: new Date().toISOString()
});

const normalizeImages = (images) => {
  if (!images) return [];
  
  return images.map(img => {
    if (typeof img === 'string') {
      return createImageObject(img);
    } else if (typeof img === 'object') {
      return {
        _id: img._id || uuidv4(),
        path: img.path || img.url || img.image_url || '',
        url: img.url || img.path || img.image_url || '',
        type: img.type || 'image',
        uploadedAt: img.uploadedAt || new Date().toISOString()
      };
    }
    return img;
  }).filter(img => img.path || img.url);
};

const calculatePercentageDifference = (mrp, price) => {
  const mrpValue = parseFloat(mrp) || 0;
  const priceValue = parseFloat(price) || 0;
  
  if (mrpValue === 0 || priceValue === 0) return 0;
  
  const difference = priceValue - mrpValue;
  const percentage = (difference / mrpValue) * 100;
  
  return Math.round(percentage * 100) / 100;
};

const calculateDiscountedAmount = (basePrice, discountPercentage) => {
  const price = parseFloat(basePrice) || 0;
  const discount = parseFloat(discountPercentage) || 0;
  return price - (price * discount / 100);
};

// Enhanced Sortable Image Component
const SortableImage = ({ id, image, onRemove, showDragLabel = true }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove(id);
  };

  const imageUrl = image.url || image.path || image;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-20 bg-blue-500 bg-opacity-80 text-white p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ width: '24px', height: '24px' }}
      >
        <div className="flex items-center justify-center w-full h-full">
          ⠿
        </div>
      </div>
      
      <Image
        src={imageUrl}
        alt="Product"
        width={80}
        height={80}
        className="object-cover rounded border-2 border-dashed border-gray-300 cursor-pointer"
        preview={{
          mask: (
            <div className="flex items-center justify-center gap-1">
              <EyeOutlined className="text-white" />
              <span className="text-white text-xs">Preview</span>
            </div>
          ),
        }}
      />

      <button
        type="button"
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-0 cursor-pointer z-20"
        onClick={handleRemove}
      >
        <DeleteFilled className="text-xs" />
      </button>

      {showDragLabel && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
          Drag to reorder
        </div>
      )}
    </div>
  );
};

// Enhanced Sortable Image List Component
const SortableImageList = ({ images, setImages, showDragLabel = true, title = "" }) => {
  const getImageId = (image) => {
    return image._id || image.path || image;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => getImageId(img) === active.id);
    const newIndex = images.findIndex((img) => getImageId(img) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);
    }
  };

  const handleRemove = (imageId) => {
    const newImages = images.filter(img => getImageId(img) !== imageId);
    setImages(newImages);
  };

  return (
    <div className="space-y-3">
      {title && (
        <label className="text-gray-600 text-sm font-medium block">
          {title} ({images.length} images) - Drag to reorder
        </label>
      )}
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={images.map(img => getImageId(img))}>
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg !min-h-32 border border-dashed border-gray-300">
            {images.map((image, index) => (
              <SortableImage
                key={getImageId(image)}
                id={getImageId(image)}
                image={image}
                onRemove={handleRemove}
                showDragLabel={showDragLabel}
              />
            ))}
            {images.length === 0 && (
              <div className="flex items-center justify-center w-full h-32 text-gray-500">
                No images uploaded yet. Click upload to add images.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Color Picker Component for Variant Options
const ColorPickerOption = ({ 
  color, 
  onChange, 
  variantId, 
  optionId 
}) => {
  const [selectedColor, setSelectedColor] = useState(color || '#000000');

  const handleColorChange = (color, hex) => {
    setSelectedColor(hex);
    onChange(variantId, optionId, hex);
  };

  const presetColors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#000000', '#FFFFFF',
    '#808080', '#FFD700', '#008000', '#000080', '#800000', '#FF4500'
  ];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-600">Color Picker</label>
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded border border-gray-300 shadow-sm cursor-pointer"
          style={{ backgroundColor: selectedColor }}
          onClick={() => {
            message.info(`Selected color: ${selectedColor}`);
          }}
        />
        <ColorPicker
          value={selectedColor}
          onChange={handleColorChange}
          presets={[
            {
              label: 'Recommended',
              colors: presetColors,
            },
          ]}
          showText
        />
      </div>
    </div>
  );
};

// Enhanced Upload Helper Component
const EnhancedUploadHelper = ({ 
  multiple = true, 
  max = 10,
  setImagePath, 
  image_path = [], 
  blog = false, 
  current_key, 
  handleChange,
  label = "Upload Images"
}) => {
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event) => {
    try {
      setLoading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          message.warning(`File ${file.name} is not an image`);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          message.warning(`File ${file.name} is too large (max 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append("image", file);
        
        const result = await uploadImage(formData);
        const imageUrl = _.get(result, "data.data.url", "");
        
        if (imageUrl) {
          uploadedImages.push(createImageObject(imageUrl));
        }
      }

      if (uploadedImages.length > 0) {
        if (blog && current_key && handleChange) {
          handleChange(current_key, uploadedImages[0].url);
        } else {
          const currentImages = Array.isArray(image_path) ? image_path : [];
          const newImages = [...currentImages, ...uploadedImages].slice(0, max);
          setImagePath(newImages);
        }
        message.success(`Successfully uploaded ${uploadedImages.length} image(s)`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      message.error('Failed to upload images');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  if (blog) {
    return (
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          multiple={multiple}
          className="hidden"
          id={`blog-upload-${current_key}`}
        />
        <label
          htmlFor={`blog-upload-${current_key}`}
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-600 transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        multiple={multiple}
        className="hidden"
        id={`upload-${current_key || 'product'}`}
      />
      <label
        htmlFor={`upload-${current_key || 'product'}`}
        className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-50"
      >
        <div className="flex flex-col items-center gap-2">
          <PlusOutlined className="text-2xl text-gray-400" />
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="text-sm text-gray-500">
            Max {max} images • PNG, JPG, JPEG • Max 5MB each
          </span>
          {loading && (
            <div className="flex items-center gap-2 mt-2">
              <Spin size="small" />
              <span className="text-sm text-gray-500">Uploading...</span>
            </div>
          )}
        </div>
      </label>
      
      {image_path && image_path.length > 0 && (
        <div className="mt-4">
          <SortableImageList
            images={image_path}
            setImages={setImagePath}
            title="Uploaded Images"
          />
        </div>
      )}
    </div>
  );
};

// Variant Option Image Upload Component
const VariantOptionImageUpload = ({ 
  variantId, 
  optionId, 
  optionValue, 
  image_names = [], 
  onImageUpload
}) => {
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event) => {
    try {
      setLoading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          message.warning(`File ${file.name} is not an image`);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          message.warning(`File ${file.name} is too large (max 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append("image", file);
        
        const result = await uploadImage(formData);
        const imageUrl = _.get(result, "data.data.url", "");
        
        if (imageUrl) {
          uploadedImages.push(createImageObject(imageUrl));
        }
      }

      if (uploadedImages.length > 0) {
        const currentImages = Array.isArray(image_names) ? image_names : [];
        const newImages = [...currentImages, ...uploadedImages].slice(0, 6);
        onImageUpload(variantId, optionId, newImages);
        message.success(`Uploaded ${uploadedImages.length} image(s) for ${optionValue}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      message.error('Failed to upload images');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        multiple={true}
        className="hidden"
        id={`variant-option-upload-${variantId}-${optionId}`}
      />
      
      <label
        htmlFor={`variant-option-upload-${variantId}-${optionId}`}
        className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors bg-gray-50"
      >
        <div className="flex flex-col items-center gap-2">
          <PlusOutlined className="text-xl text-gray-400" />
          <span className="text-gray-600 font-medium">
            {image_names && image_names.length > 0 ? 'Add More' : 'Upload'} {optionValue} Images
          </span>
          <span className="text-sm text-gray-500">
            {image_names && image_names.length > 0 
              ? `${image_names.length}/6 images uploaded` 
              : `Upload 6 images for ${optionValue}`
            }
          </span>
          {loading && (
            <div className="flex items-center gap-2 mt-1">
              <Spin size="small" />
              <span className="text-xs text-gray-500">Uploading...</span>
            </div>
          )}
        </div>
      </label>
      
      {(image_names && image_names.length > 0) && (
        <div className="mt-4">
          <SortableImageList
            images={image_names}
            setImages={(newImages) => onImageUpload(variantId, optionId, newImages)}
            title={`${optionValue} Images`}
          />
        </div>
      )}
    </div>
  );
};

// Fixed Variant Option Component
const VariantOption = React.memo(({ 
  variant, 
  option, 
  onOptionChange, 
  onOptionDelete,
  onColorChange,
  onImageUpload 
}) => {
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    onOptionChange(variant._id, option._id, e.target.value);
  };

  const handleDelete = () => {
    onOptionDelete(variant._id, option._id);
  };

  const handleColorChange = (color) => {
    onColorChange(variant._id, option._id, color);
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          placeholder="eg. White, Large, etc."
          value={option.value}
          onChange={handleInputChange}
          className="flex-1"
          size="middle"
        />
        <Button
          type="text"
          danger
          icon={<DeleteFilled />}
          onClick={handleDelete}
          size="small"
          className="flex-shrink-0"
        />
      </div>
      
      {variant.variant_type === "color_variant" && (
        <ColorPickerOption
          color={option.color_code}
          onChange={onColorChange}
          variantId={variant._id}
          optionId={option._id}
        />
      )}
      
      {variant.variant_type === "image_variant" && (
        <VariantOptionImageUpload
          variantId={variant._id}
          optionId={option._id}
          optionValue={option.value}
          image_names={option.image_names || []}
          onImageUpload={onImageUpload}
        />
      )}
    </div>
  );
});

// Discount Row Component
const DiscountRow = React.memo(({ 
  name, 
  restField, 
  remove, 
  form, 
  customerPrice, 
  dealerPrice, 
  corporatePrice,
  productType,
  variantPrices = {}
}) => {
  const customerDiscount = Form.useWatch(['quantity_discount_splitup', name, 'Customer_discount'], form) || 0;
  const dealerDiscount = Form.useWatch(['quantity_discount_splitup', name, 'Dealer_discount'], form) || 0;
  const corporateDiscount = Form.useWatch(['quantity_discount_splitup', name, 'Corporate_discount'], form) || 0;

  const freeDeliveryCustomer = Form.useWatch(['quantity_discount_splitup', name, 'free_delivery_customer'], form) || false;
  const freeDeliveryDealer = Form.useWatch(['quantity_discount_splitup', name, 'free_delivery_dealer'], form) || false;
  const freeDeliveryCorporate = Form.useWatch(['quantity_discount_splitup', name, 'free_delivery_corporate'], form) || false;

  const getEffectivePrice = (priceType) => {
    if (productType === "Variable Product") {
      const variants = Object.values(variantPrices);
      if (variants.length > 0) {
        const firstVariant = variants[0];
        return firstVariant[priceType] || 0;
      }
      return 0;
    }
    
    switch (priceType) {
      case 'customer_product_price': return customerPrice;
      case 'Deler_product_price': return dealerPrice;
      case 'corporate_product_price': return corporatePrice;
      default: return 0;
    }
  };

  const effectiveCustomerPrice = getEffectivePrice('customer_product_price');
  const effectiveDealerPrice = getEffectivePrice('Deler_product_price');
  const effectiveCorporatePrice = getEffectivePrice('corporate_product_price');

  return (
    <Card size="small" key={name} className="relative mb-3">
      <div className="flex flex-nowrap items-start gap-3 overflow-x-auto pb-2">
        <div className="flex flex-col gap-2 min-w-[300px] bg-blue-50 p-3 rounded border">
          <div className="flex items-end gap-2">
            <Form.Item
              label="Cus Qty"
              {...restField}
              name={[name, "Customer_quantity"]}
              rules={[formValidation("Enter Customer Quantity")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="Qty"
                className="h-9"
              />
            </Form.Item>

            <Form.Item
              label="Cus Dis%"
              {...restField}
              name={[name, "Customer_discount"]}
              rules={[formValidation("Enter Customer discount")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="%"
                className="h-9"
                suffix="%"
              />
            </Form.Item>

            <div className="flex flex-col min-w-[100px]">
              <label className="text-xs text-gray-500 mb-1">Cus Price</label>
              <div className="h-9 px-2 border border-gray-300 rounded flex items-center bg-gray-50 text-sm">
                ₹{calculateDiscountedAmount(effectiveCustomerPrice, customerDiscount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Form.Item
              label="Free Delivery"
              {...restField}
              name={[name, "free_delivery_customer"]}
              valuePropName="checked"
              className="mb-0"
            >
              <Switch size="small" />
            </Form.Item>

            {!freeDeliveryCustomer && (
              <div className="flex items-center gap-2 flex-1">
                <Form.Item
                label="Delivery Charges"
                {...restField}
                name={[name, "delivery_charges_customer"]}
                className="mb-0 flex-1"
              >
                <Input
                  type="number"
                  placeholder="Charges"
                  className="h-9"
                  prefix="₹"
                />
              </Form.Item>
              <Form.Item
                label="out of TN charges"
                {...restField}
                name={[name, "delivery_charges_customer_outer_tn"]}
                className="mb-0 flex-1"
              >
                <Input
                  type="number"
                  placeholder="Charges for out of TN"
                  className="h-9"
                  prefix="₹"
                />
              </Form.Item>
              </div>
            )}
          </div>

          <Form.Item
            label="Recommended"
            {...restField}
            name={[name, "recommended_stats_customer"]}
            className="mb-0"
          >
            <Select
              className="h-9 text-sm"
              placeholder="Select status"
            >
              {[
                "Recommended",
                "Most Picked",
                "High seller",
                "Best seller",
                "No comments",
              ].map((res, index) => (
                <Select.Option key={index} value={res}>
                  {res}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="flex flex-col gap-2 min-w-[300px] bg-gray-50 p-3 rounded border">
          <div className="flex items-end gap-2">
            <Form.Item
              label="Dealer Qty"
              {...restField}
              name={[name, "Dealer_quantity"]}
              rules={[formValidation("Enter Dealer Quantity")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="Qty"
                className="h-9"
              />
            </Form.Item>

            <Form.Item
              label="Dealer Dis%"
              {...restField}
              name={[name, "Dealer_discount"]}
              rules={[formValidation("Enter Dealer discount")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="%"
                className="h-9"
                suffix="%"
              />
            </Form.Item>

            <div className="flex flex-col min-w-[100px]">
              <label className="text-xs text-gray-500 mb-1">Dealer Price</label>
              <div className="h-9 px-2 border border-gray-300 rounded flex items-center bg-gray-50 text-sm">
                ₹{calculateDiscountedAmount(effectiveDealerPrice, dealerDiscount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Form.Item
              label="Free Delivery"
              {...restField}
              name={[name, "free_delivery_dealer"]}
              valuePropName="checked"
              className="mb-0"
            >
              <Switch size="small" />
            </Form.Item>

            {!freeDeliveryDealer && (
              <div className="flex items-center gap-2 flex-1">

              <Form.Item
                label="Delivery Charges"
                {...restField}
                name={[name, "delivery_charges_dealer"]}
                className="mb-0 flex-1"
                >
                <Input
                  type="number"
                  placeholder="Charges"
                  className="h-9"
                  prefix="₹"
                  />
              </Form.Item>              

              <Form.Item
                label="out of TN charges"
                {...restField}
                name={[name, "delivery_charges_dealer_outer_tn"]}
                className="mb-0 flex-1"
                >
                <Input
                  type="number"
                  placeholder="Charges"
                  className="h-9"
                  prefix="₹"
                  />
              </Form.Item>              
                  </div>
            )}
          </div>

          <Form.Item
            label="Recommended"
            {...restField}
            name={[name, "recommended_stats_dealer"]}
            className="mb-0"
          >
            <Select
              className="h-9 text-sm"
              placeholder="Select status"
            >
              {[
                "Recommended",
                "Most Picked",
                "High seller",
                "Best seller",
                "No comments",
              ].map((res, index) => (
                <Select.Option key={index} value={res}>
                  {res}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="flex flex-col gap-2 min-w-[300px] bg-green-50 p-3 rounded border">
          <div className="flex items-end gap-2">
            <Form.Item
              label="Corp Qty"
              {...restField}
              name={[name, "Corporate_quantity"]}
              rules={[formValidation("Enter Corporate Quantity")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="Qty"
                className="h-9"
              />
            </Form.Item>

            <Form.Item
              label="Corp Dis%"
              {...restField}
              name={[name, "Corporate_discount"]}
              rules={[formValidation("Enter Corporate discount")]}
              className="mb-0 flex-1"
            >
              <Input
                type="number"
                placeholder="%"
                className="h-9"
                suffix="%"
              />
            </Form.Item>

            <div className="flex flex-col min-w-[100px]">
              <label className="text-xs text-gray-500 mb-1">Corp Price</label>
              <div className="h-9 px-2 border border-gray-300 rounded flex items-center bg-gray-50 text-sm">
                ₹{calculateDiscountedAmount(effectiveCorporatePrice, corporateDiscount).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Form.Item
              label="Free Delivery"
              {...restField}
              name={[name, "free_delivery_corporate"]}
              valuePropName="checked"
              className="mb-0"
            >
              <Switch size="small" />
            </Form.Item>

            {!freeDeliveryCorporate && (
              <div className="flex items-center gap-2 flex-1">

              <Form.Item
                label="Delivery Charges"
                {...restField}
                name={[name, "delivery_charges_corporate"]}
                className="mb-0 flex-1"
                >
                <Input
                  type="number"
                  placeholder="Charges"
                  className="h-9"
                  prefix="₹"
                  />
              </Form.Item>
              <Form.Item
                label="out of TN charges"
                {...restField}
                name={[name, "delivery_charges_corporate_outer_tn"]}
                className="mb-0 flex-1"
                >
                <Input
                  type="number"
                  placeholder="Charges"
                  className="h-9"
                  prefix="₹"
                  />
              </Form.Item>
                  </div>
            )}
          </div>

          <Form.Item
            label="Recommended"
            {...restField}
            name={[name, "recommended_stats_corporate"]}
            className="mb-0"
          >
            <Select
              className="h-9 text-sm"
              placeholder="Select status"
            >
              {[
                "Recommended",
                "Most Picked",
                "High seller",
                "Best seller",
                "No comments",
              ].map((res, index) => (
                <Select.Option key={index} value={res}>
                  {res}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteFilled />}
          onClick={() => remove(name)}
          className="mt-1"
        />
      </div>
    </Card>
  );
});

// Fixed PriceColumn Component - No cursor jumping
const PriceColumn = React.memo(({ title, dataIndex, record, onPriceChange }) => {
  const percentage = calculatePercentageDifference(record.MRP_price || 0, record[dataIndex] || 0);
  
  const handleChange = (e) => {
    const { value } = e.target;
    const numericValue = parseFloat(value) || 0;
    
    // Create updated record and call parent handler
    const updatedRecord = {
      ...record,
      [dataIndex]: numericValue,
    };
    
    onPriceChange(updatedRecord);
  };

  return (
    <div>
      <Input
        type="number"
        required
        placeholder={title}
        value={record[dataIndex] || ""}
        onChange={handleChange}
        step="0.01"
        min="0"
      />
      {record.MRP_price > 0 && record[dataIndex] > 0 && (
        <div className="text-xs mt-1">
          <Tag 
            color={percentage > 0 ? "green" : percentage < 0 ? "red" : "default"}
            icon={percentage > 0 ? <ArrowUpOutlined /> : percentage < 0 ? <ArrowDownOutlined /> : null}
          >
            {percentage > 0 ? '+' : ''}
            {percentage.toFixed(2)}%
          </Tag>
        </div>
      )}
    </div>
  );
});

// Main Component
const AddForms = ({ fetchData, setFormStatus, id, setId }) => {
  const [form] = Form.useForm();
  const [image_path, setImagePath] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [subcategory_data, setSubcategory_data] = useState([]);
  const [filter_subcategory_data, setFilterSubcategory_data] = useState([]);
  const [variants, setVariants] = useState([{ ...INITIAL_VARIANT, _id: Date.now() }]);
  const [tableValue, setTableValue] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantityType, setQuantityType] = useState("");
  const [dummy, setDummy] = useState(false);
  const [modalUnitVisible, setModalUnitVisible] = useState(false);
  const [usedProductCodes, setUsedProductCodes] = useState(new Set());
  
  const [isProductCodeLocked, setIsProductCodeLocked] = useState(false);
  const [lockedProductCodes, setLockedProductCodes] = useState({});
  
  const [percentageDifferences, setPercentageDifferences] = useState({
    customer: 0,
    dealer: 0,
    corporate: 0
  });

  const [seo_datas, setSEO_Datas] = useState(INITIAL_SEO_DATA);

  // Customization & Design States
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customizationMandatory, setCustomizationMandatory] = useState(false);
  const [proceedWithDesign, setProceedWithDesign] = useState(true);

  // Watched values
  const productTypeSelectedValue = Form.useWatch('type', form) || (id?.type || PRODUCT_TYPE[0].value);
  const customerPrice = Form.useWatch('customer_product_price', form) || 0;
  const dealerPrice = Form.useWatch('Deler_product_price', form) || 0;
  const corporatePrice = Form.useWatch('corporate_product_price', form) || 0;
  
  const variantPrices = Form.useWatch('variants_price', form) || [];
  const watchedMRP = Form.useWatch('MRP_price', form) || 0;
  const watchedProductCode = Form.useWatch('product_code', form) || '';
  const watchedProductCodeSNO = Form.useWatch('product_codeS_NO', form) || '';

  const isCustomizationEnabled = Form.useWatch('is_customization_enabled', form);
  const isCustomizationMandatory = Form.useWatch('is_customization_mandatory', form);

  const isPS0511Product =
    String(watchedProductCode).trim().toUpperCase() === "PS0511" ||
    String(watchedProductCodeSNO).trim().toUpperCase() === "PS0511" ||
    String(id?.product_code || "").trim().toUpperCase() === "PS0511" ||
    String(id?.product_codeS_NO || "").trim().toUpperCase() === "PS0511" ||
    (Array.isArray(id?.variants_price) && id.variants_price.some(vp => String(vp?.product_code || "").trim().toUpperCase() === "PS0511"));

  const userRole = JSON.parse(localStorage.getItem("userprofile") || '{"role": "user"}');
  const hasImageVariant = variants.some(variant => 
    variant.variant_type === "image_variant" 
  );

  // API Functions
  const productCategory = async () => {
    try {
      const result = await getMainCategory();
      const result2 = await getSubCategory();
      const data = _.get(result, "data.data", "");
      setCategoryData(data);
      setSubcategory_data(_.get(result2, "data.data", []));
    } catch (err) {
      console.log(err);
    }
  };

  const collectVendors = async () => {
    try {
      setLoading(true);
      const result = await getAllVendor(null);
      setAllVendors(_.get(result, "data.data", []));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    productCategory();
    collectVendors();
  }, []);

  useEffect(() => {
    if (id && categoryData.length > 0 && subcategory_data.length > 0) {
      setLoading(true);
      const categoryId = _.get(id, "category_details._id", "");
      
      if (categoryId) {
        const filteredSubcategories = subcategory_data.filter(
          (data) => data.select_main_category === categoryId
        );
        setFilterSubcategory_data(filteredSubcategories);
      }
      
      setCustomizationEnabled(Boolean(id.is_customization_enabled));
      setCustomizationMandatory(Boolean(id.is_customization_mandatory));
      setProceedWithDesign(id.is_proceed_with_design !== false && id.proceed_with_design !== false);

      const formValues = {
        ...id,
        vendor_details: _.get(id, "vendor_details._id",""),
        category_details: categoryId,
        sub_category_details: _.get(id, "sub_category_details._id", ""),
        customization_name_price: id.customization_name_price !== undefined ? id.customization_name_price : 10,
        is_customization_enabled: Boolean(id.is_customization_enabled),
        is_customization_mandatory: Boolean(id.is_customization_mandatory),
        is_proceed_with_design: id.is_proceed_with_design !== false && id.proceed_with_design !== false,
        stock_info: [],
      };

      form.setFieldsValue(formValues);
      setQuantityType(_.get(id, "quantity_type", ""));

      setSEO_Datas({
        title: _.get(id, "seo_title", ""),
        description: _.get(id, "seo_description", ""),
        url: _.get(id, "seo_url", ""),
      });

      const initialTableValue = _.get(id, "variants_price", []).map(item => ({
        ...item,
        MRP_price: item.MRP_price || 0,
        customer_product_price: item.customer_product_price || 0,
        Deler_product_price: item.Deler_product_price || 0,
        corporate_product_price: item.corporate_product_price || 0,
      }));
      setTableValue(initialTableValue);
      
      setIsProductCodeLocked(_.get(id, "product_Lock", false));
      
      const initialLockedCodes = {};
      _.get(id, "variants_price", []).forEach(variant => {
        if (variant.key && variant.isLocked) {
          initialLockedCodes[variant.key] = true;
        }
      });
      setLockedProductCodes(initialLockedCodes);
      
      const productImages = _.get(id, "images", []);
      const normalizedImages = normalizeImages(productImages);
      setImagePath(normalizedImages);
      
      const initialVariants = _.get(id, "variants", [INITIAL_VARIANT]);
      const updatedVariants = initialVariants.map(variant => ({
        ...variant,
        _id: variant._id || Date.now() + Math.random(),
        variant_images: normalizeImages(variant.variant_images || []),
        options: variant.options.map(option => ({
          ...option,
          _id: option._id || Date.now() + Math.random(),
          image_names: normalizeImages(option.image_names || []),
          color_code: option.color_code || "#000000"
        }))
      }));
      
      setVariants(updatedVariants);
      setDummy(!dummy);
      setLoading(false);
    }
  }, [id, form, categoryData, subcategory_data]);

  // Price Handlers
  const updatePercentageDifferences = useCallback((mrp, customerPrice, dealerPrice, corporatePrice) => {
    const mrpValue = parseFloat(mrp) || 0;
    
    const newPercentages = {
      customer: calculatePercentageDifference(mrpValue, customerPrice),
      dealer: calculatePercentageDifference(mrpValue, dealerPrice),
      corporate: calculatePercentageDifference(mrpValue, corporatePrice)
    };
    
    setPercentageDifferences(newPercentages);
  }, []);

  const handleMRPChange = (value) => {
    const mrp = parseFloat(value) || 0;
    const customerPrice = parseFloat(form.getFieldValue('customer_product_price') || 0);
    const dealerPrice = parseFloat(form.getFieldValue('Deler_product_price') || 0);
    const corporatePrice = parseFloat(form.getFieldValue('corporate_product_price') || 0);
    
    updatePercentageDifferences(mrp, customerPrice, dealerPrice, corporatePrice);
  };

  const handleCustomerPriceChange = (value) => {
    const customerPrice = parseFloat(value) || 0;
    const mrp = parseFloat(form.getFieldValue('MRP_price') || 0);
    const dealerPrice = parseFloat(form.getFieldValue('Deler_product_price') || 0);
    const corporatePrice = parseFloat(form.getFieldValue('corporate_product_price') || 0);
    
    updatePercentageDifferences(mrp, customerPrice, dealerPrice, corporatePrice);
  };

  const handleDealerPriceChange = (value) => {
    const dealerPrice = parseFloat(value) || 0;
    const mrp = parseFloat(form.getFieldValue('MRP_price') || 0);
    const customerPrice = parseFloat(form.getFieldValue('customer_product_price') || 0);
    const corporatePrice = parseFloat(form.getFieldValue('corporate_product_price') || 0);
    
    updatePercentageDifferences(mrp, customerPrice, dealerPrice, corporatePrice);
  };

  const handleCorporatePriceChange = (value) => {
    const corporatePrice = parseFloat(value) || 0;
    const mrp = parseFloat(form.getFieldValue('MRP_price') || 0);
    const customerPrice = parseFloat(form.getFieldValue('customer_product_price') || 0);
    const dealerPrice = parseFloat(form.getFieldValue('Deler_product_price') || 0);
    
    updatePercentageDifferences(mrp, customerPrice, dealerPrice, corporatePrice);
  };

  // FIXED: Variant price handlers - No cursor jumping
  const handlePriceChange = useCallback((updatedRecord) => {
    setTableValue(prevTableValue => {
      const updatedTableValue = prevTableValue.map((data) => {
        if (data.key === updatedRecord.key) {
          return updatedRecord;
        }
        return data;
      });

      if (!updatedTableValue.some((data) => data.key === updatedRecord.key)) {
        updatedTableValue.push(updatedRecord);
      }

      return updatedTableValue;
    });
  }, []);

  const handleProductCodeChange = useCallback((record, e) => {
    const { value } = e.target;
    setTableValue(prevTableValue => 
      prevTableValue.map((data) => {
        if (data.key === record.key) {
          return {
            ...data,
            product_code: value,
            product_unique_code: uuidv4() + Date.now(),
          };
        }
        return data;
      })
    );
  }, []);

  // Fixed Variant Handlers
  const handleAddVariant = useCallback(() => {
    const newVariantId = Date.now() + Math.random();
    const newVariant = { 
      ...INITIAL_VARIANT, 
      _id: newVariantId,
      options: [{
        ...INITIAL_VARIANT_OPTION,
        _id: Date.now() + Math.random()
      }]
    };
    setVariants(prev => [...prev, newVariant]);
  }, []);

  const handleAddVariantOption = useCallback((id) => {
    setVariants(prevVariants => 
      prevVariants.map((data) => {
        if (data._id === id) {
          return {
            ...data,
            options: [
              ...data.options,
              {
                ...INITIAL_VARIANT_OPTION,
                _id: Date.now() + Math.random(),
                variant_type: data.variant_type,
                color_code: data.variant_type === "color_variant" ? "#000000" : undefined,
              },
            ],
          };
        }
        return data;
      })
    );
  }, []);

  const handleOnChangeVariantName = useCallback((event, id) => {
    const { value } = event.target;
    setVariants(prevVariants =>
      prevVariants.map((variant) =>
        variant._id === id ? { ...variant, variant_name: value } : variant
      )
    );
  }, []);

  const handleOnChangeVariantType = useCallback((event, id) => {
    setVariants(prevVariants =>
      prevVariants.map((variant) =>
        variant._id === id
          ? {
              ...variant,
              variant_type: event,
              options: variant.options.map(option => ({
                ...option,
                variant_type: event,
                image_names: event === "image_variant" ? (option.image_names || []) : [],
                color_code: event === "color_variant" ? (option.color_code || "#000000") : undefined
              }))
            }
          : variant
      )
    );
  }, []);

  const handleOnDeleteVariantName = useCallback((variant_details) => {
    if (variants.length <= 1) {
      return CUSTOM_ERROR_NOTIFICATION("At least one variant is required");
    }
    
    if (!_.isEmpty(_.get(variant_details, "options", []))) {
      return CUSTOM_ERROR_NOTIFICATION("Please delete variant options first");
    }
    
    setVariants(prevVariants =>
      prevVariants.filter((variant) => variant._id !== variant_details._id)
    );
  }, [variants]);

  // FIXED: Variant option change handler
  const handleOnChangeVariantOptionName = useCallback((VariantId, OptionId, value) => {
    setVariants(prevVariants => 
      prevVariants.map((data) => {
        if (data._id === VariantId) {
          const optionChange = data.options.map((option) =>
            option._id === OptionId ? { ...option, value } : option
          );
          return { ...data, options: optionChange };
        }
        return data;
      })
    );
  }, []);

  const handleOnDeleteVariantOptionName = useCallback((VariantId, OptionId) => {
    const variant = variants.find(v => v._id === VariantId);
    if (variant && variant.options.length <= 1) {
      return CUSTOM_ERROR_NOTIFICATION("At least one option is required");
    }

    setVariants(prevVariants => 
      prevVariants.map((data) => {
        if (data._id === VariantId) {
          const optionChange = data.options.filter(
            (option) => option._id !== OptionId
          );
          return { ...data, options: optionChange };
        }
        return data;
      })
    );
  }, [variants]);

  // Color Picker Handler
  const handleColorChange = useCallback((variantId, optionId, color) => {
    setVariants(prevVariants =>
      prevVariants.map(variant =>
        variant._id === variantId
          ? {
              ...variant,
              options: variant.options.map(option =>
                option._id === optionId
                  ? { ...option, color_code: color }
                  : option
              )
            }
          : variant
      )
    );
  }, []);

  // Variant Option Image Handlers
  const handleVariantOptionImageUpload = useCallback((variantId, optionId, images) => {
    setVariants(prevVariants =>
      prevVariants.map(variant =>
        variant._id === variantId
          ? {
              ...variant,
              options: variant.options.map(option =>
                option._id === optionId
                  ? { ...option, image_names: images }
                  : option
              )
            }
          : variant
      )
    );
  }, []);

  // Lock Handlers
  const handleLockProductCode = useCallback(() => {
    if (isProductCodeLocked && userRole.role !== "super admin") {
      message.error("Only super admin can unlock product code");
      return;
    }
    
    setIsProductCodeLocked(!isProductCodeLocked);
    if (!isProductCodeLocked) {
      message.success("Product code locked");
    } else {
      message.info("Product code unlocked");
    }
  }, [isProductCodeLocked, userRole.role]);

  const handleLockVariantProductCode = useCallback((recordKey) => {
    if (lockedProductCodes[recordKey] && userRole.role !== "super admin") {
      message.error("Only super admin can unlock variant product code");
      return;
    }
    
    setLockedProductCodes(prev => ({
      ...prev,
      [recordKey]: !prev[recordKey]
    }));

    setTableValue(prevTableValue => 
      prevTableValue.map(item => {
        if (item.key === recordKey) {
          return { ...item, isLocked: !lockedProductCodes[recordKey] };
        }
        return item;
      })
    );
  }, [lockedProductCodes, userRole.role]);

  // Form Helpers
  const onCategoryChnge = useCallback((value) => {
    if (value) {
      const response = subcategory_data.filter((data) => {
        return data.select_main_category === value;
      });
      setFilterSubcategory_data(response);
      
      form.setFieldsValue({ sub_category_details: undefined });
    } else {
      setFilterSubcategory_data([]);
    }
  }, [subcategory_data, form]);

  const handleChnge = useCallback((e, location) => {
    setSEO_Datas((pre) => ({ ...pre, [location]: e.target.value }));
  }, []);

  const GET_TABLE_TYPE = useCallback((key) => {
    try {
      return _.get(
        form.getFieldValue("description_tabs"),
        `[${key}].tab_type`,
        ""
      );
    } catch (err) {
      return "";
    }
  }, [form]);

  const handleChange = useCallback((id, url) => {
    setDummy(!dummy);
    let firstFieldKey = Number(id.split("-")[1]);
    let imageFieldKey = Number(id.split("-")[0]);

    let currentObject = _.get(
      form.getFieldValue("description_tabs"),
      `[${firstFieldKey}].content_image_view`,
      []
    ).filter((res) => {
      return res.image_id === imageFieldKey;
    });

    let initial = _.get(currentObject, "[0].images", []);
    initial.push(url);
    currentObject[0].images = initial;
  }, [dummy, form]);

  const GETCURRENT_SETOF_IMAGES = useCallback((id) => {
    try {
      let firstFieldKey = Number(id.split("-")[1]);
      let imageFieldKey = Number(id.split("-")[0]);
      let currentObject = _.get(
        form.getFieldValue("description_tabs"),
        `[${firstFieldKey}].content_image_view`,
        []
      ).filter((res) => {
        return res.image_id === imageFieldKey;
      });

      return _.get(currentObject, "[0].images", []);
    } catch (err) {
      return [];
    }
  }, [form]);

  const REMOVE_IMAGES = useCallback((id, delete_url) => {
    try {
      setDummy(!dummy);
      let firstFieldKey = Number(id.split("-")[1]);
      let imageFieldKey = Number(id.split("-")[0]);
      let currentObject = _.get(
        form.getFieldValue("description_tabs"),
        `[${firstFieldKey}].content_image_view`,
        []
      ).filter((res) => {
        return res.image_id === imageFieldKey;
      });

      let initial = currentObject[0].images;
      initial?.splice(initial?.indexOf(delete_url), 1);
      currentObject[0].images = initial;
    } catch (err) {
      console.log(err);
    } finally {
      setDummy(!dummy);
    }
  }, [dummy, form]);

  // Generate Product Code
  const generateProductCode = useCallback((isVariableProduct = false, variantName = "") => {
    const categoryId = form.getFieldValue("category_details");
    const subCategoryId = form.getFieldValue("sub_category_details");

    if (!categoryId || !subCategoryId) {
      message.warning("Please select category and subcategory first");
      return null;
    }

    const category = categoryData.find((c) => c._id === categoryId);
    const subCategory = filter_subcategory_data.find(
      (sc) => sc._id === subCategoryId
    );

    if (!category || !subCategory) {
      message.warning("Please select valid category and subcategory");
      return null;
    }

    const categoryPrefix = category.main_category_name.charAt(0).toUpperCase();
    const subCategoryPrefix = subCategory.sub_category_name.charAt(0).toUpperCase();

    let variantPrefix = "";
    if (isVariableProduct && variantName) {
      variantPrefix = variantName.charAt(0).toUpperCase();
    }

    let productCode = "";
    let isUnique = false;
    let attemptCount = 0;
    const maxAttempts = 50;

    while (!isUnique && attemptCount < maxAttempts) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      productCode = `${categoryPrefix}${subCategoryPrefix}${variantPrefix}${randomNum}`;

      if (!usedProductCodes.has(productCode)) {
        isUnique = true;
        setUsedProductCodes((prev) => new Set([...prev, productCode]));
      }
      attemptCount++;
    }

    if (attemptCount >= maxAttempts) {
      message.error("Could not generate a unique product code. Please try again.");
      return null;
    }

    return productCode;
  }, [categoryData, filter_subcategory_data, form, usedProductCodes]);

  // Modal Handlers
  const showUnitModal = useCallback(() => {
    setModalUnitVisible(true);
  }, []);

  const handleUnitOk = useCallback(() => {
    setModalUnitVisible(false);
  }, []);

  const handleUnitCancel = useCallback(() => {
    setModalUnitVisible(false);
  }, []);

  // Generate table data from variants with proper price initialization
  const combinations = useMemo(() => {
    if (!variants || variants.length === 0) return [[]];
    
    return variants.reduce(
      (acc, variant) =>      
        acc.flatMap((combination) =>
          variant.options.map((option) => [...combination, option])
        ),
      [[]]
    );
  }, [variants]);

  const tableData = useMemo(() => {
    if (!combinations || combinations.length === 0) return [];
    
    return combinations.map((combination) => {
      const row = {
        key: combination.map((opt) => opt.value).join("-"),
        variantData: {}
      };

      combination.forEach((data, i) => {
        const variantName = variants[i]?.variant_name || `Variant ${i + 1}`;
        
        if (variants[i]?.variant_type === "color_variant") {
          row.variantData[variantName] = {
            value: data.value,
            color: data.color_code || "#000000"
          };
        } else {
          row.variantData[variantName] = {
            value: data.value
          };
        }
      });

      const existingData = tableValue.find((data) => data.key === row.key);

      const baseRecord = {
        ...row,
        isLocked: lockedProductCodes[row.key] || false,
        MRP_price: existingData?.MRP_price || 0,
        customer_product_price: existingData?.customer_product_price || 0,
        Deler_product_price: existingData?.Deler_product_price || 0,
        corporate_product_price: existingData?.corporate_product_price || 0,
        product_code: existingData?.product_code || ""
      };

      return baseRecord;
    });
  }, [combinations, tableValue, variants, lockedProductCodes]);

  // Stock Info Data
  const stockInfoData = (form.getFieldValue("stock_info") || []).map(
    (item, index) => ({
      key: `new-${index}`,
      _id: item._id || uuidv4(),
      add_stock: item.add_stock,
      date: item.date ? moment(item.date).format("DD/MM/YYYY h:mm A") : "",
      invoice: item.invoice || "",
      note: item.notes || "",
    })
  );

  const combinedStockInfoData = [
    ...(id?.stock_info || []).map((item, index) => ({
      key: `existing-${index}`,
      _id: item._id || uuidv4(),
      add_stock: item.add_stock,
      date: item.date ? moment(item.date).format("DD/MM/YYYY h:mm A") : "",
      invoice: item.invoice || "",
      note: item.notes || "",
    })),
    ...stockInfoData,
  ].reduce((unique, item) => {
    return unique.some((u) => u._id === item._id) ? unique : [...unique, item];
  }, []);

  // Stock Info Columns
  const stockInfoColumns = [
    {
      title: "Add Stock",
      dataIndex: "add_stock",
      key: "add_stock",
      render: (text) => text || "N/A",
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      key: "date",
      render: (text) => text || "N/A",
    },
    {
      title: "Invoice",
      dataIndex: "invoice",
      key: "invoice",
      render: (text) => text || "N/A",
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (text) => text || "N/A",
    },
  ];

  // FIXED: Columns definition with stable handlers
  const columns = useMemo(() => [
    ...variants.map((variant) => {
      const variantName = variant.variant_name || `Variant ${variant._id}`;
      
      return {
        title: variantName,
        dataIndex: ['variantData', variantName, 'value'],
        key: variantName,
        render: (text, record) => {
          const variantData = record.variantData[variantName];
          
          if (!variantData) return "-";
          
          if (variant.variant_type === "color_variant") {
            const colorCode = variantData.color || "#000000";
            return (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300 shadow-sm cursor-pointer"
                  style={{ backgroundColor: colorCode }}
                  title={colorCode}
                  onClick={() => message.info(`Color: ${colorCode}`)}
                />
                <span>{variantData.value || "-"}</span>
              </div>
            );
          }
          
          return variantData.value || "-";
        },
      };
    }),
    {
      title: "Cost",
      dataIndex: "MRP_price",
      key: "MRP_price",
      render: (text, record) => (
        <PriceColumn
          title="Cost"
          dataIndex="MRP_price"
          record={record}
          onPriceChange={handlePriceChange}
        />
      ),
    },
    {
      title: "Customer Price",
      dataIndex: "customer_product_price",
      key: "customer_product_price",
      render: (text, record) => (
        <PriceColumn
          title="Customer Price"
          dataIndex="customer_product_price"
          record={record}
          onPriceChange={handlePriceChange}
        />
      ),
    },
    {
      title: "Dealer Price",
      dataIndex: "Deler_product_price",
      key: "Deler_product_price",
      render: (text, record) => (
        <PriceColumn
          title="Dealer Price"
          dataIndex="Deler_product_price"
          record={record}
          onPriceChange={handlePriceChange}
        />
      ),
    },
    {
      title: "Corporate Price",
      dataIndex: "corporate_product_price",
      key: "corporate_product_price",
      render: (text, record) => (
        <PriceColumn
          title="Corporate Price"
          dataIndex="corporate_product_price"
          record={record}
          onPriceChange={handlePriceChange}
        />
      ),
    },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      render: (text, record) => (
        <Input
          placeholder="Product Code"
          required
          value={record.product_code || ""}
          onChange={(e) => handleProductCodeChange(record, e)}
          readOnly={lockedProductCodes[record.key]}
          suffix={
            !lockedProductCodes[record.key] ? (
              <ReloadOutlined
                onClick={() => {
                  const isVariable = productTypeSelectedValue === "Variable Product";
                  const code = generateProductCode(isVariable, record.variant_name);
                  if (code) {
                    setTableValue(prevTableValue => 
                      prevTableValue.map((data) => {
                        if (data.key === record.key) {
                          return { ...data, product_code: code };
                        }
                        return data;
                      })
                    );
                  }
                }}
                style={{ cursor: "pointer" }}
              />
            ) : null
          }
          addonAfter={
            <Button
              type="text"
              icon={lockedProductCodes[record.key] ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleLockVariantProductCode(record.key)}
              size="small"
              disabled={lockedProductCodes[record.key] && userRole.role !== "super admin"}
            />
          }
        />
      ),
    },
  ], [variants, tableValue, lockedProductCodes, productTypeSelectedValue, userRole.role, handlePriceChange, handleProductCodeChange, generateProductCode, handleLockVariantProductCode]);

  // Form Submission
const getFirstAvailableImage = (productData) => {
  // Check main images array
  if (productData.images && productData.images.length > 0) {
    return productData.images[0].url;
  }
  
  // Check variant images
  if (productData.variants && productData.variants.length > 0) {
    // Look for variant images first
    for (const variant of productData.variants) {
      if (variant.variant_images && variant.variant_images.length > 0) {
        return variant.variant_images[0].url;
      }
    }
    
    // Look in option images
    for (const variant of productData.variants) {
      if (variant.options && variant.options.length > 0) {
        for (const option of variant.options) {
          if (option.image_names && option.image_names.length > 0) {
            return option.image_names[0].url;
          }
        }
      }
    }
  }
  
  return null; // Return null if no image found
};

const handleFinish = async (values) => {
  try {
    console.log("Form Values:", values);
    
    setLoading(true);
    
    const existingStockInfo = (id ? _.get(id, "stock_info", []) : []).map(
      (item) => ({
        ...item,
        _id: item._id || uuidv4(),
        date: item.date ? new Date(item.date).toISOString() : null,
      })
    );
    
    const newStockInfo = (values.stock_info || []).map((item) => ({
      ...item,
      _id: uuidv4(),
      date: item.date ? item.date.toISOString() : null,
    }));

    const combinedStockInfo = [...existingStockInfo, ...newStockInfo];
    const uniqueStockInfo = [];
    const seenIds = new Set();

    combinedStockInfo.forEach((item) => {
      if (!seenIds.has(item._id)) {
        seenIds.add(item._id);
        uniqueStockInfo.push(item);
      }
    });

    values.stock_info = uniqueStockInfo;

    const existingStockCount = id ? Number(_.get(id, "stock_count", 0)) : 0;
    const newStock = newStockInfo.reduce(
      (sum, item) => sum + (Number(item.add_stock) || 0),
      0
    );
    values.stock_count = Number(existingStockCount) + Number(newStock);

    values.images = image_path.map(img => ({
      _id: img._id,
      path: img.path,
      url: img.url,
      type: img.type || 'image',
      uploadedAt: img.uploadedAt
    }));

    values.variants = variants.map(variant => ({
      variant_name: variant.variant_name,
      variant_type: variant.variant_type,
      variant_images: variant.variant_images ? variant.variant_images.map(img => ({
        _id: img._id,
        path: img.path,
        url: img.url,
        type: img.type || 'image',
        uploadedAt: img.uploadedAt
      })) : [],
      options: variant.options.map(option => ({
        value: option.value,
        variant_type: option.variant_type,
        color_code: option.color_code,
        image_names: option.image_names ? option.image_names.map(img => ({
          _id: img._id,
          path: img.path,
          url: img.url,
          type: img.type || 'image',
          uploadedAt: img.uploadedAt
        })) : []
      }))
    }));

    values.product_Lock = isProductCodeLocked;
    values.variants_price = tableValue.map(item => {
      const { variantData, ...rest } = item;
      
      const flatItem = { ...rest };
      if (variantData) {
        Object.keys(variantData).forEach(variantName => {
          flatItem[variantName] = variantData[variantName].value;
          if (variantData[variantName].color) {
            flatItem[`${variantName}_color`] = variantData[variantName].color;
          }
        });
      }
      
      return {
        ...flatItem,
        isLocked: lockedProductCodes[item.key] || false
      };
    });

    values.seo_url = String(values.seo_url).trim();
    
    const isCustomEnabled = Boolean(customizationEnabled || form.getFieldValue('is_customization_enabled') || values.is_customization_enabled);
    const isCustomMandatory = Boolean(customizationMandatory || form.getFieldValue('is_customization_mandatory') || values.is_customization_mandatory);
    values.is_customization_enabled = isCustomEnabled;
    values.is_customization_mandatory = isCustomEnabled ? isCustomMandatory : false;
    values.is_proceed_with_design = proceedWithDesign !== false && form.getFieldValue('is_proceed_with_design') !== false && values.is_proceed_with_design !== false;

    if (values.customization_name_price !== undefined && values.customization_name_price !== "") {
      values.customization_name_price = Number(values.customization_name_price);
    } else if (isPS0511Product) {
      values.customization_name_price = 10;
    }

    // Get SEO image from available images
    values.seo_img = getFirstAvailableImage(values);
    console.log("SEO Image URL:", values.seo_img);

    let result = id
      ? await editProduct(values, id?._id)
      : await addproduct(values);

    setFormStatus(false);
    SUCCESS_NOTIFICATION(result);
    form.resetFields();
    setCustomizationEnabled(false);
    setCustomizationMandatory(false);
    setProceedWithDesign(true);
    setId("");
    setQuantityType("");
    setImagePath([]);
    setFormStatus(false);
    fetchData();
    setSEO_Datas(INITIAL_SEO_DATA);
    setPercentageDifferences({ customer: 0, dealer: 0, corporate: 0 });
    
    if (!id) {
      setIsProductCodeLocked(false);
      setLockedProductCodes({});
    }
  } catch (err) {
    console.log("Error in form submission:", err);
    ERROR_NOTIFICATION(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <Spin spinning={loading}>
      <div className="bg-gray-50 min-h-screen">
        <Card
          bordered={false}
          style={{
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "12px",
            background: "white",
          }}
        >
          <div className="flex justify-between px-5 items-center mb-6">
            <div>
              <Title
                level={2}
                style={{ color: "#2c3e50", marginBottom: "8px" }}
              >
                {id ? "Edit Product" : "Add New Product"}
              </Title>
              <Text type="secondary">
                {id
                  ? "Update the product details below"
                  : "Fill in the details below to add a new product to your catalog"}
              </Text>
            </div>
          </div>

      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ is_customization_enabled: false, is_customization_mandatory: false, is_proceed_with_design: true }}>
        <Collapse
          defaultActiveKey={["1", "2", "3", "4", "5", "6", "7"]}
          expandIconPosition="end"
          className="custom-collapse"
        >
          {/* Product Basic Information Panel */}
          <Panel
            header={
              <span className="text-lg font-semibold relative">
                Product Basic Information
              </span>
            }
            key="1"
          >
            <div className={`grid grid-cols-1 md:grid-cols-2 ${userRole.role == "super admin"?"lg:grid-cols-5":"lg:grid-cols-4"} gap-4`}>
              {userRole.role == "super admin" && (
              <div className="p-2 bg-blue-50 rounded-lg border">
                <Form.Item
                  name="is_visible"
                  label="Visibility"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Form.Item>
                </div>
              )}
              <div className="p-2 bg-gray-50 rounded-lg border">
                    <Form.Item
                  name="is_soldout"
                  label="sold out "
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border">
                <Form.Item
                  name="is_customer"
                  label="Customer product"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border">
                <Form.Item
                  name="is_dealer"
                  label="Dealer product"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border">
              <Form.Item
                name="is_corporate"
                label="Corporate product"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              </div>
            </div>

            {/* Customization & Design Settings (Not applicable to PS0511 which has its dedicated live flow) */}
            {!isPS0511Product ? (
              <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">✍️</span>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm m-0">
                      Product Customization &amp; Design Settings
                    </h4>
                    <p className="text-xs text-gray-600 m-0">
                      Control design file upload and customized name options for this product.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Toggle 1: Proceed with Design */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        Proceed with Design
                      </div>
                      <div className="text-xs text-gray-500">
                        Show image/design upload UI for customer
                      </div>
                    </div>
                    <Switch
                      checked={proceedWithDesign}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      onChange={(checked) => {
                        setProceedWithDesign(checked);
                        form.setFieldsValue({ is_proceed_with_design: checked });
                      }}
                    />
                  </div>

                  {/* Toggle 2: Customization Name */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        Customization Name
                      </div>
                      <div className="text-xs text-gray-500">
                        Show customized name input for customer
                      </div>
                    </div>
                    <Switch
                      checked={customizationEnabled}
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                      onChange={(checked) => {
                        setCustomizationEnabled(checked);
                        form.setFieldsValue({
                          is_customization_enabled: checked,
                          ...(!checked ? { is_customization_mandatory: false } : {})
                        });
                        if (!checked) {
                          setCustomizationMandatory(false);
                        }
                      }}
                    />
                  </div>

                  {/* Toggle 3: Mandatory */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between shadow-sm transition-all ${
                      customizationEnabled
                        ? "bg-white border-gray-200"
                        : "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800">
                          Mandatory
                        </span>
                        {customizationEnabled && (
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                              customizationMandatory
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {customizationMandatory ? "Required" : "Optional"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customizationEnabled
                          ? (customizationMandatory
                              ? "Customer must enter name before adding to cart"
                              : "Optional: customer can choose to leave blank")
                          : "Enable Customization Name first to activate"}
                      </div>
                    </div>
                    <Switch
                      disabled={!customizationEnabled}
                      checked={customizationEnabled && customizationMandatory}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                      onChange={(checked) => {
                        setCustomizationMandatory(checked);
                        form.setFieldsValue({ is_customization_mandatory: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                <span>ℹ️</span>
                <span>
                  <strong>Phone Stand (PS0511)</strong> uses its dedicated live customization & giveaway logic. See Pricing panel for pricing.
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Form.Item
                name="product_codeS_NO"
                label="Product Code(S.No)"
                rules={[formValidation("Enter Product Code(S.No)")]}
              >
                <Input
                  placeholder="Enter Product Code(S.No)"
                  type="text"
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                name="Vendor_Code"
                label="Vendor Code"
                rules={[formValidation("Enter Vendor Code")]}
              >
                <Input
                  placeholder="Enter Vendor Code"
                  type="text"
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                label="Product Type"
                name="type"
                rules={[
                  {
                    required: true,
                    message: "Please select a product type!",
                  },
                ]}
              >
                <Select
                  placeholder="Select type"
                  className="h-12"
                  options={PRODUCT_TYPE}
                />
              </Form.Item>

              <Form.Item
                label="Main Category"
                name="category_details"
                rules={[
                  {
                    required: true,
                    message: "Please select a product category!",
                  },
                ]}
              >
                <Select
                  placeholder="Select Product Category"
                  className="h-12"
                  onChange={(e) => onCategoryChnge(e)}
                >
                  {categoryData.map((item) => (
                    <Select.Option key={item._id} value={item._id}>
                      {item.main_category_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {!_.isEmpty(filter_subcategory_data) ? (
                <Form.Item
                  label="Sub Category"
                  name="sub_category_details"
                  rules={[
                    {
                      required: true,
                      message: "Please select a product category!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Select Product Sub Category"
                    className="h-12"
                  >
                    {filter_subcategory_data.map((item) => (
                      <Select.Option key={item._id} value={item._id}>
                        {item.sub_category_name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item label="Sub Category" name="sub_category_details">
                  <Select
                    placeholder="No subcategories available"
                    className="h-12"
                    disabled
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Product Stocks"
                name="stocks_status"
                rules={[
                  {
                    required: true,
                    message: "Please select a product stock type!",
                  },
                ]}
              >
                <Select
                  placeholder="Select Stocks Type"
                  className="h-12"
                  options={PRODUCT_STOCK_TYPE}
                />
              </Form.Item>

             {productTypeSelectedValue === "Stand Alone Product" && (
              <Form.Item
                label="Product Code"
                name="product_code"
                rules={[
                  { required: true, message: "Product code is required" },
                ]}
                className="mb-0"
              >
                <Input
                  placeholder="Product code will be generated automatically"
                  readOnly={isProductCodeLocked||id}
                  suffix={
                    !isProductCodeLocked ? (
                      <ReloadOutlined
                        onClick={() => {
                          const code = generateProductCode(false);
                          if (code)
                            form.setFieldsValue({ product_code: code });
                        }}
                        className="h-10"
                        style={{ cursor: "pointer" }}
                      />
                    ) : null
                  }
                  addonAfter={
                    <Button
                      type="text"
                      icon={isProductCodeLocked ? <LockOutlined /> : <UnlockOutlined />}
                      onClick={handleLockProductCode}
                      size="small"
                      disabled={isProductCodeLocked && userRole.role !== "super admin"}
                    />
                  }
                />
              </Form.Item>
             )}

              <Form.Item
                name="name"
                label="Product Name"
                rules={[formValidation("Enter Product Name")]}
              >
                <Input
                  placeholder="Enter Product Name"
                  type="text"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                name="vendor_details"
                label="Select Vendor"
                rules={[formValidation("Select Vendor")]}
              >
                <Select
                  placeholder="Select Vendor"
                  mode="multiple"
                  className="h-12"
                >
                  {allVendors.map((item) => (
                    <Select.Option key={item._id} value={item._id}>
                      <div className="flex justify-between items-center">
                        {item.business_name}({item.vendor_name})
                        <Link
                          to={`/vendor_details/${item._id}`}
                          target="_blank"
                        >
                          <span className="text-blue-500">View</span>
                        </Link>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                rules={[formValidation("Enter HSN code")]}
                label="HSN code"
                name="HSNcode_time"
              >
                <Input
                  placeholder="Enter HSN code"
                  type="Text"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                label="Unit"
                name="unit"
                rules={[
                  {
                    required: true,
                    message: "Please select a unit!",
                  },
                ]}
              >
                <Select
                  placeholder="Select Unit Type"
                  className="h-12"
                  options={UNIT_TYPE}
                />
              </Form.Item>

              <Form.Item
                rules={[formValidation("Enter Production Time")]}
                label="Production Time"
                name="Production_time"
              >
                <Input
                  placeholder="Enter Production Time"
                  type="number"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                rules={[formValidation("Enter Stock Arrangement Time")]}
                label="Stock Arrangement Time"
                name="Stock_Arrangement_time"
              >
                <Input
                  placeholder="Enter Stock Arrangement Time"
                  type="number"
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                label="Tax Preference"
                name="Tax_prefernce"
                rules={[
                  {
                    required: true,
                    message: "Please select a Tax preference!",
                  },
                ]}
              >
                <Select
                  placeholder="Select type"
                  className="h-12"
                  options={TAX_PREFERENCE}
                />
              </Form.Item>
              <Form.Item
                label="GST Percentage"
                name="GST"
                rules={[
                  {
                    required: true,
                    message: "Please select a GST percentage!",
                  },
                ]}
              >
                <Select
                  placeholder="Select type"
                  className="h-12"
                  options={GST_PREFERENCE}
                />
              </Form.Item>
            </div>

            <Form.Item
              rules={[formValidation("enter title for description")]}
              label="Product Description Title"
              name="product_description_tittle"
            >
              <Input
                placeholder="Enter description title"
                type="Text"
                className="h-12"
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-2">
              <Form.Item
                rules={[formValidation("enter Point one")]}
                label="Point one"
                name="Point_one"
              >
                <Input
                  placeholder="Enter Point one"
                  type="Text"
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                rules={[formValidation("enter Point two")]}
                label="Point two"
                name="Point_two"
              >
                <Input
                  placeholder="Enter Point two"
                  type="Text"
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                rules={[formValidation("enter Point three")]}
                label="Point three"
                name="Point_three"
              >
                <Input
                  placeholder="Enter Point three"
                  type="Text"
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                rules={[formValidation("enter Point four")]}
                label="Point four"
                name="Point_four"
              >
                <Input
                  placeholder="Enter Point four"
                  type="Text"
                  className="h-12"
                />
              </Form.Item>
            </div>
          </Panel>

          {/* Stock Info Panel */}
          <Panel
            header={
              <div className="flex md:flex-row flex-col justify-between items-center">
                <span className="text-lg font-semibold">
                  Stock Information
                </span>
                <span>Current Stock:{_.get(id, "stock_count", 0)}</span>
              </div>
            }
            key="7"
          >
            <div className="mt-4">
              <h2 className="font-medium mb-3">Stock Info</h2>
              <Form.List name="stock_info">
                {(fields, { add, remove }) => (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <Form.Item className="mb-0">
                        <Button
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                          className="h-10"
                        >
                          Add Stock Info
                        </Button>
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {fields.map(({ key, name, ...restField }) => (
                        <Card size="small" key={key} className="relative">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <Form.Item
                              label="Add Stock"
                              {...restField}
                              name={[name, "add_stock"]}
                              rules={[
                                formValidation("Enter stock quantity"),
                              ]}
                              className="mb-0"
                            >
                              <Input
                                type="number"
                                placeholder="Enter Stock Quantity"
                                className="h-10"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Date & Time"
                              {...restField}
                              name={[name, "date"]}
                              rules={[formValidation("Select a date")]}
                              className="mb-0"
                            >
                              <DatePicker
                                showTime
                                className="h-10 w-full"
                                format="DD/MM/YYYY h:mm A"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Invoice"
                              {...restField}
                              name={[name, "invoice"]}
                              className="mb-0"
                            >
                              <Input
                                placeholder="Enter Invoice"
                                className="h-10"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Note"
                              {...restField}
                              name={[name, "notes"]}
                              className="mb-0"
                            >
                              <Input.TextArea
                                placeholder="Enter Notes"
                                className="h-10"
                              />
                            </Form.Item>

                            <Button
                              type="text"
                              danger
                              icon={<DeleteFilled />}
                              onClick={() => remove(name)}
                              className="absolute top-2 right-2"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {combinedStockInfoData.length > 1 && (
                      <div className="mt-6">
                        <Table
                          bordered
                          dataSource={combinedStockInfoData}
                          columns={stockInfoColumns}
                          pagination={false}
                          scroll={{ x: true }}
                          className="custom-table"
                        />
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </div>
          </Panel>

          {/* Product Images Panel - Conditionally hide when there are image variants */}
          {!hasImageVariant && (
            <Panel
              header={
                <span className="text-lg font-semibold">Product Images</span>
              }
              key="2"
            >
              <Form.Item className="py-4" label="Product Image" name="images">
                <EnhancedUploadHelper
                  multiple={true}
                  max={10}
                  setImagePath={setImagePath}
                  image_path={image_path}
                  label="Upload Product Images "
                />
              </Form.Item>
            </Panel>
          )}

          {/* Pricing Information Panel */}
          <Panel
            header={
              <span className="text-lg font-semibold">
                Pricing Information
              </span>
            }
            key="3"
          >
            {productTypeSelectedValue === "Stand Alone Product" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Form.Item
                  rules={[formValidation("Enter Cost")]}
                  label="Cost"
                  name="MRP_price"
                >
                  <Input
                    placeholder="Enter Cost"
                    type="Number"
                    className="h-12"
                    onChange={(e) => handleMRPChange(e.target.value)}
                  />
                </Form.Item>
                
                <Form.Item
                  rules={[formValidation("Enter Customer Price")]}
                  label={
                    <div className="flex items-center gap-2">
                      <span>Customer Price</span>
                      {percentageDifferences.customer !== 0 && (
                        <Tag 
                          color={percentageDifferences.customer > 0 ? "green" : "red"}
                          icon={percentageDifferences.customer > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          className="text-xs"
                        >
                          {percentageDifferences.customer > 0 ? '+' : ''}
                          {percentageDifferences.customer.toFixed(2)}%
                        </Tag>
                      )}
                    </div>
                  }
                  name="customer_product_price"
                >
                  <Input
                    placeholder="Enter Customer Price"
                    type="Number"
                    className="h-12"
                    onChange={(e) => handleCustomerPriceChange(e.target.value)}
                  />
                </Form.Item>
                
                <Form.Item
                  rules={[formValidation("Enter Dealer Price")]}
                  label={
                    <div className="flex items-center gap-2">
                      <span>Dealer Price</span>
                      {percentageDifferences.dealer !== 0 && (
                        <Tag 
                          color={percentageDifferences.dealer > 0 ? "green" : "red"}
                          icon={percentageDifferences.dealer > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          className="text-xs"
                        >
                          {percentageDifferences.dealer > 0 ? '+' : ''}
                          {percentageDifferences.dealer.toFixed(2)}%
                        </Tag>
                      )}
                    </div>
                  }
                  name="Deler_product_price"
                >
                  <Input
                    placeholder="Enter Dealer Price"
                    type="Number"
                    className="h-12"
                    onChange={(e) => handleDealerPriceChange(e.target.value)}
                  />
                </Form.Item>
                
                <Form.Item
                  rules={[formValidation("Enter Corporate Price")]}
                  label={
                    <div className="flex items-center gap-2">
                      <span>Corporate Price</span>
                      {percentageDifferences.corporate !== 0 && (
                        <Tag 
                          color={percentageDifferences.corporate > 0 ? "green" : "red"}
                          icon={percentageDifferences.corporate > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          className="text-xs"
                        >
                          {percentageDifferences.corporate > 0 ? '+' : ''}
                          {percentageDifferences.corporate.toFixed(2)}%
                        </Tag>
                      )}
                    </div>
                  }
                  name="corporate_product_price"
                >
                  <Input
                    placeholder="Enter Corporate Price"
                    type="Number"
                    className="h-12"
                    onChange={(e) => handleCorporatePriceChange(e.target.value)}
                  />
                </Form.Item>
              </div>
            ) : (
              <>
                <div className="flex gap-3 items-center mb-4">
                  <label className="text-gray-700 font-medium">
                    Variants
                  </label>
                  <Button
                    type="primary"
                    onClick={handleAddVariant}
                    icon={<PlusOutlined />}
                    size="small"
                  >
                    Add Variant
                  </Button>
                </div>

                {!_.isEmpty(variants) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {variants.map((data) => (
                        <Card
                          key={data._id}
                          size="small"
                          className="relative"
                          title={
                            <div className="flex items-center">
                              <span>Variant Options</span>
                            </div>
                          }
                          extra={
                            <Button
                              type="text"
                              danger
                              icon={<DeleteFilled />}
                              onClick={() =>
                                handleOnDeleteVariantName(data)
                              }
                              size="small"
                            />
                          }
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-gray-600">
                                Variant Name
                              </label>
                              <Input
                                size="middle"
                                placeholder="eg. Color"
                                value={data.variant_name}
                                onChange={(e) =>
                                  handleOnChangeVariantName(e, data._id)
                                }
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-gray-600">
                                Variant Type
                              </label>
                              <Select
                                value={data.variant_type}
                                placeholder="Select Variant type"
                                onChange={(e) =>
                                  handleOnChangeVariantType(e, data._id)
                                }
                              >
                                {VARIANT_TYPES.map(type => (
                                  <Select.Option key={type.value} value={type.value}>
                                    {type.label}
                                  </Select.Option>
                                ))}
                              </Select>
                            </div>

                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <label className="text-gray-600">
                                  Variant Options
                                </label>
                                <Button
                                  type="dashed"
                                  onClick={() =>
                                    handleAddVariantOption(data._id)
                                  }
                                  icon={<PlusOutlined />}
                                  size="small"
                                >
                                  Add Option
                                </Button>
                              </div>

                              {data.options.map((option) => (
                                <VariantOption
                                  key={option._id}
                                  variant={data}
                                  option={option}
                                  onOptionChange={handleOnChangeVariantOptionName}
                                  onOptionDelete={handleOnDeleteVariantOptionName}
                                  onColorChange={handleColorChange}
                                  onImageUpload={handleVariantOptionImageUpload}
                                />
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Table
                        bordered
                        dataSource={!_.isEmpty(variants) ? tableData : []}
                        columns={columns}
                        pagination={false}
                        scroll={{ x: true }}
                        className="custom-table"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {isPS0511Product && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎁</span>
                  <div>
                    <h4 className="font-semibold text-amber-900 text-sm m-0">Phone Stand (PS0511) Customization Pricing</h4>
                    <p className="text-xs text-amber-700 m-0">
                      Set the price charged for each customized name per unit when no giveaway coupon is applied.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Form.Item
                    name="customization_name_price"
                    label="Customization name price (₹ per unit)"
                    tooltip="For each customized name, the price charged per quantity (default: ₹10). For example, if 50 quantity then 500 will be customization charge."
                    rules={[{ required: true, message: "Enter Customization name price" }]}
                  >
                    <Input
                      placeholder="Enter Customization name price (e.g. 10)"
                      type="number"
                      min={0}
                      className="h-12"
                    />
                  </Form.Item>
                </div>
              </div>
            )}
          </Panel>

          {/* Quantity Information Panel */}
          <Panel
            header={
              <span className="text-lg font-semibold">
                Quantity Information
              </span>
            }
            key="4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="quantity_type"
                rules={[formValidation("Select Quantity Type")]}
                label="Quantity Type"
              >
                <Select
                  className="h-12"
                  onChange={(e) => {
                    setQuantityType(e);
                  }}
                >
                  <Select.Option key="Variable" value="dropdown">
                    Dropdown
                  </Select.Option>
                </Select>
              </Form.Item>

              {quantityType === "textbox" && (
                <>
                  <Form.Item
                    name="max_quantity"
                    rules={[formValidation("Enter Maximum Quantity")]}
                    label="Maximum Quantity"
                  >
                    <Input type="number" className="h-12 w-full" />
                  </Form.Item>
                </>
              )}
            </div>

            <div className="mt-4">
              <h2 className="font-medium mb-3">Quantity + Discount % + Delivery + Recommended Status</h2>
              <Form.List name="quantity_discount_splitup">
                {(fields, { add, remove }) => (
                  <>
                    <Form.Item>
                      <Button
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        className="h-10"
                      >
                        Add Quantity and Discount
                      </Button>
                    </Form.Item>

                    <div className="grid grid-cols-1 gap-3">
                      {fields.map(({ key, name, ...restField }) => (
                        <DiscountRow
                          key={key}
                          name={name}
                          restField={restField}
                          remove={remove}
                          form={form}
                          customerPrice={customerPrice}
                          dealerPrice={dealerPrice}
                          corporatePrice={corporatePrice}
                          productType={productTypeSelectedValue}
                          variantPrices={tableValue.reduce((acc, variant) => {
                            acc[variant.key] = {
                              customer_product_price: variant.customer_product_price || 0,
                              Deler_product_price: variant.Deler_product_price || 0,
                              corporate_product_price: variant.corporate_product_price || 0
                            };
                            return acc;
                          }, {})}
                        />
                      ))}
                    </div>
                  </>
                )}
              </Form.List>
            </div>
          </Panel>

          {/* Product Tab Description Info Panel */}
          <Panel
            header={
              <span className="text-lg font-semibold">
                Product Tab Description Info
              </span>
            }
            key="5"
          >
            <Form.List name="description_tabs">
              {(fields, { add, remove }) => (
                <>
                  <Tag
                    type="dashed"
                    onClick={() => add()}
                    block
                    className="cursor-pointer !bg-green-500 hover:!bg-orange-500 !mb-5 !text-white"
                  >
                    + Add New Tab
                  </Tag>
                  <div className="grid grid-cols-1 gap-x-2 gap-y-3">
                    {fields.map((field) => (
                      <Card
                        size="small"
                        title={`Tab ${field.name + 1}`}
                        key={field.key}
                        extra={
                          <DeleteFilled
                            onClick={() => {
                              remove(field.name);
                            }}
                            className="!text-red-500"
                          />
                        }
                      >
                        <div className="center_div justify-start gap-x-2">
                          <Form.Item
                            label="Tab Name"
                            name={[field.name, "name"]}
                            rules={[formValidation("Enter tab name")]}
                          >
                            <Input className="!h-[50px] !w-[300px]" />
                          </Form.Item>
                          <Form.Item
                            label="Tab Name"
                            hidden
                            name={[field.name, "key"]}
                            initialValue={field.key}
                            rules={[formValidation("Enter tab name")]}
                          >
                            <Input className="!h-[50px] !w-[300px]" />
                          </Form.Item>
                          <Form.Item
                            label="Tab Type"
                            name={[field.name, "tab_type"]}
                            rules={[formValidation("Select tab Type")]}
                          >
                            <Select
                              className="!h-[50px] !w-[300px]"
                              onChange={() => {
                                setDummy(!dummy);
                              }}
                            >
                              <Select.Option value={"Editor"}>
                                Editor
                              </Select.Option>
                              <Select.Option value={"Table"}>
                                Table View
                              </Select.Option>
                              <Select.Option value={"Content-With-Image"}>
                                Content With Image
                              </Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                        {GET_TABLE_TYPE(field.key) === "Editor" && (
                          <>
                            <Form.Item
                              label="Description"
                              name={[field.name, "description"]}
                              rules={[formValidation("Enter Description")]}
                            >
                              <JoditEditor />
                            </Form.Item>
                          </>
                        )}
                        {GET_TABLE_TYPE(field.key) === "Table" && (
                          <>
                            <Form.Item label="Table View">
                              <Form.List name={[field.name, "table_view"]}>
                                {(subFields, subOpt) => (
                                  <>
                                    <div className="w-full center_div justify-end px-10">
                                      <Tag
                                        type="dashed"
                                        onClick={() => subOpt.add()}
                                        className="!cursor-pointer hover:!bg-orange-500 !bg-green-500 !mb-4 !text-white"
                                      >
                                        + Add Table Item
                                      </Tag>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      {subFields.map((subField) => (
                                        <Space key={subField.key}>
                                          <Form.Item
                                            label="Left"
                                            name={[subField.name, "left"]}
                                            rules={[
                                              formValidation(
                                                "Enter left value"
                                              ),
                                            ]}
                                          >
                                            <Input
                                              placeholder="Left"
                                              className="!h-[50px]"
                                            />
                                          </Form.Item>
                                          <Form.Item
                                            label="Right"
                                            name={[subField.name, "right"]}
                                            rules={[
                                              formValidation(
                                                "Enter right value"
                                              ),
                                            ]}
                                          >
                                            <Input
                                              placeholder="right"
                                              className="!h-[50px]"
                                            />
                                          </Form.Item>
                                          <DeleteFilled
                                            onClick={() => {
                                              subOpt.remove(subField.name);
                                            }}
                                            className="!text-red-500"
                                          />
                                        </Space>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </Form.List>
                            </Form.Item>
                          </>
                        )}
                        {GET_TABLE_TYPE(field.key) ===
                          "Content-With-Image" && (
                          <>
                            <Form.Item label="Content With Image">
                              <Form.List
                                name={[field.name, "content_image_view"]}
                              >
                                {(subFields, subOpt) => (
                                  <>
                                    <div className="w-full center_div justify-end px-10">
                                      <Tag
                                        type="dashed"
                                        onClick={() =>
                                          subOpt.add({ images: [] })
                                        }
                                        className="!cursor-pointer hover:!bg-orange-500 !bg-green-500 !mb-4 !text-white"
                                      >
                                        + Add new image with content
                                      </Tag>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                      {subFields.map((subField) => (
                                        <div
                                          key={subField.key}
                                          className="flex flex-col"
                                        >
                                          <Form.Item
                                            label="Content"
                                            name={[
                                              subField.name,
                                              "content",
                                            ]}
                                            rules={[
                                              formValidation(
                                                "Enter content"
                                              ),
                                            ]}
                                          >
                                            <Input.TextArea
                                              placeholder="Content"
                                              className=" !w-full"
                                            />
                                          </Form.Item>
                                          <Form.Item
                                            label="Content"
                                            hidden
                                            name={[
                                              subField.name,
                                              "image_id",
                                            ]}
                                            initialValue={subField.key}
                                            rules={[
                                              formValidation(
                                                "Enter content"
                                              ),
                                            ]}
                                          >
                                            <Input.TextArea
                                              placeholder="Content"
                                              className=" !w-full"
                                            />
                                          </Form.Item>
                                          <Form.Item
                                            hidden
                                            rules={[
                                              {
                                                required: true,
                                                message: `Please upload images`,
                                              },
                                            ]}
                                            name={[subField.name, "images"]}
                                            initialValue={[]}
                                            label="images"
                                          >
                                            <Input.TextArea
                                              disabled
                                              rows={5}
                                              placeholder="Images"
                                              className="!w-[90%] !h-[50px]"
                                            />
                                          </Form.Item>
                                          <div className="flex items-center gap-x-2">
                                            <Form.Item
                                              label="Image"
                                              name={[
                                                subField.name,
                                                "image",
                                              ]}
                                            >
                                              <EnhancedUploadHelper
                                                blog={true}
                                                current_key={`${subField.key}-${field.key}`}
                                                handleChange={handleChange}
                                              />
                                            </Form.Item>
                                            <div className="flex gap-x-2 flex-wrap">
                                              {GETCURRENT_SETOF_IMAGES(
                                                `${subField.key}-${field.key}`
                                              )?.map((res, index) => {
                                                return (
                                                  <div
                                                    key={index}
                                                    className="relative"
                                                  >
                                                    <Image
                                                      height={50}
                                                      key={index}
                                                      className="!h-[50px] !w-[50px] !rounded-lg !border cursor-pointer"
                                                      src={res}
                                                      preview={{
                                                        mask: (
                                                          <div className="flex items-center justify-center gap-1">
                                                            <EyeOutlined className="text-white" />
                                                            <span className="text-white text-xs">Preview</span>
                                                          </div>
                                                        ),
                                                      }}
                                                    />
                                                    <div
                                                      onClick={() => {
                                                        REMOVE_IMAGES(
                                                          `${subField.key}-${field.key}`,
                                                          res
                                                        );
                                                      }}
                                                      className="cursor-pointer text-center text-red-500 gap-x-2 center_div"
                                                    >
                                                      {
                                                        <ICON_HELPER.DELETE_ICON2 />
                                                      }
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                          <DeleteFilled
                                            onClick={() => {
                                              subOpt.remove(subField.name);
                                            }}
                                            className="!text-red-500"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </Form.List>
                            </Form.Item>
                          </>
                        )}
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </Form.List>
          </Panel>

          {/* SEO Information Panel */}
          <Panel
            header={
              <span className="text-lg font-semibold">SEO Information</span>
            }
            key="6"
          >
            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                name="seo_title"
                rules={[formValidation("Enter SEO Title")]}
                label="SEO Title"
              >
                <Input
                  onChange={(e) => {
                    handleChnge(e, "title");
                  }}
                  className="h-12"
                />
              </Form.Item>
              <Form.Item
                name="seo_keywords"
                rules={[formValidation("Enter SEO keywords")]}
                label="SEO keywords"
              >
                <Input
                  onChange={(e) => {
                    handleChnge(e, "keywords");
                  }}
                  className="h-12"
                />
              </Form.Item>

              <Form.Item
                name="seo_description"
                rules={[formValidation("Enter SEO Description")]}
                label="SEO description"
              >
                <Input.TextArea
                  onChange={(e) => {
                    handleChnge(e, "description");
                  }}
                  rows={3}
                />
              </Form.Item>
              <Form.Item
                name="seo_img"
                label="SEO img"
                className="hidden"
              >
                <Input.TextArea
                  onChange={(e) => {
                    handleChnge(e, "img");
                  }}
                />
              </Form.Item>

              <Form.Item
                label="URL"
                name="seo_url"
                rules={[formValidation("Enter SEO URL")]}
              >
                <Input
                  onChange={(e) => {
                    handleChnge(e, "url");
                  }}
                  className="h-12"
                  addonBefore={"https://printe.in/products/"}
                />
              </Form.Item>

              <Card size="small" title="SEO Preview">
                <h3 className="text-blue-600 text-lg mb-1">
                  {_.get(seo_datas, "title", ``) ||
                    `WWE Raw Results, News, Video & Photos`}
                </h3>
                <p className="text-green-600 text-sm mb-2">
                  {`https://www.printe.in/` + _.get(seo_datas, "url", ``) ||
                    `https://www.printe.in/product/Signages/Standees/Premium`}
                </p>
                <p className="text-gray-600 text-sm">
                  {_.get(seo_datas, "description", ``) ||
                    `Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Accusamus voluptatum consequuntur, quaerat perspiciatis architecto
                    neque, porro blanditiis fugit nulla, nobis error quisquam
                    consequatur ad corporis modi hic autem numquam et.`}
                </p>
              </Card>
            </div>
          </Panel>
        </Collapse>

        <Divider />

        <Form.Item className="my-6">
          <Button
            block
            htmlType="submit"
            type="primary"
            size="large"
            loading={loading}
            className="h-12 text-lg"
          >
            {id ? "Update Product" : "Add Product"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>

  <Modal
    title="Unit Configuration"
    visible={modalUnitVisible}
    onOk={handleUnitOk}
    onCancel={handleUnitCancel}
    width={800}
    footer={[
      <Button key="cancel" onClick={handleUnitCancel}>
        Cancel
      </Button>,
      <Button key="submit" type="primary" onClick={handleUnitOk}>
        Save Configuration
      </Button>,
    ]}
  >
    <Form form={form} layout="vertical">
      <Form.List name="unit_splitup">
        {(fields, { add, remove }) => (
          <>
            <Form.Item>
              <Button
                onClick={() => add()}
                icon={<PlusOutlined />}
                className="h-10 mb-4"
              >
                Add Unit
              </Button>
            </Form.Item>

            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
              {fields.map(({ key, name, ...restField }) => (
                <Card size="small" key={key} className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <Form.Item
                      label="Unit"
                      {...restField}
                      name={[name, "Unit"]}
                      rules={[formValidation("Enter a Unit")]}
                      className="mb-0"
                    >
                      <Input
                        type="Text"
                        placeholder="Enter Unit"
                        className="h-10"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Measurement"
                      {...restField}
                      name={[name, "Measurement"]}
                      rules={[formValidation("Enter a Measurement")]}
                      className="mb-0"
                    >
                      <Input
                        type="Text"
                        placeholder="Enter Measurement"
                        className="h-10"
                      />
                    </Form.Item>

                    <Button
                      type="text"
                      danger
                      icon={<DeleteFilled />}
                      onClick={() => remove(name)}
                      className="absolute top-2 right-2"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Form.List>
    </Form>
  </Modal>

  <style jsx>{`
    :global(.custom-collapse .ant-collapse-header) {
      align-items: center !important;
      font-weight: 600;
    }

    :global(.custom-table .ant-table-thead > tr > th) {
      background-color: #fafafa;
      font-weight: 600;
    }

    :global(.image-preview-modal .ant-modal-body) {
      padding: 0;
    }

    :global(.image-preview-modal .ant-modal-close) {
      top: 10px;
      right: 10px;
    }
  `}</style>
</Spin>
  );
};

export default AddForms;