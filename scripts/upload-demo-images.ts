// This script uploads the demo event images to Supabase Storage
// Run it manually or via the edge function

import { supabase } from "@/integrations/supabase/client";

// Image files generated for demo events
const DEMO_IMAGES = [
  { file: "demo-hockey-tournament.jpg", storageName: "demo/hockey-tournament.jpg", eventId: "a1b2c3d4-0001-4000-8000-000000000001" },
  { file: "demo-tennis-mixed.jpg", storageName: "demo/tennis-mixed.jpg", eventId: "a1b2c3d4-0002-4000-8000-000000000002" },
  { file: "demo-golf-beginner.jpg", storageName: "demo/golf-beginner.jpg", eventId: "a1b2c3d4-0003-4000-8000-000000000003" },
  { file: "demo-hockey-bundesliga.jpg", storageName: "demo/hockey-bundesliga.jpg", eventId: "a1b2c3d4-0004-4000-8000-000000000004" },
  { file: "demo-tennis-tournament.jpg", storageName: "demo/tennis-tournament.jpg", eventId: "a1b2c3d4-0005-4000-8000-000000000005" },
  { file: "demo-golf-charity.jpg", storageName: "demo/golf-charity.jpg", eventId: "a1b2c3d4-0006-4000-8000-000000000006" },
];

export async function uploadDemoImages() {
  for (const img of DEMO_IMAGES) {
    try {
      // Import the image as a module
      const imageModule = await import(`@/assets/${img.file}`);
      const imageUrl = imageModule.default;
      
      // Fetch the image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(img.storageName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
      
      if (uploadError) {
        console.error(`Error uploading ${img.file}:`, uploadError);
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
        console.error(`Error updating event ${img.eventId}:`, updateError);
      } else {
        console.log(`✓ Uploaded and linked: ${img.file}`);
      }
    } catch (err) {
      console.error(`Error processing ${img.file}:`, err);
    }
  }
}
