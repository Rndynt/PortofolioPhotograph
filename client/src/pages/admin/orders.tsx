import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, Payment, Category, PriceTier, Session, Photographer, SessionAssignment, Project, InsertSession } from "@shared/schema";
import { insertSessionSchema } from "@shared/schema";
import AdminLayout from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone, Calendar, DollarSign, Copy, CheckCircle2, Clock, XCircle, Plus, Pencil, Trash2, UserPlus } from "lucide-react";

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-gray-100 text-gray-800" },
  { value: "CONSULTATION", label: "Consultation", color: "bg-blue-100 text-blue-800" },
  { value: "SESSION", label: "Session", color: "bg-purple-100 text-purple-800" },
  { value: "FINISHING", label: "Finishing", color: "bg-yellow-100 text-yellow-800" },
  { value: "DRIVE_LINK", label: "Drive Link", color: "bg-orange-100 text-orange-800" },
  { value: "DONE", label: "Done", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

interface OrderWithDetails extends Order {
  categoryName?: string;
  tierName?: string;
}

interface SessionWithDetails extends Session {
  assignments?: SessionAssignment[];
  photographers?: Photographer[];
}

interface OrderCardProps {
  order: OrderWithDetails;
  onClick: () => void;
}

function OrderCard({ order, onClick }: OrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">No Payment</Badge>;
    
    switch (status) {
      case "settlement":
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "expire":
      case "cancel":
      case "deny":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const channelBadge = order.channel === "OFFLINE" ? (
    <Badge variant="outline" className="text-xs">Offline</Badge>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
      data-testid={`order-card-${order.id}`}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-sm" data-testid={`text-customer-${order.id}`}>{order.customerName}</h4>
            {channelBadge}
          </div>
          {getPaymentStatusBadge(order.paymentStatus)}
        </div>
        <p className="text-xs text-gray-600" data-testid={`text-email-${order.id}`}>{order.email}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <DollarSign className="h-3 w-3" />
          <span data-testid={`text-dp-${order.id}`}>{formatIDR(order.dpAmount)}</span>
        </div>
        <div className="text-xs">
          <span className="font-medium">{order.categoryName}</span>
          {order.tierName && <span className="text-gray-500"> • {order.tierName}</span>}
        </div>
        <p className="text-xs text-gray-400">
          {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}

const sessionFormSchema = insertSessionSchema.extend({
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  projectId: z.string().min(1, "Project ID is required"),
});

type SessionFormData = z.infer<typeof sessionFormSchema>;

const offlineOrderSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  priceTierId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  notes: z.string().optional(),
  paymentProvider: z.enum(["cash", "bank_transfer"]),
  source: z.string().optional(),
});

type OfflineOrderFormData = z.infer<typeof offlineOrderSchema>;

const manualPaymentSchema = z.object({
  provider: z.enum(["cash", "bank_transfer", "midtrans"]),
  status: z.enum(["pending", "settlement", "deny", "expire", "cancel"]),
  grossAmount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["DOWN_PAYMENT", "FULL_PAYMENT"]),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isOfflineOrderOpen, setIsOfflineOrderOpen] = useState(false);
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: priceTiers } = useQuery<PriceTier[]>({
    queryKey: ['/api/price-tiers'],
  });

  const { data: photographers } = useQuery<Photographer[]>({
    queryKey: ['/api/photographers'],
    enabled: !!selectedOrder,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/orders', selectedOrder?.id, 'payments'],
    enabled: !!selectedOrder,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ['/api/projects', 'by-order', selectedOrder?.id],
    enabled: !!selectedOrder?.id,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
    select: (allSessions) => allSessions.filter(s => s.orderId === selectedOrder?.id),
    enabled: !!selectedOrder,
  });

  const ordersWithDetails: OrderWithDetails[] = (orders || []).map(order => {
    const category = categories?.find(c => c.id === order.categoryId);
    return {
      ...order,
      categoryName: category?.name,
      tierName: order.priceTierId ? "Custom Tier" : undefined,
    };
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    }
  });

  const updateDriveLinkMutation = useMutation({
    mutationFn: async ({ id, driveLink }: { id: string; driveLink: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${id}`, { driveLink });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Drive link updated successfully" });
      setDriveLink("");
    },
    onError: () => {
      toast({ title: "Failed to update drive link", variant: "destructive" });
    }
  });

  const createOfflineOrderMutation = useMutation({
    mutationFn: async (data: OfflineOrderFormData) => {
      const response = await apiRequest('POST', '/api/orders', {
        ...data,
        channel: 'OFFLINE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Offline order created successfully" });
      setIsOfflineOrderOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create offline order", variant: "destructive" });
    }
  });

  const createManualPaymentMutation = useMutation({
    mutationFn: async (data: ManualPaymentFormData) => {
      if (!selectedOrder) throw new Error("No order selected");
      const response = await apiRequest('POST', `/api/orders/${selectedOrder.id}/payments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrder?.id, 'payments'] });
      toast({ title: "Manual payment added successfully" });
      setIsManualPaymentOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add manual payment", variant: "destructive" });
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const response = await apiRequest('POST', '/api/sessions', {
        ...data,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session created successfully" });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
    onError: () => {
      toast({ title: "Failed to create session", variant: "destructive" });
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SessionFormData> }) => {
      const response = await apiRequest('PATCH', `/api/sessions/${id}`, {
        ...data,
        startAt: data.startAt ? new Date(data.startAt).toISOString() : undefined,
        endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session updated successfully" });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
    onError: () => {
      toast({ title: "Failed to update session", variant: "destructive" });
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/sessions/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete session", variant: "destructive" });
    }
  });

  const assignPhotographerMutation = useMutation({
    mutationFn: async ({ sessionId, photographerId }: { sessionId: string; photographerId: string }) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/assign`, { photographerId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/session-assignments'] });
      toast({ title: "Photographer assigned successfully" });
    },
    onError: (error: any) => {
      const message = error.message || "";
      if (message.includes("409") || message.includes("busy")) {
        toast({ 
          title: "Photographer is busy", 
          description: "This photographer has another session at this time",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to assign photographer", variant: "destructive" });
      }
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const orderId = active.id as string;
      const newStatus = over.id as string;
      
      updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
    }
    
    setActiveId(null);
  };

  const handleMoveToNextStage = () => {
    if (!selectedOrder) return;
    
    const currentIndex = ORDER_STATUSES.findIndex(s => s.value === selectedOrder.status);
    if (currentIndex < ORDER_STATUSES.length - 2) {
      const nextStatus = ORDER_STATUSES[currentIndex + 1].value;
      updateOrderStatusMutation.mutate({ id: selectedOrder.id, status: nextStatus });
    }
  };

  const handleUpdateDriveLink = () => {
    if (!selectedOrder || !driveLink) return;
    updateDriveLinkMutation.mutate({ id: selectedOrder.id, driveLink });
  };

  const handleCopyLink = () => {
    if (!selectedOrder) return;
    const orderLink = `${window.location.origin}/order?id=${selectedOrder.id}`;
    navigator.clipboard.writeText(orderLink);
    toast({ title: "Order link copied to clipboard" });
  };

  const activeOrder = ordersWithDetails.find(o => o.id === activeId);

  if (ordersLoading) {
    return (
      <AdminLayout activeTab="orders">
        <div className="grid grid-cols-7 gap-4">
          {ORDER_STATUSES.map((status) => (
            <div key={status.value}>
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Orders Kanban</h2>
            <p className="text-gray-600 mt-1">Drag and drop orders to update their status</p>
          </div>
          <Dialog open={isOfflineOrderOpen} onOpenChange={setIsOfflineOrderOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-offline-order">
                <Plus className="h-4 w-4 mr-2" />
                Create Offline Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Offline Order</DialogTitle>
                <DialogDescription>
                  Create a new order for walk-in or phone customers
                </DialogDescription>
              </DialogHeader>
              <OfflineOrderForm
                categories={categories || []}
                priceTiers={priceTiers || []}
                onSubmit={(data) => createOfflineOrderMutation.mutate(data)}
                isPending={createOfflineOrderMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {ORDER_STATUSES.map((status) => {
              const statusOrders = ordersWithDetails.filter(o => o.status === status.value);
              
              return (
                <SortableContext
                  key={status.value}
                  id={status.value}
                  items={statusOrders.map(o => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Card className="min-h-[400px]" data-testid={`column-${status.value}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>{status.label}</span>
                        <Badge variant="secondary" className="ml-2">{statusOrders.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {statusOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onClick={() => {
                            setSelectedOrder(order);
                            setDriveLink(order.driveLink || "");
                          }}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activeOrder && (
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary opacity-90">
                <OrderCard order={activeOrder} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto" data-testid="sheet-order-details">
            {selectedOrder && (
              <>
                <SheetHeader>
                  <SheetTitle>Order Details</SheetTitle>
                  <SheetDescription>
                    Order ID: {selectedOrder.id}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Name:</span>
                        <span data-testid="text-detail-customer">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a href={`mailto:${selectedOrder.email}`} className="text-blue-600 hover:underline" data-testid="link-email">
                          {selectedOrder.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${selectedOrder.phone}`} className="text-blue-600 hover:underline" data-testid="link-phone">
                          {selectedOrder.phone}
                        </a>
                      </div>
                      <div>
                        <span className="font-medium">Channel:</span>
                        <Badge variant="outline" className="ml-2">{selectedOrder.channel}</Badge>
                      </div>
                      {selectedOrder.source && (
                        <div>
                          <span className="font-medium">Source:</span>
                          <span className="ml-2">{selectedOrder.source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Package Details</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Category:</span>
                        <span className="ml-2" data-testid="text-detail-category">{selectedOrder.categoryName}</span>
                      </div>
                      {selectedOrder.tierName && (
                        <div>
                          <span className="font-medium">Tier:</span>
                          <span className="ml-2" data-testid="text-detail-tier">{selectedOrder.tierName}</span>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 text-sm text-gray-600" data-testid="text-detail-notes">{selectedOrder.notes}</p>
                        </div>
                      )}
                      {project && (
                        <div>
                          <span className="font-medium">Linked Project:</span>
                          <Badge variant="secondary" className="ml-2">
                            {project.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Pricing Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Price:</span>
                        <span className="font-semibold" data-testid="text-detail-total">{formatIDR(selectedOrder.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Down Payment ({selectedOrder.dpPercent}%):</span>
                        <span className="font-semibold text-green-600" data-testid="text-detail-dp">{formatIDR(selectedOrder.dpAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Remaining:</span>
                        <span data-testid="text-detail-remaining">{formatIDR(selectedOrder.totalPrice - selectedOrder.dpAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Payment History</h3>
                      <Dialog open={isManualPaymentOpen} onOpenChange={setIsManualPaymentOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" data-testid="button-add-manual-payment">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Manual Payment</DialogTitle>
                            <DialogDescription>
                              Record a manual payment for this order
                            </DialogDescription>
                          </DialogHeader>
                          <ManualPaymentForm
                            orderId={selectedOrder.id}
                            onSubmit={(data) => createManualPaymentMutation.mutate(data)}
                            isPending={createManualPaymentMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    {paymentsLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : payments && payments.length > 0 ? (
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div key={payment.id} className="p-3 bg-gray-50 rounded-lg" data-testid={`payment-${payment.id}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {payment.status === "settlement" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                {payment.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
                                {(payment.status === "deny" || payment.status === "expire" || payment.status === "cancel") && <XCircle className="h-4 w-4 text-red-600" />}
                                <span className="text-sm font-medium">{formatIDR(payment.grossAmount)}</span>
                                <Badge variant="outline" className="text-xs">{payment.provider}</Badge>
                              </div>
                              <Badge variant={payment.status === "settlement" ? "default" : "secondary"}>
                                {payment.status}
                              </Badge>
                            </div>
                            {payment.paidAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(payment.paidAt).toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No payment records yet</p>
                    )}
                  </div>

                  {project && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Schedule & Sessions</h3>
                        <Dialog open={isSessionDialogOpen} onOpenChange={(open) => {
                          setIsSessionDialogOpen(open);
                          if (!open) setEditingSession(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" data-testid="button-create-session">
                              <Plus className="h-3 w-3 mr-1" />
                              New Session
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingSession ? "Edit Session" : "Create Session"}</DialogTitle>
                              <DialogDescription>
                                Schedule a photo session for this order
                              </DialogDescription>
                            </DialogHeader>
                            <SessionForm
                              projectId={project.id}
                              orderId={selectedOrder.id}
                              defaultValues={editingSession ? {
                                startAt: new Date(editingSession.startAt).toISOString().slice(0, 16),
                                endAt: new Date(editingSession.endAt).toISOString().slice(0, 16),
                                location: editingSession.location || "",
                                notes: editingSession.notes || "",
                                status: editingSession.status,
                              } : undefined}
                              onSubmit={(data) => {
                                if (editingSession) {
                                  updateSessionMutation.mutate({ id: editingSession.id, data });
                                } else {
                                  createSessionMutation.mutate(data);
                                }
                              }}
                              isPending={createSessionMutation.isPending || updateSessionMutation.isPending}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      {sessionsLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : sessions.length > 0 ? (
                        <div className="space-y-2">
                          {sessions.map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              photographers={photographers || []}
                              onEdit={(s) => {
                                setEditingSession(s);
                                setIsSessionDialogOpen(true);
                              }}
                              onDelete={(id) => deleteSessionMutation.mutate(id)}
                              onAssignPhotographer={(photographerId) => 
                                assignPhotographerMutation.mutate({ sessionId: session.id, photographerId })
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No sessions scheduled yet</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Order Status</h3>
                    <Badge className={ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.color}>
                      {ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.label}
                    </Badge>
                  </div>

                  {selectedOrder.status === "DRIVE_LINK" && (
                    <div>
                      <h3 className="font-semibold mb-3">Drive Link</h3>
                      <div className="space-y-2">
                        <Input
                          placeholder="https://drive.google.com/..."
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                          data-testid="input-drive-link"
                        />
                        <Button
                          onClick={handleUpdateDriveLink}
                          disabled={!driveLink || updateDriveLinkMutation.isPending}
                          className="w-full"
                          data-testid="button-update-drive-link"
                        >
                          Update Drive Link
                        </Button>
                      </div>
                      {selectedOrder.driveLink && (
                        <p className="text-sm text-gray-600 mt-2">
                          Current: <a href={selectedOrder.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedOrder.driveLink}</a>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t">
                    {selectedOrder.status !== "DONE" && selectedOrder.status !== "CANCELLED" && (
                      <Button
                        onClick={handleMoveToNextStage}
                        disabled={updateOrderStatusMutation.isPending}
                        className="w-full"
                        data-testid="button-next-stage"
                      >
                        Move to Next Stage
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="w-full"
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Order Link
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}

function SessionCard({ 
  session, 
  photographers, 
  onEdit, 
  onDelete, 
  onAssignPhotographer 
}: { 
  session: Session; 
  photographers: Photographer[]; 
  onEdit: (session: Session) => void; 
  onDelete: (id: string) => void; 
  onAssignPhotographer: (photographerId: string) => void;
}) {
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");

  const { data: assignments = [] } = useQuery<SessionAssignment[]>({
    queryKey: ['/api/sessions', session.id, 'assignments'],
  });

  const assignedPhotographers = photographers.filter(p => 
    assignments.some(a => a.photographerId === p.id)
  );

  const activePhotographers = photographers.filter(p => p.isActive);

  return (
    <div className="p-3 bg-gray-50 rounded-lg" data-testid={`session-${session.id}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {new Date(session.startAt).toLocaleString('id-ID', { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </span>
            <Badge variant={session.status === "DONE" ? "default" : "secondary"} className="text-xs">
              {session.status}
            </Badge>
          </div>
          {session.location && (
            <p className="text-xs text-gray-600 mt-1">📍 {session.location}</p>
          )}
          {session.notes && (
            <p className="text-xs text-gray-600 mt-1">{session.notes}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(session)} data-testid={`button-edit-session-${session.id}`}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(session.id)} data-testid={`button-delete-session-${session.id}`}>
            <Trash2 className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <div className="text-xs font-medium text-gray-700">Assigned Photographers:</div>
        {assignedPhotographers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {assignedPhotographers.map(p => (
              <Badge key={p.id} variant="outline" className="text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No photographers assigned</p>
        )}
        
        <div className="flex gap-2">
          <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
            <SelectTrigger className="h-8 text-xs" data-testid={`select-photographer-${session.id}`}>
              <SelectValue placeholder="Select photographer" />
            </SelectTrigger>
            <SelectContent>
              {activePhotographers.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={() => {
              if (selectedPhotographer) {
                onAssignPhotographer(selectedPhotographer);
                setSelectedPhotographer("");
              }
            }}
            disabled={!selectedPhotographer}
            data-testid={`button-assign-photographer-${session.id}`}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionForm({ 
  projectId, 
  orderId,
  defaultValues, 
  onSubmit, 
  isPending 
}: { 
  projectId: string; 
  orderId: string;
  defaultValues?: Partial<SessionFormData>; 
  onSubmit: (data: SessionFormData) => void; 
  isPending: boolean;
}) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      projectId,
      orderId,
      startAt: defaultValues?.startAt || "",
      endAt: defaultValues?.endAt || "",
      location: defaultValues?.location || "",
      notes: defaultValues?.notes || "",
      status: defaultValues?.status || "PLANNED",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="startAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} data-testid="input-session-start" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} data-testid="input-session-end" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="Venue or address" data-testid="input-session-location" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Any special instructions" data-testid="textarea-session-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-session-status">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-session">
          {isPending ? "Saving..." : "Save Session"}
        </Button>
      </form>
    </Form>
  );
}

function OfflineOrderForm({ 
  categories, 
  priceTiers, 
  onSubmit, 
  isPending 
}: { 
  categories: Category[]; 
  priceTiers: PriceTier[];
  onSubmit: (data: OfflineOrderFormData) => void; 
  isPending: boolean;
}) {
  const form = useForm<OfflineOrderFormData>({
    resolver: zodResolver(offlineOrderSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      notes: "",
      paymentProvider: "cash",
      source: "",
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const filteredTiers = priceTiers.filter(t => t.categoryId === selectedCategoryId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-offline-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {filteredTiers.length > 0 && (
          <FormField
            control={form.control}
            name="priceTierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Tier (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-offline-tier">
                      <SelectValue placeholder="Select tier or use base price" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTiers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} - {formatIDR(t.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John Doe" data-testid="input-offline-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="john@example.com" data-testid="input-offline-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+62 812 3456 7890" data-testid="input-offline-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-offline-payment">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="walk_in, whatsapp, instagram, etc." data-testid="input-offline-source" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Special requests" data-testid="textarea-offline-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full" data-testid="button-submit-offline-order">
          {isPending ? "Creating..." : "Create Offline Order"}
        </Button>
      </form>
    </Form>
  );
}

function ManualPaymentForm({ 
  orderId, 
  onSubmit, 
  isPending 
}: { 
  orderId: string; 
  onSubmit: (data: ManualPaymentFormData) => void; 
  isPending: boolean;
}) {
  const form = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      provider: "cash",
      status: "settlement",
      type: "DOWN_PAYMENT",
      grossAmount: "" as any,
      paidAt: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Provider</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-provider">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="midtrans">Midtrans</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="settlement">Settlement</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deny">Deny</SelectItem>
                  <SelectItem value="expire">Expire</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DOWN_PAYMENT">Down Payment</SelectItem>
                  <SelectItem value="FULL_PAYMENT">Full Payment</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grossAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (IDR)</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number" 
                  placeholder="500000"
                  data-testid="input-payment-amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid At (optional)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="datetime-local" 
                  value={field.value || ""}
                  data-testid="input-payment-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Payment details or reference" data-testid="textarea-payment-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full" data-testid="button-submit-payment">
          {isPending ? "Adding..." : "Add Payment"}
        </Button>
      </form>
    </Form>
  );
}
