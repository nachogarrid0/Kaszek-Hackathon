# TradeMind AI

Plataforma donde cualquier persona sin conocimientos de trading escribe su tesis de inversión en lenguaje natural, y un agente autónomo basado en Claude la convierte en una estrategia cuantificada, backtestada y lista para aprobar.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + TailwindCSS + Recharts + Zustand |
| Backend | FastAPI + Python |
| IA | Claude (Anthropic API) con Tool Calling |
| Backtest | Motor custom (pandas + numpy) |
| Datos | Mock data generado + Yahoo Finance |

## Requisitos

- Node.js >= 18
- Python >= 3.10
- API Key de Anthropic

## Setup

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Kaszek-Hackathon.git
cd Kaszek-Hackathon
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Crear el archivo `.env` con tu API key:

```bash
cp .env.example .env
# Editar .env y poner tu ANTHROPIC_API_KEY
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Correr la app

Abrir dos terminales:

**Terminal 1 — Backend (puerto 8000):**

```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 — Frontend (puerto 3000):**

```bash
cd frontend
npm run dev
```

Abrir http://localhost:3000

## Cómo funciona

1. El usuario escribe su tesis de inversión en el chat (ej: "Creo que la IA va a dominar el mercado los próximos 2 años")
2. El agente trabaja de forma autónoma — sin intervención del usuario
3. El dashboard de la derecha se construye progresivamente mientras el agente:
   - Identifica activos relevantes
   - Descarga datos históricos
   - Diseña y backtestea la estrategia
   - Ajusta parámetros si los resultados no son buenos
   - Compara contra el S&P 500
4. Claude explica cada decisión en el chat
5. El usuario aprueba y guarda la estrategia

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/agent/run` | Recibe tesis, devuelve SSE stream con el proceso del agente |
| GET | `/api/strategy/{id}` | Retorna una estrategia completa |
| POST | `/api/strategy/{id}/approve` | Aprueba y guarda la estrategia |
| GET | `/api/strategies` | Lista estrategias guardadas |

## Estructura del proyecto

```
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Settings (.env)
│   ├── api/                  # Endpoints y schemas
│   ├── agent/                # Orchestrator, tools, system prompt, handlers
│   ├── engine/               # Backtester, métricas, benchmark
│   ├── data/                 # Mock data y CSVs
│   └── store/                # In-memory store
│
├── frontend/
│   └── src/
│       ├── app/              # Pages (Next.js App Router)
│       ├── components/       # Chat, Dashboard, Layout, Strategies
│       ├── hooks/            # useAgent, useStrategies
│       ├── stores/           # Zustand store
│       ├── services/         # API client
│       └── types/            # TypeScript types
```
