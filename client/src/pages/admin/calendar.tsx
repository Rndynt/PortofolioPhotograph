import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Session, Photographer, SessionAssignment, Project, Order } from "@shared/schema";
import { insertSessionSchema } from "@shared/schema";
import AdminLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Plus, Edit, Trash2, UserPlus, X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";

interface SessionWithDetails extends Session {
  photographers?: Photographer[];
  project?: Project;
  order?: Order | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const createSessionFormSchema = insertSessionSchema.extend({
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  projectId: z.string().min(1, "Project is required"),
  orderId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"]).default("PLANNED"),
});

function getWeekDates(date: Date): Date[] {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(current);
    d.setDate(diff + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function getSessionPosition(session: Session, dayStart: Date): { top: number; height: number } {
  const sessionStart = new Date(session.startAt);
  const sessionEnd = new Date(session.endAt);
  
  const startHour = sessionStart.getHours() + sessionStart.getMinutes() / 60;
  const endHour = sessionEnd.getHours() + sessionEnd.getMinutes() / 60;
  
  const hourHeight = 60;
  const top = startHour * hourHeight;
  const height = (endHour - startHour) * hourHeight;
  
  return { top, height: Math.max(height, 30) };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "PLANNED":
      return "bg-blue-500";
    case "CONFIRMED":
      return "bg-green-500";
    case "DONE":
      return "bg-gray-500";
    case "CANCELLED":
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
}

function isSessionStartingSoon(session: Session): boolean {
  const now = new Date();
  const sessionStart = new Date(session.startAt);
  const diffMinutes = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
  return diffMinutes > 0 && diffMinutes <= 15;
}

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [photographerFilter, setPhotographerFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [helperTipDismissed, setHelperTipDismissed] = useState(() => {
    return localStorage.getItem('calendar-helper-dismissed') === 'true';
  });
  const { toast } = useToast();

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
  });

  const { data: photographers = [] } = useQuery<Photographer[]>({
    queryKey: ['/api/photographers'],
  });

  const { data: allAssignments = [] } = useQuery<SessionAssignment[]>({
    queryKey: ['/api/session-assignments'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/sessions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session updated successfully" });
      setEditMode(false);
      setSheetOpen(false);
    },
    onError: (error: any) => {
      const message = error.message || "";
      if (message.includes("409") || message.includes("conflict") || message.includes("busy")) {
        toast({ 
          title: "Scheduling conflict", 
          description: "A photographer has another session at this time",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to update session", variant: "destructive" });
      }
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session deleted successfully" });
      setDeleteDialogOpen(false);
      setSheetOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to delete session", variant: "destructive" });
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSessionFormSchema>) => {
      const response = await apiRequest('POST', '/api/sessions', {
        projectId: data.projectId,
        orderId: data.orderId || null,
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location || null,
        notes: data.notes || null,
        status: data.status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session created successfully" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      const message = error.message || "";
      if (message.includes("409") || message.includes("conflict")) {
        toast({ 
          title: "Scheduling conflict", 
          description: "There is a conflict with another session at this time",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to create session", variant: "destructive" });
      }
    }
  });

  const assignPhotographerMutation = useMutation({
    mutationFn: async ({ sessionId, photographerId }: { sessionId: string; photographerId: string }) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/assign`, {
        photographerId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/session-assignments'] });
      toast({ title: "Photographer assigned successfully" });
    },
    onError: (error: any) => {
      const message = error.message || "";
      if (message.includes("409") || message.includes("conflict") || message.includes("busy")) {
        toast({ 
          title: "Photographer busy for this time range",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to assign photographer", variant: "destructive" });
      }
    }
  });

  const unassignPhotographerMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await apiRequest('DELETE', `/api/session-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/session-assignments'] });
      toast({ title: "Photographer unassigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unassign photographer", variant: "destructive" });
    }
  });

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedTimeSlot({ date, hour });
    setDialogOpen(true);
  };

  const handleSessionClick = (session: SessionWithDetails) => {
    setSelectedSession(session);
    setSheetOpen(true);
    setEditMode(false);
  };

  const handleDismissHelperTip = () => {
    localStorage.setItem('calendar-helper-dismissed', 'true');
    setHelperTipDismissed(true);
  };

  const sessionsWithPhotographers: SessionWithDetails[] = useMemo(() => {
    return sessions.map(session => {
      const sessionAssignments = allAssignments.filter(a => a.sessionId === session.id);
      const sessionPhotographers = photographers.filter(p => 
        sessionAssignments.some(a => a.photographerId === p.id)
      );
      const project = projects.find(p => p.id === session.projectId);
      const order = session.orderId ? orders.find(o => o.id === session.orderId) : null;
      
      return {
        ...session,
        photographers: sessionPhotographers,
        project,
        order,
      };
    });
  }, [sessions, allAssignments, photographers, projects, orders]);

  const filteredSessions = useMemo(() => {
    if (photographerFilter === "all") return sessionsWithPhotographers;
    return sessionsWithPhotographers.filter(s => 
      s.photographers?.some(p => p.id === photographerFilter)
    );
  }, [sessionsWithPhotographers, photographerFilter]);

  const weekSessions = useMemo(() => {
    const weekStart = weekDates[0];
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);
    
    return filteredSessions.filter(session => {
      const sessionDate = new Date(session.startAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  }, [filteredSessions, weekDates]);

  const sessionsByDay = useMemo(() => {
    const byDay: Record<string, SessionWithDetails[]> = {};
    
    weekDates.forEach(date => {
      const key = date.toISOString().split('T')[0];
      byDay[key] = weekSessions.filter(session => 
        isSameDay(new Date(session.startAt), date)
      );
    });
    
    return byDay;
  }, [weekSessions, weekDates]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const CreateSessionDialog = () => {
    const form = useForm<z.infer<typeof createSessionFormSchema>>({
      resolver: zodResolver(createSessionFormSchema),
      defaultValues: {
        projectId: "",
        orderId: null,
        startAt: "",
        endAt: "",
        location: "",
        notes: "",
        status: "PLANNED",
      },
    });

    useMemo(() => {
      if (selectedTimeSlot && dialogOpen) {
        const startDateTime = new Date(selectedTimeSlot.date);
        startDateTime.setHours(selectedTimeSlot.hour, 0, 0, 0);
        
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 2);

        form.reset({
          projectId: "",
          orderId: null,
          startAt: startDateTime.toISOString().slice(0, 16),
          endAt: endDateTime.toISOString().slice(0, 16),
          location: "",
          notes: "",
          status: "PLANNED",
        });
      }
    }, [selectedTimeSlot, dialogOpen]);

    const selectedProject = projects.find(p => p.id === form.watch("projectId"));
    
    useMemo(() => {
      if (selectedProject?.orderId) {
        form.setValue("orderId", selectedProject.orderId);
      }
    }, [selectedProject]);

    const onSubmit = (data: z.infer<typeof createSessionFormSchema>) => {
      createSessionMutation.mutate(data);
    };

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-session">
          <DialogHeader>
            <DialogTitle>Create Session</DialogTitle>
            <DialogDescription>
              Schedule a new photography session. All times are in your local timezone.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value || null)} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-order">
                          <SelectValue placeholder="Select an order (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {orders.map(order => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.customerName} - {order.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date/Time *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-start-time"
                        />
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
                      <FormLabel>End Date/Time *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Studio A, Client Office" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-location"
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes..." 
                        {...field} 
                        value={field.value || ""}
                        className="min-h-20"
                        data-testid="input-notes"
                      />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
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

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSessionMutation.isPending}
                  data-testid="button-create-session"
                >
                  {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  const SessionDetailsSheet = () => {
    const [selectedPhotographer, setSelectedPhotographer] = useState<string>("");
    
    const editForm = useForm<z.infer<typeof createSessionFormSchema>>({
      resolver: zodResolver(createSessionFormSchema),
      defaultValues: {
        projectId: selectedSession?.projectId || "",
        orderId: selectedSession?.orderId || null,
        startAt: selectedSession ? new Date(selectedSession.startAt).toISOString().slice(0, 16) : "",
        endAt: selectedSession ? new Date(selectedSession.endAt).toISOString().slice(0, 16) : "",
        location: selectedSession?.location || "",
        notes: selectedSession?.notes || "",
        status: selectedSession?.status || "PLANNED",
      },
    });

    useEffect(() => {
      if (selectedSession && editMode) {
        editForm.reset({
          projectId: selectedSession.projectId,
          orderId: selectedSession.orderId || null,
          startAt: new Date(selectedSession.startAt).toISOString().slice(0, 16),
          endAt: new Date(selectedSession.endAt).toISOString().slice(0, 16),
          location: selectedSession.location || "",
          notes: selectedSession.notes || "",
          status: selectedSession.status,
        });
      }
    }, [selectedSession, editMode]);

    const onEditSubmit = (data: z.infer<typeof createSessionFormSchema>) => {
      if (!selectedSession) return;
      
      updateSessionMutation.mutate({
        id: selectedSession.id,
        data: {
          projectId: data.projectId,
          orderId: data.orderId || null,
          startAt: data.startAt,
          endAt: data.endAt,
          location: data.location || null,
          notes: data.notes || null,
          status: data.status,
        }
      });
    };

    const handleAssignPhotographer = () => {
      if (!selectedSession || !selectedPhotographer) return;
      
      assignPhotographerMutation.mutate({
        sessionId: selectedSession.id,
        photographerId: selectedPhotographer,
      });
      setSelectedPhotographer("");
    };

    const handleUnassignPhotographer = (photographerId: string) => {
      if (!selectedSession) return;
      
      const assignment = allAssignments.find(
        a => a.sessionId === selectedSession.id && a.photographerId === photographerId
      );
      
      if (assignment) {
        unassignPhotographerMutation.mutate(assignment.id);
      }
    };

    if (!selectedSession) return null;

    const assignedPhotographerIds = selectedSession.photographers?.map(p => p.id) || [];
    const availablePhotographers = photographers.filter(
      p => p.isActive && !assignedPhotographerIds.includes(p.id)
    );

    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[540px] overflow-y-auto" data-testid="sheet-session-details">
          <SheetHeader>
            <SheetTitle>{editMode ? "Edit Session" : "Session Details"}</SheetTitle>
            <SheetDescription>
              {editMode ? "Update session information" : "View and manage session details"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {!editMode ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Project</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold" data-testid="text-project-title">
                      {selectedSession.project?.title || "Unknown Project"}
                    </p>
                    <Link href={`/admin/projects/${selectedSession.projectId}`}>
                      <Button variant="ghost" size="sm" data-testid="link-project">
                        View Project <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {selectedSession.order && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Order</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-base" data-testid="text-order-customer">
                        {selectedSession.order.customerName}
                      </p>
                      <Link href={`/admin/orders`}>
                        <Button variant="ghost" size="sm" data-testid="link-order">
                          View Order <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h3>
                  <p className="text-base" data-testid="text-session-time">
                    {new Date(selectedSession.startAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })} - {new Date(selectedSession.endAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  <Badge 
                    className={`${getStatusColor(selectedSession.status)} text-white`}
                    data-testid="badge-session-status"
                  >
                    {selectedSession.status}
                  </Badge>
                </div>

                {selectedSession.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                    <p className="text-base" data-testid="text-session-location">
                      {selectedSession.location}
                    </p>
                  </div>
                )}

                {selectedSession.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <p className="text-base whitespace-pre-wrap" data-testid="text-session-notes">
                      {selectedSession.notes}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Assigned Photographers</h3>
                  <div className="space-y-2 mb-4">
                    {selectedSession.photographers && selectedSession.photographers.length > 0 ? (
                      selectedSession.photographers.map(photographer => (
                        <div 
                          key={photographer.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          data-testid={`photographer-${photographer.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(photographer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{photographer.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignPhotographer(photographer.id)}
                            data-testid={`button-unassign-${photographer.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500" data-testid="text-no-photographers">
                        No photographers assigned yet
                      </p>
                    )}
                  </div>

                  {availablePhotographers.length > 0 && (
                    <div className="flex gap-2">
                      <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
                        <SelectTrigger className="flex-1" data-testid="select-assign-photographer">
                          <SelectValue placeholder="Select photographer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePhotographers.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignPhotographer}
                        disabled={!selectedPhotographer || assignPhotographerMutation.isPending}
                        data-testid="button-assign-photographer"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditMode(true)}
                    data-testid="button-edit-session"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-session"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-project">
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value || null)} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-order">
                              <SelectValue placeholder="Select an order (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {orders.map(order => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.customerName} - {order.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="startAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date/Time *</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              data-testid="input-edit-start-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="endAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date/Time *</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              data-testid="input-edit-end-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Studio A, Client Office" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-edit-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes..." 
                            {...field} 
                            value={field.value || ""}
                            className="min-h-20"
                            data-testid="input-edit-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-status">
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

                  <SheetFooter className="gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditMode(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateSessionMutation.isPending}
                      data-testid="button-save-session"
                    >
                      {updateSessionMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  if (sessionsLoading) {
    return (
      <AdminLayout activeTab="calendar">
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowLinePosition = currentHour * 60;

  return (
    <AdminLayout activeTab="calendar">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Session Calendar</h2>
            <p className="text-gray-600 mt-1">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={photographerFilter} onValueChange={setPhotographerFilter}>
              <SelectTrigger className="w-48" data-testid="select-photographer-filter">
                <SelectValue placeholder="All Photographers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Photographers</SelectItem>
                {photographers.filter(p => p.isActive).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={goToPreviousWeek} data-testid="button-prev-week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday} data-testid="button-today">
              Today
            </Button>
            <Button variant="outline" onClick={goToNextWeek} data-testid="button-next-week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {sessions.length === 0 && !helperTipDismissed && (
          <Card className="border-blue-200 bg-blue-50" data-testid="card-helper-tip">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Get Started with Your Calendar</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-blue-800 ml-7">
                    <li>• Click any time slot to create a session</li>
                    <li>• Click on a session to view details and assign photographers</li>
                    <li>• Sessions starting soon will pulse to grab your attention</li>
                    <li>• Use the photographer filter to view specific schedules</li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissHelperTip}
                  data-testid="button-dismiss-helper"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="flex border-b">
              <div className="w-16 flex-shrink-0 border-r"></div>
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, today);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div 
                    key={i} 
                    className={`flex-1 p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : ''}`}
                    data-testid={`day-header-${i}`}
                  >
                    <div className="font-semibold text-sm">{DAYS_OF_WEEK[i]}</div>
                    <div className={`text-lg ${isToday ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex">
              <div className="w-16 flex-shrink-0 border-r bg-gray-50">
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="h-[60px] border-b text-xs text-gray-500 px-2 py-1 text-right"
                  >
                    {hour}:00
                  </div>
                ))}
              </div>

              {weekDates.map((date, dayIndex) => {
                const key = date.toISOString().split('T')[0];
                const daySessions = sessionsByDay[key] || [];
                const isToday = isSameDay(date, today);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`flex-1 relative border-r last:border-r-0 ${isToday ? 'bg-blue-50/30' : isWeekend ? 'bg-gray-50/50' : ''}`}
                    data-testid={`day-column-${dayIndex}`}
                  >
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="h-[60px] border-b cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={() => handleTimeSlotClick(date, hour)}
                        data-testid={`timeslot-${dayIndex}-${hour}`}
                      />
                    ))}
                    
                    {isToday && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ top: `${nowLinePosition}px` }}
                        data-testid="now-line"
                      >
                        <div className="absolute left-0 w-2 h-2 bg-red-500 rounded-full -top-[3px] -left-1"></div>
                      </div>
                    )}
                    
                    {daySessions.map(session => {
                      const position = getSessionPosition(session, date);
                      const statusColor = getStatusColor(session.status);
                      const startingSoon = isSessionStartingSoon(session);
                      
                      return (
                        <div
                          key={session.id}
                          className={`absolute left-1 right-1 ${statusColor} text-white rounded p-2 text-xs cursor-pointer hover:opacity-90 transition-all overflow-hidden pointer-events-auto ${startingSoon ? 'animate-pulse' : ''}`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                          data-testid={`session-${session.id}`}
                        >
                          <div className="font-semibold truncate">
                            {new Date(session.startAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </div>
                          {session.location && (
                            <div className="text-xs opacity-90 truncate">📍 {session.location}</div>
                          )}
                          {session.photographers && session.photographers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {session.photographers.map(p => (
                                <div 
                                  key={p.id} 
                                  className="flex items-center gap-1 bg-white/20 rounded px-1.5 py-0.5"
                                >
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px] bg-white/30">
                                      {getInitials(p.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px]">{p.name.split(' ')[0]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{weekSessions.length}</div>
                <div className="text-sm text-gray-600">Sessions This Week</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {weekSessions.filter(s => s.status === "PLANNED").length}
                </div>
                <div className="text-sm text-gray-600">Planned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {weekSessions.filter(s => s.status === "CONFIRMED").length}
                </div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {weekSessions.filter(s => s.status === "DONE").length}
                </div>
                <div className="text-sm text-gray-600">Done</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photographer Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {photographers.filter(p => p.isActive).map(photographer => {
                const photographerSessions = weekSessions.filter(s => 
                  s.photographers?.some(p => p.id === photographer.id)
                );
                
                const totalHours = photographerSessions.reduce((acc, session) => {
                  const start = new Date(session.startAt);
                  const end = new Date(session.endAt);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return acc + hours;
                }, 0);
                
                return (
                  <div key={photographer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(photographer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{photographer.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {photographerSessions.length} session{photographerSessions.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-medium">
                        {totalHours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <CreateSessionDialog />
        <SessionDetailsSheet />
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-confirmation">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the session
                and remove all photographer assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedSession && deleteSessionMutation.mutate(selectedSession.id)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
