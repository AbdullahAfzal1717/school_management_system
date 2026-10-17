import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { classFilter, getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "due:asc", label: "Due date" },
  { value: "due:desc", label: "Due date (latest)" },
  { value: "title:asc", label: "Title A–Z" },
];

const AssignmentsListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const role = session.user.role;
  const scope = await getViewerScope(session.user.id, role);
  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const sort = getParam(searchParams, "sort") || "due:asc";
  const where: Prisma.AssignmentWhereInput = {
    ...classFilter(scope, classId),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { subject: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "due:desc"
      ? { dueDate: "desc" as const }
      : sort === "title:asc"
        ? { title: "asc" as const }
        : sort === "title:desc"
          ? { title: "desc" as const }
          : { dueDate: "asc" as const };

  const [assignments, count, classes] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: { subject: true, class: true, teacher: { include: { user: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.assignment.count({ where }),
    prisma.schoolClass.findMany({
      where: scope.unrestricted ? { academicYear: { isCurrent: true } } : { id: { in: scope.classIds } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const data = assignments.map((assignment) => ({
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

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Assignments</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter param="classId" label="Class" options={classes.map((item) => ({ value: item.id, label: item.name }))} />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="assignment" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Subject Name", accessor: "subject", sortKey: "title" },
          { header: "Class", accessor: "class", className: "hidden md:table-cell" },
          { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
          { header: "Due Date", accessor: "dueDate", className: "hidden lg:table-cell", sortKey: "due" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.subject}</p>
            </td>
            <td className="hidden md:table-cell">{item.schoolClass}</td>
            <td className="hidden lg:table-cell">{item.teacher}</td>
            <td className="hidden lg:table-cell">{item.dueDate}</td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="assignment" data={{ id: item.id, title: item.title, startDate: item.startDate, dueDate: item.dueDate, subjectId: item.subjectId, classId: item.classId, teacherId: item.teacherId }} />
                    <FormModal type="delete" table="assignment" id={item.id} />
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

export default AssignmentsListPage;
