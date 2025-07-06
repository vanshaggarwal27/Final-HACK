import { MapPin, Navigation, Leaf } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MapDisplaySection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Interactive Route Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize optimized delivery routes and store locations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardContent className="p-6 h-full">
              <div className="flex flex-col items-center justify-center h-full text-center bg-muted/50 rounded-lg">
                <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Interactive Map Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  The map will display optimized delivery routes, store
                  locations, and real-time route information using MapTiler
                  tiles and Leaflet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Navigation className="h-5 w-5" />
                Route Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Distance
                </span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated Time
                </span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Stores</span>
                <span className="font-medium">--</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Leaf className="h-5 w-5" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  CO₂ Emissions
                </span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Fuel Consumption
                </span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Route Efficiency
                </span>
                <span className="font-medium">--</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
