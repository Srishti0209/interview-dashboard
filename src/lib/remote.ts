import { supabase } from '@/lib/supabase';

const PAGE = 1000;

/**
 * Fetches every row of a table visible to the user, paging past PostgREST's
 * 1000-row response limit. `order` must be a unique column for stable pages.
 */
export async function fetchAll<T>(
  table: string,
  columns: string,
  order: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (data.length < PAGE) return rows;
  }
}

/** Updates a cached list in place; no-op when the list isn't loaded yet. */
export function mapList<T>(list: T[] | undefined, fn: (items: T[]) => T[]) {
  return list ? fn(list) : list;
}
