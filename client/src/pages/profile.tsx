import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { ProfileForm } from "@/components/profile/profile-form";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">My Profile</h2>
          <p className="text-gray-500">Manage your personal information and details</p>
        </div>
        
        <ProfileForm userId={user.id} isEditable={true} />
      </div>
    </MainLayout>
  );
}
