"use client";

import { markMessageRead } from "@/app/actions/message";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MarkReadButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="btn bg-AbSky px-3 py-1 text-xs font-medium"
      onClick={async () => {
        setPending(true);
        await markMessageRead(id);
        router.refresh();
        setPending(false);
      }}
    >
      {pending ? "Saving..." : "Mark read"}
    </button>
  );
};

export default MarkReadButton;
