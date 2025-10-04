import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ProjectDetail from "@/pages/project-detail";
import OrderPage from "@/pages/order";
import AdminProjects from "@/pages/admin/projects";
import AdminPricing from "@/pages/admin/pricing";
import AdminOrders from "@/pages/admin/orders";
import AdminPhotographers from "@/pages/admin/photographers";
import AdminCalendar from "@/pages/admin/calendar";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/project/:slug" component={ProjectDetail} />
      <Route path="/order" component={OrderPage} />
      <Route path="/dashboard-admin">
        {() => <Redirect to="/dashboard-admin/projects" />}
      </Route>
      <Route path="/dashboard-admin/projects" component={AdminProjects} />
      <Route path="/dashboard-admin/pricing" component={AdminPricing} />
      <Route path="/dashboard-admin/orders" component={AdminOrders} />
      <Route path="/dashboard-admin/photographers" component={AdminPhotographers} />
      <Route path="/dashboard-admin/calendar" component={AdminCalendar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="bg-white">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
