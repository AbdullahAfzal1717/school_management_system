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
  { value: "id:asc", label: "Student ID" },
];

const StudentsListPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";
  assertRoles(role, [UserRole.ADMIN, UserRole.TEACHER]);

  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const sort = getParam(searchParams, "sort") || "name:asc";
  const where = {
    ...(q
      ? {
          OR: [
            { user: { firstName: { contains: q, mode: "insensitive" as const } } },
            { user: { lastName: { contains: q, mode: "insensitive" as const } } },
            { studentNumber: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(classId
      ? { enrollments: { some: { schoolClassId: classId } } }
      : {}),
  };
  const orderBy =
    sort === "name:desc"
      ? { user: { firstName: "desc" as const } }
      : sort === "id:asc"
        ? { studentNumber: "asc" as const }
        : sort === "id:desc"
          ? { studentNumber: "desc" as const }
          : { user: { firstName: "asc" as const } };

  const [studentProfiles, count, classes] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      include: {
        user: true,
        enrollments: {
          include: { schoolClass: true },
          orderBy: { enrolledAt: "desc" },
          take: 1,
        },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.studentProfile.count({ where }),
    prisma.schoolClass.findMany({
      where: { academicYear: { isCurrent: true } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const students = studentProfiles.map((profile) => {
    const enrollment = profile.enrollments[0];
    return {
      id: profile.id,
      studentId: profile.studentNumber,
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      email: profile.user.email,
      photo: profile.photoUrl ?? undefined,
      phone: profile.phone ?? undefined,
      grade: enrollment?.schoolClass.grade ?? 0,
      class: enrollment?.schoolClass.name ?? "Not enrolled",
      address: profile.address ?? undefined,
    };
  });

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Students</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter
              param="classId"
              label="Class"
              options={classes.map((item) => ({ value: item.id, label: item.name }))}
            />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="student" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Info", accessor: "info", sortKey: "name" },
          { header: "Student ID", accessor: "studentId", className: "hidden md:table-cell", sortKey: "id" },
          { header: "Grade", accessor: "grade", className: "hidden md:table-cell" },
          { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
          { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId"])}
        renderRow={(item) => (
          <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm"
          >
            <td className="flex items-center gap-4 p-4">
              <Image
                src={item.photo ?? "/avatar.png"}
                alt=""
                width={40}
                height={40}
                className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.class}</p>
              </div>
            </td>
            <td className="hidden md:table-cell">{item.studentId}</td>
            <td className="hidden md:table-cell">{item.grade}</td>
            <td className="hidden lg:table-cell">{item.phone}</td>
            <td className="hidden lg:table-cell">{item.address}</td>
            <td>
              <div className="flex gap-2 items-center">
                <Link
                  href={`/list/students/${item.id}`}
                  aria-label={`View ${item.name}`}
                  className="icon-btn w-7 h-7 bg-AbSky"
                >
                  <Image src="/view.png" alt="" width={16} height={16} />
                </Link>
                {role === UserRole.ADMIN && (
                  <FormModal table="student" type="delete" id={item.id} />
                )}
              </div>
            </td>
          </tr>
        )}
        data={students}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default StudentsListPage;
