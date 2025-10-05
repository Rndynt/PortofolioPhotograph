import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, PriceTier } from "@shared/schema";
import { insertCategorySchema, insertPriceTierSchema } from "@shared/schema";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

const categoryFormSchema = insertCategorySchema.extend({
  slug: z.string().min(1, "Slug is required"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const tierFormSchema = insertPriceTierSchema;
type TierFormData = z.infer<typeof tierFormSchema>;

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function AdminPricing() {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteTierId, setDeleteTierId] = useState<string | null>(null);
  const [selectedCategoryForTiers, setSelectedCategoryForTiers] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allTiers, isLoading: tiersLoading } = useQuery<PriceTier[]>({
    queryKey: ['/api/categories', selectedCategoryForTiers, 'tiers'],
    enabled: !!selectedCategoryForTiers,
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: null,
      basePrice: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  const tierForm = useForm<TierFormData>({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      price: 0,
      description: null,
      sessionCount: 1,
      sessionDuration: 2,
      isActive: true,
      sortOrder: 0,
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest('POST', '/api/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Category created successfully" });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await apiRequest('PATCH', `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Category updated successfully" });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/categories/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Category deleted successfully" });
      setDeleteCategoryId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  });

  const createTierMutation = useMutation({
    mutationFn: async (data: TierFormData) => {
      const response = await apiRequest('POST', '/api/tiers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Price tier created successfully" });
      setIsTierDialogOpen(false);
      tierForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create price tier", variant: "destructive" });
    }
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TierFormData> }) => {
      const response = await apiRequest('PATCH', `/api/tiers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Price tier updated successfully" });
      setIsTierDialogOpen(false);
      setEditingTier(null);
      tierForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update price tier", variant: "destructive" });
    }
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/tiers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Price tier deleted successfully" });
      setDeleteTierId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete price tier", variant: "destructive" });
    }
  });

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description,
      basePrice: category.basePrice,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditTier = (tier: PriceTier) => {
    setEditingTier(tier);
    tierForm.reset({
      categoryId: tier.categoryId,
      name: tier.name,
      price: tier.price,
      description: tier.description,
      sessionCount: tier.sessionCount,
      sessionDuration: tier.sessionDuration,
      isActive: tier.isActive,
      sortOrder: tier.sortOrder,
    });
    setIsTierDialogOpen(true);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const onTierSubmit = (data: TierFormData) => {
    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, data });
    } else {
      createTierMutation.mutate(data);
    }
  };

  return (
    <AdminLayout activeTab="pricing">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage photography package categories</CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCategory(null);
                    categoryForm.reset();
                  }} data-testid="button-create-category">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-32px)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                    <DialogDescription>
                      Fill out the form to {editingCategory ? "update" : "create"} a category
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Wedding Photography"
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (!editingCategory) {
                                    categoryForm.setValue("slug", generateSlug(e.target.value));
                                  }
                                }}
                                data-testid="input-category-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="wedding-photography" data-testid="input-category-slug" />
                            </FormControl>
                            <FormDescription>URL-friendly identifier</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} placeholder="Category description..." data-testid="input-category-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Price (IDR) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                placeholder="5000000" 
                                data-testid="input-category-base-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-category-sort-order"
                              />
                            </FormControl>
                            <FormDescription>Lower numbers appear first</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                              <FormDescription>
                                Show this category on the order page
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-category-is-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} data-testid="button-save-category">
                          {editingCategory ? "Update" : "Create"} Category
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsCategoryDialogOpen(false);
                          setEditingCategory(null);
                          categoryForm.reset();
                        }} data-testid="button-cancel-category">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.sort((a, b) => a.sortOrder - b.sortOrder).map((category) => (
                    <TableRow key={category.id} data-testid={`row-category-${category.slug}`}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{formatIDR(category.basePrice)}</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"} data-testid={`badge-category-status-${category.slug}`}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{category.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            data-testid={`button-edit-category-${category.slug}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteCategoryId(category.id)}
                            data-testid={`button-delete-category-${category.slug}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Price Tiers</CardTitle>
                <CardDescription>Manage pricing tiers for categories</CardDescription>
              </div>
              <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTier(null);
                    tierForm.reset();
                  }} data-testid="button-create-tier">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-32px)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTier ? "Edit Price Tier" : "Create New Price Tier"}</DialogTitle>
                    <DialogDescription>
                      Fill out the form to {editingTier ? "update" : "create"} a price tier
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...tierForm}>
                    <form onSubmit={tierForm.handleSubmit(onTierSubmit)} className="space-y-4">
                      <FormField
                        control={tierForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                              disabled={!categories || categories.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-tier-category">
                                  <SelectValue placeholder={!categories || categories.length === 0 ? "No categories available" : "Select category"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories && categories.length > 0 ? (
                                  categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">No categories available</div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Premium Package" data-testid="input-tier-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (IDR) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                placeholder="7500000" 
                                data-testid="input-tier-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="sessionCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Count *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                placeholder="1" 
                                min="1"
                                data-testid="input-tier-session-count"
                              />
                            </FormControl>
                            <FormDescription>Number of sessions included in this package</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="sessionDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Duration (hours) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                placeholder="2" 
                                min="1"
                                data-testid="input-tier-session-duration"
                              />
                            </FormControl>
                            <FormDescription>Duration of each session in hours</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} placeholder="Tier description..." data-testid="input-tier-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-tier-sort-order"
                              />
                            </FormControl>
                            <FormDescription>Lower numbers appear first</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                              <FormDescription>
                                Show this tier as an option
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-tier-is-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={createTierMutation.isPending || updateTierMutation.isPending} data-testid="button-save-tier">
                          {editingTier ? "Update" : "Create"} Tier
                        </Button>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsTierDialogOpen(false);
                          setEditingTier(null);
                          tierForm.reset();
                        }} data-testid="button-cancel-tier">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select 
                value={selectedCategoryForTiers || "none"} 
                onValueChange={(value) => setSelectedCategoryForTiers(value === "none" ? null : value)}
                disabled={!categories || categories.length === 0}
              >
                <SelectTrigger className="w-[280px]" data-testid="select-filter-tier-category">
                  <SelectValue placeholder={!categories || categories.length === 0 ? "No categories available" : "Select category to view tiers"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select category to view tiers</SelectItem>
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No categories available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedCategoryForTiers && (
              tiersLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : allTiers && allTiers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Duration/Session</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTiers.sort((a, b) => a.sortOrder - b.sortOrder).map((tier) => (
                      <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                        <TableCell className="font-medium">{tier.name}</TableCell>
                        <TableCell>{formatIDR(tier.price)}</TableCell>
                        <TableCell>{tier.sessionCount}x</TableCell>
                        <TableCell>{tier.sessionDuration}h</TableCell>
                        <TableCell>{tier.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={tier.isActive ? "default" : "secondary"} data-testid={`badge-tier-status-${tier.id}`}>
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{tier.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTier(tier)}
                              data-testid={`button-edit-tier-${tier.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTierId(tier.id)}
                              data-testid={`button-delete-tier-${tier.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">No tiers found for this category</p>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and all its associated tiers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-category">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryId && deleteCategoryMutation.mutate(deleteCategoryId)}
              data-testid="button-confirm-delete-category"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTierId} onOpenChange={() => setDeleteTierId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this price tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-tier">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTierId && deleteTierMutation.mutate(deleteTierId)}
              data-testid="button-confirm-delete-tier"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
