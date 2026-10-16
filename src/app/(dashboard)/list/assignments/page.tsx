import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Assignment = {
  id: string;
  title: string;
  subject: string;
  schoolClass: string;
  teacher: string;
  dueDate: string;
  startDate: string;
  subjectId: string;
  classId: string;
  teacherId: string;
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

const AssignmentsListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";

  const assignments = await prisma.assignment.findMany({
    include: {
      subject: true,
      class: true,
      teacher: { include: { user: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const data: Assignment[] = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    subject: assignment.subject.name,
    schoolClass: assignment.class.name,
    teacher: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
    dueDate: assignment.dueDate.toISOString().slice(0, 10),
    startDate: assignment.startDate.toISOString().slice(0, 10),
    subjectId: assignment.subjectId,
    classId: assignment.classId,
    teacherId: assignment.teacherId,
  }));

  const renderRow = (item: Assignment) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-xs text-gray-500">{item.subject}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.schoolClass}</td>
      <td className="hidden lg:table-cell">{item.teacher}</td>
      <td className="hidden lg:table-cell">{item.dueDate}</td>
      <td>
        <div className="flex gap-2 items-center">
          {role && role === "ADMIN" && (
            <>
              <FormModal
                type="edit"
                table="assignment"
                data={{
                  id: item.id,
                  title: item.title,
                  startDate: item.startDate,
                  dueDate: item.dueDate,
                  subjectId: item.subjectId,
                  classId: item.classId,
                  teacherId: item.teacherId,
                }}
              />
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
        <h1 className="hidden md:block text-lg font-semibold">
          All Assignments
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex  items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role && role === "ADMIN" && (
              <FormModal type="create" table="assignment" />
            )}
          </div>
        </div>
      </div>
      {/* Table */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default AssignmentsListPage;
