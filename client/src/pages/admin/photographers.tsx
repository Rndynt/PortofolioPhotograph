import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Photographer } from "@shared/schema";
import { insertPhotographerSchema } from "@shared/schema";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

const photographerFormSchema = insertPhotographerSchema.extend({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(1, "Contact is required"),
});

type PhotographerFormData = z.infer<typeof photographerFormSchema>;

export default function AdminPhotographers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhotographer, setEditingPhotographer] = useState<Photographer | null>(null);
  const [deletePhotographerId, setDeletePhotographerId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: photographers, isLoading: photographersLoading } = useQuery<Photographer[]>({
    queryKey: ['/api/photographers'],
  });

  const form = useForm<PhotographerFormData>({
    resolver: zodResolver(photographerFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      isActive: true,
    },
  });

  const createPhotographerMutation = useMutation({
    mutationFn: async (data: PhotographerFormData) => {
      const response = await apiRequest('POST', '/api/photographers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photographers'] });
      toast({ title: "Photographer created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create photographer", variant: "destructive" });
    }
  });

  const updatePhotographerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PhotographerFormData> }) => {
      const response = await apiRequest('PATCH', `/api/photographers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photographers'] });
      toast({ title: "Photographer updated successfully" });
      setIsDialogOpen(false);
      setEditingPhotographer(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update photographer", variant: "destructive" });
    }
  });

  const deletePhotographerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/photographers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photographers'] });
      toast({ title: "Photographer deleted successfully" });
      setDeletePhotographerId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete photographer", variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/photographers/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photographers'] });
      toast({ title: "Photographer status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  const handleEdit = (photographer: Photographer) => {
    setEditingPhotographer(photographer);
    form.reset({
      name: photographer.name,
      contact: photographer.contact || "",
      isActive: photographer.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPhotographer(null);
    form.reset();
  };

  const onSubmit = (data: PhotographerFormData) => {
    if (editingPhotographer) {
      updatePhotographerMutation.mutate({ id: editingPhotographer.id, data });
    } else {
      createPhotographerMutation.mutate(data);
    }
  };

  return (
    <AdminLayout activeTab="photographers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Photographers</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPhotographer(null);
                form.reset();
              }} data-testid="button-create-photographer">
                <Plus className="h-4 w-4 mr-2" />
                Create Photographer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPhotographer ? "Edit Photographer" : "Create New Photographer"}</DialogTitle>
                <DialogDescription>
                  Fill out the form to {editingPhotographer ? "update" : "create"} a photographer
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Photographer Name"
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Phone or Email"
                            data-testid="input-contact"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Make this photographer available for assignments
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createPhotographerMutation.isPending || updatePhotographerMutation.isPending}
                      data-testid="button-save-photographer"
                    >
                      {editingPhotographer ? "Update" : "Create"} Photographer
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

        {photographersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {photographers?.map((photographer) => (
                <TableRow key={photographer.id} data-testid={`row-photographer-${photographer.id}`}>
                  <TableCell className="font-medium" data-testid={`text-name-${photographer.id}`}>
                    {photographer.name}
                  </TableCell>
                  <TableCell data-testid={`text-contact-${photographer.id}`}>
                    {photographer.contact || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={photographer.isActive}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: photographer.id, isActive: checked })
                      }
                      disabled={toggleActiveMutation.isPending}
                      data-testid={`switch-active-${photographer.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(photographer)}
                        data-testid={`button-edit-photographer-${photographer.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePhotographerId(photographer.id)}
                        data-testid={`button-delete-photographer-${photographer.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {photographers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No photographers found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <AlertDialog open={!!deletePhotographerId} onOpenChange={() => setDeletePhotographerId(null)}>
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the photographer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePhotographerId && deletePhotographerMutation.mutate(deletePhotographerId)}
                disabled={deletePhotographerMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
