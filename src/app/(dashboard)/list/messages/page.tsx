import FormModal from "@/components/FormModal";
import MarkReadButton from "@/components/MarkReadButton";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableFilter from "@/components/TableFilter";
import TableSearch from "@/components/TableSearch";
import TableSort from "@/components/TableSort";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { PAGE_SIZE, SearchParams, getPage, getParam, getQuery, preservedParams } from "@/lib/list";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "date:desc", label: "Newest" },
  { value: "date:asc", label: "Oldest" },
];

const MessagesListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const role = session.user.role;
  const userId = session.user.id;
  const page = getPage(searchParams);
  const q = getQuery(searchParams);
  const box = getParam(searchParams, "box") === "sent" ? "sent" : "inbox";
  const read = getParam(searchParams, "read");
  const sort = getParam(searchParams, "sort") || "date:desc";
  const where: Prisma.MessageWhereInput = {
    ...(box === "sent" ? { senderId: userId } : { receiverId: userId }),
    ...(read === "unread" ? { read: false } : read === "read" ? { read: true } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy = { sentAt: sort === "date:asc" ? ("asc" as const) : ("desc" as const) };

  const [messages, count] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: true, receiver: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.message.count({ where }),
  ]);

  const data = messages.map((message) => ({
    id: message.id,
    subject: message.subject,
    body: message.body,
    sender: `${message.sender.firstName} ${message.sender.lastName}`,
    receiver: `${message.receiver.firstName} ${message.receiver.lastName}`,
    receiverId: message.receiverId,
    date: message.sentAt.toISOString().slice(0, 16).replace("T", " "),
    read: message.read,
    canEdit: role === UserRole.ADMIN || message.senderId === userId,
  }));

  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/list/messages?box=inbox"
            className={`btn px-3 py-1 text-sm ${box === "inbox" ? "bg-AbSky" : "bg-slate-100"}`}
          >
            Inbox
          </Link>
          <Link
            href="/list/messages?box=sent"
            className={`btn px-3 py-1 text-sm ${box === "sent" ? "bg-AbSky" : "bg-slate-100"}`}
          >
            Sent
          </Link>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch />
          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:gap-4">
            <TableFilter
              param="read"
              label="Status"
              options={[
                { value: "unread", label: "Unread" },
                { value: "read", label: "Read" },
              ]}
            />
            <TableSort options={sorts} />
            <FormModal type="create" table="message" />
          </div>
        </div>
      </div>
      <Table
        columns={[
          { header: box === "sent" ? "To" : "From", accessor: "person" },
          { header: "Subject", accessor: "subject" },
          { header: "Date", accessor: "date", className: "hidden md:table-cell", sortKey: "date" },
          { header: "Status", accessor: "status" },
          { header: "Actions", accessor: "action" },
        ]}
        sort={sort}
        preserved={preservedParams(searchParams, ["q", "box", "read"])}
        data={data}
        renderRow={(item) => (
          <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 hover:bg-AbPurpleLight text-sm">
            <td className="p-4 font-semibold">{box === "sent" ? item.receiver : item.sender}</td>
            <td>
              <p className="font-medium">{item.subject}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{item.body}</p>
            </td>
            <td className="hidden md:table-cell">{item.date}</td>
            <td>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.read ? "bg-slate-100 text-slate-600" : "bg-AbPurple text-gray-700"}`}>
                {item.read ? "Read" : "Unread"}
              </span>
            </td>
            <td>
              <div className="flex gap-2 items-center">
                {box === "inbox" && !item.read && <MarkReadButton id={item.id} />}
                {item.canEdit && (
                  <FormModal
                    type="edit"
                    table="message"
                    data={{ id: item.id, receiverId: item.receiverId, subject: item.subject, body: item.body }}
                  />
                )}
                <FormModal type="delete" table="message" id={item.id} />
              </div>
            </td>
          </tr>
        )}
      />
      <Pagination page={page} count={count} />
    </div>
  );
};

export default MessagesListPage;
