"use client";

import { useState } from "react";
import type { GeoScope } from "./content-types";

interface Filterable {
  tags: string[];
  geoScope: GeoScope;
}

export function useContentFilters<T extends Filterable>(items: T[]) {
  const [tag, setTag] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeoScope | null>(null);

  const allTags = Array.from(new Set(items.flatMap((item) => item.tags))).sort();

  const filtered = items.filter(
    (item) =>
      (tag === null || item.tags.includes(tag)) &&
      (geo === null || item.geoScope === geo),
  );

  const clear = () => {
    setTag(null);
    setGeo(null);
  };

  return { filtered, tag, setTag, geo, setGeo, allTags, clear };
}
