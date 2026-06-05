import { UserCircle2, LogOut } from "lucide-react";

export default function Navbar({ onProfileOpen, onLogout }) {
  return (
    <div className="h-20 bg-[#1e293b] text-white flex items-center justify-end px-6 shadow-md fixed top-0 left-[270px] right-0 z-50 border-b border-gray-700">
      
      {/* LEFT - Logo */}
      {/* <div className="text-xl font-bold text-orange-500">
        VM SHEET
      </div> */}

      {/* RIGHT - Actions */}
      <div className="flex items-center gap-4">

        <button
          onClick={onProfileOpen}
          className="flex items-center gap-2 hover:scale-105 transition"
        >
          <UserCircle2 size={35} className="text-orange-400" />
          {/* <span className="hidden md:block">Profile</span> */}
        </button>

        {/* <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg"
        >
          <LogOut size={18} />
          Logout
        </button> */}

      </div>
    </div>
  );
}