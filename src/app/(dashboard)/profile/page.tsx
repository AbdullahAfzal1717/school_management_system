import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ProfilePage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teacherProfile: {
        include: {
          teachingAssignments: { include: { subject: true, schoolClass: true } },
          supervisedClasses: true,
        },
      },
      studentProfile: {
        include: {
          enrollments: {
            where: { academicYear: { isCurrent: true } },
            include: { schoolClass: true, academicYear: true },
          },
        },
      },
      parentProfile: {
        include: {
          children: {
            include: {
              student: {
                include: {
                  user: true,
                  enrollments: {
                    where: { academicYear: { isCurrent: true } },
                    include: { schoolClass: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/sign-in");

  const subjects = Array.from(
    new Set(user.teacherProfile?.teachingAssignments.map((item) => item.subject.name) ?? []),
  );
  const classes = Array.from(
    new Set(user.teacherProfile?.teachingAssignments.map((item) => item.schoolClass.name) ?? []),
  );

  return (
    <div className="m-2 rounded-md bg-white p-4 sm:m-4 sm:p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>
        </div>
        <Link href="/settings" className="btn shrink-0 bg-AbSky px-4 py-2 text-sm font-medium">
          Edit profile
        </Link>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-gray-400">Role</dt>
          <dd className="font-medium capitalize">{user.role.toLowerCase()}</dd>
        </div>
        {user.teacherProfile && (
          <>
            <div>
              <dt className="text-xs text-gray-400">Employee ID</dt>
              <dd className="font-medium">{user.teacherProfile.employeeId}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Phone</dt>
              <dd className="font-medium">{user.teacherProfile.phone ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Address</dt>
              <dd className="font-medium">{user.teacherProfile.address ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Subjects</dt>
              <dd className="font-medium">{subjects.join(", ") || "None"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Classes</dt>
              <dd className="font-medium">{classes.join(", ") || "None"}</dd>
            </div>
          </>
        )}
        {user.studentProfile && (
          <>
            <div>
              <dt className="text-xs text-gray-400">Student number</dt>
              <dd className="font-medium">{user.studentProfile.studentNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Class</dt>
              <dd className="font-medium">
                {user.studentProfile.enrollments[0]?.schoolClass.name ?? "Not enrolled"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Phone</dt>
              <dd className="font-medium">{user.studentProfile.phone ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Address</dt>
              <dd className="font-medium">{user.studentProfile.address ?? "Not set"}</dd>
            </div>
          </>
        )}
        {user.parentProfile && (
          <>
            <div>
              <dt className="text-xs text-gray-400">Phone</dt>
              <dd className="font-medium">{user.parentProfile.phone ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Address</dt>
              <dd className="font-medium">{user.parentProfile.address ?? "Not set"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-400">Children</dt>
              <dd className="font-medium">
                {user.parentProfile.children.length === 0
                  ? "None linked"
                  : user.parentProfile.children
                      .map((child) => {
                        const name = `${child.student.user.firstName} ${child.student.user.lastName}`;
                        const className =
                          child.student.enrollments[0]?.schoolClass.name ?? "Not enrolled";
                        return `${name} (${className})`;
                      })
                      .join(", ")}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
};

export default ProfilePage;
