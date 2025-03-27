import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Building2, Briefcase, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: faculties, isLoading: isLoadingFaculties } = useQuery({
    queryKey: ["/api/faculties"],
  });

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/groups"],
  });

  const isLoading = isLoadingUsers || isLoadingFaculties || isLoadingGroups;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Administrator Dashboard</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold">{users?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="font-medium">{users?.filter(u => u.role === 'student').length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Teachers</p>
                    <p className="font-medium">{users?.filter(u => u.role === 'teacher').length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Admins</p>
                    <p className="font-medium">{users?.filter(u => u.role === 'admin').length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Faculties</p>
                    <p className="text-2xl font-semibold">{faculties?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-md">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/admin/faculties">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Faculties
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Groups</p>
                    <p className="text-2xl font-semibold">{groups?.length || 0}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-md">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/admin/groups">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Groups
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/users">
                  <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/faculties">
                  <Button variant="outline" className="w-full">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Faculties
                  </Button>
                </Link>
                <Link href="/admin/groups">
                  <Button variant="outline" className="w-full">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Manage Groups
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Faculty/Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users?.slice(0, 5).map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.fullName || "-"}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">
                          {user.role}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {user.facultyId && user.groupId 
                            ? `${faculties?.find(f => f.id === user.facultyId)?.name || '-'} / 
                               ${groups?.find(g => g.id === user.groupId)?.name || '-'}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                    {!users?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <Link href="/admin/users">
                  <a className="text-primary text-sm font-medium hover:underline">
                    View all users
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
