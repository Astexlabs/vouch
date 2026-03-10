import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const wishes = await ctx.db
      .query('wishes')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    // Sort: critical (priority === 1) pinned at top, then by priority asc, then by amount desc
    return wishes.sort((a, b) => {
      if (a.priority === 1 && b.priority !== 1) return -1;
      if (b.priority === 1 && a.priority !== 1) return 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.amount - a.amount;
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    priority: v.number(),
    utility: v.string(),
    targetMonth: v.optional(v.string()),
  },
  handler: async (ctx, { title, amount, priority, utility, targetMonth }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    return await ctx.db.insert('wishes', {
      userId: identity.subject,
      title: title.trim(),
      amount,
      priority,
      utility: utility.trim(),
      targetMonth,
      purchased: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('wishes'),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    priority: v.optional(v.number()),
    utility: v.optional(v.string()),
    targetMonth: v.optional(v.string()),
    purchased: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, title, amount, priority, utility, targetMonth, purchased }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const wish = await ctx.db.get(id);
    if (!wish || wish.userId !== identity.subject) throw new Error('Not found');

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title.trim();
    if (amount !== undefined) patch.amount = amount;
    if (priority !== undefined) patch.priority = priority;
    if (utility !== undefined) patch.utility = utility.trim();
    if (targetMonth !== undefined) patch.targetMonth = targetMonth;
    if (purchased !== undefined) patch.purchased = purchased;

    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('wishes') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const wish = await ctx.db.get(id);
    if (!wish || wish.userId !== identity.subject) throw new Error('Not found');
    await ctx.db.delete(id);
  },
});
