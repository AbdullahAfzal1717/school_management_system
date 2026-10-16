import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import PerformanceChart from "@/components/PerformanceChart";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const SingleTeacherPage = async ({ params }: { params: { id: string } }) => {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      teachingAssignments: {
        include: { subject: true, schoolClass: true },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const subjects = Array.from(
    new Set(teacher.teachingAssignments.map((a) => a.subject.name)),
  );
  const classes = Array.from(
    new Set(teacher.teachingAssignments.map((a) => a.schoolClass.name)),
  );

  return (
    <div className="flex flex-col xl:flex-row gap-4 p-4 flex-1">
      {/* Left */}
      <div className="w-full xl:w-2/3">
        {/* Top */}
        <div className="flex flex-col xl:flex-row gap-4">
          {/* UserInfoCard */}
          <div className="bg-AbSky py-6 px-4 rounded-md flex-1 flex gap-4">
            {/* Image Section */}
            <div className="w-1/3">
              <Image
                src={teacher.photoUrl ?? "/avatar.png"}
                alt={fullName}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            {/* TextSection */}
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{fullName}</h1>
                <FormModal
                  type="edit"
                  table="teacher"
                  data={{
                    id: teacher.id,
                    email: teacher.user.email,
                    firstName: teacher.user.firstName,
                    lastName: teacher.user.lastName,
                    employeeId: teacher.employeeId,
                    phone: teacher.phone ?? "",
                    address: teacher.address ?? "",
                  }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Employee ID: {teacher.employeeId}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-medium">
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/mail.png" alt="Email" width={14} height={14} />
                  <span>{teacher.user.email}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/phone.png" alt="Phone" width={14} height={14} />
                  <span>{teacher.phone ?? "No phone"}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image
                    src="/profile.png"
                    alt="Address"
                    width={14}
                    height={14}
                  />
                  <span>{teacher.address ?? "No address"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Small Cards */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* Card */}
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold"> 90%</h1>
                <span className="text-sm text-gray-400">Attendence</span>
              </div>
            </div>
            {/* Card */}
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{classes.length}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
            {/* Card */}
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{subjects.length}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
            </div>
            {/* Card */}
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {teacher.teachingAssignments.length}
                </h1>
                <span className="text-sm text-gray-400">Assignments</span>
              </div>
            </div>
          </div>
        </div>
        {/* bottom */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendar />
        </div>
      </div>
      {/* Right */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Shortcuts */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link href="/" className="p-3 rounded-md bg-AbSkyLight">
              Teacher&apos;s Classes
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbPurpleLight">
              Teacher&apos;s Students
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbYellowLight">
              Teacher&apos;s Lessons
            </Link>
            <Link href="/" className="p-3 rounded-md bg-pink-50">
              Teacher&apos;s Exams
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbSkyLight">
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>
        {/* Performance Chart */}
        <PerformanceChart />

        {/* Announcements */}
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
