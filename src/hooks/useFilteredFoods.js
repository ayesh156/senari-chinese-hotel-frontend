import { useMemo } from 'react';

/**
 * Custom hook that filters and sorts food items by category, search query, and category filter.
 */
export function useFilteredFoods({ foods, selectedCategory, categoryFilter, searchQuery }) {
  return useMemo(() => {
    let items = selectedCategory === 'All'
      ? foods
      : foods.filter((i) => (i.category?.name || '') === selectedCategory);

    if (categoryFilter) {
      items = items.filter((i) => (i.category?.name || '') === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category?.name || '').toLowerCase().includes(q)
      );
    }

    return [...items].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [foods, selectedCategory, categoryFilter, searchQuery]);
}