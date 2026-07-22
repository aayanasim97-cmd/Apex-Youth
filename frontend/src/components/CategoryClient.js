"use client";
import React, { useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";
import HomeClient from "./HomeClient";

export default function CategoryClient({ categorySlug }) {
  const { setCategory } = useFilterStore();

  useEffect(() => {
    setCategory(categorySlug);
  }, [categorySlug, setCategory]);

  // Render the core home client which now operates under the active category filter
  return <HomeClient />;
}
