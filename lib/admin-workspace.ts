import operations from "./admin-operations.json";

export type Field = {
  name: string;
  label: string;
  kind: string;
  required?: boolean;
  nullable?: boolean;
  options?: (string | number | boolean)[];
  hint?: string;
  integer?: boolean;
  min?: number;
  max?: number;
};
export type Operation = {
  path: string;
  method: string;
  permission?: string;
  fields?: Field[];
  filters?: Field[];
  multipart?: boolean;
  idempotent?: boolean;
};
export const apiOperations: Record<string, Operation> = operations;

export type Action = [operation: string, label: string];
export type Section = {
  title: string;
  description?: string;
  list: string;
  columns?: string[];
  detail?: string;
  actions?: Action[];
  row?: Action[];
  children?: string[];
  single?: boolean;
};

export const sections: Record<string, Section> = {
  products: {title:"Products", description:"Manage product listings, variants and media.", list:"listAdminProducts", detail:"getAdminProduct", columns:["thumbnail","name","status","regular_amount","sale_amount"], actions:[["createProduct","Add product"],["bulkProducts","Bulk product action"]], row:[["updateProduct","Edit product"],["updateProductStatus","Change visibility"],["deleteProduct","Archive product"],["restoreProduct","Restore product"]], children:["variants","images"]},
  variants: {title:"Variants", list:"listProductVariants", columns:["sku","options","status","price_override_amount","is_default"], actions:[["createProductVariant","Add variant"]], row:[["updateProductVariant","Edit variant"],["updateProductVariantStatus","Change visibility"],["deleteProductVariant","Archive variant"]]},
  images: {title:"Product images", list:"listProductImages", columns:["thumbnail","alt_text","sort_order"], actions:[["uploadProductImage","Upload image"],["reorderProductImages","Reorder selected images"]], row:[["updateProductImage","Edit image details"],["replaceProductImage","Replace file"],["deleteProductImage","Delete image"]]},
  categories: taxonomy("Category", "Categories", "listAdminCategory", "getAdminCategory", "bulkCategory", "reorderCategory", "setCategoryStatus"),
  brands: taxonomy("Brand", "Brands", "listAdminBrand", "getAdminBrand", "bulkBrand", "reorderBrand", "setBrandStatus"),
  attributes: {...taxonomy("Attribute", "Attributes", "listAdminAttribute", "getAdminAttribute", "bulkAttribute", "reorderAttribute", "setAttributeStatus"), children:["attribute-values"]},
  "attribute-values": taxonomy("AttributeValue", "Attribute values", "listAdminAttributeValue", "getAdminAttributeValue", "bulkAttributeValue", "reorderAttributeValue", "setAttributeValueStatus"),
  inventory: {title:"Inventory", description:"Review available stock and record adjustments with an audit reason.", list:"listInventory", columns:["sku","on_hand","reserved","available","low_stock"], row:[["adjustInventory","Adjust stock"]]},
  movements: {title:"Stock movements", list:"listInventoryMovements", columns:["type","delta","reason","created_at"]},
  orders: {title:"Orders", description:"Review customer orders, manage fulfillment and issue refunds.", list:"listAdminOrders", detail:"getAdminOrder", columns:["number","status","payment_status","total_amount","created_at"], row:[["transitionOrder","Advance fulfillment"],["cancelAdminOrder","Cancel order"],["requestOrderRefund","Issue refund"]], children:["refunds"]},
  refunds: {title:"Refund history", list:"listOrderRefunds", columns:["status","amount","reason","created_at"]},
  customers: {title:"Customers", list:"listCustomers", detail:"getCustomer", columns:["name","email","active","created_at"], row:[["updateCustomerStatus","Change account status"]], children:["customer-orders"]},
  "customer-orders": {title:"Order history", list:"listCustomerHistory", columns:["number","status","payment_status","total_amount","created_at"]},
  coupons: {title:"Coupons", list:"listCoupons", detail:"getCoupon", columns:["code","type","value","status","ends_at"], actions:[["createCoupon","Add coupon"],["bulkCoupons","Update selected coupons"]], row:[["updateCoupon","Edit coupon"],["updateCouponStatus","Change status"],["deleteCoupon","Archive coupon"],["restoreCoupon","Restore coupon"]]},
  sales: {title:"Sales reports", description:"Explore daily revenue, product sales and category performance in UTC.", list:"getSalesReport", columns:["date","orders","gross_captured_amount","refunded_amount","net_revenue_amount"], single: true},
  "low-stock": {title:"Low-stock report", list:"getLowStockReport", columns:["sku","on_hand","reserved","available"]},
  "coupon-report": {title:"Coupon report", list:"getCouponReport", columns:["code","redemptions","discount_amount"]},
  reviews: {title:"Reviews", list:"listAdminReviews", columns:["title","rating","verified_purchase","status","created_at"], actions:[["bulkModerateReviews","Moderate selected"]], row:[["moderateReview","Moderate review"]]},
  banners: content("Banner","Banners"),
  "homepage-sections": content("HomepageSection","Homepage sections"),
  navigation: content("NavigationItem","Navigation"),
  testimonials: content("Testimonial","Testimonials"),
  "site-settings": {title:"Site settings", list:"getAdminSiteSettings", single:true, actions:[["updateSiteSettings","Edit site settings"]]},
  newsletter: {title:"Newsletter", list:"listNewsletter", columns:["email","source","consented_at","unsubscribed_at"]},
  staff: {title:"Staff accounts", list:"listStaff", detail:"getStaff", columns:["name","email","roles","active"], actions:[["createStaff","Add staff member"]], row:[["updateStaff","Edit account"],["replaceStaffRoles","Assign roles"]]},
  roles: {title:"Roles", list:"listRoles", detail:"getRole", columns:["name","slug","permissions"], actions:[["createRole","Add role"]], row:[["updateRole","Rename role"],["replaceRolePermissions","Edit permissions"],["deleteRole","Delete role"]], children:[]},
  permissions: {title:"Permissions", list:"listPermissions", columns:["name","slug"]},
  audit: {title:"Audit log", list:"listAuditLogs", columns:["event","actor.name","subject_type","created_at"]},
  shipping: {title:"Shipping settings", description:"The flat rate applies to new checkouts. Use zero for free shipping.", list:"getShippingSettings", single:true, actions:[["updateShippingSettings","Change shipping rate"]]},
  settings: {title:"My account", list:"showStaffProfile", single:true, actions:[["updateStaffProfile","Edit profile"],["changeStaffPassword","Change password"],["setupStaffTwoFactor","Set up two-factor authentication"],["confirmStaffTwoFactor","Confirm setup"],["replaceStaffRecoveryCodes","Replace recovery codes"],["disableStaffTwoFactor","Disable two-factor authentication"]]},
};

function taxonomy(suffix: string, title: string, list: string, detail: string, bulk: string, reorder: string, status: string): Section {
  return {title, list, detail, columns:suffix === "Category" || suffix === "Brand" ? ["thumbnail","name","slug","status","sort_order"] : ["name","slug","status","sort_order"],
    actions:[["create"+suffix,"Add "+title.toLowerCase().replace(/s$/, "")],[bulk,"Bulk action"],[reorder,"Reorder selected"]],
    row:[["update"+suffix,"Edit"],[status,"Change status"],["delete"+suffix,"Archive"],["restore"+suffix,"Restore"]]};
}

function content(suffix: string, title: string): Section {
  return {title,list:"list"+suffix, detail:"read"+suffix, columns:suffix === "Banner" || suffix === "Testimonial" ? ["thumbnail","key","published","sort_order","starts_at","ends_at"] : ["key","published","sort_order","starts_at","ends_at"],
    actions:[["create"+suffix,"Add content"]],row:[["update"+suffix,"Edit content"],["delete"+suffix,"Delete content"]]};
}

export const navigation = [
  { title:"Operations", items:[["orders","Orders"],["products","Products"],["inventory","Inventory"],["movements","Stock movements"],["customers","Customers"],["coupons","Coupons"],["reviews","Reviews"]] },
  { title:"Catalog & storefront", items:[["categories","Categories"],["brands","Brands"],["attributes","Attributes"],["banners","Banners"],["homepage-sections","Homepage sections"],["navigation","Navigation"],["testimonials","Testimonials"],["site-settings","Site settings"],["newsletter","Newsletter"]] },
  { title:"Insights", items:[["sales","Sales reports"],["low-stock","Low stock"],["coupon-report","Coupon reports"]] },
  { title:"Administration", items:[["staff","Staff accounts"],["roles","Roles"],["permissions","Permissions"],["audit","Audit log"],["shipping","Shipping"],["settings","My account"]] },
];
