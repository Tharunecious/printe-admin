import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Layout from "./Layout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Category from "../pages/Categories/Category";
import Orders from "../pages/Orders/Orders";
import Products from "../pages/Products/Products";
import VendorProduct from "../pages/Products/VendorProduct";
import Settings from "../pages/Settings/Settings";
import ProductForm from "../pages/Productforms/ProductForm";
import AdminUsers from "../pages/AdminUsers/AdminUsers";
import ClientUsers from "../pages/ClientUsers/ClientUsers";
import OrderExplore from "../pages/Orders/OrderExplore";
import MainCategory from "../pages/Categories/MainCategory";
import SubCategory from "../pages/Categories/SubCategory";
import SubProductCategory from "../pages/Categories/SubProductCategory";
import Banner from "../pages/banner/Banner";
import Review from "../pages/Review/Review";
import Blog from "../pages/Blog/Blog";
import Vendors from "../pages/vendors/Vendors";
import VendorDetails from "../pages/vendors/VendorDetails";
import ClientUsersDetails from "../pages/ClientUsers/ClientUsersDetails";
import Enquires from "../pages/Enquries/Enquires";
import CustomerPage from "../pages/customerpage/CustomerPage";
import ProductDetails from "../pages/productdetails/ProductDetails";
import AssignedOrder from "../pages/Orders/AssignedOrder";
import UserPanel from "../pages/userPanel/UserPanel";
import BulkEnquirey from "../pages/Enquries/BulkEnquirey";
import AddForms from "../pages/Products/AddForms";
import Coupen from "../pages/coupen/Coupen";
import AdminCreateOrder from "../pages/InvoiceGenration/AdminCreateOrder";
import AdminCreateQuotation from "../pages/InvoiceGenration/Admincreatequotation";
import DummyOrder from "../pages/Orders/DummyOrder";
import BNIPanel from "../pages/userPanel/BNIPanel";
import PermissionGuard from "../components/PermissionGuard";
import OfflineProduct from "../pages/Products/OfflineProduct";
import ProductCatalogPage from "../pages/Products/ProductCatalogPage";
import CampaignEntries from "../pages/Campaign/CampaignEntries";
import TemplateList from "../pages/PhotoBook/TemplateList";
import PhotoBookEditor from "../pages/PhotoBook/Editor/PhotoBookEditor";

// Wrapper component for permission-protected routes
const ProtectedRoute = ({ children, pageName }) => (
  <PermissionGuard pageName={pageName}>{children}</PermissionGuard>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Layout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute pageName="dashboard">
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin-users",
    element: <Layout />,
    children: [
      {
        path: "/admin-users",
        element: (
          <ProtectedRoute pageName="admin-users">
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/categories",
    element: <Layout />,
    children: [
      {
        path: "/categories",
        element: (
          <ProtectedRoute pageName="categories">
            <Category />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/categories/main-category",
    element: <Layout />,
    children: [
      {
        path: "/categories/main-category",
        element: (
          <ProtectedRoute pageName="main-category">
            <MainCategory />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/categories/sub-category",
    element: <Layout />,
    children: [
      {
        path: "/categories/sub-category",
        element: (
          <ProtectedRoute pageName="sub-category">
            <SubCategory />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/categories/product-category",
    element: <Layout />,
    children: [
      {
        path: "/categories/product-category",
        element: (
          <ProtectedRoute pageName="product-category">
            <SubProductCategory />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/client-users",
    element: <Layout />,
    children: [
      {
        path: "/client-users",
        element: (
          <ProtectedRoute pageName="client-users">
            <ClientUsers />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/user_details",
    element: <Layout />,
    children: [
      {
        path: "/user_details",
        element: (
          <ProtectedRoute pageName="client-users">
            <ClientUsersDetails />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/orders",
    element: <Layout />,
    children: [
      {
        path: "/orders",
        element: (
          <ProtectedRoute pageName="orders">
            <Orders />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/cancelled-orders",
    element: <Layout />,
    children: [
      {
        path: "/cancelled-orders",
        element: (
          <ProtectedRoute pageName="cancelled-orders">
            <DummyOrder />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/assigned-order",
    element: <Layout />,
    children: [
      {
        path: "/assigned-order",
        element: (
          <ProtectedRoute pageName="orders">
            <AssignedOrder />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/order_explore",
    element: <Layout />,
    children: [
      {
        path: "/order_explore",
        element: (
          <ProtectedRoute pageName="orders">
            <OrderExplore />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/products/add",
    element: <Layout />,
    children: [
      {
        path: "/products/add",
        element: (
          <ProtectedRoute pageName="product-details">
            <AddForms />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/product-details",
    element: <Layout />,
    children: [
      {
        path: "/product-details",
        element: (
          <ProtectedRoute pageName="product-details">
            <Products />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/Vendor-product-details",
    element: <Layout />,
    children: [
      {
        path: "/Vendor-product-details",
        element: (
          <ProtectedRoute pageName="Vendor-product-details">
            <VendorProduct />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/stock-management",
    element: <Layout />,
    children: [
      {
        path: "/stock-management",
        element: (
          <ProtectedRoute pageName="offline-product-details">
            <OfflineProduct />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/product-catalog/:id" ,
    element: <Layout />,
    children: [
      {
        path: "/product-catalog/:id" ,
        element: (
            <ProductCatalogPage />
        ),
      },
    ],
  },
  {
    path: "/coupons",
    element: <Layout />,
    children: [
      {
        path: "/coupons",
        element: (
          <ProtectedRoute pageName="coupons">
            <Coupen />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/products/product-description",
    element: <Layout />,
    children: [
      {
        path: "/products/product-description",
        element: (
          <ProtectedRoute pageName="product-details">
            <ProductDetails />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/settings",
    element: <Layout />,
    children: [
      {
        path: "/settings",
        element: (
          <ProtectedRoute pageName="settings">
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/homepage/banners",
    element: <Layout />,
    children: [
      {
        path: "/homepage/banners",
        element: (
          <ProtectedRoute pageName="banners">
            <Banner />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/homepage/product-section",
    element: <Layout />,
    children: [
      {
        path: "/homepage/product-section",
        element: (
          <ProtectedRoute pageName="product-section">
            <CustomerPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/forms",
    element: <Layout />,
    children: [
      {
        path: "/forms",
        element: (
          <ProtectedRoute pageName="product-details">
            <ProductForm />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/review",
    element: <Layout />,
    children: [
      {
        path: "/review",
        element: (
          <ProtectedRoute pageName="review">
            <Review />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/Dealers",
    element: <Layout />,
    children: [
      {
        path: "/Dealers",
        element: (
          <ProtectedRoute pageName="client-users">
            <UserPanel />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/BNI",
    element: <Layout />,
    children: [
      {
        path: "/BNI",
        element: (
          <ProtectedRoute pageName="BNI">
            <BNIPanel />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/vendors",
    element: <Layout />,
    children: [
      {
        path: "/vendors",
        element: (
          <ProtectedRoute pageName="vendors">
            <Vendors />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/vendor_details/:id",
    element: <Layout />,
    children: [
      {
        path: "/vendor_details/:id",
        element: (
          <ProtectedRoute pageName="vendors">
            <VendorDetails />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/blogs",
    element: <Layout />,
    children: [
      {
        path: "/blogs",
        element: (
          <ProtectedRoute pageName="blogs">
            <Blog />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/enquires",
    element: <Layout />,
    children: [
      {
        path: "/enquires",
        element: (
          <ProtectedRoute pageName="enquires">
            <Enquires />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/bulk-enquires",
    element: <Layout />,
    children: [
      {
        path: "/bulk-enquires",
        element: (
          <ProtectedRoute pageName="bulk-enquires">
            <BulkEnquirey />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/Invoice-genaration",
    element: <Layout />,
    children: [
      {
        path: "/Invoice-genaration",
        element: (
          <ProtectedRoute pageName="dashboard">
            <AdminCreateOrder />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/Quotation",
    element: <Layout />,
    children: [
      {
        path: "/Quotation",
        element: (
          <ProtectedRoute pageName="dashboard">
            <AdminCreateQuotation />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/campaign-entries",
    element: <Layout />,
    children: [
      {
        path: "/campaign-entries",
        element: (
          <ProtectedRoute pageName="campaign-entries">
            <CampaignEntries />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/photobook-templates",
    element: <Layout />,
    children: [
      {
        path: "/photobook-templates",
        element: (
          <ProtectedRoute pageName="photobook-templates">
            <TemplateList />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/photobook-editor/:id",
    element: <Layout />,
    children: [
      {
        path: "/photobook-editor/:id",
        element: (
          <ProtectedRoute pageName="photobook-templates">
            <PhotoBookEditor />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Catch-all route for 404
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);