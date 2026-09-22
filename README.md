# stella-profile
My profile

```mermaid
flowchart LR
    visitor([Visitor]) --> nginx
    you([You]) -->|/admin| nginx
    other([Other sites]) -->|/api/supporters/*| nginx
    kofi([Ko-fi]) -->|/api/kofi/webhook| nginx

    subgraph docker["Docker stack"]
        nginx["app: nginx :8083<br/>React site"]
        backend["backend: FastAPI"]
        uploads[("uploads volume")]
        nginx -->|"/api, /admin, /uploads"| backend
        backend --- uploads
    end

    backend -->|DATABASE_URL| db[("PostgreSQL")]
```

## Setup

```sh
cp .env.example .env          # fill it in
docker compose up -d --build  # prod: -f compose.prod.yaml

# first run only
docker compose cp export.csv backend:/tmp/kofi.csv
docker compose exec backend python -m app.kofi_import /tmp/kofi.csv
docker compose exec backend python -m app.seed
```

Ko-fi webhook URL: `https://<your-domain>/api/kofi/webhook`
