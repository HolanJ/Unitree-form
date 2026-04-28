# Předávací protokol robota Unitree

React webová aplikace v češtině pro vytvoření předávacího protokolu při výpůjčce robota Unitree.

## Funkce

- výběr jednoho nebo více robotů: Adam, Božena, Emil, Cvrček, Fík,
- blokace duplicitních robotů v jedné zápůjčce,
- horní přepínač režimu editace: vydání nebo vrácení,
- checklisty pro vydání i vrácení,
- poznámky, podpisy na canvasu a fotodokumentace,
- tiskový výstup vhodný pro uložení jako PDF.

## Stack

- React
- Vite
- Tailwind CSS
- GitHub Pages deploy přes GitHub Actions

## Lokální spuštění

```bash
npm install
npm run dev
```

Build pro produkci:

```bash
npm run build
```

## GitHub Pages

Workflow je připravený v `.github/workflows/pages.yml`.

Postup:

1. Vytvořte GitHub repozitář.
2. Pushněte projekt do větve `main`.
3. V repozitáři nastavte **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. Po pushi se spustí workflow a nasadí obsah složky `dist`.

V nastavení GitHub Pages musí být `Source` nastavené na `GitHub Actions`, ne na `Deploy from a branch`. Pokud je tam branch deploy, GitHub bude servírovat zdrojový `index.html` a stránka může být prázdná.

Výsledná URL bude typicky:

```text
https://UZIVATEL.github.io/NAZEV-REPOZITARE/
```

Poznámka: data z formuláře se nikam neposílají ani neukládají na server. Vše běží v prohlížeči zákazníka a PDF se ukládá přes tiskový dialog.
