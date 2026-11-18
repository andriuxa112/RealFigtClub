# Patikrų rezultatai

Patikrinta 2026-11-15 vietinėje Windows aplinkoje, su Node.js 22.23.5 ir npm 10.9.9. Priklausomybių versijos užfiksuotos `package-lock.json`; pakartotiniam diegimui naudokite `npm ci`.

| Patikra | Rezultatas |
| --- | --- |
| `npm test` | **29 / 29**: 9 domeno testai, 20 PostgreSQL integracinių testų |
| `npm run typecheck` | Praėjo, klaidų nėra |
| `npm run lint` | Praėjo, klaidų ir įspėjimų nėra |
| `npm run build` | Praėjo, Next.js 16.4.6 produkcinis surinkimas |
| Produkcinio serverio paleidimas | Praėjo, `next start` adresu `127.0.0.1:3000` |
| `/login` be aplinkos kintamųjų | HTTP 200, rodomas tikras Supabase nustatymo pranešimas |
| `/` | HTTP 307 į `/dashboard` |
| `/dashboard`, `/tournaments`, `/athletes/new` be konfigūracijos | HTTP 307 į `/login?setup=1` |
| Nežinomas maršrutas | HTTP 404 |

HTTP patikrai naudotas serveris po bandymo sustabdytas. Naršyklės automatizavimo įrankio šioje aplinkoje nebuvo, todėl interaktyvi sąsaja ir mobiliojo ekrano vaizdas naršyklėje nepatikrinti.

PostgreSQL testai realiai pritaiko projekto migraciją PGlite variklyje ir įkelia atskirą seed. Testų Auth schema atkuria `auth.users`, `auth.uid()` bei `anon` / `authenticated` vaidmenis. Vienintelė migracijos adaptacija testui — praleistas `CREATE EXTENSION pgcrypto`, nes testų variklis jau turi `gen_random_uuid()`. Testai vykdo tikrą SQL su RLS, FK, unikalumo apribojimais ir trigeriais, o ne jų JavaScript imitaciją.

Patikrinta: savų sportininkų registracija; kitų klubų skaitymo, redagavimo, kūrimo ir registravimo blokavimas; dubliuotų registracijų atmetimas; trenerio patvirtinimo ir rolės eskalavimo blokavimas; administratoriaus varžybų valdymas; netinkamos ir kategorijos neturinčios registracijos atmetimas; svorio ribos; registracijos terminas; jau patvirtintų registracijų apsauga; naudojamų kategorijų ir varžybų datos užrakinimas; audito rašymas ir klastojimo apsauga; juodraščių slėpimas.

Domeno testai tikrina gimtadienio ribas, vasario 29 d., amžių varžybų dieną, svorio intervalus, persidengiančias kategorijas, lytį / discipliną / patirtį / turnyrą ir netinkamus skaitinius duomenis.

**Neatlikta:** gyvas vartotojo prisijungimas ir Server Actions rašymas į nuotolinę Supabase DB; naršyklės end-to-end testai; GitHub įkėlimas; Vercel publikavimas. Nuotolinės DB schema šio pokalbio metu nekeista. Vartotojo paskyra ir jos administratoriaus teisės dar nepatikrintos.

## Papildoma Supabase ryšio patikra

Vartotojo pateiktas atskiras REAL FIGHT projektas: `lukzxacaqryhdwyyxstu.supabase.co`. Sutvarkytas `.env.local`: URL ir publishable raktas priskirti programos naudojamiems `NEXT_PUBLIC_SUPABASE_*` kintamiesiems; failas ignoruojamas Git.

- `GET /auth/v1/settings` su pateiktu viešu raktu: HTTP 200 — projektas pasiekiamas, raktas priimamas.
- Visos 13 programai reikalingų lentelių patikrintos tik skaitymo užklausomis su numatytais stulpeliais ir `limit=0`: grąžintas PostgreSQL `42501` (anoniminei rolei prieiga prie lentelių uždrausta). Lentelės jau egzistuoja, tačiau šios užklausos nepatvirtina visų RLS politikų, trigerių ar migracijų versijos. Migracija pakartotinai nepaleista.
- `http://localhost:3001/login`: HTTP 200, rodoma prisijungimo forma su slaptažodžio lauku.
- Supabase vieša paskyrų registracija šiuo metu leidžiama (`disable_signup=false`). Projekte, kuriame paskyras kuria administratorius, reikia išjungti „Allow new users to sign up“ pagal README aprašytą modelį.
- Atila konfigūracija ir failai nekeisti. Patikros metu jos serveris nebuvo paleistas; jis paleistas iš `D:\atila-crm` ankstesniu 3000 prievadu. Patikrinta HTTP 200 ir Atila turinys.

Patikrintos pagrindinės įdiegtos versijos: Next.js 16.4.6, React 19.3.1, Supabase SSR 0.8.0, Supabase JS 2.119.0, Tailwind CSS 4.3.5, PGlite 0.5.16.
