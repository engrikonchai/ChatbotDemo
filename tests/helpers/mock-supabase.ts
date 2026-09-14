/**
 * A minimal fake Supabase query builder for unit-testing
 * lib/server/widget-service.ts without a live database. It supports the
 * exact chain shapes that module uses (`.from().select().eq().eq()
 * .maybeSingle()`, `.insert().select().single()`,
 * `.select(..., {count, head}).eq()` awaited directly, etc.) by
 * recording the accumulated query state and handing it to a
 * per-table responder function that decides what a real Postgres/RLS
 * query would have returned.
 *
 * This is deliberately not a general PostgREST simulator — just enough
 * to make the authorization/shape logic in widget-service.ts testable.
 */

export interface QueryState {
  table: string;
  selectArgs?: unknown[];
  filters: [string, unknown][];
  insertPayload?: unknown;
  updatePayload?: unknown;
  isDelete?: boolean;
  order?: unknown[];
  limit?: number;
}

export type TableResponder = (state: QueryState) => { data?: unknown; error?: unknown; count?: number };

export function createMockSupabase(responders: Record<string, TableResponder>) {
  const calls: QueryState[] = [];

  function makeBuilder(table: string) {
    const state: QueryState = { table, filters: [] };

    function respond() {
      calls.push({ ...state, filters: [...state.filters] });
      const responder = responders[table];
      if (!responder) return { data: null, error: new Error(`No mock responder for table "${table}"`) };
      return responder(state);
    }

    const builder = {
      select(...args: unknown[]) {
        state.selectArgs = args;
        return builder;
      },
      insert(payload: unknown) {
        state.insertPayload = payload;
        return builder;
      },
      update(payload: unknown) {
        state.updatePayload = payload;
        return builder;
      },
      delete() {
        state.isDelete = true;
        return builder;
      },
      eq(column: string, value: unknown) {
        state.filters.push([column, value]);
        return builder;
      },
      order(...args: unknown[]) {
        state.order = args;
        return builder;
      },
      limit(n: number) {
        state.limit = n;
        return builder;
      },
      maybeSingle: () => Promise.resolve(respond()),
      single: () => Promise.resolve(respond()),
      // Supabase's query builder is a thenable — many call sites await it
      // directly without calling .single()/.maybeSingle() (e.g. count
      // queries, bulk inserts, updates).
      then(onFulfilled: (value: { data?: unknown; error?: unknown; count?: number }) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(respond()).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return {
    from: (table: string) => makeBuilder(table),
    calls,
  };
}
