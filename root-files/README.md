# DreamScope-Frontend

Ren HTML/CSS/JS frontend til DreamScope.

## Lokal udvikling med Docker/Nginx

Start hele systemet fra backend-mappen. Backenden læser den lokale `.env`, så `RESEND_API_KEY` og `OPENAI_API_KEY` bliver brugt ved login og drømmefortolkning.

```bash
docker compose up --build
```

Åbn:

```text
http://localhost
```

Nginx server frontenden og proxyer `/api/*` til Spring Boot-containeren. Browseren ser kun én origin: `http://localhost`.
