import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Teacher = {
  id: string;
  teacherId: string;
  name: string;
  email?: string;
  photo: string;
  phone: string;
  subjects: string[];
  classes: string[];
  address: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Classes",
    accessor: "classes",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  {
    header: "Action",
    accessor: "action",
  },
];

const TeacherListPage = async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "";

  const teacherProfiles = await prisma.teacherProfile.findMany({
    include: {
      user: true,
      teachingAssignments: {
        include: { subject: true, schoolClass: true },
      },
    },
    orderBy: { employeeId: "asc" },
  });

  const teachers: Teacher[] = teacherProfiles.map((profile) => {
    const subjects = Array.from(
      new Set(profile.teachingAssignments.map((a) => a.subject.name)),
    );
    const classes = Array.from(
      new Set(profile.teachingAssignments.map((a) => a.schoolClass.name)),
    );

    return {
      id: profile.id,
      teacherId: profile.employeeId,
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      email: profile.user.email,
      photo: profile.photoUrl ?? "/avatar.png",
      phone: profile.phone ?? "",
      subjects,
      classes,
      address: profile.address ?? "",
    };
  });

  const renderRow = (item: Teacher) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.teacherId}</td>
      <td className="hidden md:table-cell">{item.subjects.join(",")}</td>
      <td className="hidden md:table-cell">{item.classes.join(",")}</td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">{item.address}</td>
      <td>
        <div className="flex gap-2 items-center">
          <Link
            href={`/list/teachers/${item.id}`}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-AbSky"
          >
            <Image src="/view.png" alt="View teacher" width={16} height={16} />
          </Link>
          {role && role === "ADMIN" && (
            <FormModal table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="rounded-md p-4 flex-1 m-4 mt-0 bg-white">
      {/* Top */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex  items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-AbYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role && role === "ADMIN" && (
              <FormModal table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* Table */}
      <Table columns={columns} renderRow={renderRow} data={teachers} />
      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default TeacherListPage;
