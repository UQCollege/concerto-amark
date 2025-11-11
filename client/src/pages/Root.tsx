import { Outlet } from "react-router";
import Sidebar from "../uis/Sidebar";
import { SidebarItem } from "../uis/Sidebar";
import {

  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  BookOpenCheck,
} from "lucide-react";
import { PrimeReactProvider } from "primereact/api";
import { useAuth } from "../utils/useAuth";
import { useAppSelector } from "../store/hooks";
import { EnvSwitcher } from "../uis/EnvSwitcher";


const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";

const Root = () => {
  const userData = useAppSelector((state) => state.auth);

  const name = isAuthDisabled
    ? import.meta.env.VITE_LOCALDEV
    : userData?.user || "";
  const isAdmin =
    userData.groups.includes("Admin") ||
    userData.groups.includes("Admin-Rater");
  const { logout } = useAuth();


  return (
    <PrimeReactProvider>
      <div className="flex relative m-5">
        <Sidebar>
           <EnvSwitcher />
          <hr className="my-3" />
          <SidebarItem icon={<Home size={20} />} text="Home" alert link="/" />
          {isAdmin && (
            <SidebarItem
              icon={<LayoutDashboard size={20} />}
              text={`${name}'s Admin Board`}
              active
              link="/admin"
            />
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

         
          <hr className="my-3" />
          {/* <SidebarItem icon={<LogOut size={20} />} text="Log Out" link={import.meta.env.VITE_LOGOUT_URL} /> */}
          <LogOut
            className="font-medium rounded-md cursor-pointer transition-colors group bg-indigo-100 hover:bg-indigo-50 text-gray-600 cursor-pointer p-2 w-12 h-8"
            size={20}
            onClick={logout}
          />
          
        </Sidebar>
        <main className="transition-all duration-300 ease-in-out flex-grow ">
          <Outlet />
        </main>
      </div>
    </PrimeReactProvider>
  );
};

export default Root;
