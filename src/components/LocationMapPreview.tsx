import { useState, useEffect, useRef } from "react";
import { ExternalLink, MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyC5O6oJjt66t69ylhhi2I2VJAUS46iy2JY";

interface LocationMapPreviewProps {
  location: string;
  className?: string;
  showMapOnly?: boolean;
}

export function LocationMapPreview({ location, className, showMapOnly = false }: LocationMapPreviewProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    // Load Google Maps script if not loaded
    if (!(window as any).google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => geocodeLocation();
      document.head.appendChild(script);
    } else {
      geocodeLocation();
    }
  }, [location]);

  const geocodeLocation = () => {
    if (!(window as any).google?.maps) {
      setLoading(false);
      return;
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new (window as any).google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ address: location }, (results: any, status: string) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        setCoordinates({ lat: loc.lat(), lng: loc.lng() });
      }
      setLoading(false);
    });
  };

  const openGoogleMaps = () => {
    if (coordinates) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
        "_blank"
      );
    }
  };

  if (!location) return null;

  const mapUrl = coordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=600x200&scale=2&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${GOOGLE_MAPS_API_KEY}`
    : null;

  // Show only the map
  if (showMapOnly) {
    return (
      <div className={className}>
        {mapUrl && !loading && (
          <button
            type="button"
            onClick={openGoogleMaps}
            className="relative w-full h-40 rounded-xl overflow-hidden group cursor-pointer"
          >
            <img
              src={mapUrl}
              alt={`Map of ${location}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium shadow-md">
                <ExternalLink className="h-4 w-4" />
                Google Maps
              </div>
            </div>
          </button>
        )}

        {loading && (
          <div className="w-full h-40 rounded-xl bg-muted animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Clickable Address */}
      <button
        type="button"
        onClick={openGoogleMaps}
        className="flex items-center gap-3 w-full text-left group"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-sm text-foreground group-hover:text-primary group-hover:underline transition-colors">
          {location}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
      </button>

      {/* Map Preview */}
      {mapUrl && !loading && (
        <button
          type="button"
          onClick={openGoogleMaps}
          className="relative w-full h-32 rounded-xl overflow-hidden group cursor-pointer mt-3"
        >
          <img
            src={mapUrl}
            alt={`Map of ${location}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium shadow-md">
              <ExternalLink className="h-4 w-4" />
              Google Maps
            </div>
          </div>
        </button>
      )}

      {loading && mapUrl === null && (
        <div className="w-full h-32 rounded-xl bg-muted animate-pulse mt-3" />
      )}
    </div>
  );
}
