"use client"

import { getApiBaseUrl } from "@/lib/config"
import { useEffect, useState } from "react"
import { Search, History, TrendingUp, X, Command, Flame, Sparkles, LayoutGrid } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { getOptimizedImageUrl } from "@/lib/utils"

interface SearchSuggestion {
  products: {
    id: number;
    name: string;
    slug: string;
    primaryImageUrl: string;
    price: number;
    packingUnit: string;
    requiresPrescription: boolean;
  }[];
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  relatedKeywords: string[];
  trendingKeywords: string[];
}

interface SearchOverlayProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectKeyword: (keyword: string) => void;
}

export function SearchOverlay({ query, isOpen, onClose, onSelectKeyword }: SearchOverlayProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("search_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions(null);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const url = query.length >= 2
          ? `${getApiBaseUrl()}/product-service/api/products/search-suggestions?q=${encodeURIComponent(query)}`
          : `${getApiBaseUrl()}/product-service/api/products/search-suggestions?q=`; // Empty query to get trending

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        } else {
          setSuggestions(null);
        }
      } catch (error) {
        console.warn("Search suggestions failed (API down)");
        setSuggestions(null);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isOpen]);

  // Highlighting function
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    // If no parts matched the regex (split returned only the text), return normal text
    if (parts.length === 1) {
      return <span className="text-muted-foreground font-medium">{text}</span>;
    }

    return (
      <span className="font-medium">
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase()
            ? <span key={i} className="font-bold text-foreground">{part}</span>
            : <span key={i} className="text-muted-foreground opacity-90">{part}</span>
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  const removeHistoryItem = (item: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = history.filter(h => h !== item);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.2)] border border-border overflow-hidden z-[60] animate-in fade-in slide-in-from-top-1 duration-200"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="max-h-[75vh] overflow-y-auto no-scrollbar">
        {query.length < 2 ? (
          <div className="p-4 space-y-6">
            {/* Lịch sử tìm kiếm */}
            {history.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest px-2 mb-2 uppercase">LỊCH SỬ</h3>
                <div className="space-y-0.5">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl cursor-pointer"
                      onClick={() => onSelectKeyword(item)}
                    >
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                      <button onClick={(e) => removeHistoryItem(item, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Xu hướng */}
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest px-2 mb-3 uppercase">GỢI Ý TỪ KHÓA</h3>
              <div className="flex flex-wrap gap-2 px-1">
                {(suggestions?.trendingKeywords || ["Sữa rửa mặt", "Siro", "Khẩu trang"]).map((kw) => (
                  <Badge
                    key={kw}
                    variant="secondary"
                    className="px-4 py-1.5 rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors"
                    onClick={() => onSelectKeyword(kw)}
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Keywords/Phrases Section */}
            {suggestions?.relatedKeywords && suggestions.relatedKeywords.length > 0 && (
              <div className="pb-2">
                {suggestions.relatedKeywords.slice(0, 2).map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelectKeyword(kw)}
                  >
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm leading-relaxed truncate">
                      {highlightText(kw, query)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Categories Section */}
            {suggestions?.categories && suggestions.categories.length > 0 && (
              <div className="bg-muted/10 border-y border-muted/50">
                {suggestions.categories.slice(0, 2).map(cat => (
                  <Link
                    key={cat.id}
                    href={`/cua-hang?category=${cat.slug}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                    onClick={() => onClose()}
                  >
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      <span className="text-primary/70 mr-1.5 italic">Danh mục</span>
                      {highlightText(cat.name, query)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Products Section */}
            <div className="divide-y divide-muted/50">
              {suggestions?.products.map(product => (
                <Link
                  key={product.id}
                  href={`/san-pham/${product.slug}`}
                  className="flex items-center gap-5 px-5 py-4 hover:bg-muted/30 transition-colors group"
                  onClick={() => onClose()}
                >
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-border bg-white shrink-0 shadow-sm">
                    <Image
                      src={getOptimizedImageUrl(product.primaryImageUrl)}
                      alt={product.name}
                      fill
                      unoptimized={product.primaryImageUrl?.includes("cloudinary")}
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="text-[15px] font-medium leading-normal mb-1 line-clamp-2">
                      {highlightText(product.name, query)}
                    </h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-foreground">
                        {product.price ? product.price.toLocaleString("vi-VN") : "0"}đ
                      </span>
                      <span className="text-xs text-muted-foreground"> / {product.packingUnit || "Hộp"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {!loading && suggestions?.products.length === 0 && suggestions?.categories.length === 0 && (
              <div className="p-10 text-center text-muted-foreground italic text-sm">
                Không tìm thấy kết quả nào cho "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
