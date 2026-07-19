import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const platformEnum = pgEnum("platform", [
  "whatsapp",
  "telegram",
  "signal",
  "messenger",
  "instagram",
  "discord",
  "other",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const websites = pgTable(
  "websites",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    status: statusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("websites_slug_idx").on(table.slug)]
);

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id")
    .notNull()
    .references(() => websites.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  status: statusEnum("status").notNull().default("active"),
  priority: integer("priority").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiRequests = pgTable("api_requests", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id")
    .notNull()
    .references(() => websites.id, { onDelete: "cascade" }),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
});

export const linkClicks = pgTable("link_clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id, { onDelete: "cascade" }),
  websiteId: integer("website_id")
    .notNull()
    .references(() => websites.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
});

export const websitesRelations = relations(websites, ({ many }) => ({
  links: many(links),
  apiRequests: many(apiRequests),
  linkClicks: many(linkClicks),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  website: one(websites, {
    fields: [links.websiteId],
    references: [websites.id],
  }),
  clicks: many(linkClicks),
}));

export const apiRequestsRelations = relations(apiRequests, ({ one }) => ({
  website: one(websites, {
    fields: [apiRequests.websiteId],
    references: [websites.id],
  }),
}));

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(links, {
    fields: [linkClicks.linkId],
    references: [links.id],
  }),
  website: one(websites, {
    fields: [linkClicks.websiteId],
    references: [websites.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Link = typeof links.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
export type NewLink = typeof links.$inferInsert;
