import Image from "next/image"

const TableSearch = () => {
  return (
     <div className="w-full md:w-auto flex items-center text-xs ring-[1.5px] ring-gray-300 rounded-full px-2 gap-2 ">
            <Image src="/search.png" alt="search" width={18} height={8} />
            <input type="text" placeholder="Search ......" className="w-[200px] p-2 bg-transparent outline-none"/>
          </div>
    
  )
}

export default TableSearch