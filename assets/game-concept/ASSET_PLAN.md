# Lista grafik do gry: Doradź klientowi

Katalog służy do przeglądu propozycji wizualnych. Obrazki z `drafts/` są koncepcjami, nie gotowymi elementami produkcyjnymi.

## Wygenerować teraz — osobne, składane warstwy 2D

- [x] Tło sklepu motocyklowego: widok od strony pracownika, półki z kaskami i odzieżą, bez ludzi, lady, napisów i logotypów.
- [x] Lada na pierwszym planie: szeroka, widok od przodu, osobny plik z przezroczystym tłem.
- [x] Pierwszy klient: pełna sylwetka, osobny plik z przezroczystym tłem; ilustracyjny styl zgodny z podesłanym konceptem.
- [x] Strzałka w lewo i strzałka w prawo: osobne przyciski-grafiki z przezroczystym tłem.
- [x] Gwiazdka punktów: osobna, dekoracyjna ikona.
- [x] Panel punktów: pusta ramka pod dynamiczną wartość punktów.
- [x] Ikona stopera: osobna grafika z przezroczystym tłem.

## Dodać jako tekst i zachowanie interfejsu

- Wartości punktów i czasu, poziom, nazwy kategorii oraz teksty przycisków będą dynamicznym tekstem nałożonym na grafiki.
- Układ, klikalność, animacje i półkę produktów zbudujemy w interfejsie, wykorzystując wygenerowane obrazki jako dekoracyjne warstwy.
- W pierwszej rundzie używamy prawdziwego packshotu Ceramic Detailera, który już jest w projekcie. Pozostałe packshoty dodamy po otrzymaniu linku do sklepu.

## Złożone już w grywalnym prototypie

- Jedna runda: klient pyta o połysk i ochronę motocykla po myciu.
- Trzy odpowiedzi produktowe: prawdziwy packshot Ceramic Detailera oraz dwie tekstowe odpowiedzi do wyboru.
- Licznik 45 sekund, punkty za poprawną poradę i bonus zależny od czasu odpowiedzi.
- Grafiki z `drafts/` są zoptymalizowane do WebP i użyte warstwami w ekranie gry.
- Wybór odpowiedzi, informacja zwrotna, ponowna gra i przewijanie półki działają w przeglądarce.

## Dodać po ustaleniu zasad gry

- Kolejne postacie klientów i warianty wyglądu.
- Pozy postaci do wejścia, podejścia do lady i reakcji na poradę.
- Ikony kategorii po potwierdzeniu kategorii produktów.
- Ewentualne animacje, odznaki i grafiki kolekcjonowanych produktów.

## Zasady przygotowania

- Scena będzie składana z osobnych warstw: tło → klient → lada → interfejs.
- Wygenerowane obrazy nie powinny zawierać tekstu, nazw produktów ani znaków towarowych.
- Zachowamy przezroczystość postaci i lady, żeby można je było układać warstwami.

## Wygenerowane pliki do podglądu

Pliki PNG znajdują się w `drafts/`:

- `shop-background.png` — tło sklepu.
- `customer-rider.png` — pierwsza postać klienta.
- `checkout-counter.png` — lada na pierwszym planie.
- `arrow-left.png` i `arrow-right.png` — przyciski nawigacyjne.
- `points-star.png` i `points-panel.png` — gwiazdka oraz pusta ramka punktów.
- `timer-icon.png` — wcześniejsza koncepcja ikony stopera.
- `timer-stopwatch-cutout.png` — osobny stoper na przezroczystym tle, do animowania niezależnie od panelu.

Zoptymalizowane pliki używane przez aplikację znajdują się w `next-prototype/public/assets/game-concept/`.

## Audio and updated controls

- `public/assets/game-concept/audio/` contains a quiet loop and short game effects. Playback starts only after the player turns sound on.
- The points panel is reused for the timer, with a separate stopwatch icon that can animate independently. The product row uses the separate `arrow-left.png` and `arrow-right.png` artwork at a larger size, without an extra HTML circle.
- The product choices are vertical 4:5 cards with a product image and name.
- The source PNG drafts remain in `assets/game-concept/drafts/`; app-ready graphics are optimized in `public/assets/game-concept/`.
