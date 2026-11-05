import React, { useState, useEffect } from "react";
import {
  Input, 
  Button, 
  DatePicker, 
  Select, 
  Tag, 
  Tooltip, 
  message, 
  Card, 
  Table, 
  Upload,
  Space,
  Modal
} from "antd";
import { 
  SearchOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  UploadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  collectallorders,
  assignOrder,
  GetTeam,
  getOrderAssignments,
} from "../../api";
import _ from "lodash";
import moment from "moment";
import xlsx from "json-as-xlsx";

const { RangePicker } = DatePicker;

const TEAM_OPTIONS = [
  { id: "accounting team", name: "Accounting Team" },
  { id: "designing team", name: "Designing Team" },
  { id: "quality check", name: "Quality Check" },
  { id: "production team", name: "Production team" },
  { id: "delivery team", name: "Delivery Team" },
];

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved", color: "green", icon: <CheckCircleOutlined /> },
  { value: "hold", label: "Hold", color: "orange", icon: <PauseCircleOutlined /> },
  { value: "not_approved", label: "Not Approved", color: "red", icon: <CloseCircleOutlined /> },
  { value: "pending", label: "Pending", color: "blue", icon: <ClockCircleOutlined /> },
];

const AssignedOrder = () => {
  const { user } = useSelector((state) => state.authSlice);
  const [orderData, setOrderData] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentTeamRole, setCurrentTeamRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeTimers, setActiveTimers] = useState({});
  const navigate = useNavigate();

  const userRole = JSON.parse(localStorage.getItem("userprofile"));

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, dateFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const searchParams = {
        search: searchTerm,
        date_filter: dateFilter,
      };

      let result;
      let data;

      if (userRole.role === "super admin") {
        result = await collectallorders(JSON.stringify(searchParams));
        data = _.get(result, "data.data", []);
      } else {
        result = await getOrderAssignments(userRole._id);
        data = _.get(result, "data.data.assigned_orders", []) || [];
      }

      setOrderData(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = async (teamId, orderId) => {
    setCurrentOrderId(orderId);
    setCurrentTeamRole(teamId);
    
    try {
      const result = await GetTeam(teamId);
      const members = _.get(result, "data.data", []);
      setTeamMembers(members);
      
      if (members.length > 0) {
        setIsModalVisible(true);
      } else {
        message.warning("No members available in this team");
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      message.error("Failed to load team members");
    }
  };

  const handleMemberAssign = async (memberId) => {
    if (!currentOrderId || !memberId) return;

    setLoading(true);
    try {
      const member = teamMembers.find(m => m._id === memberId);
      const result = await assignOrder({
        order_id: currentOrderId,
        user_id: memberId,
        team_status: currentTeamRole,
        GetAssigner: userRole.name
      });

      if (result.status === 200) {
        message.success(`Order assigned to ${member.name}`);
        setIsModalVisible(false);
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to assign order:", error);
      message.error("Failed to assign order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const response = await updateOrderStatus(orderId, { status });
      if (response.status === 200) {
        message.success("Status updated successfully");
        fetchOrders();
      }
    } catch (error) {
      message.error("Failed to update status");
      console.error(error);
    }
  };

  const handleUpload = async (orderId) => {
    if (!fileList.length) return;

    setUploading(true);
    const formData = new FormData();
    fileList.forEach(file => {
      formData.append('design_files', file);
    });
    formData.append('order_id', orderId);

    try {
      const response = await uploadDesignFiles(formData);
      if (response.status === 200) {
        message.success('Files uploaded successfully');
        setFileList([]);
        fetchOrders();
      }
    } catch (error) {
      message.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDesignTimeAction = async (orderId, action) => {
    try {
      let response;
      if (action === 'start') {
        response = await startDesignTimer(orderId);
        message.success('Design timer started');
        // Start local timer
        setActiveTimers(prev => ({
          ...prev,
          [orderId]: {
            startTime: new Date(),
            interval: setInterval(() => {
              setActiveTimers(prev => ({
                ...prev,
                [orderId]: {
                  ...prev[orderId],
                  elapsed: ((new Date() - prev[orderId].startTime) / 1000).toFixed(0)
                }
              }));
            }, 1000)
          }
        }));
      } else {
        response = await endDesignTimer(orderId);
        message.success('Design timer stopped');
        // Clear local timer
        if (activeTimers[orderId]?.interval) {
          clearInterval(activeTimers[orderId].interval);
          setActiveTimers(prev => {
            const newTimers = {...prev};
            delete newTimers[orderId];
            return newTimers;
          });
        }
      }
      
      if (response.status === 200) {
        fetchOrders();
      }
    } catch (error) {
      message.error(`Failed to ${action} design timer`);
      console.error(error);
    }
  };

  const calculateDesignTime = (order) => {
    if (activeTimers[order._id]) {
      return {
        seconds: parseInt(activeTimers[order._id].elapsed || 0),
        totalSeconds: parseInt(activeTimers[order._id].elapsed || 0)
      };
    }

    if (!order.design_start_time) return null;
    
    const start = moment(order.design_start_time);
    const end = order.design_end_time ? moment(order.design_end_time) : moment();
    
    const duration = moment.duration(end.diff(start));
    return {
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      totalSeconds: duration.asSeconds()
    };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 || hrs > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  const handleViewDesignFiles = (record) => {
    Modal.info({
      title: 'Design Files',
      content: (
        <div className="space-y-2">
          {record.design_files?.map((file, index) => (
            <div key={index}>
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {file.name || `Design File ${index + 1}`}
              </a>
              <span className="text-gray-500 text-xs ml-2">
                ({Math.round(file.size / 1024)} KB)
              </span>
            </div>
          ))}
        </div>
      ),
      width: 600,
    });
  };

  const handleDownloadExcel = () => {
    const columns = [
      { label: "Order ID", value: "_id" },
      { label: "Invoice Number", value: "invoice_no" },
      { label: "Order Date", value: (order) => moment(order.createdAt).format("YYYY-MM-DD") },
      { label: "Team Status", value: "team_status" },
      { label: "Status", value: "status" },
      { label: "Design Time", value: (order) => {
        const time = calculateDesignTime(order);
        return time ? formatDuration(time.totalSeconds) : "N/A";
      }},
      { label: "Payment Method", value: "payment_type" },
      { label: "Customer Name", value: (order) => _.get(order, "user_details[0].name", "N/A") },
      { label: "Customer Email", value: (order) => _.get(order, "user_details[0].email", "N/A") },
      { label: "Customer Phone", value: (order) => _.get(order, "delivery_address.mobile_number", "") },
      { label: "GSTIN", value: (order) => _.get(order, "delivery_address.gst_no", "") },
      { label: "Customer Address", value: (order) => [
          _.get(order, "delivery_address.addressType", ""),
          _.get(order, "delivery_address.street_address", ""),
          _.get(order, "delivery_address.pincode", "")
        ].filter(Boolean).join(", ") },
      { label: "Product Name", value: (order) => _.get(order, "cart_items.product_name", "") },
      { label: "Quantity", value: (order) => _.get(order, "cart_items.product_quantity", "") },
      { label: "Unit Price", value: (order) => _.get(order, "cart_items.product_price", 0) },
      { label: "CGST (%)", value: (order) => _.get(order, "cart_items.cgst", 0) },
      { label: "SGST (%)", value: (order) => _.get(order, "cart_items.sgst", 0) },
      { label: "Total Price (₹)", value: "total_price" },
    ];

    const data = [
      {
        sheet: "All Orders",
        columns,
        content: filteredOrders,
      },
      ...TEAM_OPTIONS.map((team) => ({
        sheet: team.name,
        columns,
        content: filteredOrders.filter((order) => order.team_status === team.id),
      })),
    ];

    const settings = {
      fileName: `Orders_Report_${moment().format("YYYY-MM-DD")}`,
      extraLength: 3,
      writeMode: "writeFile",
      columnStyles: {
        _id: { font: { sz: 10 } },
        total_price: { numFmt: '"₹"#,##0.00' },
      },
    };

    try {
      xlsx(data, settings);
      message.success("Excel report downloaded successfully");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export order data");
    }
  };

  const handleTeamMemberAssign = (order) => {
    const teams = [
      "accounting team",
      "designing team",
      "quality check",
      "packing team",
      "delivery"
    ];

    const teamEntry = order.order_delivery_timeline?.find(entry => 
      teams.includes(entry.team_status)
    );
    return (
      <span>
        <UserOutlined className="mr-1" />
        {teamEntry?.changed_by_name || "Unassigned"}
        {/* {teamEntry?.changed_by_role && ` (${teamEntry.changed_by_role})`} */}
      </span>
    );
  };

  const renderDesignTime = (record) => {
    if (record.team_status !== "designing team") return "-";
    
    const time = calculateDesignTime(record);
    const isActive = !!activeTimers[record._id] || 
                     (record.design_start_time && !record.design_end_time);
    
    if (!time) {
      return (
        <Button 
          type="link" 
          size="small"
          onClick={() => handleDesignTimeAction(record._id, 'start')}
          disabled={userRole.role !== "designing team"}
        >
          Start Timer
        </Button>
      );
    }
    
    if (isActive) {
      return (
        <Space>
          <span className="text-orange-500">
            {formatDuration(time.totalSeconds)} (ongoing)
          </span>
          {userRole.role === "designing team" && (
            <Button 
              type="link" 
              size="small"
              danger
              onClick={() => handleDesignTimeAction(record._id, 'end')}
            >
              Stop
            </Button>
          )}
        </Space>
      );
    }
    
    return formatDuration(time.totalSeconds);
  };

  const renderStatus = (record) => {
    const status = record.status || "pending";
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[3];
    
    if (userRole.role === "super admin") {
      return (
        <Tag color={statusOption.color} icon={statusOption.icon}>
          {statusOption.label}
        </Tag>
      );
    }
    
    return (
      <Select
        value={status}
        style={{ width: 120 }}
        onChange={(value) => handleStatusChange(record._id, value)}
      >
        {STATUS_OPTIONS.map(option => (
          <Select.Option key={option.value} value={option.value}>
            <Tag color={option.color} icon={option.icon}>
              {option.label}
            </Tag>
          </Select.Option>
        ))}
      </Select>
    );
  };

    const items = [
    { key: "1", label: "placed" },
    { key: "2", label: "accounting team" },
    { key: "3", label: "designing team" },
    { key: "4", label: "production team" },
    { key: "5", label: "delivery team" },
    { key: "6", label: "out For Delivery" },
    { key: "7", label: "completed" },
  ];

  const findIndex = (status) => items.findIndex((data) => data.label === status) + 1;


  const columns = [
    {
      title: "S.No",
      dataIndex: "_id",
      key: "sno",
      render: (text, record, index) => index + 1,
      width: 80,
    },
    {
      title: "Invoice No",
      dataIndex: "invoice_no",
      key: "invoice",
      render: (text, record) => {
        const customName =
          record.customized_name ||
          record.phone_stand_details?.customized_name ||
          record.cart_items?.[0]?.customized_name;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{text}</span>
            {customName && (
              <span className="text-xs text-blue-600 font-semibold">
                Name: {customName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Amount",
      key: "amount",
      render: (record) => (
        <span className="font-medium text-blue-600">
          ₹{record.total_price.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Team Status",
      key: "team_status",
      render: (record) => (
        record.team_status ? (
          <Tag color="blue">{record.team_status}</Tag>
        ) : (
          <Tag color="red">Unassigned</Tag>
        )
      ),
    },
    {
      title: "Assigned To",
      key: "assigned_member",
      render: (record) => handleTeamMemberAssign(record)
    },
    {
      title: "Design Time",
      key: "design_time",
      render: renderDesignTime,
    },
    {
      title: "Design Files",
      key: "design_files",
      render: (record) => (
        record.design_files?.length > 0 ? (
          <Tooltip title="View design files">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDesignFiles(record)}
            />
          </Tooltip>
        ) : (
          userRole.role === "designing team" && record.team_status === "designing team" ? (
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([...fileList, file]);
                return false;
              }}
              onRemove={(file) => {
                setFileList(fileList.filter(f => f.uid !== file.uid));
              }}
              multiple
            >
              <Button 
                type="link" 
                icon={<UploadOutlined />}
                size="small"
              >
                Upload
              </Button>
            </Upload>
          ) : "-"
        )
      ),
    },
    
    {
      title: "Payment",
      key: "payment",
      render: (record) => (
        <Tag color={record.payment_type === "online" ? "green" : "orange"}>
          <CreditCardOutlined className="mr-1" />
          {record.payment_type === "online" ? "ONLINE" : "COD"}
        </Tag>
      ),
    },
     ...(user.role !== "super admin"
          ? [
              {
                title: "Edit Status",
                align: "left",
                render: (_, record) => {
                  const currentStatusIndex = findIndex(record.order_status);
                  const nextStatus = items[currentStatusIndex]?.label;
    
                  const Authorized = (user.role === "accounting team" && record.order_status === "accounting team") || (user.role === "designing team" && record.order_status === "designing team") || (user.role === "production team" && record.order_status === "production team") || (user.role === "delivery team" && record.order_status === "delivery team") || (user.role === "out for delivery" && record.order_status === "out for delivery");
    
                  if (!nextStatus) {
                    return (
                      <Tag color="green" className="flex items-center gap-2">
                        Completed <MdDone />
                      </Tag>
                    );
                  }
    
                  return Authorized ? (
                    <Popconfirm title="Forwarding task" description={`Are you sure to forward this task to '${nextStatus}'?`} onConfirm={() => handleView(record._id, record.order_status)} okText="Yes" cancelText="No">
                      <Tag className="cursor-pointer bg-green-700 text-white flex items-center gap-2 hover:bg-green-200 hover:border-green-500 hover:text-green-700">
                        Forward to {nextStatus} <IoIosArrowRoundForward />
                      </Tag>
                    </Popconfirm>
                  ) : (
                    <Tooltip title={`Pending to ${record.order_status}`}>
                      <div className="bg-red-300 !line-clamp-1 !w-[150px] text-sm px-2">Pending to {record.order_status}</div>
                    </Tooltip>
                  );
                },
              },
            ]
          : []),
    ...(userRole.role === "super admin"
      ? [
          {
            title: "Assign Team",
            key: "assign_team",
            render: (record) => (
              <Select
                placeholder="Select team"
                onChange={(value) => handleTeamSelect(value, record._id)}
                style={{ width: 150 }}
                value={record.team_status}
              >
                {TEAM_OPTIONS.map((team) => (
                  <Select.Option key={team.id} value={team.id}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ),
          },
        ]
      : []),
    {
      title: "Date",
      key: "date",
      render: (record) => (
        <span>
          <CalendarOutlined className="mr-1" />
          {moment(record.createdAt).format("DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate("/order_explore", { state: record._id })}
          >
            View
          </Button>
          {userRole.role === "designing team" && 
           record.team_status === "designing team" && 
           fileList.length > 0 && (
            <Button
              type="link"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={() => handleUpload(record._id)}
            >
              Submit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(activeTimers).forEach(timer => {
        if (timer.interval) clearInterval(timer.interval);
      });
    };
  }, [activeTimers]);

  return (
    <div className="p-6">
      <Card title="Order Management" className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>
          <RangePicker
            className="w-full md:w-auto"
            onChange={(dates) => setDateFilter(dates)}
            format="DD-MM-YYYY"
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700"
          >
            Export
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="_id"
          loading={loading}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Assign Team Member"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div 
              key={member._id}
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
              <Button
                type="primary"
                onClick={() => handleMemberAssign(member._id)}
                loading={loading}
              >
                Assign
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AssignedOrder;