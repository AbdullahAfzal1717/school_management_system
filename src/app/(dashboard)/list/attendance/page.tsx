import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { AttendanceStatus, Prisma, UserRole } from "@/generated/prisma/client";
import { classFilter, getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "date:desc", label: "Date (newest)" },
  { value: "date:asc", label: "Date" },
];

const statusStyles: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-700",
};

const AttendanceListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const role = session.user.role;
  const scope = await getViewerScope(session.user.id, role);
  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const status = getParam(searchParams, "status");
  const sort = getParam(searchParams, "sort") || "date:desc";
  const where: Prisma.AttendanceWhereInput = {
    ...classFilter(scope, classId),
    ...(!scope.unrestricted && role !== UserRole.TEACHER
      ? { studentId: { in: scope.studentIds } }
      : {}),
    ...(status && status in AttendanceStatus ? { status: status as AttendanceStatus } : {}),
    ...(q
      ? {
          OR: [
            { student: { user: { firstName: { contains: q, mode: "insensitive" } } } },
            { student: { user: { lastName: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const orderBy = { date: sort === "date:asc" ? ("asc" as const) : ("desc" as const) };

  const [records, count, classes] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { student: { include: { user: true } }, class: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.attendance.count({ where }),
    prisma.schoolClass.findMany({
      where: scope.unrestricted ? { academicYear: { isCurrent: true } } : { id: { in: scope.classIds } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const data = records.map((record) => ({
    id: record.id,
    student: `${record.student.user.firstName} ${record.student.user.lastName}`,
    schoolClass: record.class.name,
    date: record.date.toISOString().slice(0, 10),
    status: record.status,
    studentId: record.studentId,
    classId: record.classId,
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Attendance</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter param="classId" label="Class" options={classes.map((item) => ({ value: item.id, label: item.name }))} />
            <TableFilter
              param="status"
              label="Status"
              options={[
                { value: "PRESENT", label: "Present" },
                { value: "ABSENT", label: "Absent" },
                { value: "LATE", label: "Late" },
              ]}
            />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="attendence" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Student", accessor: "student" },
          { header: "Class", accessor: "class", className: "hidden md:table-cell" },
          { header: "Date", accessor: "date", className: "hidden lg:table-cell", sortKey: "date" },
          { header: "Status", accessor: "status" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId", "status"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4 font-semibold">{item.student}</td>
            <td className="hidden md:table-cell">{item.schoolClass}</td>
            <td className="hidden lg:table-cell">{item.date}</td>
            <td>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[item.status] ?? ""}`}>
                {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
              </span>
            </td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="attendence" data={{ id: item.id, studentId: item.studentId, classId: item.classId, date: item.date, status: item.status }} />
                    <FormModal type="delete" table="attendence" id={item.id} />
                  </>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default AttendanceListPage;
