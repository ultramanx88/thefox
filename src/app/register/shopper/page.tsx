import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bike, Car, Truck } from "lucide-react";

export default function DeliveryRegistrationPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl">Become a Delivery Driver</CardTitle>
          <CardDescription>
            Join our delivery network and start earning by delivering goods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="e.g., John Appleseed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 555-5555" />
            </div>

            <div className="space-y-3 pt-2">
              <Label>Vehicle Type</Label>
              <RadioGroup defaultValue="motorcycle" className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="motorcycle" id="motorcycle" className="peer sr-only" />
                  <Label
                    htmlFor="motorcycle"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Bike className="mb-3 h-6 w-6" />
                    Motorcycle
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="car" id="car" className="peer sr-only" />
                  <Label
                    htmlFor="car"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Car className="mb-3 h-6 w-6" />
                    Car
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <p className="text-xs text-muted-foreground pt-2">
                We'll use your location to connect you with nearby delivery requests.
            </p>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
              Start Delivering
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
