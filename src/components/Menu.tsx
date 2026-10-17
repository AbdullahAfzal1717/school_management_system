import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["ADMIN", "TEACHER"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["ADMIN", "TEACHER"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["ADMIN", "TEACHER"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["ADMIN"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["ADMIN", "TEACHER"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["ADMIN", "TEACHER"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "#",
        visible: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
    ],
  },
];

const Menu = async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "";
  return (
    <div className="mt-4 text-sm ">
      {menuItems.map((i) => (
        <div key={i.title} className="flex flex-col gap-2 ">
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {

            if(item.visible.includes(role)){
              if(item.label === "Logout"){
                return <LogoutButton key={item.label} />;
              }
              return(
                <Link
              href={item.href}
              key={item.label}
              className="flex justify-center items-center lg:justify-start gap-4 text-gray-500 py-2 rounded-md hover:bg-AbSkyLight focus-visible:bg-AbSkyLight focus-visible:outline-none md:px-2"
              >
              <Image src={item.icon} alt={item.label} width={20} height={20} />
              <span className="hidden lg:block">{item.label}</span>
            
            </Link>
            );
           }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
