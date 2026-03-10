import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  pushTokens: defineTable({
    subject: v.string(),
    pushToken: v.string(),
  }).index('by_subject', ['subject']),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  buckets: defineTable({
    userId: v.string(),
    title: v.string(),
    type: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_title', ['userId', 'title']),

  groups: defineTable({
    userId: v.string(),
    title: v.string(),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_timestamp', ['userId', 'timestamp']),

  items: defineTable({
    userId: v.string(),
    groupId: v.id('groups'),
    bucketId: v.id('buckets'),
    title: v.string(),
    planned: v.number(),
    actual: v.number(),
    reason: v.optional(v.string()),
  })
    .index('by_group', ['groupId'])
    .index('by_user', ['userId'])
    .index('by_bucket', ['bucketId']),

  wishes: defineTable({
    userId: v.string(),
    title: v.string(),
    amount: v.number(),
    priority: v.number(),
    utility: v.string(),
    targetMonth: v.optional(v.string()),
    purchased: v.optional(v.boolean()),
  })
    .index('by_user', ['userId'])
    .index('by_user_priority', ['userId', 'priority']),
});
