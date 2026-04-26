"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyUtils } from "@/lib/currency";
import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  primaryImageUrl: string;
  requiresPrescription: boolean;
}

export function ProductCarousel({ ids }: { ids: number[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchProducts = async () => {
      try {
        // Fetch product details from product-service
        const validIds = ids.filter(id => id && id > 0).slice(0, 5);
        if (validIds.length === 0) {
          setLoading(false);
          return;
        }

        const promises = validIds.map(id => 
          fetch(`${getApiBaseUrl()}${API_ENDPOINTS.PRODUCT}/${id}`)
            .then(res => res.ok ? res.json() : null)
        );
        const results = (await Promise.all(promises)).filter(p => p !== null) as Product[];
        setProducts(results);
      } catch (error) {
        console.error("Failed to fetch products for carousel", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [ids]);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-3 w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-3 w-max px-1">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="w-[160px] overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative aspect-square w-full bg-slate-50">
                <Image
                  src={product.primaryImageUrl || "/placeholder-medicine.png"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {index === 0 && (
                  <Badge className="absolute top-1 left-1 bg-amber-500 text-[8px] h-4 px-1">Phù hợp nhất</Badge>
                )}
                {product.requiresPrescription && (
                  <Badge variant="destructive" className="absolute bottom-1 right-1 text-[8px] h-4 px-1">Kê đơn</Badge>
                )}
              </div>
              <div className="p-2">
                <h4 className="text-[11px] font-medium line-clamp-2 h-8 leading-tight mb-1">
                  {product.name}
                </h4>
                <div className="flex flex-col gap-1.5">
                  <span className="text-primary font-bold text-[12px]">
                    {CurrencyUtils.formatVND(product.price)}
                  </span>
                  <Link href={`/san-pham/${product.slug}`} target="_blank">
                    <Button size="sm" variant="outline" className="w-full h-7 text-[10px] gap-1 px-1">
                      Chi tiết <ExternalLink size={10} />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
