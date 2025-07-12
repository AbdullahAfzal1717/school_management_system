import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import PerformanceChart from "@/components/PerformanceChart";
import Image from "next/image";
import Link from "next/link";

const SingleStudentPage = () => {
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
                src="https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            {/* TextSection */}
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <h1 className="text-xl font-semibold">Jane Doe</h1>
              <p className="text-sm text-gray-500">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Similique
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-medium">
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>A+</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>April 22</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>user+@gmail.com</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>123 4567 890</span>
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
                <h1 className="text-xl font-semibold"> 6th</h1>
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
                <h1 className="text-xl font-semibold"> 6A</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>
        {/* bottom */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student's Schedule</h1>
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
              Student's Lessons
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbPurpleLight">
              Student's Teachers
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbYellowLight">
              Student's Exams
            </Link>
            <Link href="/" className="p-3 rounded-md bg-pink-50">
              Student's Results
            </Link>
            <Link href="/" className="p-3 rounded-md bg-AbSkyLight">
              Student's Assignments
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
