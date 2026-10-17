import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { UserRole } from "@/generated/prisma/client";
import { assertRoles, getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "day:asc", label: "Day" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

const formatDay = (day: string) => day.charAt(0) + day.slice(1).toLowerCase();

const LessonListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN, UserRole.TEACHER]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const sort = getParam(searchParams, "sort") || "day:asc";
  const scope = await getViewerScope(session!.user.id, role);
  const where: Prisma.LessonWhereInput = {
    ...(role === UserRole.TEACHER && scope.teacherId
      ? { teacherId: scope.teacherId }
      : {}),
    ...(classId
      ? scope.unrestricted || scope.classIds.includes(classId)
        ? { classId }
        : { classId: "__none__" }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { subject: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "name:desc"
      ? { name: "desc" as const }
      : sort === "name:asc"
        ? { name: "asc" as const }
        : sort === "day:desc"
          ? [{ day: "desc" as const }, { startTime: "asc" as const }]
          : [{ day: "asc" as const }, { startTime: "asc" as const }];

  const [lessons, count, classes] = await Promise.all([
    prisma.lesson.findMany({
      where,
      include: { subject: true, class: true, teacher: { include: { user: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lesson.count({ where }),
    prisma.schoolClass.findMany({
      where: { academicYear: { isCurrent: true } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const data = lessons.map((lesson) => ({
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

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Lessons</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter
              param="classId"
              label="Class"
              options={classes.map((item) => ({ value: item.id, label: item.name }))}
            />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="lesson" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Lesson", accessor: "name", sortKey: "name" },
          { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
          { header: "Class", accessor: "class", className: "hidden md:table-cell" },
          { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
          { header: "Day & Time", accessor: "time", className: "hidden lg:table-cell", sortKey: "day" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-gray-500 md:hidden">{item.subject}</p>
            </td>
            <td className="hidden md:table-cell">{item.subject}</td>
            <td className="hidden md:table-cell">{item.schoolClass}</td>
            <td className="hidden lg:table-cell">{item.teacher}</td>
            <td className="hidden lg:table-cell">
              {formatDay(item.day)}, {item.startTime} - {item.endTime}
            </td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
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
        )}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default LessonListPage;
