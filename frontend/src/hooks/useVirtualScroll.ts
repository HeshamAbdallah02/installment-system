import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Virtual scrolling hook for optimizing large lists
 * Only renders visible items plus a buffer
 * Requirement: Performance optimization for large payment lists
 *
 * @param items - Array of items to virtualize
 * @param itemHeight - Height of each item in pixels
 * @param containerHeight - Height of the scrollable container
 * @param overscan - Number of items to render outside visible area (default: 3)
 * @returns Virtual scroll state and handlers
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Handle scroll event
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll position when items change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  return {
    containerRef,
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Virtual scrolling component wrapper
 * Usage example:
 *
 * const { containerRef, visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
 *   payments,
 *   60, // item height
 *   600 // container height
 * );
 *
 * <div ref={containerRef} onScroll={handleScroll} style={{ height: 600, overflow: 'auto' }}>
 *   <div style={{ height: totalHeight, position: 'relative' }}>
 *     <div style={{ transform: `translateY(${offsetY}px)` }}>
 *       {visibleItems.map((item, index) => (
 *         <PaymentRow key={startIndex + index} payment={item} />
 *       ))}
 *     </div>
 *   </div>
 * </div>
 */
