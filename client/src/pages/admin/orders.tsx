import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, Payment, Category, PriceTier } from "@shared/schema";
import AdminLayout from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone, Calendar, DollarSign, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";

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
          <h4 className="font-semibold text-sm" data-testid={`text-customer-${order.id}`}>{order.customerName}</h4>
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

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState("");
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

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/orders', selectedOrder?.id, 'payments'],
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
        <div>
          <h2 className="text-3xl font-bold">Orders Kanban</h2>
          <p className="text-gray-600 mt-1">Drag and drop orders to update their status</p>
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
                    <h3 className="font-semibold mb-3">Payment History</h3>
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
