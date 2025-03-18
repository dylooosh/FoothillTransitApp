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
}

export interface BusStop {
  id: string;
  name: string;
  address: string;
  routes: string[];
  amenities: string[];
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
    id: '1',
    number: '195A',
    route: 'Silver Streak',
    status: 'On Time',
    nextStop: 'Cal Poly Pomona',
    eta: '5 min',
    progress: 75,
    previousStop: 'Downtown Pomona',
    finalStop: 'El Monte Station'
  },
  {
    id: '2',
    number: '486',
    route: 'Express Line',
    status: 'Delayed',
    nextStop: 'Pomona Transit Center',
    eta: '10 min',
    progress: 45,
    previousStop: 'Diamond Bar',
    finalStop: 'El Monte Station'
  },
  {
    id: '3',
    number: '190',
    route: 'Local Line',
    status: 'On Time',
    nextStop: 'West Covina',
    eta: '3 min',
    progress: 90,
    previousStop: 'Baldwin Park',
    finalStop: 'El Monte Station'
  }
];

export const mockBusStops = [
  {
    id: '1',
    name: 'Cal Poly Pomona Transit Center',
    address: '3801 W Temple Ave, Pomona, CA 91768',
    routes: ['486', '190', '194', '480'],
    amenities: ['Shelter', 'Seating', 'Real-time Display'],
  },
  {
    id: '2',
    name: 'Grand Ave / Temple Ave',
    address: 'Grand Ave & Temple Ave, Walnut, CA 91789',
    routes: ['190', '194'],
    amenities: ['Shelter', 'Seating'],
  },
  {
    id: '3',
    name: 'Downtown Pomona Transit Center',
    address: '100 W Commercial St, Pomona, CA 91768',
    routes: ['486', '194', '480'],
    amenities: ['Shelter', 'Seating', 'Real-time Display', 'Ticket Vending'],
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