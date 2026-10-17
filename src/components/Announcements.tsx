import Link from "next/link";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  date: string;
};

const backgrounds = ["bg-AbSkyLight", "bg-AbPurpleLight", "bg-AbYellowLight"];

const Announcements = ({ items }: { items: AnnouncementItem[] }) => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <Link
          href="/list/announcements"
          className="text-xs text-gray-400 rounded-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          View All
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No announcements yet.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-md ${backgrounds[index % backgrounds.length]}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="break-words font-medium">{item.title}</h2>
                <span className="shrink-0 rounded-md bg-white px-1 py-1 text-xs text-gray-400">
                  {item.date}
                </span>
              </div>
              <p className="mt-1 break-words text-sm text-gray-400">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
