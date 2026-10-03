import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, dashboardForRole } from "@/lib/auth";

const Homepage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    redirect("/sign-in");
  }

  redirect(dashboardForRole[session.user.role]);
};

export default Homepage;
