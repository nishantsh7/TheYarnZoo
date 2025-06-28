
"use client";

import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { ProductFormData, ProductActionResponse } from '@/actions/productActions';


export const productFormSchema = z.object({
  _id: z.string().optional(), 
  name: z.string().min(3, "Name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0.01, "Price must be a positive value."),
  category: z.string().min(2, "Category is required."),
  material: z.string().min(2, "Material is required."),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer."),
  images: z.array(z.string().url("Must be a valid URL.")).min(1, "At least one image is required."),
});


interface ProductFormProps {
  initialData?: Product | null;
  onSubmitForm: (data: ProductFormData) => Promise<ProductActionResponse>;
  isEditing?: boolean;
}

export default function ProductForm({ initialData, onSubmitForm, isEditing = false }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const defaultFormValues = initialData ? {
    ...initialData,
    _id: initialData._id,
    images: initialData.images?.length > 0 ? initialData.images : [''],
  } : {
    name: '',
    slug: '',
    description: '',
    price: 0,
    category: '',
    material: '',
    stock: 0,
    images: [''],
  };


  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      const dataToSubmit = isEditing && initialData?._id ? { ...data, _id: initialData._id } : data;
      
      const response = await onSubmitForm(dataToSubmit);

      if (response.success) {
        toast({
          title: `Product ${isEditing ? 'Updated' : 'Created'}!`,
          description: response.message,
        });
        router.push('/admin/products');
        router.refresh(); 
      } else {
        toast({
          title: `Error ${isEditing ? 'Updating' : 'Creating'} Product`,
          description: response.message,
          variant: 'destructive',
        });
      }
    } catch (error) { 
      toast({
        title: "An Unexpected Error Occurred",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: 'destructive',
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue('name', newName);
    if (!form.formState.dirtyFields.slug && !isEditing) { 
      const slug = newName
        .toLowerCase()
        .replace(/\s+/g, '-') 
        .replace(/[^\w-]+/g, '');
      form.setValue('slug', slug);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">{isEditing ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {isEditing && initialData?._id && (
              <input type="hidden" {...form.register('_id')} value={initialData._id} />
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input {...field} onChange={handleNameChange} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Slug</FormLabel>
                  <FormControl><Input {...field} disabled={isEditing} /></FormControl>
                  <FormDescription>Unique identifier for URL (e.g., yarny-elephant). {isEditing ? "Cannot be changed after creation." : ""}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={5} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="stock" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="material" render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <div>
              <FormLabel>Product Images (URLs)</FormLabel>
              <FormDescription className="mb-2">
                Upload images to a hosting service (e.g., Imgur, Cloudinary, Firebase Storage) and paste the direct URLs here. The first image is the main display.
              </FormDescription>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`images.${index}`}
                  render={({ field: imageField }) => (
                    <FormItem className="flex items-center gap-2 mb-2">
                      <FormControl>
                        <Input placeholder="https://placehold.co/600x400.png" {...imageField} />
                      </FormControl>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                       <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append('')} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Image URL
              </Button>
            </div>
            
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Product')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
