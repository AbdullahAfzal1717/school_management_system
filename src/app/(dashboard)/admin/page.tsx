import Announcements from "@/components/Announcements";
import AttendenceChart from "@/components/AttendenceChart";
import CountChart from "@/components/CountChart";
import EventCalender from "@/components/EventCalender";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";

const AdminPage = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* Left */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* UserCards */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="students" />
          <UserCard type="teachers" />
          <UserCard type="parents" />
          <UserCard type="staffs" />
        </div>
        {/* Middle Charts */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Count Chart */}
          <div className="w-full lg:w-1/3 h-[450px]  ">
            <CountChart />
          </div>
          {/* Attendence Chart */}
          <div className="w-full lg:w-2/3 h-[450px] ">
            <AttendenceChart />
          </div>
        </div>
        {/* Bottom chart */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>
      {/* Right */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalender />
        <Announcements />
      </div>
    </div>
  );
};
export default AdminPage;
