export type Lang = "ja" | "en" | "si";

export const translations: Record<Lang, Record<string, string>> = {
  ja: {
    nav_dashboard: "ダッシュボード",
    nav_orders: "注文",
    nav_shipments: "Shipment",
    nav_customers: "顧客",
    nav_login: "ログイン",
    nav_signup: "新規登録",
    nav_logout: "ログアウト",
    app_title: "Coco Export",
    app_subtitle: "Management System",
  },
  en: {
    nav_dashboard: "Dashboard",
    nav_orders: "Orders",
    nav_shipments: "Shipment",
    nav_customers: "Customers",
    nav_login: "Login",
    nav_signup: "Sign up",
    nav_logout: "Log out",
    app_title: "Coco Export",
    app_subtitle: "Management System",
  },
  si: {
    nav_dashboard: "උපකරණ පුවරුව",
    nav_orders: "ඇණවුම්",
    nav_shipments: "Shipment",
    nav_customers: "පාරිභෝගිකයන්",
    nav_login: "ඇතුළු වන්න",
    nav_signup: "ලියාපදිංචි වන්න",
    nav_logout: "ඉවත් වන්න",
    app_title: "Coco Export",
    app_subtitle: "Management System",
  },
};

export function getT(lang: Lang) {
  return (key: string) => translations[lang]?.[key] ?? translations.ja[key] ?? key;
}
