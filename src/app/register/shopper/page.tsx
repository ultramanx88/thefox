import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export default function ShopperRegistrationPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl">Become a Shopper</CardTitle>
          <CardDescription>
            Join our community of personal shoppers and start earning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="e.g., Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 555-5555" />
            </div>
            <p className="text-xs text-muted-foreground pt-2">
                Location services will be requested to connect you with nearby customers.
            </p>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
              Start Shopping
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
