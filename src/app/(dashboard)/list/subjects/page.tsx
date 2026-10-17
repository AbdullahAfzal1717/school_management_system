import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
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
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

const SubjectsListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const sort = getParam(searchParams, "sort") || "name:asc";
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  const orderBy = { name: sort === "name:desc" ? ("desc" as const) : ("asc" as const) };

  const [subjects, count] = await Promise.all([
    prisma.subject.findMany({
      where,
      include: {
        teachingAssignments: { include: { teacher: { include: { user: true } } } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.subject.count({ where }),
  ]);

  const data = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    teachers: Array.from(
      new Set(
        subject.teachingAssignments.map(
          (item) => `${item.teacher.user.firstName} ${item.teacher.user.lastName}`,
        ),
      ),
    ),
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Subjects</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableSort options={sorts} />
            <FormModal type="create" table="subject" />
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Subjects", accessor: "name", sortKey: "name" },
          { header: "Teacher Names", accessor: "teachers", className: "hidden md:table-cell" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="flex items-center gap-4 p-4">
              <h3 className="font-semibold">{item.name}</h3>
            </td>
            <td className="hidden md:table-cell">{item.teachers.join(", ")}</td>
            <td>
              <div className="flex gap-2 items-center">
                <FormModal type="edit" table="subject" data={item} />
                <FormModal type="delete" table="subject" id={item.id} />
              </div>
            </td>
          </tr>
        )}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default SubjectsListPage;
