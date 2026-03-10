import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('groups')
      .withIndex('by_user_timestamp', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
  },
});

export const get = query({
  args: { id: v.id('groups') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const group = await ctx.db.get(id);
    if (!group || group.userId !== identity.subject) return null;
    return group;
  },
});

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    return await ctx.db.insert('groups', {
      userId: identity.subject,
      title: title.trim(),
      timestamp: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('groups') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const group = await ctx.db.get(id);
    if (!group || group.userId !== identity.subject) throw new Error('Not found');
    // Remove all items in this group first
    const items = await ctx.db
      .query('items')
      .withIndex('by_group', (q) => q.eq('groupId', id))
      .collect();
    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    await ctx.db.delete(id);
  },
});

export const update = mutation({
  args: { id: v.id('groups'), title: v.string() },
  handler: async (ctx, { id, title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const group = await ctx.db.get(id);
    if (!group || group.userId !== identity.subject) throw new Error('Not found');
    await ctx.db.patch(id, { title: title.trim() });
  },
});
