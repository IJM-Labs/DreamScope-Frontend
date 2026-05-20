# DreamScope Frontend

Frontend til DreamScope – en webapplikation hvor brugere kan skrive deres drømme og modtage AI-genererede fortolkninger.

---

# Funktioner

- Login via magic link
- Dashboard til bruger
- Opret og se drømme
- AI-fortolkning af drømme
- Terms and Conditions
- Responsivt design

---

# Teknologier

## Frontend
- HTML
- CSS
- JavaScript

## Build og Deployment
- Webpack
- Docker
- Nginx

## Test
- Playwright
- GitHub Actions

---

# Projektstruktur

```text
css/
├── components/
├── pages/
├── style.css

js/
├── components/
├── pages/
├── services/
├── utils/
└── app.js

img/
├── backgrounds/
├── icons/
└── logo/

tests/
└── e2e/

webpack/
nginx/
```

---

# Installation

Installer dependencies:

```bash
npm install
```

---

# Lokal udvikling

Start udviklingsmiljø:

```bash
npm run dev
```

Åbn:

```text
http://localhost
```

---

# Produktion

Byg projekt:

```bash
npm run build
```

Start med Docker:

```bash
docker build -t dreamscope-frontend .
docker run -p 80:80 dreamscope-frontend
```

---

# Test

Kør E2E tests:

```bash
npm test
```

eller

```bash
npx playwright test
```

---

# Miljøvariabler

Kopiér:

```bash
cp .env.example .env
```

Tilpas værdier efter behov.

---

# CI/CD

Automatiske workflows:

```text
.github/workflows/
```

Indeholder:
- CI
- Publish

---

# Team

DreamScope projektgruppe
