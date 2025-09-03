import { Outlet } from "react-router";
import Sidebar from "../uis/Sidebar";
import { SidebarItem } from "../uis/Sidebar";
import { Flag, Home, Layers, LayoutDashboard, LogOut, BookOpenCheck } from "lucide-react";
import { PrimeReactProvider } from "primereact/api";

import { useAppSelector } from "../store/hooks";
import { handleLogout } from "../utils/auth";


const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";


const Root = () => {

  const userData = useAppSelector((state) => state.auth)

  const name = isAuthDisabled ? import.meta.env.VITE_LOCALDEV : (userData?.user || "");
  const isAdmin = userData.groups.includes("Admin") || userData.groups.includes("Admin-Rater");
  

  return (
    <PrimeReactProvider>
      <div className="flex relative m-5">
        <Sidebar>

          <SidebarItem icon={<Home size={20} />} text="Home" alert link="/" />
          {isAdmin && (
            <SidebarItem icon={<LayoutDashboard size={20} />} text={`${name}'s Admin Board`} active link="/admin" />
          )}
          <SidebarItem
            icon={<BookOpenCheck size={20} />}
            text={`${name}'s Writing Assessments`}
            link={`/raters/${name}`} //
          />
      
            <SidebarItem
              icon={<Layers size={20} />}
              text={`${name}'s Classes`}
              link={`/classes/${name}`} //
            />
     
          <SidebarItem icon={<Flag size={20} />} text="" link="" />
          <hr className="my-3" />
          {/* <SidebarItem icon={<LogOut size={20} />} text="Log Out" link={import.meta.env.VITE_LOGOUT_URL} /> */}
          <LogOut className="mx-3 my-2 cursor-pointer" size={20} onClick={() => handleLogout()} />
        </Sidebar>
        <main className="transition-all duration-300 ease-in-out flex-grow ">
          <Outlet />
        </main>
      </div>
    </PrimeReactProvider>
  );
};

export default Root;
