export interface Bus {
  id: string;
  number: string;
  route: string;
  status: 'On Time' | 'Delayed' | 'Early';
  nextStop: string;
  eta: string;
  progress: number;
  previousStop: string;
  finalStop: string;
  baseLng: number;
  baseLat: number;
}

export interface BusStop {
  id: string;
  name: string;
  address: string;
  routes: string[];
  amenities: string[];
  lng: number;
  lat: number;
}

export interface Event {
  id: string;
  title: string;
  type: 'Service Change' | 'Community Event';
  date: string;
  location: string;
  description: string;
  affectedRoutes?: string[];
  imageUrl?: string;
}

export const mockBuses = [
  {
    id: 'BUS001',
    number: '187',
    route: '187A',
    status: 'On Time',
    nextStop: 'Foothill Transit Center',
    eta: '5',
    progress: 75,
    previousStop: 'Azusa Ave / Gladstone St',
    finalStop: 'Montclair Transit Center',
    baseLng: -117.8221,
    baseLat: 34.0579
  },
  {
    id: 'BUS002',
    number: '280',
    route: '280B',
    status: 'Delayed',
    nextStop: 'Azusa Station',
    eta: '10',
    progress: 25,
    previousStop: 'Citrus College',
    finalStop: 'Puente Hills Mall',
    baseLng: -117.8321,
    baseLat: 34.0679
  },
  {
    id: 'BUS003',
    number: '486',
    route: '486C',
    status: 'On Time',
    nextStop: 'Cal Poly Pomona',
    eta: '3',
    progress: 50,
    previousStop: 'Diamond Bar',
    finalStop: 'El Monte Station',
    baseLng: -117.8121,
    baseLat: 34.0479
  }
];

export const mockBusStops = [
  {
    id: 'STOP001',
    name: 'Foothill Transit Center',
    address: '3801 W Temple Ave, Pomona, CA 91768',
    routes: ['486', '190', '194', '480'],
    amenities: ['Shelter', 'Seating', 'Real-time Display'],
    lng: -117.8221,
    lat: 34.0579
  },
  {
    id: 'STOP002',
    name: 'Azusa Station',
    address: 'Azusa Station, Azusa, CA 91702',
    routes: ['280'],
    amenities: ['Shelter', 'Seating'],
    lng: -117.8321,
    lat: 34.0679
  },
  {
    id: 'STOP003',
    name: 'Cal Poly Pomona',
    address: '3801 W Temple Ave, Pomona, CA 91768',
    routes: ['486', '190', '194', '480'],
    amenities: ['Shelter', 'Seating', 'Real-time Display'],
    lng: -117.8121,
    lat: 34.0479
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Route 187 Service Change',
    type: 'Service Change',
    date: '2024-04-15',
    location: 'Azusa - Pasadena Route',
    description: 'Temporary route modification due to road construction on Foothill Boulevard.',
    affectedRoutes: ['187', '280'],
    imageUrl: '/images/placeholder.svg'
  },
  {
    id: '2',
    title: 'Cal Poly Pomona Community Art Exhibition',
    type: 'Community Event',
    date: '2024-04-20',
    location: 'Cal Poly Pomona Art Gallery',
    description: 'Join us for a special exhibition featuring local artists and Cal Poly Pomona students. Free admission with your Foothill Transit pass. Refreshments will be served.',
    imageUrl: '/images/placeholder.svg'
  },
  {
    id: '3',
    title: 'Route 486 Schedule Update',
    type: 'Service Change',
    date: '2024-04-25',
    location: 'El Monte - Pomona Route',
    description: 'New schedule implementation to improve service frequency during peak hours.',
    affectedRoutes: ['486'],
    imageUrl: '/images/placeholder.svg'
  }
]; 