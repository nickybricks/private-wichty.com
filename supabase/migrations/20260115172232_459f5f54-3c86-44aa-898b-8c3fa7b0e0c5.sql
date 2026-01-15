-- Demo Events für Hockey, Tennis und Golf in Berlin & Hamburg
-- User ID: a7a756ab-37ef-416e-83ce-66c972db87e7

-- Event 1: Hockey Winterturnier Hamburg
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Hockey Winterturnier',
  'Unser traditionelles Winterturnier beim Uhlenhorster HC! Spielt mit uns um den begehrten Wanderpokal. Für alle Spielstärken geeignet - Teams werden vor Ort eingeteilt. Inklusive Verpflegung und After-Match-Getränke.',
  'Uhlenhorster Hockey-Club, Bornheide 3, 22459 Hamburg',
  'Hamburg',
  'Deutschland',
  '2026-01-25',
  '10:00',
  '18:00',
  32,
  false,
  true,
  true,
  ARRAY['hockey'],
  'waiting'
);

-- Event 2: Tennis Mixed-Doppel Berlin (kostenlos)
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Tennis Mixed-Doppel Nachmittag',
  'Lockeres Mixed-Doppel für alle Levels! Bringt gute Laune mit, Partner werden vor Ort zugeteilt. Schläger können ausgeliehen werden. Anschließend gemütliches Beisammensein im Clubhaus.',
  'LTTC Rot-Weiss Berlin, Hundekehlestraße 47, 14199 Berlin',
  'Berlin',
  'Deutschland',
  '2026-02-01',
  '14:00',
  '18:00',
  16,
  false,
  true,
  false,
  ARRAY['tennis'],
  'waiting'
);

-- Event 3: Golf Schnupperkurs Hamburg
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0003-4000-8000-000000000003',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Golf Schnupperkurs für Einsteiger',
  'Du wolltest schon immer Golf ausprobieren? Jetzt ist die perfekte Gelegenheit! Unser erfahrener Pro zeigt dir die Grundlagen: Griff, Stand, Schwung. Equipment wird gestellt. Keine Vorkenntnisse nötig!',
  'Golf Club Hamburg Wendlohe, Oldesloer Straße 251, 22457 Hamburg',
  'Hamburg',
  'Deutschland',
  '2026-02-08',
  '10:00',
  '14:00',
  12,
  false,
  true,
  true,
  ARRAY['golf'],
  'waiting'
);

-- Event 4: Hockey Liga-Spiel Berlin
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0004-4000-8000-000000000004',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Hockey Bundesliga: BHC vs. UHC',
  'Erlebe spannenden Spitzenhockey live! Der Berliner HC empfängt den Uhlenhorster HC zum Topspiel der Bundesliga. Stimmungsgarantie auf der Tribüne. Kinder unter 12 Jahren haben freien Eintritt.',
  'Berliner Hockey Club, Am Hüttenweg 14, 14195 Berlin',
  'Berlin',
  'Deutschland',
  '2026-02-15',
  '15:00',
  '17:30',
  200,
  false,
  true,
  true,
  ARRAY['hockey'],
  'waiting'
);

-- Event 5: Tennis Frühjahrsturnier Hamburg
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0005-4000-8000-000000000005',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Tennis Frühjahrsturnier',
  'Das traditionelle Frühjahrsturnier des TC Wellingsbüttel! Einzel- und Doppelwettbewerbe für alle Altersklassen. Professionelle Schiedsrichter, Siegerehrung mit Preisen. Anmeldeschluss: 15.02.2026.',
  'Tennisclub Wellingsbüttel, Rolfinckstraße 18, 22391 Hamburg',
  'Hamburg',
  'Deutschland',
  '2026-02-22',
  '09:00',
  '19:00',
  48,
  false,
  true,
  true,
  ARRAY['tennis'],
  'waiting'
);

-- Event 6: Golf Charity Cup Berlin
INSERT INTO events (id, user_id, name, description, location, city, country, event_date, event_time, end_time, target_participants, capacity_unlimited, is_public, is_paid, tags, status)
VALUES (
  'a1b2c3d4-0006-4000-8000-000000000006',
  'a7a756ab-37ef-416e-83ce-66c972db87e7',
  'Golf Charity Cup 2026',
  'Golfen für den guten Zweck! Unser beliebtes Charity-Turnier geht in die nächste Runde. Vierer-Scramble Format, inklusive Halfway-Verpflegung und festliches Dinner. Erlös geht an die Berliner Kinderhilfe.',
  'Golf & Country Club Berlin, Im Jagen 79, 14055 Berlin',
  'Berlin',
  'Deutschland',
  '2026-03-01',
  '09:00',
  '20:00',
  80,
  false,
  true,
  true,
  ARRAY['golf'],
  'waiting'
);

-- Ticket-Kategorien

-- Hockey Winterturnier Hamburg
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Standard-Ticket', 'Teilnahme am Turnier inkl. Verpflegung', 1500, 'eur', 24, 0, true),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Ermäßigt', 'Für Schüler, Studenten und Azubis (Ausweis erforderlich)', 800, 'eur', 8, 1, true);

-- Tennis Mixed-Doppel Berlin (kostenlos)
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Teilnahme', 'Kostenlose Teilnahme am Mixed-Doppel', 0, 'eur', 16, 0, false);

-- Golf Schnupperkurs Hamburg
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Einsteiger-Paket', 'Kurs inkl. Leihschläger und Bälle', 2500, 'eur', 8, 0, true),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Premium-Paket', 'Kurs mit Privattrainer (1:2) + Goodie-Bag', 4500, 'eur', 4, 1, true);

-- Hockey Liga-Spiel Berlin
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Tribüne', 'Sitzplatz auf der überdachten Tribüne', 500, 'eur', 150, 0, false),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Stehplatz', 'Günstigster Eintritt - beste Atmosphäre!', 300, 'eur', 50, 1, false);

-- Tennis Frühjahrsturnier Hamburg
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Teilnehmer Einzel', 'Startgebühr für Einzelwettbewerb', 1500, 'eur', 32, 0, true),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Teilnehmer Doppel', 'Startgebühr für Doppelwettbewerb (pro Person)', 1000, 'eur', 16, 1, true);

-- Golf Charity Cup Berlin
INSERT INTO ticket_categories (event_id, name, description, price_cents, currency, max_quantity, sort_order, pass_fee_to_customer)
VALUES 
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Turnier-Teilnahme', 'Greenfee, Halfway, Abendessen, Tombola-Los', 3500, 'eur', 72, 0, true),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'VIP-Paket', 'Alles inklusive + Caddy + 5 extra Tombola-Lose', 7500, 'eur', 8, 1, true);