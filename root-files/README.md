# DreamScope-Frontend

Ren HTML/CSS/JS frontend til DreamScope.

## Lokal udvikling

Start backenden på `http://localhost:8080`. Backenden læser den lokale `.env`, så `RESEND_API_KEY` og `OPENAI_API_KEY` bliver brugt ved login og drømmefortolkning.

Start derefter frontenden fra projektroden:

```bash
python3 -m http.server 3000
```

Åbn:

```text
http://localhost:3000/root-files/index.html
```

Frontenden kalder som standard backend på `http://localhost:8080`. Hvis backend kører på en anden adresse, kan den overskrives før `js/app.js` loader:

```html
<script>
  window.DREAMSCOPE_API_BASE_URL = "http://localhost:8081";
</script>
```
