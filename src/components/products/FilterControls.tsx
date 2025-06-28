
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X, Filter as FilterIcon } from 'lucide-react';

interface FilterControlsProps {
  categories: string[];
  materials: string[];
  maxPrice: number;
}

const ALL_FILTER_VALUE = "__ALL__";

export default function FilterControls({ categories, materials, maxPrice }: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || ALL_FILTER_VALUE);
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('material') || ALL_FILTER_VALUE);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || maxPrice,
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name_asc');

  useEffect(() => {
    // Update price range if maxPrice changes (e.g., initial load)
    // Also, ensure the current max of the range doesn't exceed the new overall maxPrice
    setPriceRange(prev => [prev[0], Math.min(prev[1] === 0 ? maxPrice : prev[1], maxPrice)]);
  }, [maxPrice]);
  
  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory && selectedCategory !== ALL_FILTER_VALUE) params.set('category', selectedCategory); else params.delete('category');
    if (selectedMaterial && selectedMaterial !== ALL_FILTER_VALUE) params.set('material', selectedMaterial); else params.delete('material');
    params.set('minPrice', String(priceRange[0]));
    params.set('maxPrice', String(priceRange[1]));
    params.set('sortBy', sortBy);
    
    // Keep existing search query if present
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
        params.set('search', currentSearch);
    }
    const currentResults = searchParams.get('results');
    if (currentResults) {
        params.set('results', currentResults);
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setSelectedCategory(ALL_FILTER_VALUE);
    setSelectedMaterial(ALL_FILTER_VALUE);
    setPriceRange([0, maxPrice]);
    setSortBy('name_asc');
    const params = new URLSearchParams();
    
    const currentSearch = searchParams.get('search');
    if (currentSearch) params.set('search', currentSearch);
    const currentResults = searchParams.get('results');
    if (currentResults) params.set('results', currentResults);
    //sortBy will be reset by handleFilterChange if apply is clicked next, or by its default in useState on navigation
    
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters = 
    selectedCategory !== ALL_FILTER_VALUE || 
    selectedMaterial !== ALL_FILTER_VALUE || 
    priceRange[0] !== 0 || 
    priceRange[1] !== maxPrice || 
    sortBy !== 'name_asc';

  return (
    <aside className="w-full md:w-72 lg:w-80 space-y-6 p-4 bg-card rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-headline font-semibold text-foreground flex items-center">
          <FilterIcon className="mr-2 h-5 w-5 text-accent"/> Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-accent hover:text-accent/80">
            <X className="mr-1 h-3 w-3" /> Clear All
          </Button>
        )}
      </div>
      
      <Accordion type="multiple" defaultValue={['category', 'price']} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-medium hover:text-accent">Category</AccordionTrigger>
          <AccordionContent className="pt-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="material">
          <AccordionTrigger className="text-base font-medium hover:text-accent">Material</AccordionTrigger>
          <AccordionContent className="pt-2">
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="All Materials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Materials</SelectItem>
                {materials.map(material => (
                  <SelectItem key={material} value={material}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-medium hover:text-accent">Price Range</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            <Slider
              min={0}
              max={maxPrice}
              step={1}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={(newRange) => setPriceRange(newRange as [number, number])}
              className="[&>span:first-child]:h-2 [&>span:first-child>span]:bg-accent [&_[role=slider]]:bg-accent [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:border-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange(prev => [Number(e.target.value), prev[1]])}
                className="w-20 h-8 text-center"
                aria-label="Minimum price"
              />
              <span>-</span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange(prev => [prev[0], Number(e.target.value)])}
                className="w-20 h-8 text-center"
                aria-label="Maximum price"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="sort">
          <AccordionTrigger className="text-base font-medium hover:text-accent">Sort By</AccordionTrigger>
          <AccordionContent className="pt-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={handleFilterChange} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-subtle-animate">Apply Filters</Button>
    </aside>
  );
}
