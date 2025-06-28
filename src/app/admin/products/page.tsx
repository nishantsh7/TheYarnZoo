
"use client"; 

import Link from 'next/link';
import Image from 'next/image';
import { getAdminProducts, deleteProductAction, type ProductActionResponse } from '@/actions/productActions';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect, startTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); 
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      const fetchedProducts = await getAdminProducts();
      setProducts(fetchedProducts);
      setIsLoading(false);
    }
    fetchProducts();
  }, []);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !productToDelete._id) return;
    
    setIsDeleting(productToDelete._id); 

    const response: ProductActionResponse = await deleteProductAction(productToDelete._id);
    
    if (response.success) {
      toast({ title: "Success", description: response.message });
      setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
       startTransition(() => { 
         router.refresh();
       });
    } else {
      toast({ title: "Error", description: response.message, variant: "destructive" });
    }
    
    setShowDeleteDialog(false);
    setProductToDelete(null);
    setIsDeleting(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-headline font-bold text-gray-800">Manage Products</h1>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
            </Link>
          </Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Product List</CardTitle><CardDescription>Loading products...</CardDescription></CardHeader>
          <CardContent className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold text-gray-800">Manage Products</h1>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">
          <Link href="/admin/products/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Product List</CardTitle>
            <CardDescription>View, edit, or delete products from your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: Product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <Image 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/48x48.png'} 
                      alt={product.name} 
                      width={48} 
                      height={48} 
                      className="rounded-md object-cover"
                      data-ai-hint={`${product.category.toLowerCase()} ${product.name.toLowerCase().split(' ')[0]}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 0 ? (product.stock < 10 ? "secondary" : "default") : "destructive"} 
                           className={product.stock > 0 ? (product.stock < 10 ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-green-100 text-green-800 border-green-300") : "bg-red-100 text-red-800 border-red-300"}>
                      {product.stock > 0 ? (product.stock < 10 ? "Low Stock" : "In Stock") : "Out of Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!!isDeleting}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/edit/${product.slug}`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => handleDeleteClick(product)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer"
                            disabled={isDeleting === product._id}
                        >
                          {isDeleting === product._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {products.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-10">No products found. Add your first product!</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}" and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={!!isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
