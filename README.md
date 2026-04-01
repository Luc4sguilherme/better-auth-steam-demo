# Better Auth Steam Demo

A full-featured authentication demo application using [Better Auth](https://www.better-auth.com/) with a custom **Steam OpenID 2.0** authentication plugin.

## 🛠️ Tech Stack

### Backend (`/server`)
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **Better Auth** - Authentication system
- **Resend** - Email service
- **PostgreSQL** - Database

### Frontend (`/web`)
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI component library
- **Radix UI** - Accessible components
- **React Hook Form + Zod** - Forms and validation

### Plugin (`/plugins/better-auth-steam`)
- **better-auth-steam** - Custom Better Auth plugin for Steam authentication via OpenID 2.0

## ✨ Features

- 🔐 Login & Registration (email/password)
- 🎮 Steam authentication (OpenID 2.0)
- 🔑 Two-factor authentication (2FA)
- 📧 Email verification
- 🔄 Password reset
- 👤 User profile management
- 👑 Admin panel
- 🔗 Account linking (link Steam to existing account)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL
- [Steam API key](https://steamcommunity.com/dev/apikey)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Luc4sguilherme/better-auth-steam-demo.git
cd better-auth-steam-demo
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (create `.env` files in `/server` and `/web`).

   The server requires the following variables:
   - `BETTER_AUTH_URL` - Backend URL
   - `BETTER_AUTH_SECRET` - Auth secret key
   - `BETTER_TRUSTED_ORIGINS` - Trusted frontend origin
   - `STEAM_API_KEY` - Your Steam API key

4. Run database migrations:
```bash
cd server
pnpm prisma:migrate
```

### Running

**Backend:**
```bash
pnpm dev:server
```

**Frontend:**
```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── plugins/
│   └── better-auth-steam/  # Custom Steam auth plugin
│       └── index.ts         # Plugin implementation (OpenID 2.0)
│
├── server/                  # NestJS API
│   ├── src/
│   │   ├── auth/            # Authentication module (Better Auth)
│   │   ├── email/           # Email service (Resend)
│   │   ├── prisma/          # Prisma service
│   │   └── users/           # Users module
│   └── prisma/              # Schema and migrations
│
└── web/                     # Next.js frontend
    ├── app/                 # Routes and pages
    ├── components/          # React components
    └── lib/                 # Utilities and config
```

## 📄 License

This project is for demonstration purposes only.