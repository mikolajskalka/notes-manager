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
- ✅ Uwierzytelnianie użytkowników (lokalne)
- ✅ Notatki prywatne dla każdego użytkownika

## Technologie

- **Backend**: Node.js + Express.js
- **Frontend (szablony)**: EJS
- **Baza danych**: SQLite z Sequelize ORM
- **Operacje dyskowe**: Upload plików przy użyciu multer
- **REST API**: Pełne operacje CRUD
- **Autentykacja**: Passport.js (lokalna)

## Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/mikolajskalka/notes-manager.git
cd notes-manager

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiskowych
# Skopiuj plik .env.example do .env i dostosuj ustawienia
cp .env.example .env

# Uruchomienie aplikacji w trybie developerskim
npm run dev
```

Po uruchomieniu, aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

**Publiczna wersja aplikacji jest dostępna pod adresem: [http://149.156.43.57/12040/](http://149.156.43.57/12040/)**

## Uruchamianie

- **Tryb produkcyjny**: `npm start`
- **Tryb developerski (z autoodświeżaniem)**: `npm run dev`

## Automatyczne ustawianie BASE_PATH w zależności od trybu uruchomienia

W tym projekcie skrypt produkcyjny (`npm start`) automatycznie ustawia zmienną środowiskową `BASE_PATH` na wartość odpowiadającą portowi (np. `/12040`), dzięki czemu aplikacja działa poprawnie za reverse proxy pod adresem z prefiksem ścieżki (np. `http://adres-serwera/12040/`).

W trybie developerskim (`npm run dev`) aplikacja uruchamia się standardowo na `localhost:3000` bez żadnego prefiksu ścieżki (`BASE_PATH` nie jest ustawiony).

**Przykład uruchomienia produkcyjnego:**

```bash
PORT=12040 npm start
```

Wtedy aplikacja będzie dostępna pod adresem: `http://adres-serwera/12040/`

**Przykład uruchomienia developerskiego:**

```bash
npm run dev
```

Wtedy aplikacja będzie dostępna pod adresem: `http://localhost:3000/`

Nie musisz ręcznie ustawiać `BASE_PATH` – jest ona ustawiana automatycznie przez odpowiedni skrypt w zależności od trybu uruchomienia.

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