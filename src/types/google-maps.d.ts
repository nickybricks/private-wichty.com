declare namespace google.maps {
  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
    ): void;
  }

  interface GeocoderRequest {
    address?: string;
    placeId?: string;
  }

  interface GeocoderResult {
    geometry: {
      location: LatLng;
    };
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  type GeocoderStatus = "OK" | "ZERO_RESULTS" | "ERROR";

  namespace places {
    class AutocompleteService {
      getPlacePredictions(
        request: AutocompletionRequest
      ): Promise<AutocompleteResponse>;
    }

    class PlacesService {
      constructor(attrContainer: HTMLDivElement | null);
      getDetails(
        request: PlaceDetailsRequest,
        callback: (
          result: PlaceResult | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    interface AutocompletionRequest {
      input: string;
      types?: string[];
    }

    interface AutocompleteResponse {
      predictions: AutocompletePrediction[];
    }

    interface AutocompletePrediction {
      place_id: string;
      description: string;
      structured_formatting: {
        main_text: string;
        secondary_text: string;
      };
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
    }

    interface PlaceResult {
      geometry?: {
        location: {
          lat(): number;
          lng(): number;
        };
      };
    }

    enum PlacesServiceStatus {
      OK = "OK",
      ZERO_RESULTS = "ZERO_RESULTS",
      ERROR = "ERROR",
    }
  }
}

interface Window {
  google?: typeof google;
}
