# Niebieskie elementy UI gry

Wierne, wektorowe odtworzenie 5 elementów grafiki referencyjnej: gwiazdka + postęp, serce + segmenty, błyskawica + energia, licznik punktów i zegar. Kod jest w HTML, CSS, SVG, JS — bez bibliotek i bez obrazka referencyjnego użytego jako gotowe tło.

- `index.html` — demo z suwakami i licznikiem.
- `style.css` — style strony i responsywność.
- `script.js` — działająca logika wartości (punkty, czas, postęp itd.).
- `ui-elements.svg` — edytowalne grafiki wektorowe.
- `standalone.html` — kompletna strona w jednym pliku, bez zewnętrznych zależności.
- `components/*.svg` i `components/*.png` — każdy element osobno, na przezroczystym tle.

Otwórz `index.html` lub `standalone.html` w przeglądarce. W grze po załadowaniu skryptu możesz używać:

```js
gameUI.setProgress(70); // 0..100
gameUI.setHearts(6);     // 0..14
gameUI.setEnergy(80);   // 0..100
gameUI.setPoints(7500);
gameUI.setSeconds(42);
```

Elementy SVG można edytować niezależnie w edytorze wektorowym; identyfikatory komponentów zaczynają się od `ui-`.
