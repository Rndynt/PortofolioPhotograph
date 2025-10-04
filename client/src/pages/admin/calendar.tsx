import { useState, useMemo } from "react";
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface SessionWithDetails extends Session {
  photographers?: Photographer[];
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

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [photographerFilter, setPhotographerFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number } | null>(null);
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
    mutationFn: async ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) => {
      const response = await apiRequest('PATCH', `/api/sessions/${id}`, {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({ title: "Session rescheduled successfully" });
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
        toast({ title: "Failed to reschedule session", variant: "destructive" });
      }
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

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedTimeSlot({ date, hour });
    setDialogOpen(true);
  };

  const sessionsWithPhotographers: SessionWithDetails[] = useMemo(() => {
    return sessions.map(session => {
      const sessionAssignments = allAssignments.filter(a => a.sessionId === session.id);
      const sessionPhotographers = photographers.filter(p => 
        sessionAssignments.some(a => a.photographerId === p.id)
      );
      return {
        ...session,
        photographers: sessionPhotographers,
      };
    });
  }, [sessions, allAssignments, photographers]);

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
    const byDay: Record<string, Session[]> = {};
    
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

    // When dialog opens, prefill with selected time slot
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
    
    // Auto-populate order if project has orderId
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

        <Card>
          <CardContent className="p-0">
            {sessions.length === 0 && (
              <div className="p-8 text-center text-gray-500" data-testid="empty-state-message">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-lg">Click any time slot to create a session</p>
              </div>
            )}
            <div className="flex border-b">
              <div className="w-16 flex-shrink-0 border-r"></div>
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, today);
                return (
                  <div 
                    key={i} 
                    className={`flex-1 p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}
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
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`flex-1 relative border-r last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}
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
                    
                    {daySessions.map(session => {
                      const position = getSessionPosition(session, date);
                      const sessionWithDetails = sessionsWithPhotographers.find(s => s.id === session.id);
                      
                      return (
                        <div
                          key={session.id}
                          className="absolute left-1 right-1 bg-blue-500 text-white rounded p-2 text-xs cursor-pointer hover:bg-blue-600 transition-colors overflow-hidden pointer-events-auto"
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                          {sessionWithDetails?.photographers && sessionWithDetails.photographers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sessionWithDetails.photographers.map(p => (
                                <Badge key={p.id} variant="secondary" className="text-[10px] px-1 py-0">
                                  {p.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Badge 
                            variant={session.status === "DONE" ? "default" : "secondary"} 
                            className="text-[10px] px-1 py-0 mt-1"
                          >
                            {session.status}
                          </Badge>
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
                      <User className="h-4 w-4 text-gray-500" />
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
      </div>
    </AdminLayout>
  );
}
