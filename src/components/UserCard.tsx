import Link from "next/link";

const UserCard = ({
  type,
  count,
  year,
  href,
}: {
  type: string;
  count: number;
  year: string;
  href?: string;
}) => {
  const body = (
    <>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          {year}
        </span>
      </div>
      <h1 className="text-2xl font-semibold my-4">{count.toLocaleString()}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">{type}</h2>
    </>
  );

  if (!href) {
    return (
      <div className="min-w-[7rem] flex-1 rounded-2xl p-4 odd:bg-AbPurple even:bg-AbYellow">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="min-w-[7rem] flex-1 rounded-2xl p-4 transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 odd:bg-AbPurple even:bg-AbYellow"
    >
      {body}
    </Link>
  );
};

export default UserCard;
