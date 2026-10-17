import Link from "next/link";

type Column = {
  header: string;
  accessor: string;
  className?: string;
  sortKey?: string;
};

const Table = <T extends { id: string | number }>({
  columns,
  renderRow,
  data,
  sort,
  preserved,
}: {
  columns: Column[];
  renderRow: (item: T) => React.ReactNode;
  data: T[];
  sort?: string;
  preserved?: Record<string, string>;
}) => {
  const [activeKey, activeDir] = (sort ?? "").split(":");

  const sortHref = (sortKey: string) => {
    const nextDir = activeKey === sortKey && activeDir !== "desc" ? "desc" : "asc";
    const params = new URLSearchParams();
    Object.entries(preserved ?? {}).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set("sort", `${sortKey}:${nextDir}`);
    return `?${params.toString()}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full mt-4">
        <thead>
          <tr className="text-sm text-gray-500 text-left">
            {columns.map((col) => (
              <th key={col.accessor} className={col.className}>
                {col.sortKey ? (
                  <Link
                    href={sortHref(col.sortKey)}
                    className="inline-flex items-center gap-1 rounded-sm hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    aria-label={`Sort by ${col.header}`}
                  >
                    {col.header}
                    {activeKey === col.sortKey ? (activeDir === "desc" ? " ↓" : " ↑") : ""}
                  </Link>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="p-8 text-center text-sm text-gray-400"
              >
                No records found
              </td>
            </tr>
          ) : (
            data.map((item) => renderRow(item))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
