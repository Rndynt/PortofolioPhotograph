import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import type { Category, PriceTier } from "@shared/schema";

export default function PricingSection() {
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories', { active: true }],
    queryFn: async () => {
      const response = await fetch('/api/categories?active=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  if (categoriesLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categoriesError) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load pricing packages. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-black">Our Packages</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose the perfect photography package for your needs. Each package is customizable to fit your vision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const { data: tiers, isLoading: tiersLoading } = useQuery<PriceTier[]>({
    queryKey: ['/api/categories', category.id, 'tiers'],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${category.id}/tiers`);
      if (!response.ok) throw new Error('Failed to fetch tiers');
      return response.json();
    }
  });

  const activeTiers = tiers?.filter(tier => tier.isActive) || [];

  return (
    <Card 
      className="flex flex-col hover:shadow-lg transition-shadow duration-300"
      data-testid={`card-package-${category.id}`}
    >
      <CardHeader>
        <CardTitle className="text-2xl">{category.name}</CardTitle>
        {category.description && (
          <CardDescription className="text-base">{category.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <div className="text-3xl font-bold text-black mb-2">
            {formatIDR(category.basePrice)}
          </div>
          <p className="text-sm text-gray-500">Starting price</p>
        </div>

        {tiersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : activeTiers.length > 0 ? (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Available Tiers:</p>
              {activeTiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black">{tier.name}</h4>
                      {tier.description && (
                        <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-black">
                      {formatIDR(tier.price)}
                    </span>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      data-testid={`button-book-tier-${tier.id}`}
                    >
                      <a href={`/order?category=${category.id}&tier=${tier.id}`}>
                        Book Tier
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button 
          asChild 
          className="w-full"
          data-testid={`button-book-${category.id}`}
        >
          <a href={`/order?category=${category.id}`}>
            Book Now
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
