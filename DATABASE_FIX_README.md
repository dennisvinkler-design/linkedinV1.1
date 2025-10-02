# Database Fix for Dashboard Loading Issues

## Problem
Hvis du ser fejl med dashboard indlæsning og data vises ikke, er det fordi der mangler nogle kolonner i databasen.

## Løsning

### 1. Åbn Supabase Dashboard
- Gå til din Supabase projekt dashboard
- Klik på "SQL Editor" i venstre menu

### 2. Kør Database Fix
- Kopier indholdet fra `fix_database_columns.sql` filen
- Indsæt det i SQL Editor
- Klik "Run" for at udføre kommandoerne

### 3. Verificer Fix
- Efter at have kørt SQL kommandoerne, genstart systemet med `start.bat`
- Dashboardet skulle nu indlæse data korrekt

## Hvad Fix'en Gør

Fix'en tilføjer de manglende kolonner:

1. **`language` kolonne** til `persons` og `companies` tabellerne
2. **`post_type` kolonne** til `posts` tabellen  
3. **`category` kolonne** til `improvement_answers` tabellen

## Fejlmeddelelser Du Måtte Se

- `Could not find the 'language' column of 'persons' in the schema cache`
- `Could not find the 'language' column of 'companies' in the schema cache`
- `column improvement_answers.category does not exist`

Alle disse fejl bliver løst af database fix'en.

## Efter Fix'en

- Dashboardet vil vise korrekte tal for personer, virksomheder og opslag
- Du kan oprette nye profiler uden fejl
- Alle funktioner vil virke normalt

## Support

Hvis du stadig har problemer efter at have kørt fix'en, tjek:
1. At du har kørt SQL kommandoerne i den rigtige Supabase database
2. At der ikke er fejl i Supabase SQL Editor
3. At backend og frontend kører på de korrekte porte (3002 og 3000)
