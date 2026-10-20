import React, { useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import { Outlet, useHref, useNavigate } from "react-router-dom";
import { MENU_DATA } from "../helper/data";
import _ from "lodash";
import { isLoginSuccess } from "../redux/slices/authSlice";
import { admintoken } from "../helper/notification_helper";
import { checkloginstatus } from "../api";
import { useDispatch, useSelector } from "react-redux";
import TopNavbar from "../components/TopNavbar";
import { IMAGE_HELPER } from "../helper/imagehelper";
import { canViewPage, getAccessiblePages, isSuperAdmin } from "../helper/permissionHelper";

const { Sider } = Layout;

const HIDDEN_LAYOUT_ROUTES = [
  "product-catalog",
  "photobook-editor",
];

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const path = useHref();
  const dispatch = useDispatch();
  const [new_menu_data, setNew_menu_data] = useState([]);
  const { user } = useSelector((state) => state.authSlice);
  const [openKeys, setOpenKeys] = useState([]);

  const isHideLayout = HIDDEN_LAYOUT_ROUTES.some((route) => path.includes(route));

  useEffect(() => {
    if (isSuperAdmin(user.role)) {
      setNew_menu_data(MENU_DATA);
    } else if (user.pagePermissions && user.pagePermissions.length > 0) {
      const accessiblePages = getAccessiblePages(user.pagePermissions);

      const filteredMenuData = MENU_DATA.filter((menu) => {
        const hasParentAccess = menu.special.some((special) =>
          accessiblePages.includes(special)
        );

        if (!hasParentAccess) return false;

        if (menu.children && menu.children.length > 0) {
          menu.children = menu.children.filter((child) =>
            child.special.some((special) => accessiblePages.includes(special))
          );
        }

        return true;
      });

      setNew_menu_data(filteredMenuData);
    } else {
      const updatedMenuData = MENU_DATA.filter((menu) =>
        menu.for.includes(user.role)
      );
      setNew_menu_data(updatedMenuData);
    }
  }, [user]);

  const fetchdata = async () => {
    try {
      const result = await checkloginstatus();
      const data = _.get(result, "data.data", "");
      dispatch(isLoginSuccess(data));

      if (_.isEmpty(data)) {
        localStorage.removeItem(admintoken);
        navigate("/");
      }
    } catch (err) {
      console.error("Login check failed:", err);
    }
  };

  useEffect(() => {
    fetchdata();
  }, []);

  const handleClick = (to) => {
    navigate(to);
  };

  if (isHideLayout) {
    return <Outlet />;
  }

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="!h-screen !bg-white overflow-auto"
      >
        <div className="center_div rounded h-[50px]">
          <div className="flex flex-row items-center">
            {collapsed ? (
              <img
                src={IMAGE_HELPER.fav}
                alt=""
                className="w-auto h-[35px] bg-center bg-contain"
              />
            ) : (
              <img
                src={IMAGE_HELPER.logo}
                alt=""
                className="w-auto h-[55px] bg-center bg-contain"
              />
            )}
          </div>
        </div>
        <Menu mode="vertical" className="pb-20">
          {new_menu_data.map((res) =>
            !_.isEmpty(_.get(res, "children", [])) ? (
              <Menu.SubMenu
                key={res.id}
                title={res.name}
                icon={React.createElement(res.icon)}
              >
                {res.children.map((child) => (
                  <Menu.Item
                    key={child.id}
                    onClick={() => handleClick(child.to)}
                  >
                    {child.name}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            ) : (
              <Menu.Item
                key={res.id}
                onClick={() => handleClick(res.to)}
                icon={React.createElement(res.icon)}
              >
                {res.name}
              </Menu.Item>
            )
          )}
        </Menu>
      </Sider>
      <Layout className="!h-screen overflow-hidden">
        <TopNavbar />
        <div className="!h-screen overflow-auto">
          <Outlet />
        </div>
      </Layout>
    </Layout>
  );
};

export default App;