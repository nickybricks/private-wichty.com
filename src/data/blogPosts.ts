export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  readingTime: number;
  content: string;
  lang: 'de' | 'en';
  alternateSlug?: string; // Link to the same article in other language
}

export const blogPosts: BlogPost[] = [
  // German Articles
  {
    slug: "schrottwichteln-ideen",
    title: "Die 5 besten Ideen für Schrottwichteln-Events",
    metaDescription: "Entdecke kreative Schrottwichteln-Ideen für unvergessliche Events. Lustige Regeln, witzige Geschenke und Tipps für dein nächstes Wichteln.",
    keywords: ["Schrottwichteln", "Wichtelgeschenk Ideen", "Schrottwichteln Regeln", "lustige Wichtelgeschenke"],
    excerpt: "Schrottwichteln ist der absolute Party-Klassiker! Erfahre, wie du mit kreativen Regeln und witzigen Geschenk-Ideen für unvergessliche Momente sorgst.",
    coverImage: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-01",
    readingTime: 5,
    lang: 'de',
    alternateSlug: "white-elephant-gift-exchange-ideas",
    content: `
## Was ist Schrottwichteln?

Schrottwichteln ist eine lustige Variante des klassischen Wichtelns, bei der es nicht darum geht, das perfekte Geschenk zu finden – sondern das **absurdeste, witzigste oder nutzloseste**. Das Ziel: Spaß haben und gemeinsam lachen!

## Die 5 besten Ideen für dein Schrottwichteln-Event

### 1. Das "Keller-Krempel"-Wichteln

Die Regel ist einfach: Jeder bringt etwas mit, das seit mindestens einem Jahr unbenutzt im Keller, auf dem Dachboden oder im Schrank liegt. Je verstaubter, desto besser!

**Beliebte Fundstücke:**
- Alte Küchengeräte aus den 90ern
- Kuriose Deko-Objekte
- Ungelesene Bücher mit fragwürdigen Titeln
- Geschenke, die man selbst mal bekommen hat

### 2. Das "1-Euro-Shop Challenge"

Alle Geschenke müssen aus dem 1-Euro-Shop stammen. Das Budget ist begrenzt, die Kreativität nicht! Wer findet das absurdeste Produkt?

**Tipps:**
- Kombiniere mehrere günstige Artikel zu einem "Geschenk-Set"
- Achte auf besonders kitschige Verpackungen
- Saisonale Artikel sind oft Gold wert

### 3. Das "Ugly Christmas Sweater"-Wichteln

Jeder bringt einen besonders hässlichen Weihnachtspullover als Geschenk mit. Bonuspunkte für:
- Blinkende LED-Lichter
- 3D-Elemente wie Pompons oder Glöckchen
- Maximal peinliche Motive

### 4. Das "Retro-Tech"-Wichteln

Alte Technik ist der Star! VHS-Kassetten, Disketten, Nokia-Handys oder Tamagotchis – je älter, desto lustiger.

**Warum das funktioniert:**
- Nostalgie-Faktor sorgt für Gesprächsstoff
- Jeder hat irgendwo alte Technik rumliegen
- Perfekt für Tech-affine Gruppen

### 5. Das "Würfel-Chaos"

Nach dem Auspacken wird gewürfelt! Bei bestimmten Zahlen müssen Geschenke getauscht werden. Das sorgt für Extra-Spannung:

- **1-2:** Behalte dein Geschenk
- **3-4:** Tausche mit deinem linken Nachbarn
- **5-6:** Alle Geschenke wandern eine Position weiter

## Tipps für ein gelungenes Schrottwichteln

1. **Setzt ein Budget-Limit** – auch bei "Schrott" sollte niemand benachteiligt werden
2. **Definiert klare Regeln** – Was ist erlaubt, was nicht?
3. **Verpackung ist alles** – Auch Schrott verdient schönes Geschenkpapier
4. **Dokumentiert den Spaß** – Fotos von den Reaktionen sind Gold wert!

## Fazit

Schrottwichteln ist perfekt, um den Druck des "perfekten Geschenks" zu nehmen und stattdessen gemeinsam zu lachen. Mit kreativen Regeln wird jedes Event unvergesslich!
    `
  },
  {
    slug: "wichteln-firma-regeln-budget",
    title: "Wichteln in der Firma: So setzt du Regeln und Budgets fest",
    metaDescription: "Der komplette Guide für Firmen-Wichteln: Budget-Empfehlungen, faire Regeln und Tipps für die Organisation. Perfekt für HR und Event-Planer.",
    keywords: ["Wichtel Budget", "Wichteln Firma", "Online Wichteln", "Firmen-Wichteln organisieren"],
    excerpt: "Firmen-Wichteln kann tricky sein. Erfahre, wie du mit klaren Regeln und fairen Budgets ein Event organisierst, bei dem alle Spaß haben.",
    coverImage: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-03",
    readingTime: 6,
    lang: 'de',
    alternateSlug: "office-secret-santa-rules-budget",
    content: `
## Warum Wichteln im Büro eine gute Idee ist

Wichteln stärkt den Teamzusammenhalt, bringt Abwechslung in den Arbeitsalltag und sorgt für festliche Stimmung. Aber ohne klare Regeln kann es schnell zu Missverständnissen kommen.

## Das richtige Budget festlegen

### Empfohlene Budget-Stufen

| Kategorie | Budget | Geeignet für |
|-----------|--------|--------------|
| Mini | 5-10 € | Große Teams, lockere Atmosphäre |
| Standard | 10-20 € | Die meisten Firmen-Events |
| Premium | 20-30 € | Kleine Teams, engere Beziehungen |
| Deluxe | 30-50 € | Führungskräfte, besondere Anlässe |

### Faktoren bei der Budget-Wahl

1. **Teamgröße** – Je größer das Team, desto niedriger sollte das Budget sein
2. **Gehaltsniveau** – Alle sollten sich das Budget leisten können
3. **Unternehmenskultur** – Passt Premium-Wichteln zur Firmenkultur?
4. **Freiwilligkeit** – Ist die Teilnahme optional?

## Wichtige Regeln für Firmen-Wichteln

### Must-Have-Regeln

- **Verbindliches Budget** – Abweichungen von max. 10% nach oben
- **Deadline für Anmeldung** – Mindestens 2 Wochen vor dem Event
- **Geschenk-Richtlinien** – Was ist erlaubt, was nicht?
- **Anonymität** – Bleibt der Schenker geheim oder nicht?

### Geschenk-Richtlinien definieren

**Erlaubt:**
- Neutrale Geschenke (Süßigkeiten, Bürobedarf, Gutscheine)
- Persönliche, aber angemessene Geschenke
- Selbstgemachtes

**Nicht erlaubt:**
- Alkohol (außer explizit erlaubt)
- Intime oder anstößige Geschenke
- Geschenke, die auf persönliche Eigenschaften anspielen

## Organisation mit digitalen Tools

### Vorteile von Online-Wichteln

- **Anonyme Zulosung** – Kein Zettel-Chaos
- **Wunschlisten** – Jeder kann angeben, was er sich wünscht
- **Automatische Erinnerungen** – Niemand vergisst die Deadline
- **Remote-Teams** – Auch für verteilte Teams geeignet

### So funktioniert's mit Wichty

1. Event erstellen und Teilnehmerzahl festlegen
2. Link an alle Kollegen senden
3. Jeder trägt seinen Wunsch ein
4. Automatische, faire Zulosung
5. Jeder sieht nur seinen eigenen Wichtel-Partner

## Häufige Probleme und Lösungen

### "Ich weiß nicht, was ich schenken soll"

**Lösung:** Wunschlisten nutzen! Bei Wichty kann jeder Teilnehmer einen Geschenkwunsch hinterlegen.

### "Das Budget wurde überschritten"

**Lösung:** Klare Kommunikation und Verständnis. Das Geschenk kann trotzdem angenommen werden – fürs nächste Mal besser kommunizieren.

### "Jemand hat sich nicht angemeldet"

**Lösung:** Feste Deadline und Erinnerungen. Wer nicht dabei ist, ist nicht dabei.

## Checkliste für Organisatoren

- [ ] Budget festlegen und kommunizieren
- [ ] Teilnahme-Deadline setzen
- [ ] Geschenk-Richtlinien definieren
- [ ] Online-Tool einrichten
- [ ] Event-Datum festlegen
- [ ] Alle Kollegen informieren
- [ ] Erinnerung vor der Deadline senden

## Fazit

Mit klaren Regeln und dem richtigen Budget wird Firmen-Wichteln zu einem Highlight des Jahres. Digitale Tools wie Wichty machen die Organisation zum Kinderspiel!
    `
  },
  {
    slug: "geschichte-wichteln-secret-santa",
    title: "Die Geschichte vom Wichteln: Darum schenken wir uns anonym",
    metaDescription: "Entdecke die faszinierende Geschichte des Wichtelns und Secret Santa. Von skandinavischen Wurzeln bis zur modernen Wichtel-App.",
    keywords: ["Wichtel", "Secret Santa App", "Wichteln Geschichte", "Wichtel Tradition"],
    excerpt: "Woher kommt eigentlich das Wichteln? Eine Reise durch die Geschichte einer der schönsten Weihnachtstraditionen – von Skandinavien bis zur digitalen Wichtel-App.",
    coverImage: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-05",
    readingTime: 4,
    lang: 'de',
    alternateSlug: "history-of-secret-santa",
    content: `
## Die Wurzeln des Wichtelns

Das Wichteln hat eine lange und faszinierende Geschichte, die bis ins Skandinavien des 19. Jahrhunderts zurückreicht. Aber woher kommt der Name "Wichtel" eigentlich?

## Der Wichtel: Mehr als nur ein Weihnachtshelfer

In der nordischen Mythologie sind **Wichtel** (auch "Nisse" oder "Tomte" genannt) kleine, magische Wesen, die auf Bauernhöfen leben. Sie beschützen das Haus und seine Bewohner – solange man sie gut behandelt!

### Traditionen rund um den Wichtel

- **Skandinavien:** Am Heiligabend stellt man eine Schale Haferbrei für den Wichtel vor die Tür
- **Deutschland:** Wichtel wurden Teil des Weihnachtsbrauchtums
- **Moderne Interpretation:** Das anonyme Schenken als "Wichteln"

## Vom Brauch zum "Secret Santa"

In den USA entwickelte sich parallel der Begriff **"Secret Santa"** – angelehnt an die Figur des Weihnachtsmanns, der ja auch anonym Geschenke bringt.

### Die Idee dahinter

> "Es geht nicht darum, wer schenkt – sondern um die Freude des Schenkens selbst."

Das anonyme Element hat mehrere Vorteile:
- **Kein Druck:** Niemand muss "besser" schenken als andere
- **Gleichheit:** Alle sind gleich, unabhängig von Status oder Budget
- **Überraschung:** Die Spannung, wer geschenkt hat, macht Spaß

## Die Evolution des Wichtelns

### Früher: Zettel und Losverfahren

Das klassische Wichteln funktionierte so:
1. Alle Namen auf Zettel schreiben
2. Zettel in einen Hut oder eine Schüssel
3. Jeder zieht blind einen Namen
4. Problem: Was, wenn man sich selbst zieht?

### Heute: Digitale Lösungen

Moderne Wichtel-Apps wie **Wichty** lösen die alten Probleme:
- **Garantiert faire Zulosung** – Niemand zieht sich selbst
- **Wunschlisten** – Jeder kann angeben, was er sich wünscht
- **Remote-fähig** – Auch für Freunde in anderen Städten
- **Erinnerungen** – Niemand vergisst das Event

## Warum wir noch heute wichteln

### Die psychologische Komponente

Studien zeigen: **Schenken macht glücklicher als Beschenkt-werden.** Das anonyme Element verstärkt diesen Effekt:

- Der Fokus liegt auf der Geste, nicht auf der Person
- Weniger sozialer Druck
- Mehr Kreativität bei der Geschenkwahl

### Gemeinschaft stärken

Wichteln bringt Menschen zusammen:
- **In Familien:** Eine Tradition, die Generationen verbindet
- **Unter Freunden:** Ein Grund, sich zur Weihnachtszeit zu treffen
- **Im Büro:** Teambuilding mit Spaßfaktor

## Die Zukunft des Wichtelns

Mit der Digitalisierung wird Wichteln noch einfacher und inklusiver:

- **Globale Reichweite:** Wichteln mit Freunden auf der ganzen Welt
- **Nachhaltige Optionen:** Digitale Geschenkgutscheine, Erlebnisse statt Dinge
- **Personalisierung:** KI-gestützte Geschenkempfehlungen basierend auf Wünschen

## Fazit

Von den mystischen Wichteln Skandinaviens bis zur modernen Wichtel-App – die Tradition des anonymen Schenkens hat sich weiterentwickelt, ohne ihren Kern zu verlieren: **Die Freude am Geben.**

Führe die Tradition fort und starte dein eigenes Wichtel-Event – digital, fair und zeitgemäß.
    `
  },

  // English Articles
  {
    slug: "white-elephant-gift-exchange-ideas",
    title: "5 Best White Elephant Gift Exchange Ideas for Your Party",
    metaDescription: "Discover creative White Elephant gift exchange ideas for unforgettable events. Fun rules, hilarious gifts, and tips for your next Secret Santa party.",
    keywords: ["White Elephant", "Secret Santa ideas", "gift exchange rules", "funny gift exchange"],
    excerpt: "White Elephant is the ultimate party classic! Learn how to create unforgettable moments with creative rules and hilarious gift ideas.",
    coverImage: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-01",
    readingTime: 5,
    lang: 'en',
    alternateSlug: "schrottwichteln-ideen",
    content: `
## What is White Elephant?

White Elephant (also known as Yankee Swap or Dirty Santa) is a fun gift exchange game where the goal is not to find the perfect gift – but the **most absurd, hilarious, or useless** one. The objective: Have fun and laugh together!

## The 5 Best Ideas for Your White Elephant Event

### 1. The "Basement Junk" Exchange

The rule is simple: Everyone brings something that has been unused for at least a year in the basement, attic, or closet. The dustier, the better!

**Popular finds:**
- Old kitchen gadgets from the 90s
- Curious decorative objects
- Unread books with questionable titles
- Gifts you once received yourself

### 2. The "Dollar Store Challenge"

All gifts must come from a dollar store. The budget is limited, but creativity is not! Who can find the most absurd product?

**Tips:**
- Combine multiple cheap items into a "gift set"
- Look for especially tacky packaging
- Seasonal items are often gold

### 3. The "Ugly Christmas Sweater" Exchange

Everyone brings a particularly hideous Christmas sweater as a gift. Bonus points for:
- Blinking LED lights
- 3D elements like pompoms or bells
- Maximally embarrassing designs

### 4. The "Retro-Tech" Exchange

Old technology is the star! VHS tapes, floppy disks, Nokia phones, or Tamagotchis – the older, the funnier.

**Why this works:**
- Nostalgia factor sparks conversation
- Everyone has old tech lying around somewhere
- Perfect for tech-savvy groups

### 5. The "Dice Chaos"

After unwrapping, dice are rolled! Certain numbers mean gifts must be swapped. This adds extra excitement:

- **1-2:** Keep your gift
- **3-4:** Swap with your left neighbor
- **5-6:** All gifts move one position

## Tips for a Successful White Elephant

1. **Set a budget limit** – even with "junk," no one should be at a disadvantage
2. **Define clear rules** – What is allowed, what is not?
3. **Wrapping is everything** – Even junk deserves nice gift wrap
4. **Document the fun** – Photos of reactions are priceless!

## Conclusion

White Elephant is perfect for taking the pressure off finding the "perfect gift" and instead laughing together. With creative rules, every event becomes unforgettable!
    `
  },
  {
    slug: "office-secret-santa-rules-budget",
    title: "Office Secret Santa: How to Set Rules and Budgets",
    metaDescription: "The complete guide for office Secret Santa: Budget recommendations, fair rules, and organization tips. Perfect for HR and event planners.",
    keywords: ["Secret Santa budget", "office Secret Santa", "online Secret Santa", "organize Secret Santa"],
    excerpt: "Office Secret Santa can be tricky. Learn how to organize an event with clear rules and fair budgets that everyone enjoys.",
    coverImage: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-03",
    readingTime: 6,
    lang: 'en',
    alternateSlug: "wichteln-firma-regeln-budget",
    content: `
## Why Office Secret Santa is a Great Idea

Secret Santa strengthens team cohesion, brings variety to the workday, and creates a festive atmosphere. But without clear rules, misunderstandings can quickly arise.

## Setting the Right Budget

### Recommended Budget Tiers

| Category | Budget | Suitable for |
|----------|--------|--------------|
| Mini | $5-10 | Large teams, casual atmosphere |
| Standard | $10-20 | Most office events |
| Premium | $20-30 | Small teams, closer relationships |
| Deluxe | $30-50 | Executives, special occasions |

### Factors in Budget Selection

1. **Team size** – The larger the team, the lower the budget should be
2. **Salary level** – Everyone should be able to afford the budget
3. **Company culture** – Does premium Secret Santa fit the company culture?
4. **Voluntariness** – Is participation optional?

## Important Rules for Office Secret Santa

### Must-Have Rules

- **Binding budget** – Maximum 10% deviation upward
- **Registration deadline** – At least 2 weeks before the event
- **Gift guidelines** – What is allowed, what is not?
- **Anonymity** – Does the giver remain secret or not?

### Defining Gift Guidelines

**Allowed:**
- Neutral gifts (candy, office supplies, gift cards)
- Personal but appropriate gifts
- Homemade items

**Not allowed:**
- Alcohol (unless explicitly permitted)
- Intimate or offensive gifts
- Gifts that reference personal characteristics

## Organization with Digital Tools

### Benefits of Online Secret Santa

- **Anonymous drawing** – No paper chaos
- **Wishlists** – Everyone can indicate what they want
- **Automatic reminders** – Nobody forgets the deadline
- **Remote teams** – Also suitable for distributed teams

### How it Works with Wichty

1. Create event and set number of participants
2. Send link to all colleagues
3. Everyone enters their wish
4. Automatic, fair drawing
5. Everyone sees only their own Secret Santa partner

## Common Problems and Solutions

### "I do not know what to give"

**Solution:** Use wishlists! With Wichty, each participant can leave a gift wish.

### "The budget was exceeded"

**Solution:** Clear communication and understanding. The gift can still be accepted – communicate better next time.

### "Someone did not sign up"

**Solution:** Fixed deadline and reminders. Whoever is not there, is not there.

## Checklist for Organizers

- [ ] Set and communicate budget
- [ ] Set participation deadline
- [ ] Define gift guidelines
- [ ] Set up online tool
- [ ] Set event date
- [ ] Inform all colleagues
- [ ] Send reminder before deadline

## Conclusion

With clear rules and the right budget, office Secret Santa becomes a highlight of the year. Digital tools like Wichty make organization a breeze!
    `
  },
  {
    slug: "history-of-secret-santa",
    title: "The History of Secret Santa: Why We Give Gifts Anonymously",
    metaDescription: "Discover the fascinating history of Secret Santa and gift exchanges. From Scandinavian roots to modern Secret Santa apps.",
    keywords: ["Secret Santa", "Secret Santa app", "Secret Santa history", "gift exchange tradition"],
    excerpt: "Where does Secret Santa actually come from? A journey through the history of one of the most beautiful Christmas traditions – from Scandinavia to the digital Secret Santa app.",
    coverImage: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&auto=format&fit=crop",
    publishedAt: "2024-12-05",
    readingTime: 4,
    lang: 'en',
    alternateSlug: "geschichte-wichteln-secret-santa",
    content: `
## The Roots of Secret Santa

Secret Santa has a long and fascinating history dating back to 19th century Scandinavia. But where does the tradition actually come from?

## The Nordic Elves: More Than Just Christmas Helpers

In Nordic mythology, **elves** (also called "Nisse" or "Tomte") are small, magical beings that live on farms. They protect the house and its inhabitants – as long as they are treated well!

### Traditions Around Nordic Elves

- **Scandinavia:** On Christmas Eve, a bowl of porridge is placed outside the door for the elf
- **Germany:** "Wichtel" (elves) became part of Christmas customs
- **Modern interpretation:** Anonymous gift-giving as "Wichteln"

## From Custom to "Secret Santa"

In the USA, the term **"Secret Santa"** developed in parallel – based on the figure of Santa Claus, who also brings gifts anonymously.

### The Idea Behind It

> "It is not about who gives – but about the joy of giving itself."

The anonymous element has several advantages:
- **No pressure:** Nobody has to give "better" than others
- **Equality:** Everyone is equal, regardless of status or budget
- **Surprise:** The suspense of who gave is fun

## The Evolution of Secret Santa

### Before: Paper Slips and Lottery

The classic Secret Santa worked like this:
1. Write all names on slips of paper
2. Put slips in a hat or bowl
3. Everyone draws a name blindly
4. Problem: What if you draw yourself?

### Today: Digital Solutions

Modern Secret Santa apps like **Wichty** solve the old problems:
- **Guaranteed fair drawing** – Nobody draws themselves
- **Wishlists** – Everyone can indicate what they want
- **Remote-capable** – Also for friends in other cities
- **Reminders** – Nobody forgets the event

## Why We Still Do Secret Santa Today

### The Psychological Component

Studies show: **Giving makes you happier than receiving.** The anonymous element amplifies this effect:

- The focus is on the gesture, not the person
- Less social pressure
- More creativity in gift selection

### Strengthening Community

Secret Santa brings people together:
- **In families:** A tradition that connects generations
- **Among friends:** A reason to meet during the Christmas season
- **At the office:** Team building with a fun factor

## The Future of Secret Santa

With digitalization, Secret Santa becomes even easier and more inclusive:

- **Global reach:** Secret Santa with friends around the world
- **Sustainable options:** Digital gift cards, experiences instead of things
- **Personalization:** AI-powered gift recommendations based on wishes

## Conclusion

From the mystical elves of Scandinavia to the modern Secret Santa app – the tradition of anonymous gift-giving has evolved without losing its core: **The joy of giving.**

Continue the tradition and start your own Secret Santa event – digital, fair, and contemporary.
    `
  }
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getAllBlogPosts(lang?: 'de' | 'en'): BlogPost[] {
  const filtered = lang ? blogPosts.filter(post => post.lang === lang) : blogPosts;
  return filtered.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAlternatePost(slug: string): BlogPost | undefined {
  const currentPost = getBlogPostBySlug(slug);
  if (!currentPost?.alternateSlug) return undefined;
  return getBlogPostBySlug(currentPost.alternateSlug);
}
