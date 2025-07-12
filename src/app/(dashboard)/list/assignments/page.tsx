import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { assignmentsData, role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

type Assignment = {
  id: number;
  subject: string;
  class: string;
  teacher: string;
  dueDate:string;
};

const columns = [
  {
    header: "Subject Name",
    accessor: "subject",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },

  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden lg:table-cell",
  },
  {
    header: "Due Date",
    accessor: "dueDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const AssignmentsListPage = () => {
  const renderRow = (item: Assignment) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm"
    >
      <td className="flex items-center gap-4 p-4">
        <h3 className="font-semibold">{item.subject}</h3>
      </td>
      <td className="hidden md:table-cell">{item.class}</td>
      <td className="hidden lg:table-cell">{item.teacher}</td>
      <td className="hidden lg:table-cell">{item.dueDate}</td>
      <td>
        <div className="flex gap-2 items-center">
        {role === "admin" && (
            <>
              <FormModal type="edit" table="assignment" data={item} />
              <FormModal type="delete" table="assignment" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="rounded-md p-4 flex-1 m-4 mt-0 bg-white">
      {/* Top */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Assignments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex  items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal type="create" table="assignment"  />
          )}
          </div>
        </div>
      </div>
      {/* Table */}
      <Table columns={columns} renderRow={renderRow} data={assignmentsData} />
      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default AssignmentsListPage;
