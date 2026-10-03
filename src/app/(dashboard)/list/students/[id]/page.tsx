import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import PerformanceChart from "@/components/PerformanceChart";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const SingleStudentPage = async ({ params }: { params: { id: string } }) => {
  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      enrollments: {
        include: { schoolClass: true, academicYear: true },
        orderBy: { enrolledAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) {
    notFound();
  }

  const enrollment = student.enrollments[0];
  const fullName = `${student.user.firstName} ${student.user.lastName}`;

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
                src={student.photoUrl ?? "/avatar.png"}
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
                  table="student"
                  data={{
                    id: student.id,
                    email: student.user.email,
                    firstName: student.user.firstName,
                    lastName: student.user.lastName,
                    studentNumber: student.studentNumber,
                    phone: student.phone ?? "",
                    address: student.address ?? "",
                  }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Student number: {student.studentNumber}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-medium">
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/mail.png" alt="Email" width={14} height={14} />
                  <span>{student.user.email}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/phone.png" alt="Phone" width={14} height={14} />
                  <span>{student.phone ?? "No phone"}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image
                    src="/profile.png"
                    alt="Address"
                    width={14}
                    height={14}
                  />
                  <span>{student.address ?? "No address"}</span>
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
                <h1 className="text-xl font-semibold">
                  {enrollment?.schoolClass.grade ?? "-"}
                </h1>
                <span className="text-sm text-gray-400">Grade</span>
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
                <h1 className="text-xl font-semibold"> 16</h1>
                <span className="text-sm text-gray-400">Lessons</span>
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
                  {enrollment?.schoolClass.name ?? "Not enrolled"}
                </h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>
        {/* bottom */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
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
              Student&apos;s Lessons
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbPurpleLight">
              Student&apos;s Teachers
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbYellowLight">
              Student&apos;s Exams
            </Link>
            <Link href="/" className="p-3 rounded-md bg-pink-50">
              Student&apos;s Results
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbSkyLight">
              Student&apos;s Assignments
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

export default SingleStudentPage;
