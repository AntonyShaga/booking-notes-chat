import { withServerSession } from "@/lib/auth/withServerSession";
import { getUserFields } from "@/lib/getUserFields";

export default async function Home() {
  const user = await withServerSession((userId) => getUserFields(userId, { isActive: true }));
  const isActive = user?.isActive;
  return (
    <main className="flex flex-col gap-2 container mx-auto justify-center items-center">
      {isActive ? (
        <div>Welcome to your personal account!</div>
      ) : (
        <div>
          <h1>Welcome!</h1>
          <p>
            This is where public content will be. Please log in to access additional features and
            your personal account.
          </p>
        </div>
      )}
    </main>
  );
}
