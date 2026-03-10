import { v } from 'convex/values';

import { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

export const listByGroup = query({
  args: { groupId: v.id('groups') },
  handler: async (ctx, { groupId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('items')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('items')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    groupId: v.id('groups'),
    bucketId: v.id('buckets'),
    title: v.string(),
    planned: v.number(),
    actual: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, bucketId, title, planned, actual, reason }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    // Enforce accountability: if actual > planned, reason must be provided
    if (actual > planned && (!reason || reason.trim().length < 10)) {
      throw new Error('A reason of at least 10 characters is required when actual exceeds planned.');
    }
    return await ctx.db.insert('items', {
      userId: identity.subject,
      groupId,
      bucketId,
      title: title.trim(),
      planned,
      actual,
      reason: reason?.trim(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('items'),
    bucketId: v.optional(v.id('buckets')),
    title: v.optional(v.string()),
    planned: v.optional(v.number()),
    actual: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, bucketId, title, planned, actual, reason }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const item = await ctx.db.get(id);
    if (!item || item.userId !== identity.subject) throw new Error('Not found');

    const newPlanned = planned ?? item.planned;
    const newActual = actual ?? item.actual;
    if (newActual > newPlanned && (!reason || reason.trim().length < 10)) {
      throw new Error('A reason of at least 10 characters is required when actual exceeds planned.');
    }

    const patch: Partial<{
      bucketId: Id<'buckets'>;
      title: string;
      planned: number;
      actual: number;
      reason: string;
    }> = {};
    if (bucketId !== undefined) patch.bucketId = bucketId;
    if (title !== undefined) patch.title = title.trim();
    if (planned !== undefined) patch.planned = planned;
    if (actual !== undefined) patch.actual = actual;
    if (reason !== undefined) patch.reason = reason.trim();

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('items') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const item = await ctx.db.get(id);
    if (!item || item.userId !== identity.subject) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});
