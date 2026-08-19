import {
  BarChart3,
  Bell,
  Fingerprint,
  Globe2,
  LayoutDashboard,
  type LucideIcon,
  PackageSearch,
  Settings,
  Sparkles,
  SunSnow,
  Telescope,
  UserRound,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/**
 * CrossBorder Opportunity AI（日中越境商品リサーチAI）のナビゲーション。
 * docs/development_plan.md セクション50「推奨ナビゲーション」に対応。
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Research",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "ai-research",
        title: "AI Research",
        url: "/dashboard/research",
        icon: Sparkles,
        badge: "new",
      },
      {
        id: "opportunities",
        title: "Opportunities",
        url: "/dashboard/opportunities",
        icon: Telescope,
      },
      {
        id: "products",
        title: "Products",
        url: "/dashboard/products",
        icon: PackageSearch,
      },
      {
        id: "seasonal",
        title: "Seasonal",
        url: "/dashboard/seasonal",
        icon: SunSnow,
      },
      {
        id: "markets",
        title: "Markets",
        url: "/dashboard/markets",
        icon: Globe2,
      },
      {
        id: "analytics",
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: 2,
    label: "Workspace",
    items: [
      {
        id: "watchlists",
        title: "Watchlists",
        url: "/dashboard/watchlists",
        icon: Bell,
      },
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
  {
    id: 3,
    label: "Account",
    items: [
      {
        id: "authentication",
        title: "Authentication",
        icon: Fingerprint,
        subItems: [
          { id: "auth-login-v1", title: "Login", url: "/auth/v1/login", newTab: true },
          { id: "auth-register-v1", title: "Register", url: "/auth/v1/register", newTab: true },
        ],
      },
    ],
  },
];

// 参考: 旧CRM/Financeダッシュボードは Watchlists / Finance系指標へ転用予定。
// docs/development_plan.md セクション52参照。
