import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, UserCheck, Award, Calendar, Flag, Home, School, Users, Heart, BookOpen, Activity } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
  });

  const { data: tests } = useQuery({
    queryKey: [`/api/tests/${user?.id}`],
  });

  const { data: samples } = useQuery({
    queryKey: [`/api/samples/${user?.id}`],
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">User Profile</h2>
            <p className="text-gray-500">View and manage your personal information</p>
          </div>
          <Link href="/profile/edit">
            <Button className="mt-4 md:mt-0">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-center mb-4">
                <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : user?.username?.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <CardTitle className="text-center text-xl">{profile?.fullName || user?.username}</CardTitle>
              <CardDescription className="text-center capitalize">{user?.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Medical Group</p>
                    <p className="font-medium capitalize">{profile?.medicalGroup || "Not specified"}</p>
                  </div>
                </div>
                
                {profile?.dateOfBirth && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{format(new Date(profile.dateOfBirth), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{tests?.length || 0}</p>
                    <p className="text-xs text-gray-500">Tests</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{samples?.length || 0}</p>
                    <p className="text-xs text-gray-500">Samples</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="sports">Sports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Basic Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <UserCheck className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">{profile?.fullName || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Date of Birth</p>
                            <p className="font-medium">
                              {profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'MMMM d, yyyy') : "Not specified"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Flag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="font-medium">{profile?.gender || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Location Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <Flag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Place of Birth</p>
                            <p className="font-medium">{profile?.placeOfBirth || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium">{profile?.address || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Flag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Nationality</p>
                            <p className="font-medium">{profile?.nationality || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="education">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <School className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Previous School</p>
                        <p className="font-medium">{profile?.previousSchool || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Faculty</p>
                        <p className="font-medium">{profile?.facultyId ? `Faculty ID: ${profile.facultyId}` : "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Group</p>
                        <p className="font-medium">{profile?.groupId ? `Group ID: ${profile.groupId}` : "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Educational Department</p>
                        <p className="font-medium">{profile?.educationalDepartment || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="medical">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Medical Group</p>
                        <p className="font-medium capitalize">{profile?.medicalGroup || "Not specified"}</p>
                      </div>
                    </div>
                    
                    {profile?.medicalGroup && profile.medicalGroup !== "basic" && (
                      <div className="flex items-start">
                        <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Diagnosis</p>
                          <p className="font-medium">{profile?.diagnosis || "Not specified"}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Previous Illnesses</p>
                        <p className="font-medium">{profile?.previousIllnesses || "None reported"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sports">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Currently Engaged In</p>
                        <p className="font-medium">{profile?.currentSports || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Previously Engaged In</p>
                        <p className="font-medium">{profile?.previousSports || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Activity className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Additional Information</p>
                        <p className="font-medium">{profile?.additionalInfo || "None provided"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
