import { createContext, useContext, ReactNode, useState } from "react";
import { ChevronFirst, ChevronLast } from "lucide-react";

import { Link } from "react-router-dom";

interface SidebarContextType {
  expanded: boolean;
}
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProps {
  children: ReactNode;
}

interface SidebarItemProps {
  icon: ReactNode; // ReactNode allows any React component or JSX
  text: string;
  active?: boolean;
  alert?: boolean;
  link: string;
  linkLabel?: string;
}

const Sidebar = ({ children }: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <aside className="h-screen border">
        <nav className="h-full flex flex-col bg-gray-800 border-r shadow-sm">
          <div className="p-4 pb-2 flex justify-between items-center">
            <img
              className={`overflow-hidden transition-all ${expanded ? "w-32" : "w-0"
                }`}
              alt="Logo"
            />

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-gray-550 hover:bg-gray-10"
            >
              {expanded ? <ChevronFirst /> : <ChevronLast />}
            </button>
          </div>
          <SidebarContext.Provider value={{ expanded }}>
            <ul className="flex-1 px-3">{children}</ul>
          </SidebarContext.Provider>

        </nav>
      </aside>
    </>
  );
};

export const SidebarItem = ({
  icon,
  text,
  active,
  alert,
  link,
  linkLabel,
}: SidebarItemProps) => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("SidebarItem must be used within a Sidebar");
  }
  const { expanded } = context;
  return (
    <Link to={link} className="hover: bg-indigo-50 text-gray-600" aria-label={linkLabel}>
      <li
        className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active
          ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
          : "bg-indigo-100 hover:bg-indigo-50 text-gray-600"
          }`}
      >
        {icon}
        <span
          className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
            }`}
        >
          {text}
        </span>
        {alert && (
          <div
            className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${expanded ? "" : "top-2"
              }`}
          ></div>
        )}

        {!expanded && (
          <div
            className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible 
            opacity-20-translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
          >
            {text}
          </div>
        )}
      </li>
    </Link>
  );
};

export default Sidebar;
