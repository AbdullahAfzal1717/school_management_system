import SettingsForms from "@/components/SettingsForms";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SettingsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teacherProfile: true,
      studentProfile: true,
      parentProfile: true,
    },
  });

  if (!user) redirect("/sign-in");

  const profile = user.teacherProfile ?? user.studentProfile ?? user.parentProfile;

  return (
    <div className="m-2 sm:m-4">
      <h1 className="mb-4 text-lg font-semibold">Settings</h1>
      <SettingsForms
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          phone: profile?.phone ?? "",
          address: profile?.address ?? "",
        }}
      />
    </div>
  );
};

export default SettingsPage;
