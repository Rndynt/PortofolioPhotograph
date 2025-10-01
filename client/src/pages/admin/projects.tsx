import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, ProjectImage, Category } from "@shared/schema";
import { insertProjectSchema, insertProjectImageSchema } from "@shared/schema";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from "lucide-react";

const projectFormSchema = insertProjectSchema.extend({
  slug: z.string().min(1, "Slug is required"),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminProjects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const { toast } = useToast();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      categoryId: null,
      clientName: null,
      happenedAt: null,
      mainImageUrl: "",
      isPublished: false,
      driveLink: null,
    },
  });

  const titleValue = form.watch("title");

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || project.categoryId === categoryFilter;
    
    const matchesPublished = publishedFilter === "all" ||
      (publishedFilter === "published" && project.isPublished) ||
      (publishedFilter === "unpublished" && !project.isPublished);
    
    return matchesSearch && matchesCategory && matchesPublished;
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project created successfully" });
      setIsDialogOpen(false);
      form.reset();
      setProjectImages([]);
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectFormData> }) => {
      const response = await apiRequest('PATCH', `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project updated successfully" });
      setIsDialogOpen(false);
      setEditingProject(null);
      form.reset();
      setProjectImages([]);
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/projects/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project deleted successfully" });
      setDeleteProjectId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const response = await apiRequest('PATCH', `/api/projects/${id}`, { isPublished });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Project status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  const addImageMutation = useMutation({
    mutationFn: async ({ projectId, url, caption }: { projectId: string; url: string; caption: string }) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/images`, {
        url,
        caption: caption || null,
        sortOrder: projectImages.length,
      });
      return response.json();
    },
    onSuccess: (newImage) => {
      setProjectImages([...projectImages, newImage]);
      setNewImageUrl("");
      setNewImageCaption("");
      toast({ title: "Image added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to add image", variant: "destructive" });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiRequest('DELETE', `/api/project-images/${imageId}`, undefined);
    },
    onSuccess: (_, imageId) => {
      setProjectImages(projectImages.filter(img => img.id !== imageId));
      toast({ title: "Image deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete image", variant: "destructive" });
    }
  });

  const handleEdit = async (project: Project) => {
    setEditingProject(project);
    form.reset({
      title: project.title,
      slug: project.slug,
      categoryId: project.categoryId,
      clientName: project.clientName,
      happenedAt: project.happenedAt,
      mainImageUrl: project.mainImageUrl,
      isPublished: project.isPublished,
      driveLink: project.driveLink,
    });

    const imagesResponse = await fetch(`/api/projects/${project.id}/images`);
    if (imagesResponse.ok) {
      const images = await imagesResponse.json();
      setProjectImages(images);
    }

    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
    form.reset();
    setProjectImages([]);
    setNewImageUrl("");
    setNewImageCaption("");
  };

  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl || !editingProject) return;
    if (projectImages.length >= 7) {
      toast({ title: "Maximum 7 images allowed", variant: "destructive" });
      return;
    }
    addImageMutation.mutate({
      projectId: editingProject.id,
      url: newImageUrl,
      caption: newImageCaption,
    });
  };

  return (
    <AdminLayout activeTab="projects">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Projects</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingProject(null);
                form.reset();
                setProjectImages([]);
              }} data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
                <DialogDescription>
                  Fill out the form to {editingProject ? "update" : "create"} a project
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Project Title"
                            onChange={(e) => {
                              field.onChange(e);
                              if (!editingProject) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                            data-testid="input-project-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="project-slug" data-testid="input-project-slug" />
                        </FormControl>
                        <FormDescription>URL-friendly version of title</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Client Name" data-testid="input-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="happenedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                            data-testid="input-happened-at"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mainImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Image URL *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" data-testid="input-main-image-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driveLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drive Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://drive.google.com/..." data-testid="input-drive-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Published</FormLabel>
                          <FormDescription>
                            Make this project visible on the public site
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {editingProject && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4">
                        Project Images ({projectImages.length}/7)
                      </h3>
                      <div className="space-y-2 mb-4">
                        {projectImages.map((image, index) => (
                          <div key={image.id} className="flex items-center gap-2 p-2 border rounded" data-testid={`image-row-${index}`}>
                            <img src={image.url} alt={image.caption || ""} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{image.caption || "No caption"}</p>
                              <p className="text-xs text-gray-500">Order: {image.sortOrder}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteImageMutation.mutate(image.id)}
                              disabled={deleteImageMutation.isPending}
                              data-testid={`button-delete-image-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {projectImages.length < 7 && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Image URL"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            data-testid="input-new-image-url"
                          />
                          <Input
                            placeholder="Caption (optional)"
                            value={newImageCaption}
                            onChange={(e) => setNewImageCaption(e.target.value)}
                            data-testid="input-new-image-caption"
                          />
                          <Button
                            type="button"
                            onClick={handleAddImage}
                            disabled={!newImageUrl || addImageMutation.isPending}
                            data-testid="button-add-image"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Image
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createProjectMutation.isPending || updateProjectMutation.isPending} data-testid="button-save-project">
                      {editingProject ? "Update" : "Create"} Project
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDialogClose} data-testid="button-cancel">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-projects"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-published">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {projectsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects?.map((project) => {
                const category = categories?.find(c => c.id === project.categoryId);
                return (
                  <TableRow key={project.id} data-testid={`row-project-${project.slug}`}>
                    <TableCell>
                      <img src={project.mainImageUrl} alt={project.title} className="w-16 h-16 object-cover rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{category?.name || "-"}</TableCell>
                    <TableCell>{project.clientName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={project.isPublished ? "default" : "secondary"} data-testid={`badge-status-${project.slug}`}>
                        {project.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePublishMutation.mutate({ 
                            id: project.id, 
                            isPublished: !project.isPublished 
                          })}
                          disabled={togglePublishMutation.isPending}
                          data-testid={`button-toggle-publish-${project.slug}`}
                        >
                          {project.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          data-testid={`button-edit-${project.slug}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteProjectId(project.id)}
                          data-testid={`button-delete-${project.slug}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project and all its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && deleteProjectMutation.mutate(deleteProjectId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
