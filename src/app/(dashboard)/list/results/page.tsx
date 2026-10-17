import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "date:desc", label: "Date (newest)" },
  { value: "date:asc", label: "Date" },
  { value: "score:desc", label: "Score" },
];

const ResultsListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const role = session.user.role;
  const scope = await getViewerScope(session.user.id, role);
  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const classId = getParam(searchParams, "classId");
  const studentId = getParam(searchParams, "studentId");
  const sort = getParam(searchParams, "sort") || "date:desc";

  const classConstraint =
    classId && (scope.unrestricted || scope.classIds.includes(classId))
      ? classId
    : !scope.unrestricted && role === UserRole.TEACHER
      ? scope.classIds.length
        ? { in: scope.classIds }
        : "__none__"
        : classId
          ? "__none__"
          : undefined;

  const where: Prisma.ExamResultWhereInput = {
    ...(studentId
      ? { studentId }
      : !scope.unrestricted && role !== UserRole.TEACHER
        ? { studentId: { in: scope.studentIds } }
        : {}),
    ...(classConstraint ? { exam: { classId: classConstraint } } : {}),
    ...(q
      ? {
          OR: [
            { student: { user: { firstName: { contains: q, mode: "insensitive" } } } },
            { student: { user: { lastName: { contains: q, mode: "insensitive" } } } },
            { exam: { subject: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "score:desc"
      ? { score: "desc" as const }
      : sort === "score:asc"
        ? { score: "asc" as const }
        : sort === "date:asc"
          ? { exam: { date: "asc" as const } }
          : { exam: { date: "desc" as const } };

  const [results, count, classes] = await Promise.all([
    prisma.examResult.findMany({
      where,
      include: {
        exam: { include: { subject: true, class: true, teacher: { include: { user: true } } } },
        student: { include: { user: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.examResult.count({ where }),
    prisma.schoolClass.findMany({
      where: scope.unrestricted ? { academicYear: { isCurrent: true } } : { id: { in: scope.classIds } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const data = results.map((result) => ({
    id: result.id,
    subject: result.exam.subject.name,
    student: `${result.student.user.firstName} ${result.student.user.lastName}`,
    score: result.score,
    schoolClass: result.exam.class.name,
    teacher: `${result.exam.teacher.user.firstName} ${result.exam.teacher.user.lastName}`,
    date: result.exam.date.toISOString().slice(0, 10),
    examId: result.examId,
    studentId: result.studentId,
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">All Results</h1>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter param="classId" label="Class" options={classes.map((item) => ({ value: item.id, label: item.name }))} />
            <TableSort options={sorts} />
            {role === UserRole.ADMIN && <FormModal type="create" table="result" />}
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: "Subject Name", accessor: "subject" },
          { header: "Student", accessor: "student", className: "hidden md:table-cell" },
          { header: "Score", accessor: "score", className: "hidden md:table-cell", sortKey: "score" },
          { header: "Class", accessor: "class", className: "hidden lg:table-cell" },
          { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
          { header: "Date", accessor: "date", className: "hidden lg:table-cell", sortKey: "date" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "classId", "studentId"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4">
              <h3 className="font-semibold">{item.subject}</h3>
              <p className="text-xs text-gray-500 md:hidden">{item.student}</p>
            </td>
            <td className="hidden md:table-cell">{item.student}</td>
            <td className="hidden md:table-cell">{item.score}</td>
            <td className="hidden lg:table-cell">{item.schoolClass}</td>
            <td className="hidden lg:table-cell">{item.teacher}</td>
            <td className="hidden lg:table-cell">{item.date}</td>
            <td>
              <div className="flex gap-2 items-center">
                {role === UserRole.ADMIN && (
                  <>
                    <FormModal type="edit" table="result" data={{ id: item.id, examId: item.examId, studentId: item.studentId, score: item.score }} />
                    <FormModal type="delete" table="result" id={item.id} />
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

export default ResultsListPage;
