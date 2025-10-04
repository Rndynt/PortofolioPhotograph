import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Session, Photographer, SessionAssignment } from "@shared/schema";
import AdminLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react";

interface SessionWithDetails extends Session {
  photographers?: Photographer[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                        className="h-[60px] border-b"
                      />
                    ))}
                    
                    {daySessions.map(session => {
                      const position = getSessionPosition(session, date);
                      const sessionWithDetails = sessionsWithPhotographers.find(s => s.id === session.id);
                      
                      return (
                        <div
                          key={session.id}
                          className="absolute left-1 right-1 bg-blue-500 text-white rounded p-2 text-xs cursor-pointer hover:bg-blue-600 transition-colors overflow-hidden"
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
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
      </div>
    </AdminLayout>
  );
}
