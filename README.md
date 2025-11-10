# Smart Contract Security Validator

Smart Contract Security Validator scans Solidity smart contracts for common issues and surfaces official guidance from the OWASP Nest API. The project is split into a Next.js frontend and an Express.js backend so each part can scale independently.

## Project Structure

- `frontend` – Next.js + Tailwind CSS UI where developers paste or upload Solidity contracts and review scan results.
- `backend` – Express.js (TypeScript) API that performs static analysis using `solidity-parser-antlr` and fetches OWASP Nest recommendations.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (or pnpm / yarn with equivalent commands)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default the app runs on <http://localhost:3000>. Configure the backend URL with `NEXT_PUBLIC_API_BASE_URL` in a `.env.local` file if it differs from the default `http://localhost:4000`.

### Backend

```bash
cd backend
npm install
npm run build # optional type-check
npm run dev
```

The API listens on <http://localhost:4000>. Configure the port by setting the `PORT` environment variable.  
Create a `.env` file in `backend` to provide your OWASP Nest API key:

```bash
NEST_API_KEY=your-owasp-nest-api-key
# Optional: override base URL (defaults to https://nest.owasp.dev)
# NEST_API_BASE_URL=https://nest.owasp.dev
```

## How It Works

1. The frontend collects Solidity source code via file upload or text input.
2. The backend receives the contract through `POST /scan`.
3. Static analysis inspects parsed AST nodes to detect issues such as reentrancy, unsafe `.call()` usage, missing access control, unchecked arithmetic, and parser errors.
4. The backend enriches each finding with guidance from the OWASP Nest API using the official TypeScript SDK (with graceful fallbacks when the API is unavailable).
5. The frontend renders the vulnerability list with explanations, line references, and recommended remediations.

## Example Workflow

1. Start backend: `npm run dev` inside `backend`.
2. Start frontend: `npm run dev` inside `frontend`.
3. Visit <http://localhost:3000>, paste Solidity code, and press **Scan**.
4. Review the results table to understand detected weaknesses and associated OWASP guidance.

## Next Steps

- Implement detailed vulnerability detection rules.
- Integrate OWASP Nest SDK calls with caching and error handling.
- Add unit tests for analysis helpers and API layers.
- Polish the UI with richer visuals and history tracking.

