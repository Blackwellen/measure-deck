"use client";

import { SkeletonCard } from "@/components/ui/loading-skeleton";
import React from "react";

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function MobileCardList<T>({
  items,
  renderCard,
  isLoading = false,
  emptyState,
  keyExtractor,
  className,
}: MobileCardListProps<T>) {
  if (isLoading) {
    return (
      <div className={`flex flex-col gap-3 w-full ${className ?? ""}`}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${className ?? ""}`}>
      {items.map((item) => (
        <React.Fragment key={keyExtractor(item)}>{renderCard(item)}</React.Fragment>
      ))}
    </div>
  );
}

export default MobileCardList;
