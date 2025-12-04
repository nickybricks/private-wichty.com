import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Mail, Lock, Save, Settings as SettingsIcon, CreditCard, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    setEmail(session.user.email || "");
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
        setDisplayName(profile.display_name || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: displayName.trim() })
          .eq("id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ id: user.id, display_name: displayName.trim() });

        if (error) throw error;
      }

      toast.success("Profil aktualisiert!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Fehler beim Aktualisieren des Profils");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail-Adresse ein");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
      });

      if (error) throw error;

      toast.success("E-Mail-Änderung angefordert! Bitte bestätige die neue E-Mail-Adresse.");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(error.message || "Fehler beim Ändern der E-Mail");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Neues Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Passwort erfolgreich geändert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Fehler beim Ändern des Passworts");
    } finally {
      setLoading(false);
    }
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="konto" className="text-xs sm:text-sm py-2">
              <User className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Konto
            </TabsTrigger>
            <TabsTrigger value="einstellungen" className="text-xs sm:text-sm py-2">
              <SettingsIcon className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Einstellungen
            </TabsTrigger>
            <TabsTrigger value="zahlung" className="text-xs sm:text-sm py-2">
              <CreditCard className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Zahlung
            </TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs sm:text-sm py-2">
              <Ticket className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Ticketverkauf
            </TabsTrigger>
          </TabsList>

          {/* Konto Tab */}
          <TabsContent value="konto" className="space-y-6 mt-6">
            {/* Profile Section */}
            <Card className="p-6 shadow-medium">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profil
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Aktualisiere deinen Anzeigenamen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Anzeigename</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Dein Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Profil speichern
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Separator />

            {/* Email Section */}
            <Card className="p-6 shadow-medium">
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    E-Mail-Adresse
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ändere deine E-Mail-Adresse (Bestätigung erforderlich)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      E-Mail ändern
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <Separator />

            {/* Password Section */}
            <Card className="p-6 shadow-medium">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Passwort ändern
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Aktualisiere dein Passwort
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Passwort ändern
                    </>
                  )}
                </Button>
              </form>
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