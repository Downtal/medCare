import { getApiBaseUrl } from "@/lib/config"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Stethoscope, Heart, Thermometer } from "lucide-react"
import type { Category, Product } from "@/lib/types"

async function getCategories() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/product-service/api/categories`, { 
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return res.json() as Promise<Category[]>;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/product-service/api/products`, { 
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { content: [] };
  }
}

const categoryIcons = {
  "Không kê đơn": Pill,
  "Kê đơn": Stethoscope,
  "Vitamin": Heart,
  "Thiết bị y tế": Thermometer,
};

export default async function HomePage() {
  const categories = await getCategories();
  const productsData = await getFeaturedProducts();
  const products = Array.isArray(productsData) ? productsData : (productsData?.content || []);
  const featuredProducts = products.slice(0, 4); // Lấy 4 sản phẩm đầu tiên

  const displayCategories = categories.length > 0 ? categories.slice(0, 4).map(c => ({
    id: c.id,
    name: c.name,
    icon: categoryIcons[c.name as keyof typeof categoryIcons] || Pill
  })) : [];


  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Nhà thuốc trực tuyến uy tín</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
                Mua thuốc an toàn, nhanh chóng với tư vấn dược sĩ 24/7
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {displayCategories.map((category) => (
                  <Badge
                    key={category.name}
                    variant="outline"
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Sản phẩm nổi bật</h2>
                <p className="text-muted-foreground">Được tin dùng nhất tại MedCare</p>
              </div>
              <Button variant="outline">Xem tất cả</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product: Product, index: number) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id.toString()}
                  slug={product.slug}
                  name={product.name}
                  ingredient={product.activeIngredients || ""}
                  price={product.price}
                  rating={4.5} 
                  image={product.primaryImageUrl || "/placeholder.svg"}
                  requiresPrescription={product.requiresPrescription}
                  priority={index < 4}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Medical Warning Banner */}
        <section className="py-8 bg-warning/20 border-y border-warning/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm md:text-base text-warning-foreground">
                <strong>Lưu ý:</strong> Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ. 
                Vui lòng tham khảo ý kiến bác sĩ hoặc dược sĩ trước khi sử dụng.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayCategories.map((category) => (
                <Button
                  key={category.name}
                  variant="outline"
                  className="h-32 flex-col gap-3 text-lg hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                >
                  <category.icon className="h-8 w-8" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>


        {/* Consultation CTA */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-primary text-primary-foreground rounded-xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Cần tư vấn dược sĩ?</h2>
              <p className="text-lg mb-6 opacity-90">Đội ngũ dược sĩ giàu kinh nghiệm sẵn sàng tư vấn miễn phí 24/7</p>
              <Button size="lg" variant="secondary">
                Liên hệ ngay
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
