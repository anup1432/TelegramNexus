import { Home, DollarSign, MessageSquare, ShieldCheck, Package } from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const userMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Sell Your Group",
      url: "/sell-group",
      icon: Package,
    },
    {
      title: "Earnings",
      url: "/earnings",
      icon: DollarSign,
    },
    {
      title: "Support",
      url: "/support",
      icon: MessageSquare,
    },
  ];

  const adminMenuItems = user?.isAdmin === 1 ? [
    {
      title: "Admin Panel",
      url: "/admin",
      icon: ShieldCheck,
    },
  ] : [];

  const allMenuItems = [...userMenuItems, ...adminMenuItems];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base text-sidebar-foreground">TeleGroup</h2>
            <p className="text-xs text-muted-foreground">Market</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <a href={item.url} onClick={(e) => {
                        e.preventDefault();
                        setLocation(item.url);
                      }}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              ${parseFloat(user?.balance || "0").toFixed(2)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
