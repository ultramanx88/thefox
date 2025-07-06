import { CategorySuggestion } from "@/components/CategorySuggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create a New Listing</CardTitle>
          <CardDescription>
            Fill out the details below to list your product on the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input id="productName" placeholder="e.g., Handmade Ceramic Mug" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your product's features, materials, and dimensions." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">Quantity in Stock</Label>
                    <Input id="stock" type="number" placeholder="10" />
                </div>
            </div>

            <CategorySuggestion />

            <Button type="submit" size="lg" className="w-full md:w-auto bg-accent hover:bg-accent/90">
              List Product
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
