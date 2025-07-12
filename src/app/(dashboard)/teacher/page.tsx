import Announcements from "@/components/Announcements"
import BigCalendar from "@/components/BigCalendar"

const TeacherPage = () => {
    return(

        <div className=" flex-1 flex flex-col xl:flex-row gap-4 p-4">
      {/* Left */}
      <div className="w-full xl:w-2/3 ">
        <div className="h-full bg-white rounded-md p-4">
          <h1 className="text-xl font-semibold">Schedule (4A)</h1>
          <BigCalendar />
        </div>
      </div>
      {/* Right */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8 ">
        <Announcements />
      </div>
    </div>
    )
}
export default TeacherPage