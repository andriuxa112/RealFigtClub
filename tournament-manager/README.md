# REAL FIGHT Tournament Manager — I etapas

Savarankiškas projektas aplanke `tournament-manager`. Next.js App Router, React, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/RLS. Sąsajos kalbos: LT (numatytoji), RU, EN. Duomenys nesimuliuojami: be Supabase konfigūracijos rodomas nustatymo puslapis.

## Paleidimas

Reikia Node.js 22.14+ ir npm. Šiame darbo aplanke patikroms taip pat paruoštas portable Node `../.tools/node-v22.23.5-win-x64` (ne projekto dalis).

```powershell
cd D:\realfight-crm\tournament-manager
npm ci
Copy-Item .env.example .env.local
# Redaguokite .env.local pagal kitą skyrių
npm run dev
```

Atidarykite http://localhost:3001. REAL FIGHT naudoja atskirą 3001 prievadą; 3000 paliktas Atila CRM. Aplinkos kintamuosius pakeitus serverį paleiskite iš naujo.

Šiame kompiuteryje paprasčiausia paleisti **`start-local.cmd`** dukart spustelėjus failą: jis suranda paruoštą portable Node paketą ir paleidžia vietinį serverį. Be `.env.local` bus rodomas Supabase nustatymo pranešimas. Uždarius serverio langą programa sustabdoma.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Supabase publishable raktas skirtas viešam klientui. `service_role` rakto programa nenaudoja: jo niekada nedėkite į `NEXT_PUBLIC_*`. `.env.local` neįtraukiamas į Git.

## Supabase prijungimas

1. Sukurkite atskirą Supabase projektą. SQL Editor paleiskite visą `supabase/migrations/202611150001_initial.sql` turinį **vieną kartą**. Alternatyva su Supabase CLI: `supabase link --project-ref YOUR_REF`, patikrinkite migracijas su `supabase db push --dry-run`, tada patys vykdykite `supabase db push` pasirinktoje aplinkoje. Produkciniai pakeitimai šios užduoties metu nevykdyti.
2. Supabase Authentication nustatymuose išjunkite viešą paskyrų registraciją. Programa paskyrų registravimo endpointo neturi. Trenerių paskyras kuria administratorius Supabase skydelyje, naudodamas galiojančius el. paštus ir saugų slaptažodžio perdavimą / atkūrimą. Prisijungimas programoje vyksta el. paštu ir slaptažodžiu.
3. `profiles` eilutė sukuriama automatiškai Auth vartotojo kūrimo metu. Pirmą administratorių suteikia tik duomenų bazės savininkas SQL Editor (pakeiskite UUID):

```sql
update public.profiles set role='ADMIN', full_name='Administratorius'
where id='AUTH_USER_UUID';
```

4. Prisijunkite `/login`, sukurkite klubą ir jo puslapyje pasirinkite „Priskirti trenerį“. Įveskite jau sukurtos Auth paskyros UUID. Klubui galima priskirti kelis trenerius, treneriui — kelis klubus. Treneris prisijungęs matys tik savo klubus ir jų sportininkus.
5. „Klubai“ puslapyje administratorius sukuria disciplinas ir patirties lygius. Sukurkite varžybas, jų apžvalgoje priskirkite disciplinas ir „Kategorijos“ skiltyje nustatykite savo taisykles. Tada nustatykite varžybų būseną „Registracija atvira“ ir galiojantį terminą.
6. Treneris sukuria sportininką „Sportininkai“ skiltyje, tada varžybų „Registracijos“ skiltyje užpildo konkrečios disciplinos registraciją. Kelioms disciplinoms pateikiamos atskiros registracijos. Viena tinkama kategorija parenkama automatiškai, kelios siūlomos pasirinkti, kai nėra tinkamos — registraciją galima pateikti peržiūrai be kategorijos, tačiau patvirtinti negalima. Administratorius registracijos redagavimo lange nustato `APPROVED` arba `REJECTED`.

Nustatykite Supabase Auth rate limits, HTTPS ir slaptažodžių politiką savo aplinkoje. Supabase Auth tvarko prisijungimo sesijas; serveris kiekvieną skaitymą ir pakeitimą autentifikuoja su `getUser()`. Server Actions tikrina teises, įvestis validuojama su Zod, duomenų bazė nepriklausomai taiko RLS, ryšių apribojimus ir trigerius. Formų rašymo operacijos nevykdomos su privilegijuotu API raktu.

## Veikiančios funkcijos

- Varžybų kūrimas, redagavimas, archyvavimas, režimai `OPEN_RING` ir `CHAMPIONSHIP`, registracijos laikotarpis.
- Klubų kūrimas ir redagavimas, keli treneriai vienam klubui.
- Sportininkų kūrimas ir redagavimas savo klubuose. Administratoriui prieinami visi klubai.
- Varžybų disciplinos, konfigūruojami patirties lygiai, kategorijų kūrimas ir redagavimas.
- Registracijos su svoriu, patirtimi, kovų ir pergalių skaičiais, trenerio kontaktais bei pastabomis. Registracijų redagavimas, būsenos, administratoriaus patvirtinimas / atmetimas.
- Paieška ir būsenų, klubų, disciplinų filtrai, statistika, prisitaikanti navigacija, centralizuoti LT/RU/EN vertimai.
- Aiškiai pažymėti būsimi `/matchmaking` ir `/schedule` moduliai be simuliuojamo veikimo.

Maršrutai įgyvendinti viename apsaugotame App Router catch-all maršrute, kuris leidžia tik numatytus kelius ir tikrina įrašų prieinamumą. `/tournaments/new` ir `/athletes/new` turi atskiras kūrimo formas; tie patys veiksmai pasiekiami sąrašų modaluose.

## Migracija ir invariantai

Migracija sukuria visas užduotyje nurodytas lenteles, papildomą `experience_levels`, UUID raktus, indeksus, unikalumo bei sudėtinius išorinių raktų apribojimus ir RLS politiką kiekvienai lentelei. `events.archived` atskiria archyvavimą nuo varžybų būsenos. Registracijose pridėti kontaktai ir pastabos. `matches` turi būsimai progresijai skirtus `bracket_id`, `next_match_id`, `next_corner`.

- Unikali registracija: `(event_id, athlete_id, discipline_id)`.
- Kategorija ir registracija priklauso tai pačiai varžybų disciplinai.
- Amžius — pilni metai varžybų **pradžios dieną**; vasario 29 d. gimęs sportininkas nekeliamaisiais metais naują amžių pasiekia kovo 1 d. Ši aiški taisyklė vienoda TypeScript ir PostgreSQL skaičiavimuose.
- Amžiaus ribos abi įskaitomos. Svorio intervalas **(min_weight, max_weight]**. Pavyzdžiui `(60,65]` apima 65 kg, neapima 60 kg. Administratoriaus nustatyti persidengiantys intervalai grąžina visus tinkamus pasirinkimus.
- Nėra oficialiomis apsimetančių numatytųjų kategorijų.
- Negalima patvirtinti netinkamos ar kategorijos neturinčios registracijos. Treneris negali pats patvirtinti, keisti kitų klubų įrašų ar jau patvirtintos / atmestos registracijos.
- Naudojamos kategorijos ribų bei varžybų pradžios datos keitimai užrakinami, kad jau išsaugotos registracijos netaptų netinkamos. Sportininko lytis / gimimo data užrakinama esant patvirtintai registracijai; klubo perkėlimas reikalautų atskiros administracinės procedūros.
- `profiles.role` negalima keisti klientui, net per tiesioginį REST API. Auditą rašo tik DB trigeriai, saugodami veiksmą ir įrašo identifikatorių, be sportininkų duomenų kopijų.
- Kovų ir lentelių rašymas I etape išjungtas; jų modelis skirtas II etapui ir dar neapima visų būsimo algoritmo taisyklių.

## Testiniai duomenys ir patikros

`supabase/seed.sql` turi 5 išgalvotus klubus, 30 sportininkų, 2 varžybas, 3 disciplinas ir demonstracines administratoriaus kategorijas. Nėra tikrų asmenų duomenų, Auth paskyrų ar bendro slaptažodžio. `db.seed.enabled=false`; failą paleiskite tik sąmoningai SQL Editor **testinėje** DB. Seed nėra idempotentinis: antrą įkėlimą unikalumo apribojimai atmes. Nedėkite jo į produkcinę aplinką.

Atskiram naudotojo prašymui paruoštas `supabase/fill-three-clubs.sql`: paleistas REAL FIGHT SQL Editor, jis įskaito esamus klubus ir sportininkus, papildo iki **3 klubų po 4 sportininkus**, o pabaigoje parodo skaičius. Pakartotinis paleidimas nedubliuoja įrašų. Jei jau viršytas kuris nors tikslinis skaičius, visa operacija atmetama be pakeitimų. Nauji įrašai aiškiai pažymėti kaip testiniai; šis failas nekuria varžybų, registracijų ar paskyrų ir automatiškai nepaleidžiamas. Šiame pokalbyje jis patikrintas izoliuotoje PostgreSQL bazėje, tačiau nuotoliniame Supabase dar neįvykdytas.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Testų faktinius rezultatus rasite `VALIDATION.md`. Domeno testai tikrina gimtadienius, keliamuosius metus, intervalų ribas, persidengimus ir validaciją. PostgreSQL integraciniai testai naudoja izoliuotą PGlite su Auth schema ir vaidmenimis, pritaiko tą pačią migraciją ir realiai vykdo RLS / trigerių užklausas. Jie nenaudoja jūsų Supabase duomenų. Tai nepakeičia galutinio rankinio dviejų trenerių ir administratoriaus patikrinimo prijungtoje Supabase aplinkoje.

## GitHub ir Vercel

1. Sukurkite Git saugyklą būtent `tournament-manager` aplanke, pridėkite failus ir įkelkite į savo GitHub saugyklą. Slapti raktai ir `.env.local` ignoruojami. Šios užduoties metu nuotolinė saugykla nekurta ir pakeitimai nesiųsti.
2. Vercel importuokite tą GitHub saugyklą, pasirinkite Next.js ir Node.js 22. Jei saugyklos šaknis aukščiau, „Root Directory“ nustatykite `tournament-manager`.
3. Vercel Environment Variables įrašykite abu `.env.example` kintamuosius atitinkamai Preview / Production aplinkai. Preview rekomenduojamas atskiras Supabase projektas.
4. Supabase Auth URL konfigūracijoje nustatykite Vercel domeną kaip Site URL. Migracijas paleiskite atskirai, peržiūrėję jų poveikį; Vercel build jų nevykdo.
5. Publikuokite tik patys patvirtinę ir patikrinkite login, klubų izoliaciją bei registraciją. Šiuo darbu produkcinis publikavimas neatliktas.

Oficialūs įgyvendinimo šaltiniai: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy), [Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data).

## Duomenų saugojimas ir ribos

Programa pati nenustato teisinio saugojimo termino. Organizatorius prieš produkcinį naudojimą turi nustatyti teisėtą duomenų tvarkymo pagrindą, privatumo pranešimą, nepilnamečių atstovavimo procesą ir saugojimo terminus. RLS saugo duomenų prieigą, auditai nesaugo payload. Duomenų šalinimui numatyta operatoriaus vykdoma transakcija: šalinti priklausomas kovas / lenteles, registracijas, sportininką; neprivalomai išvalyti identifikatorius audite pagal patvirtintą politiką. FK tyčia neleidžia atsitiktinai ištrinti susietų sportininkų. Automatinio šalinimo grafiko, eksporto ar „GDPR compliance“ garantijos nėra. Prieš naudojimą su tikrais duomenimis reikia priėmimo bandymų ir organizatoriaus politikos.

I etapo ribos: Auth kvietimai / slaptažodžio atkūrimas valdomi Supabase skydelyje; sportininkų perkėlimas tarp klubų, trenerio atšaukimas ir įrašų šalinimas neturi UI; disciplinų / patirties lygių UI leidžia kurti (ne pervadinti / išjungti); sąrašai įkelia iki 10 000 RLS leidžiamų eilučių kiekvienoje lentelėje (Supabase API max_rows taip pat nustatykite 10 000). Didesniems turnyrams reikės serverinės puslapiavimo ir agregavimo sistemos. Laiką įvedant naudojama operatoriaus naršyklės laiko juosta, apžvalgoje terminas rodomas Europe/Vilnius.

II etapas: Open Ring poravimo taisyklės, Championship burtai, BYE, rezultatų įvedimas ir nugalėtojų progresija, kovų tvarkaraščiai, klubų dokumentai, kvietimų ir duomenų šalinimo administravimo UI, didelių sąrašų puslapiavimas ir end-to-end bandymai prijungtoje testinėje Supabase aplinkoje.
