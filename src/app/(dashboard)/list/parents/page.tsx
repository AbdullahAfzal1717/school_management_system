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

const ParentsListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN, UserRole.TEACHER]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const sort = getParam(searchParams, "sort") || "name:asc";
  const where = q
    ? {
        OR: [
          { user: { firstName: { contains: q, mode: "insensitive" as const } } },
          { user: { lastName: { contains: q, mode: "insensitive" as const } } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const orderBy =
    sort === "name:desc"
      ? { user: { lastName: "desc" as const } }
      : { user: { lastName: "asc" as const } };

  const [parentProfiles, count] = await Promise.all([
    prisma.parentProfile.findMany({
      where,
      include: {
        user: true,
        children: { include: { student: { include: { user: true } } } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.parentProfile.count({ where }),
  ]);

  const parents = parentProfiles.map((profile) => ({
    id: profile.id,
    name: `${profile.user.firstName} ${profile.user.lastName}`,
    email: profile.user.email,
    students: profile.children.map(
      (link) => `${link.student.user.firstName} ${link.student.user.lastName}`,
    ),
    studentIds: profile.children.map((link) => link.studentId),
    phone: profile.phone ?? "",
    address: profile.address ?? "",
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Parents</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="parent" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Info", accessor: "info", sortKey: "name" },
          { header: "Student Names", accessor: "students", className: "hidden md:table-cell" },
          { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
          { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q"])}
        data={parents}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="flex items-center gap-4 p-4">
              <div className="flex flex-col">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.email}</p>
              </div>
            </td>
            <td className="hidden md:table-cell">{item.students.join(", ")}</td>
            <td className="hidden lg:table-cell">{item.phone}</td>
            <td className="hidden lg:table-cell">{item.address}</td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="parent" data={item} />
                    <FormModal type="delete" table="parent" id={item.id} />
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

export default ParentsListPage;
