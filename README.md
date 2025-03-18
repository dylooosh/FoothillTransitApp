# Foothill Transit App

A modern web application for Foothill Transit that provides real-time bus tracking, safety reporting, and event updates.

## Features

- **Bus Tracking**: Real-time updates on bus locations and estimated arrival times
- **Bus Stops & Routes**: Comprehensive list of all bus stops and routes
- **Live Map**: Interactive map showing all active buses and stops
- **Safety Reporting**: Easy-to-use form for reporting safety concerns and incidents
- **Events**: Calendar of local events and transit-related activities

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd FoothillTransitApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Development

This project uses:
- React with TypeScript for the frontend
- Vite as the build tool
- Mantine UI for components
- React Router for navigation
- Leaflet for maps
- Mock data for demonstration purposes

## Project Structure

```
src/
  ├── components/         # React components
  │   ├── BusTracker.tsx
  │   ├── BusStops.tsx
  │   ├── Events.tsx
  │   ├── LiveMap.tsx
  │   ├── Navbar.tsx
  │   └── SafetyReport.tsx
  ├── data/              # Mock data and types
  │   └── mockData.ts
  ├── App.tsx            # Main application component
  └── main.tsx          # Application entry point
```

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Notes

This is a demonstration version using mock data. In a production environment, you would need to:

1. Replace mock data with real API calls
2. Implement proper error handling
3. Add authentication for the reporting system
4. Set up proper environment variables
5. Configure proper API keys for maps

## License

[Your License Here] 