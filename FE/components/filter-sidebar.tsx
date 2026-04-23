"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface FilterState {
  categories: string[]
  brands: string[]
  forms: string[]
  priceRange: [number, number]
  inStock: boolean
  minRating: number
}

export function FilterSidebar() {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    forms: [],
    priceRange: [0, 1000000],
    inStock: false,
    minRating: 0,
  })

  const categories = [
    "Không kê đơn",
    "Kê đơn",
    "Vitamin & Thực phẩm chức năng",
    "Thiết bị y tế",
    "Chăm sóc cá nhân",
    "Mẹ & Bé",
  ]

  const brands = ["Sanofi", "Pfizer", "GSK", "Abbott", "Bayer", "Traphaco", "Dược Hậu Giang"]

  const forms = ["Viên nén", "Viên nang", "Siro", "Gel/Kem", "Dung dịch", "Bột pha"]

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value) ? currentArray.filter((v) => v !== value) : [...currentArray, value]
      return { ...prev, [key]: newArray }
    })
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      forms: [],
      priceRange: [0, 1000000],
      inStock: false,
      minRating: 0,
    })
  }

  const activeFilterCount =
    filters.categories.length + filters.brands.length + filters.forms.length + (filters.inStock ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bộ lọc</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...filters.categories, ...filters.brands, ...filters.forms].map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  if (filters.categories.includes(filter)) toggleFilter("categories", filter)
                  if (filters.brands.includes(filter)) toggleFilter("brands", filter)
                  if (filters.forms.includes(filter)) toggleFilter("forms", filter)
                }}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Khoảng giá</Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))}
          max={1000000}
          step={10000}
          className="w-full"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filters.priceRange[0].toLocaleString("vi-VN")}đ</span>
          <span>{filters.priceRange[1].toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Danh mục</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleFilter("categories", category)}
              />
              <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Thương hiệu</Label>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleFilter("brands", brand)}
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm font-normal cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Dạng bào chế</Label>
        <div className="space-y-2">
          {forms.map((form) => (
            <div key={form} className="flex items-center gap-2">
              <Checkbox
                id={`form-${form}`}
                checked={filters.forms.includes(form)}
                onCheckedChange={() => toggleFilter("forms", form)}
              />
              <Label htmlFor={`form-${form}`} className="text-sm font-normal cursor-pointer">
                {form}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Status */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Tình trạng</Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, inStock: checked as boolean }))}
          />
          <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
            Còn hàng
          </Label>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Đánh giá</Label>
        <div className="space-y-2">
          {[5, 4, 3].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.minRating === rating}
                onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, minRating: checked ? rating : 0 }))}
              />
              <Label htmlFor={`rating-${rating}`} className="text-sm font-normal cursor-pointer flex items-center">
                {rating} ⭐ trở lên
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
