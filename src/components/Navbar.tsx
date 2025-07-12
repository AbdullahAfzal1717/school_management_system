import Image from "next/image";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-4 ">
      {/* Search Bar */}
      <div className="hidden md:flex items-center text-xs ring-[1.5px] ring-gray-300 rounded-full px-2 gap-2 ">
        <Image src="/search.png" alt="search" width={18} height={8} />
        <input type="text" placeholder="Search ......" className="w-[200px] p-2 bg-transparent outline-none"/>
      </div>

      {/* Icons and profile  */}

      <div className="flex items-center gap-6 justify-end w-full" >
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="message" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image
            src="/announcement.png"
            alt="announcement"
            width={20}
            height={20}
          />
          <div className="absolute -right-3 -top-3 w-5 h-5 flex items-center justify-center text-white bg-purple-500 rounded-full text-xs">
            1
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">Abdullah</span>
          <span className="text-[10px] text-gray-500 text-right">Admin</span>
        </div>
        <Image
          src="/avatar.png"
          alt="avatar"
          width={36}
          height={36}
          className="rounded-full cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Navbar;
