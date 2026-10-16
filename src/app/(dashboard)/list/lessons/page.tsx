import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Lesson = {
  id: string;
  name: string;
  subject: string;
  schoolClass: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  classId: string;
  teacherId: string;
};

const columns = [
  {
    header: "Lesson",
    accessor: "name",
  },
  {
    header: "Subject",
    accessor: "subject",
    className: "hidden md:table-cell",
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
    header: "Day & Time",
    accessor: "time",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const formatDay = (day: string) =>
  day.charAt(0) + day.slice(1).toLowerCase();

const LessonListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";

  const lessons = await prisma.lesson.findMany({
    include: {
      subject: true,
      class: true,
      teacher: { include: { user: true } },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  const data: Lesson[] = lessons.map((lesson) => ({
    id: lesson.id,
    name: lesson.name,
    subject: lesson.subject.name,
    schoolClass: lesson.class.name,
    teacher: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
    day: lesson.day,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    subjectId: lesson.subjectId,
    classId: lesson.classId,
    teacherId: lesson.teacherId,
  }));

  const renderRow = (item: Lesson) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500 md:hidden">{item.subject}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.subject}</td>
      <td className="hidden md:table-cell">{item.schoolClass}</td>
      <td className="hidden lg:table-cell">{item.teacher}</td>
      <td className="hidden lg:table-cell">
        {formatDay(item.day)}, {item.startTime} - {item.endTime}
      </td>
      <td>
        <div className="flex gap-2 items-center">
          {role && role === "ADMIN" && (
            <>
              <FormModal
                type="edit"
                table="lesson"
                data={{
                  id: item.id,
                  name: item.name,
                  day: item.day,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  subjectId: item.subjectId,
                  classId: item.classId,
                  teacherId: item.teacherId,
                }}
              />
              <FormModal type="delete" table="lesson" id={item.id} />
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
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
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
              <FormModal type="create" table="lesson" />
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

export default LessonListPage;
