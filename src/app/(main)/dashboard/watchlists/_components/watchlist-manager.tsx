"use client";

import * as React from "react";

import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n/use-i18n";
import { productCatalog } from "@/lib/research/mock-data";
import { addWatch, loadWatchlist, removeWatch, type WatchItem } from "@/lib/research/watchlist-source";

export function WatchlistManager() {
  const { m } = useI18n();

  const [items, setItems] = React.useState<WatchItem[]>([]);
  const [categoryInput, setCategoryInput] = React.useState("");
  const [productSelect, setProductSelect] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    void loadWatchlist().then((loaded) => {
      if (!cancelled) setItems(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryItems = items.filter((item) => item.kind === "category");
  const productItems = items.filter((item) => item.kind === "product");
  const watchedProductValues = new Set(productItems.map((item) => item.value));
  const availableProducts = productCatalog.filter((entry) => !watchedProductValues.has(entry.id));

  async function handleAddCategory() {
    const value = categoryInput.trim();
    if (value.length === 0) return;
    setItems(await addWatch("category", value));
    setCategoryInput("");
  }

  async function handleAddProduct() {
    if (productSelect.length === 0) return;
    setItems(await addWatch("product", productSelect));
    setProductSelect("");
  }

  async function handleRemove(item: WatchItem) {
    setItems(await removeWatch(item));
  }

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
              void handleAddCategory();
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

          {categoryItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m.watchlists.emptyCategories}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoryItems.map((item) => (
                <Badge className="gap-1 py-1 pr-1 pl-2.5" key={item.key} variant="secondary">
                  {item.value}
                  <button
                    aria-label={`${m.watchlists.remove}: ${item.value}`}
                    className="grid size-4 place-items-center rounded-sm hover:bg-foreground/10"
                    onClick={() => void handleRemove(item)}
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
            <Button
              disabled={productSelect.length === 0}
              onClick={() => void handleAddProduct()}
              type="button"
              variant="outline"
            >
              <Plus />
              {m.watchlists.addCategory}
            </Button>
          </div>

          {productItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m.watchlists.emptyProducts}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {productItems.map((item) => {
                const entry = productCatalog.find((e) => e.id === item.value);
                return (
                  <li className="flex items-center justify-between gap-2 text-sm" key={item.key}>
                    <span className="flex min-w-0 items-center gap-1.5">
                      {entry ? (
                        <span className="shrink-0 text-muted-foreground text-xs">
                          {m.labels.directionShort[entry.bestDirection]}
                        </span>
                      ) : null}
                      <span className="truncate">{entry ? entry.name : item.value}</span>
                    </span>
                    <Button
                      aria-label={`${m.watchlists.remove}: ${entry ? entry.name : item.value}`}
                      onClick={() => void handleRemove(item)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
