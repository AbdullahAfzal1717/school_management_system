import Announcements from "@/components/Announcements";
import AttendenceChart from "@/components/AttendenceChart";
import CountChart from "@/components/CountChart";
import EventCalender from "@/components/EventCalender";
import ScoresChart from "@/components/ScoresChart";
import UserCard from "@/components/UserCard";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import {
  getAttendanceSeries,
  getCurrentYearName,
  getGradeCounts,
  getLatestAnnouncements,
  getRoleCounts,
  getSubjectAverages,
  getUpcomingEvents,
} from "@/lib/dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AdminPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const scope = await getViewerScope(session.user.id, session.user.role);
  const [year, counts, grades, attendance, scores, events, announcements] =
    await Promise.all([
      getCurrentYearName(),
      getRoleCounts(),
      getGradeCounts(),
      getAttendanceSeries(),
      getSubjectAverages(),
      getUpcomingEvents(scope),
      getLatestAnnouncements(scope),
    ]);

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row">
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="students" count={counts.students} year={year} href="/list/students" />
          <UserCard type="teachers" count={counts.teachers} year={year} href="/list/teachers" />
          <UserCard type="parents" count={counts.parents} year={year} href="/list/parents" />
          <UserCard type="staff" count={counts.staff} year={year} />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-1/3">
            <CountChart grades={grades} />
          </div>
          <div className="h-80 w-full sm:h-[28rem] lg:w-2/3">
            <AttendenceChart data={attendance} />
          </div>
        </div>
        <div className="h-80 w-full sm:h-[28rem]">
          <ScoresChart data={scores} />
        </div>
      </div>
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalender events={events} />
        <Announcements items={announcements} />
      </div>
    </div>
  );
};

export default AdminPage;
