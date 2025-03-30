import { Outlet } from "react-router";
import Sidebar from "../uis/Sidebar";
import { SidebarItem } from "../uis/Sidebar";
import { Flag, Home, Layers, LayoutDashboard, LogOut } from "lucide-react";
import { PrimeReactProvider } from "primereact/api";

const Root = () => {
  const name = 'Alice2'; //todo: implement login feature for userId
  return (
    <PrimeReactProvider>
      <div className="flex relative m-5">
        {/* <Nav show={show}></Nav> */}
        <Sidebar>
          <SidebarItem icon={<Home size={20} />} text="Home" alert link="/" />
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            text="Admin Board"
            active
            link="/admin"
          />

          <SidebarItem
            icon={<Layers size={20} />}
            text={name}
            link={`/raters/${name}`} //
          />
          <SidebarItem icon={<Flag size={20} />} text="" link="" />
          <hr className="my-3" />
          <SidebarItem icon={<LogOut size={20} />} text="Log Out" link="" />
        </Sidebar>
        <main className="transition-all duration-300 ease-in-out flex-grow ">
          <Outlet />
        </main>
      </div>
    </PrimeReactProvider>
  );
};

export default Root;
