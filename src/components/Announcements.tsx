const Announcements = () => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold     ">Announcements</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="p-4 rounded-md bg-AbSkyLight">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Lorem, ipsum dolor sit amet </h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="mt-1 text-gray-400 text-sm">
            {" "}
            Lorem ipsum dolor sit amet consectetur adipisicing el it. Hic
            dignissimos laborum quaerat quia omnis commodi,{" "}
          </p>
        </div>
        <div className="p-4 rounded-md bg-purple-100 ">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Lorem, ipsum dolor sit amet </h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="mt-1 text-gray-400 text-sm">
            {" "}
            Lorem ipsum dolor sit amet consectetur adipisicing el it. Hic
            dignissimos laborum quaerat quia omnis commodi,{" "}
          </p>
        </div> <div className="p-4 rounded-md bg-AbYellowLight">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Lorem, ipsum dolor sit amet </h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
              2025-01-01
            </span>
          </div>
          <p className="mt-1 text-gray-400 text-sm">
            {" "}
            Lorem ipsum dolor sit amet consectetur adipisicing el it. Hic
            dignissimos laborum quaerat quia omnis commodi,{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
