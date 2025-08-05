# Shawn Sweeps - Premium Gaming Experience

## Project Overview

Shawn Sweeps is a premium sweepstakes gaming platform offering the finest selection of casino-style games. Built with modern web technologies for an exceptional user experience.

## Features

- **Premium Game Collection**: Access to 50+ popular sweepstakes games
- **Mobile-Optimized**: Fully responsive design for all devices
- **Secure Payments**: Bitcoin and Lightning Network payment integration via Paidly
- **Real-time Updates**: Live payment status tracking
- **Search & Filter**: Easy game discovery with search functionality

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **Payments**: Paidly Interactive API
- **Build Tool**: Vite
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd shawn-sweeps
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── data/               # Game data and configurations
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── contexts/           # React contexts
└── integrations/       # Third-party integrations
```

## Payment Integration

The platform uses Paidly Interactive for secure Bitcoin and Lightning Network payments:

- **Bitcoin On-Chain**: Traditional Bitcoin transactions
- **Lightning Network**: Fast, low-fee Bitcoin payments
- **Real-time Status**: Automatic payment confirmation
- **QR Code Support**: Easy mobile wallet integration

## Game Collection

Features popular sweepstakes games including:
- Fire Kirin
- Orion Stars
- Golden Dragon
- Ultra Panda
- Vegas X
- And many more...

## Support

For technical support or questions, please contact our development team.

## License

This project is proprietary software. All rights reserved.