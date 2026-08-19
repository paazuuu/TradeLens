"use client";

import * as React from "react";

import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getLocalStorageValue, setLocalStorageValue } from "@/lib/local-storage.client";
import { productCatalog } from "@/lib/research/mock-data";

const CATEGORIES_KEY = "crossborder_watch_categories";
const PRODUCTS_KEY = "crossborder_watch_products";

const DEFAULT_CATEGORIES = ["キャンプ用品"];
const DEFAULT_PRODUCTS = productCatalog.slice(0, 3).map((e) => e.id);

function loadList(key: string, fallback: string[]): string[] {
  const raw = getLocalStorageValue(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : fallback;
  } catch {
    return fallback;
  }
}

export function WatchlistManager() {
  const { m } = useI18n();

  const [categories, setCategories] = React.useState<string[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = React.useState<string[]>(DEFAULT_PRODUCTS);
  const [categoryInput, setCategoryInput] = React.useState("");
  const [productSelect, setProductSelect] = React.useState("");

  React.useEffect(() => {
    setCategories(loadList(CATEGORIES_KEY, DEFAULT_CATEGORIES));
    setProducts(loadList(PRODUCTS_KEY, DEFAULT_PRODUCTS));
  }, []);

  function persistCategories(next: string[]) {
    setCategories(next);
    setLocalStorageValue(CATEGORIES_KEY, JSON.stringify(next));
  }

  function persistProducts(next: string[]) {
    setProducts(next);
    setLocalStorageValue(PRODUCTS_KEY, JSON.stringify(next));
  }

  function addCategory() {
    const value = categoryInput.trim();
    if (value.length === 0 || categories.includes(value)) return;
    persistCategories([...categories, value]);
    setCategoryInput("");
  }

  function addProduct() {
    if (productSelect.length === 0 || products.includes(productSelect)) return;
    persistProducts([...products, productSelect]);
    setProductSelect("");
  }

  const watchedProducts = products
    .map((id) => productCatalog.find((e) => e.id === id))
    .filter((entry): entry is (typeof productCatalog)[number] => Boolean(entry));

  const availableProducts = productCatalog.filter((e) => !products.includes(e.id));

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.watchlists.categoriesTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              addCategory();
            }}
          >
            <Input
              onChange={(event) => setCategoryInput(event.target.value)}
              placeholder={m.watchlists.addPlaceholder}
              value={categoryInput}
            />
            <Button type="submit" variant="outline">
              <Plus />
              {m.watchlists.addCategory}
            </Button>
          </form>

          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m.watchlists.emptyCategories}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge className="gap-1 py-1 pr-1 pl-2.5" key={category} variant="secondary">
                  {category}
                  <button
                    aria-label={`${m.watchlists.remove}: ${category}`}
                    className="grid size-4 place-items-center rounded-sm hover:bg-foreground/10"
                    onClick={() => persistCategories(categories.filter((c) => c !== category))}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.watchlists.productsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <NativeSelect
              className="w-full flex-1"
              onChange={(event) => setProductSelect(event.target.value)}
              value={productSelect}
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {availableProducts.map((entry) => (
                <NativeSelectOption key={entry.id} value={entry.id}>
                  {entry.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button disabled={productSelect.length === 0} onClick={addProduct} type="button" variant="outline">
              <Plus />
              {m.watchlists.addCategory}
            </Button>
          </div>

          {watchedProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m.watchlists.emptyProducts}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {watchedProducts.map((entry) => (
                <li className="flex items-center justify-between gap-2 text-sm" key={entry.id}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {m.labels.directionShort[entry.bestDirection]}
                    </span>
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <Button
                    aria-label={`${m.watchlists.remove}: ${entry.name}`}
                    onClick={() => persistProducts(products.filter((id) => id !== entry.id))}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
