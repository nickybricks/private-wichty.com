import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const GOOGLE_MAPS_API_KEY = "AIzaSyC5O6oJjt66t69ylhhi2I2VJAUS46iy2JY";

interface LocationInputProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  placeholder?: string;
  className?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function LocationInput({ value, onChange, placeholder, className }: LocationInputProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initServices;
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initServices = () => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      if (mapRef.current) {
        placesService.current = new google.maps.places.PlacesService(mapRef.current);
      }
    }
  };

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);
    setSelectedPlaceId(null);
    setCoordinates(null);

    if (!inputValue.trim() || !autocompleteService.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input: inputValue,
        types: ["establishment", "geocode"],
      });
      setPredictions(response.predictions || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Places autocomplete error:", error);
      setPredictions([]);
    }
  };

  const handleSelectPlace = (prediction: PlacePrediction) => {
    onChange(prediction.description, prediction.place_id);
    setSelectedPlaceId(prediction.place_id);
    setPredictions([]);
    setIsOpen(false);

    // Get coordinates for the selected place
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: prediction.place_id, fields: ["geometry"] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            setCoordinates({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  const openGoogleMaps = () => {
    if (coordinates) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`,
        "_blank"
      );
    } else if (value) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`,
        "_blank"
      );
    }
  };

  const mapUrl = coordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=400x150&scale=2&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <div ref={containerRef} className={cn("relative space-y-2", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10"
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Predictions dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors flex items-start gap-2"
              onClick={() => handleSelectPlace(prediction)}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map preview */}
      {mapUrl && value && (
        <button
          type="button"
          onClick={openGoogleMaps}
          className="relative w-full h-24 rounded-lg overflow-hidden group cursor-pointer"
        >
          <img
            src={mapUrl}
            alt="Location map"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
              <ExternalLink className="h-3 w-3" />
              Google Maps
            </div>
          </div>
        </button>
      )}

      {/* Clickable address */}
      {value && coordinates && (
        <button
          type="button"
          onClick={openGoogleMaps}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          {value}
        </button>
      )}

      {/* Hidden div for PlacesService */}
      <div ref={mapRef} className="hidden" />
    </div>
  );
}
