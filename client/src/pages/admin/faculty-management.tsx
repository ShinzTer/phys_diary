import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, Edit, Trash2, MoreHorizontal, Building2 } from "lucide-react";

// Faculty form schema
const facultyFormSchema = z.object({
  name: z.string().min(1, "Faculty name is required"),
  description: z.string().optional(),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface Faculty {
  facultyId: number;
  name: string;
  description?: string;
}

export default function FacultyManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  
  // Fetch all faculties
  const { data: faculties = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  // Create faculty mutation
  const createFacultyMutation = useMutation({
    mutationFn: async (data: FacultyFormValues) => {
      await apiRequest("POST", "/api/faculties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Faculty created",
        description: "The faculty has been successfully created."
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create faculty",
        variant: "destructive"
      });
    }
  });

  // Update faculty mutation
  const updateFacultyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FacultyFormValues }) => {
      await apiRequest("PUT", `/api/faculties/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Faculty updated",
        description: "The faculty has been successfully updated."
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update faculty",
        variant: "destructive"
      });
    }
  });

  // Delete faculty mutation
  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/faculties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      toast({
        title: "Faculty deleted",
        description: "The faculty has been successfully deleted."
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete faculty",
        variant: "destructive"
      });
    }
  });

  // Create faculty form
  const createForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  // Edit faculty form
  const editForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  function onCreateSubmit(data: FacultyFormValues) {
    createFacultyMutation.mutate(data);
  }

  function onEditSubmit(data: FacultyFormValues) {
    if (selectedFaculty) {
      updateFacultyMutation.mutate({ id: selectedFaculty.facultyId, data });
    }
  }

  function handleEditFaculty(faculty: Faculty) {
    setSelectedFaculty(faculty);
    editForm.reset({
      name: faculty.name,
      description: faculty.description || "",
    });
    setIsEditDialogOpen(true);
  }

  function handleDeleteFaculty(faculty: Faculty) {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (selectedFaculty) {
      deleteFacultyMutation.mutate(selectedFaculty.facultyId);
    }
  }

  // Filter faculties based on search term
  const filteredFaculties = faculties.filter((faculty: Faculty) => 
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (faculty.description && faculty.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Faculty Management</h2>
            <p className="text-gray-500">Create, view, edit, and manage faculties</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search faculties..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Faculty
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Faculties</CardTitle>
            <CardDescription>
              Manage faculties in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {(!filteredFaculties || filteredFaculties.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No faculties found matching your search criteria.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Faculty
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredFaculties.map((faculty: Faculty) => (
                          <tr key={faculty.facultyId}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {faculty.facultyId}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-primary mr-2" />
                                {faculty.name}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-xs truncate">
                                {faculty.description || "-"}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleEditFaculty(faculty)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFaculty(faculty)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Faculty Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Faculty</DialogTitle>
              <DialogDescription>
                Add a new faculty to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter faculty name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter faculty description" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the faculty (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFacultyMutation.isPending}>
                    {createFacultyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Faculty'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Faculty Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Faculty</DialogTitle>
              <DialogDescription>
                Update faculty information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter faculty name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter faculty description" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the faculty (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateFacultyMutation.isPending}>
                    {updateFacultyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Faculty'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Faculty Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the faculty{' '}
                <span className="font-semibold">{selectedFaculty?.name}</span>.
                This action cannot be undone, and may affect students and groups associated with this faculty.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteFacultyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Faculty'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
