import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('buckets')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
  },
  handler: async (ctx, { title, type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    return await ctx.db.insert('buckets', {
      userId: identity.subject,
      title: title.trim(),
      type: type.trim(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('buckets') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const bucket = await ctx.db.get(id);
    if (!bucket || bucket.userId !== identity.subject) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});

export const update = mutation({
  args: {
    id: v.id('buckets'),
    title: v.string(),
    type: v.string(),
  },
  handler: async (ctx, { id, title, type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const bucket = await ctx.db.get(id);
    if (!bucket || bucket.userId !== identity.subject) throw new Error('Not found');
    await ctx.db.patch(id, { title: title.trim(), type: type.trim() });
  },
});
