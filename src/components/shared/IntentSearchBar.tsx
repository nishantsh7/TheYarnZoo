
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { intentBasedSearchAction } from '@/actions/searchActions';

const IntentSearchBar = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await intentBasedSearchAction({ query });
      if (result.productNames && result.productNames.length > 0) {
        // For simplicity, redirect to products page with search query
        // A more sophisticated approach would be to pass product IDs or slugs
        // Or update a shared state that a product list component listens to.
        router.push(`/products?search=${encodeURIComponent(query)}&results=${encodeURIComponent(result.productNames.join(','))}`);
      } else {
        toast({
          title: "No products found",
          description: "We couldn't find products matching your description. Try being more specific or check our categories.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Intent search failed:", error);
      toast({
        title: "Search Error",
        description: "Something went wrong with the search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe a toy (e.g., 'a soft blue bunny for a baby')"
        className="rounded-r-none focus-visible:ring-offset-0 focus-visible:ring-0"
        aria-label="Search for products by description"
      />
      <Button type="submit" className="rounded-l-none bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading} aria-label="Submit search">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
      </Button>
    </form>
  );
};

export default IntentSearchBar;
