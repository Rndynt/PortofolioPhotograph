import { Link, useRoute } from "wouter";
import { LayoutDashboard, Image, DollarSign, ShoppingCart, Camera } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: "projects" | "pricing" | "orders" | "photographers";
}

export default function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <Link href="/" className="text-sm text-gray-600 hover:text-black" data-testid="link-back-home">
              Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} className="mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <Link href="/dashboard-admin/projects">
              <TabsTrigger value="projects" className="w-full" data-testid="tab-projects">
                <Image className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
            </Link>
            <Link href="/dashboard-admin/pricing">
              <TabsTrigger value="pricing" className="w-full" data-testid="tab-pricing">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
            </Link>
            <Link href="/dashboard-admin/orders">
              <TabsTrigger value="orders" className="w-full" data-testid="tab-orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
            </Link>
            <Link href="/dashboard-admin/photographers">
              <TabsTrigger value="photographers" className="w-full" data-testid="tab-photographers">
                <Camera className="h-4 w-4 mr-2" />
                Photographers
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>

        {children}
      </div>
    </div>
  );
}
