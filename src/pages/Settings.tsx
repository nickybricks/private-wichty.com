import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Settings as SettingsIcon, CreditCard, Ticket, Camera, Trash2, Phone, Mail
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  
  // Password reset
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setUsername(profile.username || "");
        setAvatarUrl(profile.avatar_url || "");
        setPhoneNumber(profile.phone_number || "");
        setPhoneVerified(profile.phone_verified || false);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      const profileData = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        username: username.trim() || null,
        avatar_url: avatarUrl || null,
        phone_number: phoneNumber.trim() || null,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ id: user.id, ...profileData });

        if (error) throw error;
      }

      toast.success("Profil gespeichert!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.message?.includes("duplicate key") && error.message?.includes("username")) {
        toast.error("Dieser Benutzername ist bereits vergeben");
      } else {
        toast.error(error.message || "Fehler beim Speichern des Profils");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Bitte gib eine gültige Telefonnummer ein");
      return;
    }
    
    setSendingPhoneCode(true);
    // Simulate sending code - in production, integrate with SMS service
    setTimeout(() => {
      setSendingPhoneCode(false);
      setShowPhoneVerification(true);
      toast.success("Bestätigungscode gesendet!");
    }, 1000);
  };

  const handleVerifyPhone = async () => {
    if (phoneCode.length !== 6) {
      toast.error("Bitte gib den 6-stelligen Code ein");
      return;
    }
    
    // Simulate verification - in production, verify with backend
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ phone_verified: true })
        .eq("id", user.id);

      setPhoneVerified(true);
      setShowPhoneVerification(false);
      setPhoneCode("");
      toast.success("Telefonnummer bestätigt!");
    } catch (error) {
      toast.error("Fehler bei der Bestätigung");
    }
  };

  const handlePasswordReset = async () => {
    setSendingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setShowPasswordReset(true);
      toast.success("E-Mail zum Zurücksetzen des Passworts gesendet!");
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Senden der E-Mail");
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user data first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);
      
      // Delete user's events
      await supabase.from("events").delete().eq("user_id", user.id);
      
      // Sign out
      await supabase.auth.signOut();
      
      toast.success("Konto erfolgreich gelöscht");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Löschen des Kontos");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl + '?t=' + Date.now()); // Cache bust
      toast.success("Profilbild hochgeladen!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Fehler beim Hochladen des Profilbilds");
    }
  };

  const getInitials = () => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte dein Profil und deine Account-Einstellungen
          </p>
        </div>

        <Tabs defaultValue="konto" className="w-full">
          <TabsList className="h-auto bg-transparent p-0 gap-6 flex justify-start border-b border-border rounded-none w-full">
            <TabsTrigger 
              value="konto" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              Konto
            </TabsTrigger>
            <TabsTrigger 
              value="einstellungen" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              Einstellungen
            </TabsTrigger>
            <TabsTrigger 
              value="zahlung" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              Zahlung
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              Ticketverkauf
            </TabsTrigger>
          </TabsList>

          {/* Konto Tab */}
          <TabsContent value="konto" className="space-y-6 mt-6">
            <Card className="p-6 shadow-medium">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl} alt="Profilbild" className="object-cover" />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-medium">Profilbild</h3>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Max"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Mustermann"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="maxmustermann"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nur Kleinbuchstaben, Zahlen und Unterstriche
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefonnummer
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+49 170 1234567"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneVerified(false);
                      }}
                      className="flex-1"
                    />
                    {phoneNumber && !phoneVerified && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleSendPhoneCode}
                        disabled={sendingPhoneCode}
                      >
                        {sendingPhoneCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Code senden"
                        )}
                      </Button>
                    )}
                  </div>
                  {phoneVerified && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      ✓ Telefonnummer bestätigt
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Zum Anmelden und für SMS-Updates
                  </p>
                </div>

                {/* Phone Verification */}
                {showPhoneVerification && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label htmlFor="phoneCode">Bestätigungscode eingeben</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phoneCode"
                        type="text"
                        placeholder="123456"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button onClick={handleVerifyPhone}>
                        Bestätigen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Password Reset */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Passwort ändern
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Wir senden dir einen Link zum Zurücksetzen deines Passworts an {user?.email}
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePasswordReset}
                    disabled={sendingPasswordReset}
                  >
                    {sendingPasswordReset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      "Passwort-Reset E-Mail senden"
                    )}
                  </Button>
                  {showPasswordReset && (
                    <p className="text-xs text-green-600">
                      ✓ E-Mail gesendet! Überprüfe deinen Posteingang.
                    </p>
                  )}
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading} 
                  className="w-full mt-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    "Änderungen speichern"
                  )}
                </Button>
              </div>
            </Card>

            {/* Delete Account */}
            <Card className="p-6 shadow-medium border-destructive/20">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Konto löschen
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Durch das Löschen deines Kontos werden alle deine Daten unwiderruflich entfernt.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Konto endgültig löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dein Konto und alle 
                        zugehörigen Daten werden dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ja, Konto löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </TabsContent>

          {/* Einstellungen Tab */}
          <TabsContent value="einstellungen" className="mt-6">
            <Card className="p-6 shadow-medium">
              <div className="text-center py-8 text-muted-foreground">
                <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Allgemeine Einstellungen</h3>
                <p className="text-sm">Hier werden bald weitere Einstellungsmöglichkeiten verfügbar sein.</p>
              </div>
            </Card>
          </TabsContent>

          {/* Zahlungseinstellungen Tab */}
          <TabsContent value="zahlung" className="mt-6">
            <Card className="p-6 shadow-medium">
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Zahlungseinstellungen</h3>
                <p className="text-sm">Hier kannst du deine Zahlungsmethoden und Abrechnungen verwalten.</p>
              </div>
            </Card>
          </TabsContent>

          {/* Ticketverkauf Tab */}
          <TabsContent value="tickets" className="mt-6">
            <Card className="p-6 shadow-medium">
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Ticketverkauf</h3>
                <p className="text-sm">Hier kannst du deine Ticketverkäufe verwalten und einsehen.</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}