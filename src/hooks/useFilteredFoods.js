import { useMemo } from 'react';

/**
 * Custom hook that filters and sorts food items by category, search query, and category filter.
 */
// 🌟 Added quickFilterTag to parameters for quick category/status filtering
export function useFilteredFoods({ foods, selectedCategory, categoryFilter, searchQuery, quickFilterTag = 'all' }) {
  return useMemo(() => {
    let items = selectedCategory === 'All'
      ? foods
      : foods.filter((i) => (i.category?.name || '') === selectedCategory);

    if (categoryFilter) {
      items = items.filter((i) => (i.category?.name || '') === categoryFilter);
    }

    // 🌟 Filter by Quick Tag: Pinned/Featured, New, or Healthy
    if (quickFilterTag === 'featured') {
      items = items.filter((i) => Boolean(i.isFeatured));
    } else if (quickFilterTag === 'new') {
      items = items.filter((i) => Boolean(i.isNew));
    } else if (quickFilterTag === 'healthy') {
      items = items.filter((i) => Boolean(i.isHealthy));
    }

    // 🌟 Search by Item Name, Category, OR fast 5-character Food Code (e.g. CK01)
    if (searchQuery.trim()) {
      const rawQ = searchQuery.trim().toLowerCase();
      // 🌟 Strip leading zeros for numeric code search (e.g., "002" -> "2")
      const numQ = rawQ.replace(/^0+/, '');

      items = items.filter((i) => {
        const nameMatch = i.name?.toLowerCase().includes(rawQ);
        const catMatch = (i.category?.name || '').toLowerCase().includes(rawQ);
        
        let codeMatch = false;
        if (i.code) {
          const rawCode = String(i.code).toLowerCase();
          const numCode = rawCode.replace(/^0+/, '');
          // Matches exact code OR normalized number (e.g. "002" matches "2" or "0002")
          codeMatch = rawCode.includes(rawQ) || (numQ !== '' && numCode === numQ);
        }

        return nameMatch || codeMatch || catMatch;
      });
    }

   return [...items].sort((a, b) => {
      const aPinned = Boolean(a.isFeatured);
      const bPinned = Boolean(b.isFeatured);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [foods, selectedCategory, categoryFilter, searchQuery, quickFilterTag]); 
}