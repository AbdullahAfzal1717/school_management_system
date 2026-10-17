import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { getViewerScope, schoolWideClassFilter } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "date:asc", label: "Date" },
  { value: "date:desc", label: "Date (newest)" },
  { value: "title:asc", label: "Title A–Z" },
];

const EventsListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const role = session.user.role;
  const scope = await getViewerScope(session.user.id, role);
  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const sort = getParam(searchParams, "sort") || "date:asc";
  const where: Prisma.EventWhereInput = {
    AND: [
      schoolWideClassFilter(scope, classId),
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };
  const orderBy =
    sort === "date:desc"
      ? { date: "desc" as const }
      : sort === "title:asc"
        ? { title: "asc" as const }
        : sort === "title:desc"
          ? { title: "desc" as const }
          : { date: "asc" as const };

  const [events, count, classes] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { class: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where }),
    prisma.schoolClass.findMany({
      where: scope.unrestricted ? { academicYear: { isCurrent: true } } : { id: { in: scope.classIds } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const data = events.map((event) => ({
    id: event.id,
    title: event.title,
    schoolClass: event.class?.name ?? "All classes",
    date: event.date.toISOString().slice(0, 10),
    startTime: event.startTime,
    endTime: event.endTime,
    description: event.description ?? "",
    classId: event.classId ?? "",
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Events</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter param="classId" label="Class" options={classes.map((item) => ({ value: item.id, label: item.name }))} />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="event" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Title", accessor: "title", sortKey: "title" },
          { header: "Class", accessor: "class", className: "hidden md:table-cell" },
          { header: "Date", accessor: "date", className: "hidden md:table-cell", sortKey: "date" },
          { header: "Start Time", accessor: "startDate", className: "hidden lg:table-cell" },
          { header: "End Time", accessor: "endDate", className: "hidden lg:table-cell" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4 font-semibold">{item.title}</td>
            <td className="hidden md:table-cell">{item.schoolClass}</td>
            <td className="hidden md:table-cell">{item.date}</td>
            <td className="hidden lg:table-cell">{item.startTime}</td>
            <td className="hidden lg:table-cell">{item.endTime}</td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="event" data={{ id: item.id, title: item.title, description: item.description, date: item.date, startTime: item.startTime, endTime: item.endTime, classId: item.classId }} />
                    <FormModal type="delete" table="event" id={item.id} />
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

export default EventsListPage;
