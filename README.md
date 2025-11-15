# Smart Contract Security Validator

Smart Contract Security Validator scans Solidity smart contracts for common issues and surfaces official guidance from the OWASP Nest API. Built with Next.js, the application integrates static analysis and API functionality directly into the frontend using serverless functions.

## Project Structure

- `frontend` – Next.js application with integrated API routes that handles:
  - UI for pasting/uploading Solidity contracts and reviewing scan results
  - Serverless API routes (`/api/scan`, `/api/health`) for static analysis
  - Solidity parsing and vulnerability detection using `solidity-parser-antlr`
  - OWASP Nest API integration for security guidance
- `backend` – Legacy Express.js backend (no longer used, logic migrated to frontend)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ (or pnpm / yarn with equivalent commands)

### Installation and Setup

```bash
cd frontend
npm install
npm run dev
```

The application runs on <http://localhost:3000> by default.

### Environment Variables (Optional)

Create a `.env.local` file in the `frontend` directory for OWASP Nest API integration:

```bash
# OWASP Nest API Key (optional - app works with fallback guidelines if not provided)
NEST_API_KEY=your-owasp-nest-api-key

# OWASP Nest API Base URL (optional - defaults to https://nest.owasp.dev)
NEST_API_BASE_URL=https://nest.owasp.dev
```

**Note:** The application works without an OWASP Nest API key, using fallback security guidelines. However, providing an API key enables richer, more detailed security recommendations.

## How It Works

1. The frontend collects Solidity source code via file upload or text input.
2. The code is sent to the Next.js API route (`/api/scan`) which runs as a serverless function.
3. Static analysis inspects parsed AST nodes to detect issues such as:
   - **Reentrancy** - State changes after external calls
   - **Low-Level Call Usage** - Unsafe `.call()`, `.delegatecall()`, etc.
   - **Missing Access Control** - Functions without proper access modifiers
   - **Unchecked Arithmetic** - Arithmetic operations in Solidity <0.8 without SafeMath
   - **Parser Errors** - Syntax or compilation issues
4. Each finding is enriched with guidance from the OWASP Nest API using the official TypeScript SDK (with graceful fallbacks and timeouts when the API is unavailable).
5. The frontend renders the vulnerability list with explanations, line references, code snippets, and recommended remediations.

## Example Workflow

1. Start the application: `cd frontend && npm run dev`
2. Visit <http://localhost:3000>
3. Paste Solidity code or upload a `.sol` file
4. Click **Scan** to analyze the contract
5. Review the results:
   - Security score and grade (A+ to F)
   - Detailed vulnerability cards with line numbers
   - OWASP security guidelines for each finding
   - Code snippets highlighting issues
6. Track your progress with the stats dashboard and achievements system

## Features

- ✅ **Static Analysis** - Detects common Solidity vulnerabilities
- ✅ **OWASP Integration** - Official security guidance from OWASP Nest API
- ✅ **Real-time Scanning** - Instant feedback on contract security
- ✅ **Gamification** - Achievement system and progress tracking
- ✅ **Dark Mode** - Full dark/light theme support
- ✅ **Responsive Design** - Works on all device sizes
- ✅ **Error Handling** - Graceful fallbacks and user-friendly error messages
- ✅ **Serverless Architecture** - Deploy-ready for Vercel

## Deployment

The application is configured for deployment on Vercel. See `DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `frontend`
4. Add environment variables (optional):
   - `NEST_API_KEY` - Your OWASP Nest API key
   - `NEST_API_BASE_URL` - OWASP Nest API URL (optional)

## Technology Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.4.5
- **Styling:** Tailwind CSS 3.4.13
- **Animations:** Framer Motion 12.23.24
- **Icons:** Lucide React
- **Parser:** solidity-parser-antlr 0.4.11
- **OWASP SDK:** owasp-nest 0.3.0

## Project Status

✅ **Production Ready** - Fully functional and deployed
- Backend logic integrated into Next.js API routes
- Comprehensive error handling and timeouts
- OWASP Nest API integration with fallbacks
- User statistics and achievement system

