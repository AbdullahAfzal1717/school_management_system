import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { UserRole } from "@/generated/prisma/client";
import { assertRoles } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "grade:asc", label: "Grade" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

const ClassListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN, UserRole.TEACHER]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const yearId = getParam(searchParams, "yearId");
  const sort = getParam(searchParams, "sort") || "grade:asc";
  const where = {
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(yearId ? { academicYearId: yearId } : {}),
  };
  const orderBy =
    sort === "name:desc"
      ? { name: "desc" as const }
      : sort === "name:asc"
        ? { name: "asc" as const }
        : sort === "grade:desc"
          ? [{ grade: "desc" as const }, { name: "asc" as const }]
          : [{ grade: "asc" as const }, { name: "asc" as const }];

  const [classes, count, years] = await Promise.all([
    prisma.schoolClass.findMany({
      where,
      include: {
        supervisor: { include: { user: true } },
        academicYear: true,
        _count: { select: { enrollments: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.schoolClass.count({ where }),
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const data = classes.map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
    capacity: schoolClass.capacity,
    enrolled: schoolClass._count.enrollments,
    grade: schoolClass.grade,
    supervisor: schoolClass.supervisor
      ? `${schoolClass.supervisor.user.firstName} ${schoolClass.supervisor.user.lastName}`
      : "No supervisor",
    academicYearId: schoolClass.academicYearId,
    supervisorId: schoolClass.supervisorId ?? "",
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Classes</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter
              param="yearId"
              label="Academic year"
              options={years.map((year) => ({ value: year.id, label: year.name }))}
            />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="class" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Class Name", accessor: "name", sortKey: "name" },
          { header: "Enrolled / Capacity", accessor: "capacity", className: "hidden md:table-cell" },
          { header: "Grade", accessor: "grade", className: "hidden lg:table-cell", sortKey: "grade" },
          { header: "Supervisor", accessor: "supervisor", className: "hidden lg:table-cell" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "yearId"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4 font-semibold">{item.name}</td>
            <td className="hidden md:table-cell">{item.enrolled} / {item.capacity}</td>
            <td className="hidden lg:table-cell">{item.grade}</td>
            <td className="hidden lg:table-cell">{item.supervisor}</td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="class" data={item} />
                    <FormModal type="delete" table="class" id={item.id} />
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

export default ClassListPage;
