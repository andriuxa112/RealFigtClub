# Sukurtų failų santrauka

| Failai | Paskirtis |
| --- | --- |
| `src/app/(protected)/[...path]/page.tsx` | Visi numatyti apsaugoti maršrutai, įrašų prieinamumo patikra |
| `src/app/actions.ts` | Prisijungimas, atsijungimas ir validuojamos Server Actions duomenų kūrimui / redagavimui |
| `src/app/login/page.tsx`, `src/components/login.tsx` | Prisijungimas ir sąžiningas neprijungtos Supabase būsenos rodymas |
| `src/components/workspace.tsx` | Skydelis, varžybos, klubai, sportininkai, registracijos, kategorijos, formos ir filtrai |
| `src/components/language.tsx`, `src/lib/i18n.ts` | Centralizuoti LT/RU/EN vertimai ir kalbos pasirinkimas |
| `src/lib/domain.ts` | Zod schemos, teisių pagalbinė funkcija, amžiaus ir kategorijų algoritmas |
| `src/lib/auth.ts`, `src/lib/supabase/server.ts`, `src/proxy.ts` | Serverio autentifikacija ir cookie sesijos atnaujinimas |
| `src/lib/data.ts` | Tik RLS leidžiamų duomenų skaitymas, klaidų registravimas be payload |
| `src/app/layout.tsx`, `src/app/globals.css`, `src/app/error.tsx` | Bendras dizainas, prisitaikymas ekranams, klaidų puslapis |
| `supabase/migrations/202611150001_initial.sql` | Visa duomenų schema, RLS, apribojimai ir audito / validacijos trigeriai |
| `supabase/seed.sql`, `supabase/config.toml` | Atskirai įkeliami išgalvoti duomenys; automatinis seed išjungtas |
| `tests/domain.test.ts`, `tests/database.test.ts` | 29 automatiniai testai |
| `.github/workflows/ci.yml` | GitHub CI: testai, tipai, lint, build |
| `package.json`, `package-lock.json`, konfigūraciniai failai | Užfiksuotos priklausomybės ir paleidimo įrankiai |
| `.env.example`, `.gitignore` | Aplinkos kintamųjų pavyzdys ir slaptų / generuotų failų ignoravimas |
| `README.md`, `VALIDATION.md` | Paleidimas, Supabase, Vercel, ribos ir faktiniai patikrų rezultatai |

Projektas sukurtas naujame `D:\realfight-crm\tournament-manager` poaplankyje. Ankstesnio programos kodo aplanke nebuvo. Tėviniame aplanke papildomai sukurta ignoruojama `.tools` direktorija su oficialiu Node.js paketu (patikrinta SHA-256 suma), kad būtų įmanoma atlikti patikras aplinkoje be įdiegto Node.js. Ji nėra programos dalis.
