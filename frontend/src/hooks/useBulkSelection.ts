import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing bulk selection state with optimized caching
 * Requirements: 11.1, 11.2, 11.3, 11.7, 11.8
 */
export const useBulkSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /**
   * Toggle selection for a single item
   * Optimized to minimize re-renders
   */
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  /**
   * Toggle select all items on current page
   * Optimized batch operation
   */
  const toggleSelectAll = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      // Check if all current page items are selected
      const allSelected = ids.every((id) => prev.has(id));

      if (allSelected) {
        // Deselect all items on current page
        const newSelection = new Set(prev);
        ids.forEach((id) => newSelection.delete(id));
        return newSelection;
      } else {
        // Select all items on current page
        const newSelection = new Set(prev);
        ids.forEach((id) => newSelection.add(id));
        return newSelection;
      }
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Check if an item is selected
   * Memoized for performance
   */
  const isSelected = useCallback(
    (id: number) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Check if all items on current page are selected
   * Memoized for performance
   */
  const isAllSelected = useCallback(
    (ids: number[]) => {
      return ids.length > 0 && ids.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  /**
   * Get selected IDs as array (cached)
   * Useful for bulk operations
   */
  const selectedIdsArray = useMemo(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  /**
   * Get selection count (cached)
   */
  const selectionCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds]);

  return {
    selectedIds,
    selectedIdsArray,
    selectionCount,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
  };
};
