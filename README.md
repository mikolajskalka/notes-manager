# 📒 Menadżer Notatek

Aplikacja webowa do zarządzania notatkami zbudowana przy użyciu Node.js, Express i EJS.

## Funkcjonalności

- ✅ Dodawanie nowej notatki (tytuł, treść, opcjonalnie załącznik)
- ✅ Edycja istniejącej notatki
- ✅ Usuwanie notatki
- ✅ Przeglądanie listy wszystkich notatek
- ✅ Wyświetlanie szczegółów pojedynczej notatki
- ✅ Eksport notatek do pliku tekstowego
- ✅ Wyszukiwanie notatek po tytule i treści
- ✅ Uwierzytelnianie użytkowników (lokalne oraz przez Microsoft)
- ✅ Notatki prywatne dla każdego użytkownika

## Technologie

- **Backend**: Node.js + Express.js
- **Frontend (szablony)**: EJS
- **Baza danych**: SQLite z Sequelize ORM
- **Operacje dyskowe**: Upload plików przy użyciu multer
- **REST API**: Pełne operacje CRUD
- **Autentykacja**: Passport.js (lokalna oraz Microsoft OAuth)

## Instalacja

```bash
# Klonowanie repozytorium
git clone <url-repozytorium>
cd notes-manager

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiskowych
# Skopiuj plik .env.example do .env i dostosuj ustawienia
cp .env.example .env

# Dla integracji z Microsoft OAuth:
# 1. Zarejestruj aplikację na https://portal.azure.com
# 2. Dodaj URL przekierowania: http://localhost:3000/auth/microsoft/callback
# 3. Uzupełnij odpowiednie zmienne w pliku .env

# Uruchomienie aplikacji w trybie developerskim
npm run dev
```

Po uruchomieniu, aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

## Uruchamianie

- **Tryb produkcyjny**: `npm start`
- **Tryb developerski (z autoodświeżaniem)**: `npm run dev`

## Struktura projektu

```
/notes-manager
├── config/
│   └── passport.js       # Konfiguracja Passport.js dla uwierzytelniania
├── controllers/
│   └── authController.js # Kontroler uwierzytelniania
├── models/
│   ├── index.js          # Konfiguracja bazy danych
│   ├── note.js           # Model notatki
│   └── user.js           # Model użytkownika
├── public/
│   └── uploads/          # Pliki przesłane przez użytkownika
├── routes/
│   ├── auth.js           # Router uwierzytelniania
│   └── notes.js          # Router dla notatek
├── views/
│   ├── auth/
│   │   ├── login.ejs     # Formularz logowania
│   │   └── register.ejs  # Formularz rejestracji
│   ├── layouts/
│   │   └── main.ejs      # Główny szablon layoutu
│   ├── notes/
│   │   ├── index.ejs     # Lista notatek
│   │   ├── show.ejs      # Widok pojedynczej notatki
│   │   ├── new.ejs       # Formularz tworzenia notatki
│   │   └── edit.ejs      # Formularz edycji notatki
├── .env                  # Zmienne środowiskowe (nie dołączać do repozytorium)
├── .env.example          # Przykładowy plik zmiennych środowiskowych
├── app.js                # Główny plik aplikacji
├── package.json
└── README.md
```

## API Endpoints

| Metoda  | Ścieżka             | Opis                         |
|---------|---------------------|------------------------------|
| GET     | `/notes`            | Pobierz wszystkie notatki    |
| GET     | `/notes/search`     | Wyszukaj notatki             |
| GET     | `/notes/:id`        | Pobierz konkretną notatkę    |
| POST    | `/notes`            | Dodaj nową notatkę           |
| PUT     | `/notes/:id`        | Edytuj notatkę               |
| DELETE  | `/notes/:id`        | Usuń notatkę                 |
| GET     | `/notes/:id/export` | Eksportuj notatkę do pliku   |
| GET     | `/auth/login`       | Formularz logowania          |
| POST    | `/auth/login`       | Zaloguj użytkownika          |
| GET     | `/auth/register`    | Formularz rejestracji        |
| POST    | `/auth/register`    | Zarejestruj użytkownika      |
| GET     | `/auth/logout`      | Wyloguj użytkownika          |
| GET     | `/auth/microsoft`   | Logowanie przez Microsoft    |