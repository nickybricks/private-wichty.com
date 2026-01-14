import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Datenschutz() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-6">
        {/* Page Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Datenschutzerklärung</h1>
        </div>

        {/* Content */}
        <Card className="p-8 shadow-medium">
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Datenerfassung auf dieser Website</h3>
              <p className="text-muted-foreground mb-2">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              </p>
              <p className="text-muted-foreground mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen 
                Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>

              <p className="text-muted-foreground mb-2">
                <strong>Wie erfassen wir Ihre Daten?</strong>
              </p>
              <p className="text-muted-foreground mb-4">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann 
                es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der 
                Registrierung angeben.
              </p>
              <p className="text-muted-foreground mb-4">
                Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. 
                Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit 
                des Seitenaufrufs).
              </p>

              <p className="text-muted-foreground mb-2">
                <strong>Wofür nutzen wir Ihre Daten?</strong>
              </p>
              <p className="text-muted-foreground mb-4">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu 
                gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>

              <p className="text-muted-foreground mb-2">
                <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
              </p>
              <p className="text-muted-foreground">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck 
                Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, 
                die Berichtigung oder Löschung dieser Daten zu verlangen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Hosting und Content Delivery Networks (CDN)</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Externes Hosting</h3>
              <p className="text-muted-foreground mb-4">
                Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die 
                personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern 
                des Hosters gespeichert. Hierbei kann es sich v.a. um IP-Adressen, Kontaktanfragen, 
                Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und 
                sonstige Daten, die über eine Website generiert werden, handeln.
              </p>
              <p className="text-muted-foreground">
                Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren 
                potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer 
                sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen 
                professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Datenschutz</h3>
              <p className="text-muted-foreground mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir 
                behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen 
                Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-muted-foreground mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="text-muted-foreground mb-4">
                [Ihr Name / Ihre Firma]<br />
                [Ihre Adresse]<br />
                [PLZ und Ort]
              </p>
              <p className="text-muted-foreground mb-4">
                Telefon: [Ihre Telefonnummer]<br />
                E-Mail: [Ihre E-Mail-Adresse]
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Speicherdauer</h3>
              <p className="text-muted-foreground mb-4">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt 
                wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die 
                Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder 
                eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern 
                wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen 
                Daten haben.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="text-muted-foreground mb-4">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. 
                Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit 
                der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Recht auf Datenübertragbarkeit</h3>
              <p className="text-muted-foreground mb-4">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung 
                eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem 
                gängigen, maschinenlesbaren Format aushändigen zu lassen.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">Auskunft, Löschung und Berichtigung</h3>
              <p className="text-muted-foreground">
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf 
                unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft 
                und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung 
                oder Löschung dieser Daten.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Registrierung auf dieser Website</h3>
              <p className="text-muted-foreground mb-4">
                Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf der Seite 
                zu nutzen. Die dazu eingegebenen Daten (E-Mail-Adresse, Passwort) verwenden wir nur zum 
                Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich registriert 
                haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben 
                werden. Anderenfalls werden wir die Registrierung ablehnen.
              </p>
              <p className="text-muted-foreground mb-4">
                Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen 
                Änderungen nutzen wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf 
                diesem Wege zu informieren.
              </p>
              <p className="text-muted-foreground">
                Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt auf Grundlage 
                Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können eine von Ihnen erteilte 
                Einwilligung jederzeit widerrufen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Plugins und Tools</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">Verwendete Technologien</h3>
              <p className="text-muted-foreground">
                Diese Website nutzt verschiedene Technologien zur Bereitstellung und Verbesserung 
                unserer Dienste. Weitere Informationen zu den eingesetzten Tools und deren 
                Datenschutzbestimmungen können Sie den jeweiligen Anbietern entnehmen.
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                Quelle: Erstellt mit Unterstützung von{" "}
                <a 
                  href="https://www.e-recht24.de" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  e-recht24.de
                </a>
              </p>
            </section>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
