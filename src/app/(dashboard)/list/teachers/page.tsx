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
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "id:asc", label: "Teacher ID" },
];

const TeacherListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN, UserRole.TEACHER]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const subjectId = getParam(searchParams, "subjectId");
  const sort = getParam(searchParams, "sort") || "name:asc";
  const where = {
    ...(q
      ? {
          OR: [
            { user: { firstName: { contains: q, mode: "insensitive" as const } } },
            { user: { lastName: { contains: q, mode: "insensitive" as const } } },
            { employeeId: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(subjectId
      ? { teachingAssignments: { some: { subjectId } } }
      : {}),
  };
  const orderBy =
    sort === "name:desc"
      ? { user: { lastName: "desc" as const } }
      : sort === "id:asc"
        ? { employeeId: "asc" as const }
        : sort === "id:desc"
          ? { employeeId: "desc" as const }
          : { user: { lastName: "asc" as const } };

  const [teacherProfiles, count, subjects] = await Promise.all([
    prisma.teacherProfile.findMany({
      where,
      include: {
        user: true,
        teachingAssignments: { include: { subject: true, schoolClass: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.teacherProfile.count({ where }),
    prisma.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const teachers = teacherProfiles.map((profile) => ({
    id: profile.id,
    teacherId: profile.employeeId,
    name: `${profile.user.firstName} ${profile.user.lastName}`,
    email: profile.user.email,
    photo: profile.photoUrl ?? "/avatar.png",
    phone: profile.phone ?? "",
    subjects: Array.from(new Set(profile.teachingAssignments.map((item) => item.subject.name))),
    classes: Array.from(new Set(profile.teachingAssignments.map((item) => item.schoolClass.name))),
    address: profile.address ?? "",
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Teachers</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter
              param="subjectId"
              label="Subject"
              options={subjects.map((item) => ({ value: item.id, label: item.name }))}
            />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal table="teacher" type="create" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Info", accessor: "info", sortKey: "name" },
          { header: "Teacher ID", accessor: "teacherId", className: "hidden md:table-cell", sortKey: "id" },
          { header: "Subjects", accessor: "subjects", className: "hidden md:table-cell" },
          { header: "Classes", accessor: "classes", className: "hidden md:table-cell" },
          { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
          { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
          { header: "Action", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "subjectId"])}
        data={teachers}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="flex items-center gap-4 p-4">
              <Image src={item.photo} alt="" width={40} height={40} className="md:hidden xl:block w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.email}</p>
              </div>
            </td>
            <td className="hidden md:table-cell">{item.teacherId}</td>
            <td className="hidden md:table-cell">{item.subjects.join(", ")}</td>
            <td className="hidden md:table-cell">{item.classes.join(", ")}</td>
            <td className="hidden lg:table-cell">{item.phone}</td>
            <td className="hidden lg:table-cell">{item.address}</td>
            <td>
              <div className="flex gap-2 items-center">
                <Link href={`/list/teachers/${item.id}`} aria-label={`View ${item.name}`} className="icon-btn w-7 h-7 bg-AbSky">
                  <Image src="/view.png" alt="" width={16} height={16} />
                </Link>
                {role === UserRole.ADMIN && <FormModal table="teacher" type="delete" id={item.id} />}
              </div>
            </td>
          </tr>
        )}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default TeacherListPage;
