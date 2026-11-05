import React, { useEffect, useState } from "react";
import { Table, Button, Card, Divider, Timeline, Avatar, Collapse, Spin, Tooltip, Tag, QRCode } from "antd";
import { collectallorders } from "../../api";
import _ from "lodash";
import { Link, useLocation } from "react-router-dom";
import moment from "moment";
import { BiArrowBack } from "react-icons/bi";
import DefaultTile from "../../components/DefaultTile";
import Breadcrumbs from "../../components/Breadcrumbs";
import { ICON_HELPER } from "../../helper/iconhelper";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { IMAGE_HELPER } from "../../helper/imagehelper";

const OrderExplore = () => {
  const [orderData, setOrderData] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const order_id = location.state;

  const [search] = useState();

  const fetchData = async () => {
    try {
      setLoading(true);
      let searchData = {
        id: _.get(location, "state", ""),
      };

      const result = await collectallorders(JSON.stringify(searchData));
      const data = _.get(result, "data.data", []);
      setOrderData(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching order data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [_.get(location, "state", search)]);


  useEffect(() => {
    const filterOrderData = orderData.find((order) => order._id === order_id);
    if (filterOrderData && filterOrderData.products) {
      setSubtotal(filterOrderData.products.product_price / filterOrderData.products.product_quantity);
    } else {
      setSubtotal(0);
    }
  }, [orderData, order_id]);

  const filterOrderData = orderData.find((order) => order._id === order_id);

  const items = [
    { key: "1", label: "placed" },
    { key: "2", label: "accounting team" },
    { key: "3", label: "designing team" },
    { key: "4", label: "production team" },
    { key: "5", label: "delivery team" },
    { key: "6", label: "out For Delivery" },
    { key: "7", label: "completed" },
  ];
  const ORDER_TIME_LINE = (status) => {
    const orderTimeline = _.get(filterOrderData, "order_delivery_timeline", []);
    return orderTimeline.find((timeline) => timeline.order_status === status);
  };

  let completed_timelines = _.get(filterOrderData, "order_delivery_timeline", []).map((res) => {
    return res.order_status;
  });

  completed_timelines.push("placed");


  const columns = [
    {
      title: "Product",
      key: "cart_items",
      width: 200,
      render: () => (
        <div className="flex items-center gap-4">
          <div>
            <h3 className="flex flex-col">
              <div>{_.get(filterOrderData, "cart_items.category_name", "")}</div>
              <div>{_.get(filterOrderData, "cart_items.product_name", "")}</div>
              <div>{_.get(filterOrderData, "cart_items.product_seo_url", "")}</div>
            </h3>
            {(_.get(filterOrderData, "cart_items.customized_name") ||
    _.get(filterOrderData, "cart_items[0].customized_name") ||
    _.get(filterOrderData, "customized_name") ||
    _.get(filterOrderData, "phone_stand_details.customized_name") ||
    (Array.isArray(filterOrderData?.cart_items) && filterOrderData.cart_items.find(i => i.customized_name)?.customized_name)) && (
              <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
                <strong>Customized Name:</strong>{" "}
                <span className="text-blue-700 font-bold">
                  {_.get(filterOrderData, "cart_items.customized_name") ||
    _.get(filterOrderData, "cart_items[0].customized_name") ||
    _.get(filterOrderData, "customized_name") ||
    _.get(filterOrderData, "phone_stand_details.customized_name") ||
    (Array.isArray(filterOrderData?.cart_items) && filterOrderData.cart_items.find(i => i.customized_name)?.customized_name)}
                </span>
              </div>
            )}
            {(_.get(filterOrderData, "cart_items.giveaway_coupon") || _.get(filterOrderData, "cart_items[0].giveaway_coupon") || _.get(filterOrderData, "giveaway_coupon") || _.get(filterOrderData, "coupon.code")) && (
              <div className="mt-1">
                <Tag color="purple">
                  Coupon: {_.get(filterOrderData, "cart_items.giveaway_coupon") || _.get(filterOrderData, "cart_items[0].giveaway_coupon") || _.get(filterOrderData, "giveaway_coupon") || _.get(filterOrderData, "coupon.code")}
                </Tag>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Materials",
      key: "variants",
      render: () => (
        <div className="flex flex-col gap-y-2">
          {Object.entries(_.get(filterOrderData, "cart_items.product_variants[0]", {})).map((res, index) => {
            return (
              <p key={index} className="text-sm flex gap-x-2">
                {res[0]} : {res[1]}
              </p>
            );
          })}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "product_price",
      key: "product_price",
      align: "center",
      render: (price) => {
        return <div>₹ {_.get(filterOrderData, "cart_items.product_price", "")}</div>;
      },
    },
    {
      title: "Quantity",
      dataIndex: "product_price",
      key: "product_price",
      align: "center",
      render: (price) => {
        return <div className="">{_.get(filterOrderData, "cart_items.product_quantity", "")}</div>;
      },
    },
  ];

  let GET_COLOR_STATUS = (res) => {
    try {
      return completed_timelines.includes(res?.label) ? "green" : "gray";
    } catch (err) {}
  };

 const handleDownloadPDF = () => {
   try {
     const input = document.getElementById("invoice");
     html2canvas(input).then((canvas) => {
       const imgData = canvas.toDataURL("image/png");
       const pdf = new jsPDF();
       const pageWidth = pdf.internal.pageSize.width;

       const imgWidth = pageWidth;
       const imgHeight = 270;
       const x = (pageWidth - imgWidth) / 2;

       const y = 10;

       pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
       pdf.save(`#${_.get(filterOrderData, "invoice_no", "")}.pdf`);
     });
   } catch (err) {
     console.log(err);
   }
 };

 let orderItemsColumns = [
   {
     title: "Item",
     value: (
       <h3 className="flex flex-col py-4 capitalize text-center">
         <div>{_.get(filterOrderData, "cart_items.category_name", "")}</div>
         <div>{_.get(filterOrderData, "cart_items.product_name", "")}</div>
         <div>{_.get(filterOrderData, "cart_items.product_seo_url", "").slice(0, 20)}...</div>
       </h3>
     ),
   },
   {
     title: "Materials",
     value: !_.isEmpty(_.get(filterOrderData, "cart_items.product_variants[0]", {})) ? (
       <div className="flex flex-col gap-y-2 py-4 px-2 !text-sm ">
         {Object.entries(_.get(filterOrderData, "cart_items.product_variants[0]", {})).map((res, index) => {
           return (
             !["stock"].includes(res[0]) &&
             res[0] != "product_unique_code" && (
               <p key={index} className="text-sm  flex gap-x-2">
                 {res[0]} : {res[1]}
               </p>
             )
           );
         })}
       </div>
     ) : (
       false
     ),
   },

   {
     title: "Price",
     value: (
       <h3 className="flex flex-col py-4">
         <div>₹ {_.get(filterOrderData, "cart_items.product_price", "")}</div>
       </h3>
     ),
   },
   {
     title: "Quantity",
     value: (
       <h3 className="flex flex-col py-4">
         <div>{_.get(filterOrderData, "cart_items.product_quantity", "")}</div>
       </h3>
     ),
   },
   {
     title: "Total",
     value: (
       <h3 className="flex flex-col py-4 text-end items-end justify-end ">
         <div>₹ {_.get(filterOrderData, "cart_items.product_price", "")}</div>
       </h3>
     ),
   },
 ];

 let subTotalColumns = [
   {
     title: "Subtotal",
     value: `₹ ${_.get(filterOrderData, "cart_items.product_price", "")}`,
   },
   {
     title: "SGST (4%)",
     value: `₹ ${_.get(filterOrderData, "cart_items.sgst", "")}`,
   },
   {
     title: "CGST (4%)",
     value: `₹ ${_.get(filterOrderData, "cart_items.cgst", "")}`,
   },
   {
     title: "Grand Total",
     value: `₹ ${_.get(filterOrderData, "cart_items.final_total", "")}`,
   },
 ];
 return (
   <Spin spinning={loading}>
     <div>
       <DefaultTile title={"Order Details"} />
       <div className="p-5">
         <Breadcrumbs title={"Order Details"} />
       </div>
       <div className=" ">
         <Collapse defaultActiveKey={["1"]} className="!bg-white overflow-hidden">
           <Collapse.Panel
             collapsible="icon"
             key={"1"}
             header={"Invoice"}
             extra={
               <Tag onClick={handleDownloadPDF} color="green" className="!center_div gap-x-2 !cursor-pointer">
                 <ICON_HELPER.DOWNLOAD_ICON /> Download Invoice
               </Tag>
             }
           >
             <div className="w-full center_div justify-start items-start font-medium">
               <div className="w-full mx-auto px-4 pb-4 !font-billfont" id="invoice">
                 <div className="w-full center_div justify-between ">
                   <h1 className="font-bold text-2xl">INVOICE: #{_.get(filterOrderData, "invoice_no", "")}</h1>

                   <div className="!text-sm flex flex-col gap-y-2 py-4 items-end">
                     <img src={IMAGE_HELPER.FULLLOGO} alt="" className="!w-[180px]" />

                     <span className="text-black text-end">
                       #8 Church Colony, <br />
                       Opp.Bishop Heber College,
                       <br /> Vayalur Rd, Tiruchirappalli, <br /> Tamil Nadu 620017
                     </span>
                     <span className="text-black">9876543210,8976543210</span>
                     <span className="text-black">info@printe.in</span>
                   </div>
                 </div>
                 {/* <Divider className="border-gray-200" /> */}
                 <div className="center_div w-full justify-between items-start pt-5">
                   <div className="!text-sm flex flex-col gap-y-2 items-start ">
                     <h1 className="font-bold  text-lg">
                       Date: &nbsp; <span className="text-black font-normal"> {moment(_.get(filterOrderData, "createdAt", "")).format("DD-MMM-yyyy")}</span>{" "}
                     </h1>
                     <h1 className="font-bold  text-lg">
                       Payment: &nbsp; <span className="text-black font-normal"> {_.get(filterOrderData, "payment_type", "")}</span>{" "}
                     </h1>
                     {_.get(filterOrderData, "payment_id", "") && (
                       <>
                         <h1 className=" font-bold  text-lg">
                           Payment id: &nbsp; <span className="text-black font-normal"> {_.get(filterOrderData, "payment_id", "")}</span>{" "}
                         </h1>
                       </>
                     )}
                   </div>
                   <div className="!text-sm flex flex-col gap-y-2 items-end ">
                     <h1 className="font-bold text-black text-lg">Billing Address</h1>
                     <span className="text-black">{_.get(filterOrderData, "delivery_address.addressType", "")} Address,</span>
                     <span className="text-black">{_.get(filterOrderData, "delivery_address.name", "")},</span>
                     <span className="text-black">
                       {_.get(filterOrderData, "delivery_address.mobile_number", "")}, {_.get(filterOrderData, "delivery_address.Alternate_mobile_number", "")},
                     </span>
                     <span className="text-black">
                       {_.get(filterOrderData, "delivery_address.street_address", "")},{_.get(filterOrderData, "delivery_address.pincode", "")}
                     </span>
                   </div>
                 </div>
                 {/* <Divider className="border-gray-200" /> */}

                 <h1 className="pt-4 text-2xl font-bold !pb-6">Order Summary</h1>
                 {/* <Table size="small" dataSource={filterOrderData ? [filterOrderData] : []} columns={columns} pagination={false} bordered className="!pt-4 " /> */}
                 <table className="border-collapse border border-gray-200 w-full !text-black">
                   <thead>
                     <tr>
                       {orderItemsColumns.map((res, index) => {
                         return (
                           res.value && (
                             <th key={index} className={`border border-gray-200 !h-[50px]  `}>
                               {res.title}
                             </th>
                           )
                         );
                       })}
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       {orderItemsColumns.map((res, index) => {
                         return (
                           res.value && (
                             <th key={index} className={`border border-gray-200 !h-[50px] px-4 ${res.title === "Total" ? "text-end" : ""} `}>
                               {res.value}
                             </th>
                           )
                         );
                       })}
                     </tr>
                   </tbody>
                   <tbody>
                     {subTotalColumns.map((res, index) => {
                       return (
                         <tr key={index}>
                           <th colSpan={!_.isEmpty(_.get(filterOrderData, "cart_items.product_variants[0]", {})) ? 4 : 3} className={`border border-gray-200 !h-[50px] text-end px-4`}>
                             {res.title}
                           </th>
                           <td className={`border border-gray-200 !h-[50px] px-4 text-end `}>{res.value}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>

                 <div className="w-full center_div justify-end flex-col items-end py-6">
                   <h1 className="text-2xl">Total Amount</h1>
                   <h1 className="text-2xl text-primary">₹{_.get(filterOrderData, "cart_items.final_total", "")}</h1>
                   <h1 className="text-lg">Tax Included</h1>
                 </div>
               </div>
             </div>
           </Collapse.Panel>
           <Collapse.Panel key={"2"} header={"Track Order Status"}>
             <div className="bg-white  p-5 mt-4">
               <h1 className="pt-4 text-center pb-10">Track Order Status</h1>

               <Timeline
                 className="text-sm"
                 items={items.map((res) => {
                   const timelineEntry = ORDER_TIME_LINE(res.label);
                   const createdAt = _.get(timelineEntry, "createdAt", null);
                   let color = GET_COLOR_STATUS(res);

                   return {
                     dot: <ICON_HELPER.DELIVERY_ICON className="!text-2xl" />,
                     children: (
                       <div className={`${createdAt ? "" : "grayscale"} !h-[50px] !font-primary_font !text-[16px] capitalize pb-2`}>
                         <h1> {res.label}</h1>
                         <h1 className="text-black !text-[12px]">{createdAt ? moment(createdAt).format("DD-MMM-yyyy") : ""}</h1>
                       </div>
                     ),
                     color: color,
                   };
                 })}
               />
             </div>
           </Collapse.Panel>
           <Collapse.Panel key={"3"} header={"Design File"}>
             <div className="bg-white  p-5 mt-4">
               <Tag color="green" className="flex ">
                 <Tooltip title={_.get(filterOrderData, "cart_items.product_design_file", "")}>
                   <span className="line-clamp-1 text-slate-600 overflow-clip">{_.get(filterOrderData, "cart_items.product_design_file", "")}</span>
                 </Tooltip>
                 ...
               </Tag>
               <div className="pt-3">
                 <a href={_.get(filterOrderData, "cart_items.product_design_file", "")} target="_blank" className=" !my-2 text-sm text-blue-500">
                   Download
                 </a>
               </div>
             </div>
           </Collapse.Panel>
         </Collapse>
       </div>
     </div>
   </Spin>
 );
};

export default OrderExplore;
