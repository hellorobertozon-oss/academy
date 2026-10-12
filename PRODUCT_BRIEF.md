# Xzone Academy — brief produktu

**Status:** wersja robocza do wspólnego doprecyzowania  
**Produkt:** wewnętrzna platforma szkoleniowa dla pracowników sklepów Xzone

## Cel

Pracownik sklepu loguje się do własnego konta, uczy się z krótkich modułów produktowych, ogląda materiały wideo, rozwiązuje quizy i widzi swoje postępy. Osoby zarządzające mogą zapraszać pracowników, przypisywać ich do sklepów i tworzyć wielojęzyczne szkolenia.

## System projektowy i komponenty

- **BoardUI** jest głównym systemem komponentów i punktem wyjścia dla interfejsu całej aplikacji: panelu administracyjnego, logowania i widoków pracownika.
- Rozwijamy istniejący prototyp Next.js, który już zawiera podstawy BoardUI, zamiast wprowadzać drugi, konkurencyjny zestaw komponentów.
- Korzystamy z komponentów BoardUI i jego tokenów projektu; dopasowujemy motyw do identyfikacji Xzone. Własne komponenty tworzymy tam, gdzie nie ma odpowiedniego elementu BoardUI, zachowując spójne zasady wyglądu i dostępności.
- Płatne komponenty i szablony BoardUI wykorzystujemy tylko wtedy, gdy projekt ma odpowiednią licencję. Pierwszą wersję planujemy na dostępnych komponentach.

## Użytkownicy i uprawnienia

- **Administrator:** może być kilku; zarządza sklepami, pracownikami, językami, treściami i wynikami.
- **Pracownik:** widzi szkolenia, do których ma dostęp, kończy lekcje i quizy oraz sprawdza własne postępy.

Na start są dwie role: administrator i pracownik. Osobne role redaktora i kierownika sklepu nie są obecnie potrzebne.

## Główne scenariusze

### Pracownik

1. Administrator dodaje e-mail do listy zaproszeń i przypisuje sklep.
2. Pracownik otwiera zaproszenie, potwierdza e-mail i ustawia własne hasło.
3. Uzupełnia imię i nazwisko, loguje się i widzi przypisane szkolenia.
4. Otwiera moduł, czyta treść, ogląda osadzony film YouTube i poznaje najważniejsze informacje o produkcie.
5. Rozwiązuje quiz, zapisuje wynik i otrzymuje punkty za ukończenie.

### Administrator

1. Dodaje sklep i jego adres.
2. Dodaje pracowników przez listę dozwolonych adresów e-mail i przypisuje ich do sklepu.
3. Tworzy moduły i lekcje, dodaje treść, filmy, tłumaczenia i quizy.
4. Ustawia kolejność elementów metodą przeciągnij i upuść, sprawdza podgląd i publikuje szkolenie.
5. Przypisuje szkolenia do wybranych sklepów lub konkretnych pracowników.
6. Sprawdza ukończenia i wyniki według pracownika, sklepu i modułu.

## Wymagania funkcjonalne

### Konta i pracownicy

- Logowanie, wylogowanie, reset hasła i potwierdzanie adresu e-mail.
- Brak otwartej rejestracji. Konto może założyć wyłącznie osoba z aktywnym zaproszeniem lub e-mailem na liście dozwolonych adresów.
- Administrator przypisuje zaproszenie do sklepu; pracownik nie może samodzielnie wybrać sklepu ani roli.
- Profil pracownika obejmuje imię, nazwisko, e-mail i przypisanie do sklepu.
- Dane adresowe przechowujemy przy sklepie, a nie osobno przy każdym pracowniku: nazwa, ulica i numer, miasto, kod pocztowy, państwo oraz współrzędne mapy.
- Jeden sklep może mieć wielu pracowników.

### E-maile systemowe

- **Resend** obsługuje dostarczanie wiadomości transakcyjnych.
- **React Email** służy do tworzenia wielokrotnego użytku szablonów w React i oglądania ich w lokalnym podglądzie przed wysyłką.
- Wiadomości Auth — zaproszenie, potwierdzenie adresu i reset hasła — są wysyłane przez Supabase Auth skonfigurowany z SMTP Resend.
- Pierwsza wersja wysyła tylko standardowe wiadomości konta: zaproszenie, potwierdzenie adresu i reset hasła. Powiadomienia o przypisaniu szkoleń i przypomnienia nie wchodzą do zakresu.
- Szablony e-maili mają wersje PL/EN/DE/CZ. Język wiadomości wynika z preferencji pracownika; zachowanie dla brakującego tłumaczenia powinno używać języka domyślnego.
- Przed wysyłką można sprawdzić układ i treść w podglądzie React Email. Testowe wiadomości trafiają wyłącznie na wskazane adresy testowe.
- Klucze Resend i hasła SMTP przechowujemy w zmiennych środowiskowych lub ustawieniach hostingu, nigdy w repozytorium.

### Sklepy i mapa

- Lista sklepów z wyszukiwaniem i filtrowaniem po państwie oraz mieście.
- Mapa z pinezkami sklepów; kliknięcie pokazuje sklep i przypisanych pracowników zgodnie z uprawnieniami.
- Pracownik widzi wyłącznie swój przypisany sklep; administrator widzi wszystkie sklepy i przypisane osoby. Publiczne udostępnianie mapy nie wchodzi w zakres pierwszej wersji.
- Mapa pokazuje miejsca pracy, nie śledzi bieżącej lokalizacji pracowników.

### Szkolenia i edycja treści

- Struktura: **szkolenie → moduły → lekcje → bloki treści**.
- Administrator przypisuje szkolenia do wybranych sklepów lub konkretnych pracowników; pracownik widzi szkolenia przypisane do niego.
- Edytor treści z nagłówkami, akapitami, linkami, listami punktowanymi i numerowanymi oraz obrazami.
- Lekcja może zawierać film YouTube osadzony przez adres URL.
- Nie tworzymy osobnego katalogu produktów; informacje i krótkie punkty o produkcie można umieścić bezpośrednio w lekcji, jeśli są potrzebne.
- Moduły i lekcje można sortować metodą przeciągnij i upuść.
- Treść ma status roboczy lub opublikowany; nieopublikowane zmiany nie zmieniają widoku pracownika.
- Autor może podejrzeć treść przed publikacją.

### Języki

- Języki początkowe: polski, angielski, niemiecki i czeski.
- Treści modułów i lekcji mają niezależne wersje językowe.
- Administrator może dodać kolejny język bez przebudowywania aplikacji.
- Panel pokazuje brakujące tłumaczenia; nieprzetłumaczona treść jest ukryta przed pracownikiem w danym języku.

### Quizy, postęp i grywalizacja

- Quiz może być przypisany do lekcji lub modułu.
- System zapisuje odpowiedzi, wynik, liczbę prób i ukończenie.
- Próg zaliczenia wynosi 80%; liczba podejść jest nielimitowana. Quiz jest zaliczony po uzyskaniu co najmniej 80%.
- Postęp pracownika jest widoczny na jego koncie, a uprawnione osoby mogą przeglądać postępy sklepu.
- Punkty przyznawane za ukończenie lekcji lub modułu oraz zaliczenie quizu.
- Odznaki można dodać jako kolejny element grywalizacji.
- Globalny ranking obejmuje wszystkich pracowników i pokazuje imię oraz pierwszą literę nazwiska.
- Przy nazwie można pokazać miasto albo sklep; wybór oraz okres rankingu pozostają do ustalenia. E-mail nie jest pokazywany.
- Połączenie imienia, inicjału i lokalizacji może ułatwić rozpoznanie pracownika, szczególnie w małym sklepie. Ranking jest dostępny wyłącznie zalogowanym pracownikom.

### Testowanie

Słowo „testy” może oznaczać quizy szkoleniowe oraz testy jakości aplikacji. Plan uwzględnia oba znaczenia:

- **Quizy dla pracowników:** część funkcji produktu opisana wyżej.
- **Testy aplikacji:** automatyczne sprawdzanie logowania i zaproszeń, uprawnień, publikacji treści, zapisu postępów i quizów. Dodawane razem z funkcjami, nie dopiero na końcu.

## Prywatność i bezpieczeństwo

- Wszyscy pracownicy należą do konkretnego sklepu; każdy sklep może mieć wielu pracowników.
- Pracownik widzi własne dane i postępy. Dostęp do danych innych osób zależy od roli.
- Dostęp do bazy ograniczają role i polityki po stronie serwera; ukrycie elementu w interfejsie nie jest zabezpieczeniem.
- Zaproszenie i przypisanie do sklepu muszą być sprawdzone po stronie serwera.
- Dane projektu Academy są oddzielone od projektu Magazyn. Przed każdą zmianą w bazie należy zweryfikować właściwy alias MCP i `project_ref` zgodnie z `AGENTS.md`.

## Proponowane etapy

### Etap 1 — fundament

Ustalenie ról i zakresów dostępu; możliwość posiadania kilku administratorów; konta administratora i pracownika; zaproszenia e-mail; profil pracownika; sklepy i przypisanie pracowników; podstawowe polityki dostępu; skonfigurowanie Resend dla e-maili Auth oraz szablonów React Email z lokalnym podglądem.

### Etap 2 — zarządzanie szkoleniami

Szkolenia, moduły, lekcje, edytor treści, filmy YouTube, wersje językowe PL/EN/DE/CZ, podgląd, publikacja i sortowanie drag and drop. Informacje o produktach są częścią treści lekcji, bez osobnego katalogu.

### Etap 3 — nauka i sprawdzanie wiedzy

Widok pracownika, przypisywanie szkoleń do sklepów i osób, quizy, zaliczenia, próby, zapisywanie postępów oraz podstawowy raport ukończeń.

### Etap 4 — sklepy i grywalizacja

Mapa sklepów z widocznością ograniczoną do przypisanego sklepu dla pracowników, punkty, odznaki i globalny ranking po ustaleniu zasad prywatności.

Testy automatyczne i kontrola uprawnień są częścią każdego etapu. Etapy 1–3 tworzą użyteczne pierwsze wydanie; mapa i rozbudowana grywalizacja mogą wejść po uruchomieniu podstawowego procesu szkoleniowego.

## Ustalenia z właścicielem produktu

- Może być kilku administratorów; na start nie dodajemy osobnych ról redaktora i kierownika sklepu.
- Wystarczą moduły i lekcje; nie tworzymy osobnego katalogu produktów.
- Pracownik widzi wyłącznie przypisany sklep, administrator widzi wszystkie sklepy i przypisane osoby.
- Nieprzetłumaczona treść jest ukryta w danym języku.
- Globalny ranking obejmuje wszystkich pracowników i pokazuje imię oraz pierwszą literę nazwiska. Do ustalenia pozostają lokalizacja (miasto lub sklep) i okres rankingu.
- Szkolenia administrator przypisuje do sklepów lub konkretnych pracowników.
- Quizy zalicza się od wyniku 80%; podejścia są nielimitowane.
- Wysyłamy wyłącznie standardowe e-maile konta: zaproszenie, potwierdzenie adresu i reset hasła. Bez powiadomień o szkoleniach i przypomnień.

## Pytania do doprecyzowania

1. Czy obok imienia i inicjału nazwiska pokazywać miasto czy sklep? Proponuję miasto. Czy ranking ma być miesięczny czy obejmować cały okres?

## Obecny prototyp

Prototyp Next.js ma już ekrany logowania, dashboardu, nauki, modułów, quizu, nagród i FAQ. Ten brief opisuje docelowe zachowanie i panel administracyjny; backend, konta pracowników i CMS wymagają zaplanowania i implementacji.
