import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Exam = {
  id: string;
  title: string;
  subject: string;
  schoolClass: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  isoDate: string;
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
    header: "Date",
    accessor: "date",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const ExamsListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";

  const exams = await prisma.exam.findMany({
    include: {
      subject: true,
      class: true,
      teacher: { include: { user: true } },
    },
    orderBy: { date: "asc" },
  });

  const data: Exam[] = exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    subject: exam.subject.name,
    schoolClass: exam.class.name,
    teacher: `${exam.teacher.user.firstName} ${exam.teacher.user.lastName}`,
    date: exam.date.toISOString().slice(0, 10),
    startTime: exam.startTime,
    endTime: exam.endTime,
    subjectId: exam.subjectId,
    classId: exam.classId,
    teacherId: exam.teacherId,
    isoDate: exam.date.toISOString().slice(0, 10),
  }));

  const renderRow = (item: Exam) => (
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
      <td className="hidden lg:table-cell">
        {item.date}
        <span className="ml-2 text-xs text-gray-500">
          {item.startTime} - {item.endTime}
        </span>
      </td>
      <td>
        <div className="flex gap-2 items-center">
          {role && role === "ADMIN" && (
            <>
              <FormModal
                type="edit"
                table="exam"
                data={{
                  id: item.id,
                  title: item.title,
                  date: item.isoDate,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  subjectId: item.subjectId,
                  classId: item.classId,
                  teacherId: item.teacherId,
                }}
              />
              <FormModal type="delete" table="exam" id={item.id} />
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
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
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
              <FormModal type="create" table="exam" />
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

export default ExamsListPage;
