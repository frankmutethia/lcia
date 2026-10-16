import type { Resource } from "./api";
export type FormResource = Resource | "users" | "services";
export type Field = {
  name: string;
  label: string;
  kind?: "textarea" | "number" | "checkbox" | "email" | "url" | "select";
  required?: boolean;
  max?: number;
  min?: number;
  options?: string[];
};
const common: Field[] = [
  { name: "featured", label: "Featured", kind: "checkbox" },
  {
    name: "displayOrder",
    label: "Display order",
    kind: "number",
    min: 0,
    max: 100000,
  },
];
export const resourceLabels: Record<FormResource, string> = {
  events: "Events & activities",
  albums: "Community gallery",
  testimonials: "Testimonials",
  "business-categories": "Business categories",
  businesses: "Businesses",
  services: "Services",
  users: "User management",
};
export const createLabels: Record<FormResource, string> = {
  events: "Create event / activity",
  albums: "Create album",
  testimonials: "Add testimonial",
  "business-categories": "Add category",
  businesses: "Add business",
  services: "Add service",
  users: "Invite administrator",
};
export const statuses: Partial<Record<FormResource, string[]>> = {
  events: ["draft", "published", "archived"],
  albums: ["draft", "published", "archived"],
  businesses: ["draft", "published", "archived"],
  testimonials: ["pending", "draft", "published", "rejected"],
};
export const mediaFields: Partial<Record<FormResource, string>> = {
  events: "cover",
  testimonials: "photo",
  "business-categories": "image",
  businesses: "cover",
};
export const fields: Record<FormResource, Field[]> = {
  events: [
    { name: "title", label: "Title", required: true, max: 200 },
    {
      name: "type",
      label: "Type",
      kind: "select",
      options: ["event", "activity"],
    },
    { name: "summary", label: "Summary", kind: "textarea", max: 1000 },
    {
      name: "content",
      label: "Full description",
      kind: "textarea",
      max: 50000,
    },
    { name: "timezone", label: "Event timezone", required: true },
    {
      name: "displayDate",
      label: "Display date (optional override)",
      max: 120,
    },
    {
      name: "displayTime",
      label: "Display time (optional override)",
      max: 120,
    },
    { name: "venueName", label: "Venue name", max: 500 },
    { name: "venueAddress", label: "Venue address", max: 500 },
    { name: "venueLabel", label: "Venue label", max: 500 },
    { name: "audience", label: "Audience", max: 500 },
    {
      name: "attendanceCount",
      label: "Attendance count",
      kind: "number",
      min: 0,
    },
    ...common,
  ],
  albums: [
    { name: "title", label: "Album title", required: true },
    { name: "description", label: "Description", kind: "textarea", max: 10000 },
    { name: "event", label: "Linked event", kind: "select" },
    { name: "eventDate", label: "Event date (ISO with offset, optional)" },
    ...common,
  ],
  testimonials: [
    { name: "name", label: "Full name", required: true, max: 120 },
    { name: "memberTitle", label: "Member title", max: 120 },
    {
      name: "comment",
      label: "Testimonial",
      required: true,
      kind: "textarea",
      max: 5000,
    },
    {
      name: "rating",
      label: "Rating",
      required: true,
      kind: "number",
      min: 1,
      max: 5,
    },
    ...common,
  ],
  "business-categories": [
    { name: "name", label: "Category name", required: true, max: 200 },
    { name: "description", label: "Description", kind: "textarea", max: 5000 },
    { name: "active", label: "Active", kind: "checkbox" },
    {
      name: "displayOrder",
      label: "Display order",
      kind: "number",
      min: 0,
      max: 100000,
    },
  ],
  businesses: [
    { name: "title", label: "Business name", required: true },
    {
      name: "category",
      label: "Business category",
      required: true,
      kind: "select",
    },
    { name: "ownerName", label: "Owner name" },
    { name: "summary", label: "Summary", kind: "textarea", max: 1000 },
    { name: "description", label: "Description", kind: "textarea", max: 20000 },
    { name: "phone", label: "Phone number", min: 6, max: 30 },
    { name: "email", label: "Email", kind: "email" },
    { name: "website", label: "Website", kind: "url" },
    ...common,
  ],
  services: [
    { name: "title", label: "Service title", required: true, max: 200 },
    { name: "description", label: "Description", kind: "textarea", max: 5000 },
    { name: "active", label: "Active", kind: "checkbox" },
    {
      name: "displayOrder",
      label: "Display order",
      kind: "number",
      min: 0,
      max: 100000,
    },
  ],
  users: [
    { name: "name", label: "Full name", required: true },
    { name: "email", label: "Email address", required: true, kind: "email" },
    {
      name: "role",
      label: "Staff role",
      kind: "select",
      options: ["editor", "super_admin"],
    },
  ],
};
