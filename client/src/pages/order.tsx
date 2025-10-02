import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { formatIDR } from "@/lib/utils";
import type { Category, PriceTier } from "@shared/schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const orderFormSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  priceTierId: z.string().optional(),
  customerName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export default function OrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category') || "";
  const tierFromUrl = urlParams.get('tier') || "";
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryFromUrl);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');
  const [snapLoaded, setSnapLoaded] = useState(false);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', { active: true }],
    queryFn: async () => {
      const response = await fetch('/api/categories?active=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: tiers, isLoading: tiersLoading } = useQuery<PriceTier[]>({
    queryKey: ['/api/categories', selectedCategoryId, 'tiers'],
    enabled: !!selectedCategoryId,
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      categoryId: categoryFromUrl,
      priceTierId: tierFromUrl,
      customerName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const selectedCategory = categories?.find(cat => cat.id === form.watch("categoryId"));
  const selectedTier = tiers?.find(tier => tier.id === form.watch("priceTierId"));
  
  const totalPrice = selectedTier ? selectedTier.price : (selectedCategory?.basePrice || 0);
  const dpAmount = Math.round(totalPrice * 0.3);

  useEffect(() => {
    const snapScript = document.createElement('script');
    snapScript.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    snapScript.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    snapScript.onload = () => setSnapLoaded(true);
    document.body.appendChild(snapScript);

    return () => {
      document.body.removeChild(snapScript);
    };
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await apiRequest('POST', '/api/orders', data);
      return response.json();
    },
    onSuccess: (data: { snapToken: string; redirect_url: string; orderId: string }) => {
      if (window.snap && snapLoaded) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            setPaymentStatus('success');
            toast({
              title: "Payment Successful!",
              description: "Your down payment has been processed. We'll contact you soon.",
            });
          },
          onPending: () => {
            setPaymentStatus('pending');
            toast({
              title: "Payment Pending",
              description: "Your payment is being processed. Please complete the payment.",
            });
          },
          onError: () => {
            setPaymentStatus('error');
            toast({
              title: "Payment Failed",
              description: "There was an error processing your payment. Please try again.",
              variant: "destructive",
            });
          },
          onClose: () => {
            if (paymentStatus === 'idle') {
              toast({
                title: "Payment Cancelled",
                description: "You closed the payment window.",
              });
            }
          }
        });
      } else {
        window.open(data.redirect_url, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Order Failed",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto" data-testid="card-payment-success">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <CardTitle>Payment Successful!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Thank you for your order! Your down payment has been processed successfully.
                We'll contact you soon to schedule a consultation.
              </p>
              <Button onClick={() => window.location.href = '/'} data-testid="button-back-home">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto" data-testid="card-payment-pending">
            <CardHeader>
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Payment Pending</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your payment is being processed. Please complete the payment to confirm your order.
              </p>
              <Button onClick={() => window.location.href = '/'} data-testid="button-back-home">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Order Photography Package</CardTitle>
            <CardDescription>
              Fill out the form below to order your photography package. You'll pay a 30% down payment to secure your booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Category *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCategoryId(value);
                          form.setValue("priceTierId", "");
                        }}
                        value={field.value}
                        disabled={categoriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id} data-testid={`option-category-${category.slug}`}>
                              {category.name} - {formatIDR(category.basePrice)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the photography package category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCategoryId && tiers && tiers.length > 0 && (
                  <FormField
                    control={form.control}
                    name="priceTierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Tier (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={tiersLoading}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-tier">
                              <SelectValue placeholder="Select a tier or use base price" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiers?.map((tier) => (
                              <SelectItem key={tier.id} value={tier.id} data-testid={`option-tier-${tier.id}`}>
                                {tier.name} - {formatIDR(tier.price)}
                                {tier.description && ` (${tier.description})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optionally select a specific tier for this category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+62 812 3456 7890" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or additional information..."
                          className="resize-none"
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {totalPrice > 0 && (
                  <Alert data-testid="alert-price-summary">
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Total Price:</span>
                          <span data-testid="text-total-price">{formatIDR(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Down Payment (30%):</span>
                          <span data-testid="text-dp-amount" className="font-semibold">{formatIDR(dpAmount)}</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createOrderMutation.isPending || !totalPrice}
                  data-testid="button-submit-order"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay Down Payment ${dpAmount > 0 ? formatIDR(dpAmount) : ''}`
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
