import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Settings as SettingsIcon, CreditCard, Ticket, Camera, Trash2, Phone, Mail, Sun, Moon, Monitor, Globe, Bell
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
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
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

  // Settings
  const [notifyParticipating, setNotifyParticipating] = useState(true);
  const [notifyOrganizing, setNotifyOrganizing] = useState(true);
  const [notifyProductUpdates, setNotifyProductUpdates] = useState(false);

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
        setNotifyParticipating(profile.notify_participating ?? true);
        setNotifyOrganizing(profile.notify_organizing ?? true);
        setNotifyProductUpdates(profile.notify_product_updates ?? false);
        // Apply saved theme and language
        if (profile.theme) setTheme(profile.theme);
        if (profile.language) i18n.changeLanguage(profile.language);
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

  const handleSettingChange = async (field: string, value: string | boolean, successMessage?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Fehler beim Speichern der Einstellung");
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    const themeLabel = t(`settingsPage.appearance.${newTheme}`);
    handleSettingChange('theme', newTheme, t('settingsPage.toasts.themeChanged', { theme: themeLabel }));
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    const langLabels: Record<string, string> = { de: 'Deutsch', en: 'English' };
    handleSettingChange('language', lang, t('settingsPage.toasts.languageChanged', { language: langLabels[lang] }));
  };

  const handleNotificationChange = async (
    field: 'notify_participating' | 'notify_organizing' | 'notify_product_updates',
    value: boolean
  ) => {
    // Update local state immediately
    if (field === 'notify_participating') setNotifyParticipating(value);
    if (field === 'notify_organizing') setNotifyOrganizing(value);
    if (field === 'notify_product_updates') setNotifyProductUpdates(value);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;
      toast.success(value ? t('settingsPage.toasts.notificationEnabled') : t('settingsPage.toasts.notificationDisabled'));
    } catch (error) {
      console.error("Error saving notification setting:", error);
      toast.error(t('settingsPage.toasts.errorSaving'));
      // Revert on error
      if (field === 'notify_participating') setNotifyParticipating(!value);
      if (field === 'notify_organizing') setNotifyOrganizing(!value);
      if (field === 'notify_product_updates') setNotifyProductUpdates(!value);
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
          <h1 className="text-3xl font-bold tracking-tight">{t('settingsPage.title')}</h1>
        </div>

        <Tabs defaultValue="konto" className="w-full">
          <TabsList className="h-auto bg-transparent p-0 gap-6 flex justify-start border-b border-border rounded-none w-full">
            <TabsTrigger 
              value="konto" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('settingsPage.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger 
              value="einstellungen" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('settingsPage.tabs.settings')}
            </TabsTrigger>
            <TabsTrigger 
              value="zahlung" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('settingsPage.tabs.payment')}
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="text-sm px-0 pb-3 pt-0 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('settingsPage.tabs.tickets')}
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
                      <AvatarImage src={avatarUrl} alt={t('settingsPage.profile.avatar')} className="object-cover" />
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
                    <h3 className="font-medium">{t('settingsPage.profile.avatar')}</h3>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('settingsPage.profile.firstName')}</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Max"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('settingsPage.profile.lastName')}</Label>
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
                  <Label htmlFor="username">{t('settingsPage.profile.username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="maxmustermann"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('settingsPage.profile.phone')}
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
                          t('settingsPage.profile.phoneVerify')
                        )}
                      </Button>
                    )}
                  </div>
                  {phoneVerified && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      ✓ {t('settingsPage.profile.phoneVerified')}
                    </p>
                  )}
                </div>

                {/* Phone Verification */}
                {showPhoneVerification && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <Label htmlFor="phoneCode">{t('settingsPage.profile.phoneCode')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phoneCode"
                        type="text"
                        placeholder={t('settingsPage.profile.phoneCodePlaceholder')}
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button onClick={handleVerifyPhone}>
                        {t('settingsPage.profile.phoneCodeVerify')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Password Reset */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('settingsPage.profile.changePassword')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settingsPage.profile.changePasswordDesc')}
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePasswordReset}
                    disabled={sendingPasswordReset}
                  >
                    {sendingPasswordReset ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : showPasswordReset ? (
                      t('settingsPage.profile.resetLinkSent')
                    ) : (
                      t('settingsPage.profile.sendResetLink')
                    )}
                  </Button>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading} 
                  className="w-full mt-6"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('settingsPage.profile.save')
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
                    {t('settingsPage.profile.deleteAccount')}
                  </h3>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('settingsPage.profile.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settingsPage.profile.deleteAccountTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settingsPage.profile.deleteAccountDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('settingsPage.profile.deleteAccountCancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('settingsPage.profile.deleteAccountConfirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </TabsContent>

          {/* Einstellungen Tab */}
          <TabsContent value="einstellungen" className="space-y-6 mt-6">
            {/* Appearance */}
            <Card className="p-6 shadow-medium">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  <h3 className="font-semibold">{t('settingsPage.appearance.title')}</h3>
                </div>
                <RadioGroup 
                  value={theme} 
                  onValueChange={handleThemeChange}
                  className="grid grid-cols-3 gap-3"
                >
                  <Label
                    htmlFor="theme-system"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      theme === 'system' ? 'border-[3px] border-primary bg-primary/5 shadow-sm' : 'border border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                    <Monitor className="h-6 w-6" />
                    <span className="text-sm font-medium">{t('settingsPage.appearance.system')}</span>
                  </Label>
                  <Label
                    htmlFor="theme-light"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      theme === 'light' ? 'border-[3px] border-primary bg-primary/5 shadow-sm' : 'border border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">{t('settingsPage.appearance.light')}</span>
                  </Label>
                  <Label
                    htmlFor="theme-dark"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      theme === 'dark' ? 'border-[3px] border-primary bg-primary/5 shadow-sm' : 'border border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">{t('settingsPage.appearance.dark')}</span>
                  </Label>
                </RadioGroup>
              </div>
            </Card>

            {/* Language */}
            <Card className="p-6 shadow-medium">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <h3 className="font-semibold">{t('settingsPage.languageSection.title')}</h3>
                </div>
                <Select 
                  value={i18n.language.startsWith('de') ? 'de' : 'en'} 
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">
                      <span className="flex items-center gap-2">
                        <span>🇩🇪</span>
                        <span>Deutsch</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">
                        <span>🇬🇧</span>
                        <span>English</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6 shadow-medium">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h3 className="font-semibold">{t('settingsPage.notifications.title')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-participating" className="font-medium">
                        {t('settingsPage.notifications.participating')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settingsPage.notifications.participatingDesc')}
                      </p>
                    </div>
                    <Switch
                      id="notify-participating"
                      checked={notifyParticipating}
                      onCheckedChange={(checked) => handleNotificationChange('notify_participating', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-organizing" className="font-medium">
                        {t('settingsPage.notifications.organizing')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settingsPage.notifications.organizingDesc')}
                      </p>
                    </div>
                    <Switch
                      id="notify-organizing"
                      checked={notifyOrganizing}
                      onCheckedChange={(checked) => handleNotificationChange('notify_organizing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-product" className="font-medium">
                        {t('settingsPage.notifications.productUpdates')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settingsPage.notifications.productUpdatesDesc')}
                      </p>
                    </div>
                    <Switch
                      id="notify-product"
                      checked={notifyProductUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('notify_product_updates', checked)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Zahlungseinstellungen Tab */}
          <TabsContent value="zahlung" className="mt-6">
            <Card className="p-6 shadow-medium">
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">{t('settingsPage.payment.title')}</h3>
                <p className="text-sm">{t('settingsPage.payment.description')}</p>
              </div>
            </Card>
          </TabsContent>

          {/* Ticketverkauf Tab */}
          <TabsContent value="tickets" className="mt-6">
            <Card className="p-6 shadow-medium">
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">{t('settingsPage.ticketSales.title')}</h3>
                <p className="text-sm">{t('settingsPage.ticketSales.description')}</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}