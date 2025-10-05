import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppSettings } from "@shared/schema";
import AdminLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Clock, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [startHour, setStartHour] = useState<number>(6);
  const [endHour, setEndHour] = useState<number>(20);
  const [validationError, setValidationError] = useState<string>("");

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/app');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setStartHour(settings.calendarStartHour);
      setEndHour(settings.calendarEndHour);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { calendarStartHour: number; calendarEndHour: number }) => {
      const response = await apiRequest('PATCH', '/api/settings/app', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      toast({ 
        title: "Settings updated successfully",
        description: "Calendar hours have been updated."
      });
      setValidationError("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update settings", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (startHour >= endHour) {
      setValidationError("Start hour must be less than end hour");
      return;
    }
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setValidationError("Hours must be between 0 and 23");
      return;
    }

    setValidationError("");
    updateSettingsMutation.mutate({
      calendarStartHour: startHour,
      calendarEndHour: endHour,
    });
  };

  return (
    <AdminLayout activeTab="settings">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Application Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Calendar Configuration
            </CardTitle>
            <CardDescription>
              Configure the calendar view hours and timezone settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Input
                    id="timezone"
                    type="text"
                    value="Asia/Jakarta"
                    disabled
                    className="bg-gray-50"
                    data-testid="input-timezone"
                  />
                  <p className="text-sm text-gray-500">
                    All calendar times are displayed in this timezone
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-hour">
                      Calendar Start Hour (0-23)
                    </Label>
                    <Input
                      id="start-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={(e) => setStartHour(parseInt(e.target.value))}
                      data-testid="input-start-hour"
                    />
                    <p className="text-sm text-gray-500">
                      First hour displayed in the calendar (24-hour format)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-hour">
                      Calendar End Hour (0-23)
                    </Label>
                    <Input
                      id="end-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={endHour}
                      onChange={(e) => setEndHour(parseInt(e.target.value))}
                      data-testid="input-end-hour"
                    />
                    <p className="text-sm text-gray-500">
                      Last hour displayed in the calendar (24-hour format)
                    </p>
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                    {validationError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  
                  {settings && (
                    <p className="text-sm text-gray-500">
                      Current: {settings.calendarStartHour}:00 - {settings.calendarEndHour}:00
                    </p>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
