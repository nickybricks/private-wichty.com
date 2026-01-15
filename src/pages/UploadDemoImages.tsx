import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import demo images
import hockeyTournament from "@/assets/demo-hockey-tournament.jpg";
import tennisMixed from "@/assets/demo-tennis-mixed.jpg";
import golfBeginner from "@/assets/demo-golf-beginner.jpg";
import hockeyBundesliga from "@/assets/demo-hockey-bundesliga.jpg";
import tennisTournament from "@/assets/demo-tennis-tournament.jpg";
import golfCharity from "@/assets/demo-golf-charity.jpg";

const DEMO_IMAGES = [
  { src: hockeyTournament, storageName: "demo/hockey-tournament.jpg", eventId: "a1b2c3d4-0001-4000-8000-000000000001", label: "Hockey Winterturnier" },
  { src: tennisMixed, storageName: "demo/tennis-mixed.jpg", eventId: "a1b2c3d4-0002-4000-8000-000000000002", label: "Tennis Mixed-Doppel" },
  { src: golfBeginner, storageName: "demo/golf-beginner.jpg", eventId: "a1b2c3d4-0003-4000-8000-000000000003", label: "Golf Schnupperkurs" },
  { src: hockeyBundesliga, storageName: "demo/hockey-bundesliga.jpg", eventId: "a1b2c3d4-0004-4000-8000-000000000004", label: "Hockey Bundesliga" },
  { src: tennisTournament, storageName: "demo/tennis-tournament.jpg", eventId: "a1b2c3d4-0005-4000-8000-000000000005", label: "Tennis Frühjahrsturnier" },
  { src: golfCharity, storageName: "demo/golf-charity.jpg", eventId: "a1b2c3d4-0006-4000-8000-000000000006", label: "Golf Charity Cup" },
];

export default function UploadDemoImages() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ label: string; success: boolean }[]>([]);

  const handleUpload = async () => {
    setUploading(true);
    setResults([]);
    const newResults: { label: string; success: boolean }[] = [];

    for (const img of DEMO_IMAGES) {
      try {
        // Fetch the image as blob
        const response = await fetch(img.src);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(img.storageName, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Error uploading ${img.label}:`, uploadError);
          newResults.push({ label: img.label, success: false });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("event-images")
          .getPublicUrl(img.storageName);

        // Update event with new image URL
        const { error: updateError } = await supabase
          .from("events")
          .update({ image_url: urlData.publicUrl })
          .eq("id", img.eventId);

        if (updateError) {
          console.error(`Error updating event ${img.label}:`, updateError);
          newResults.push({ label: img.label, success: false });
        } else {
          newResults.push({ label: img.label, success: true });
        }
      } catch (err) {
        console.error(`Error processing ${img.label}:`, err);
        newResults.push({ label: img.label, success: false });
      }
    }

    setResults(newResults);
    setUploading(false);
    
    const successCount = newResults.filter(r => r.success).length;
    if (successCount === DEMO_IMAGES.length) {
      toast.success("Alle Demo-Bilder erfolgreich hochgeladen!");
    } else {
      toast.warning(`${successCount}/${DEMO_IMAGES.length} Bilder hochgeladen`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Demo-Bilder hochladen</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {DEMO_IMAGES.map((img) => (
            <div key={img.eventId} className="relative">
              <img 
                src={img.src} 
                alt={img.label} 
                className="w-full h-32 object-cover rounded-lg"
              />
              <p className="text-xs mt-1 text-muted-foreground">{img.label}</p>
            </div>
          ))}
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? "Lade hoch..." : "Alle Bilder hochladen"}
        </Button>

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`text-sm ${r.success ? "text-green-600" : "text-red-600"}`}>
                {r.success ? "✓" : "✗"} {r.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
