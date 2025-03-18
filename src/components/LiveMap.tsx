import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Text, Stack, Group, Badge, Modal, Card, Button, Tooltip, useMantineTheme, Progress, Timeline, ThemeIcon, Overlay, Container } from '@mantine/core';
import { IconMapPin, IconCircleCheck, IconQrcode, IconBus, IconClock, IconRoute, IconBusStop, IconFlag, IconSchool, IconAlertTriangle, IconCalendarEvent, IconShare } from '@tabler/icons-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockBuses, mockBusStops } from '../data/mockData';
import BottomNavigation from './BottomNavigation';
import * as turf from '@turf/turf';

// Note: Replace with your Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface BusDetails {
  id: string;
  number: string;
  route: string;
  status: string;
  nextStop: string;
  eta: string;
  progress: number;
  previousStop?: string;
  finalStop?: string;
}

const ROUTE_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEEAD', // Cream Yellow
  '#D4A5A5', // Dusty Rose
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#FF9F43', // Orange
];

// Define the bus angles and their corresponding sprite images
const BUS_ANGLES = {
  0: '/FoothillTransitApp/bus-sprites/bus0.png',
  45: '/FoothillTransitApp/bus-sprites/bus45.png',
  90: '/FoothillTransitApp/bus-sprites/bus90.png',
  135: '/FoothillTransitApp/bus-sprites/bus135.png',
  180: '/FoothillTransitApp/bus-sprites/bus180.png',
  225: '/FoothillTransitApp/bus-sprites/bus225.png',
  270: '/FoothillTransitApp/bus-sprites/bus270.png',
  315: '/FoothillTransitApp/bus-sprites/bus315.png',
};

// Mapbox access token and route coordinates
const ACCESS_TOKEN = 'pk.eyJ1IjoiZHlsb29zaCIsImEiOiJjbTg2cjdrcG0wN3BtMmpwc2JpcDR2dWx3In0.G2LSVKImE8ZslGr2uwvCJA';
const ROUTE_COORDINATES = [
  [
    [-117.872226, 34.070198],
    [-117.856088, 34.050211],
    [-117.837539, 34.047341]
  ],
  [
    [-117.816944, 34.059402],
    [-117.818842, 34.058634],
    [-117.814016, 34.048908]
  ],
  [
    [-117.834311, 34.026344],
    [-117.864428, 34.020798],
    [-117.826642, 34.064110]
  ]
];

const LiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const busStopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const animationRef = useRef<number | null>(null);
  const [lng] = useState(-117.8221);
  const [lat] = useState(34.0579);
  const [zoom] = useState(12);
  const [selectedBus, setSelectedBus] = useState<BusDetails | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showTracker, setShowTracker] = useState(false);
  const [routePaths, setRoutePaths] = useState<any[]>([]);
  const theme = useMantineTheme();

  // Get the GitHub Pages URL
  const currentURL = 'https://dylooosh.github.io/FoothillTransitApp/#/live-map';

  // Function to get the closest available angle
  const getClosestAngle = (angle: number) => {
    const normalized = ((angle % 360) + 360) % 360;
    const angles = Object.keys(BUS_ANGLES).map(Number);
    return angles.reduce((prev, curr) => 
      Math.abs(curr - normalized) < Math.abs(prev - normalized) ? curr : prev
    );
  };

  // Function to create a bus marker element
  const createBusElement = (routeIndex: number) => {
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    
    const markerHtml = `
      <div style="
        width: 48px;
        height: 48px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      "></div>
    `;
    
    el.innerHTML = markerHtml;
    return el;
  };

  // Function to update marker rotation using sprite images
  const updateMarker = (marker: mapboxgl.Marker, angle: number) => {
    const el = marker.getElement();
    const closestAngle = getClosestAngle(angle);
    const imageUrl = BUS_ANGLES[closestAngle as keyof typeof BUS_ANGLES];
    
    const div = el.querySelector('.vehicle-marker > div') as HTMLElement;
    if (div) {
      div.style.backgroundImage = `url(${imageUrl})`;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch route data and create map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-117.8221, 34.0579],
      zoom: 12,
      pitch: 0
    });

    // Add bus stop markers
    mockBusStops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = 'bus-stop-marker';
      el.innerHTML = `
        <div style="
          width: 12px;
          height: 12px;
          background-color: #666;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([stop.lng, stop.lat])
        .addTo(map.current!);

      busStopMarkersRef.current.push(marker);
    });

    // Fetch the snapped routes for each set of coordinates
    const fetchRoutes = async () => {
      try {
        const paths = await Promise.all(ROUTE_COORDINATES.map(async (coords) => {
          const coordinates = coords.map(coord => coord.join(',')).join(';');
          const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?access_token=${ACCESS_TOKEN}`);
          const data = await response.json();
          
          if (data.matchings && data.matchings[0]) {
            // Return the line string as a GeoJSON feature
            return {
              type: "Feature",
              properties: {},
              geometry: data.matchings[0].geometry
            };
          }
          return null;
        }));
        
        setRoutePaths(paths.filter(Boolean));
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

    fetchRoutes();

    return () => {
      map.current?.remove();
      Object.values(markersRef.current).forEach(marker => marker.remove());
      busStopMarkersRef.current.forEach(marker => marker.remove());
    };
  }, []);

  // Update bus positions when routes are loaded
  useEffect(() => {
    if (!map.current || routePaths.length === 0) return;

    const updateBuses = () => {
      mockBuses.forEach((bus, index) => {
        const time = Date.now() / 1000;
        const speed = 0.05; // Slower speed for more realistic movement
        
        // Use a different path for each bus
        const pathIndex = index % routePaths.length;
        const pathFeature = routePaths[pathIndex];
        if (!pathFeature) return;

        try {
          // Calculate the total length of the path
          const pathLength = turf.length(pathFeature, { units: 'kilometers' });
          
          // Calculate position along the snapped path
          const pathProgress = (time * speed) % pathLength;
          const point = turf.along(pathFeature, pathProgress, { units: 'kilometers' });
          
          // Ensure coordinates are correctly typed
          const position: [number, number] = point.geometry.coordinates as [number, number];
          
          // Calculate a point slightly ahead for heading
          const nextPoint = turf.along(pathFeature, Math.min(pathProgress + 0.01, pathLength), { units: 'kilometers' });
          const nextPosition: [number, number] = nextPoint.geometry.coordinates as [number, number];
          
          // Calculate heading
          const heading = turf.bearing(position, nextPosition);

          if (!markersRef.current[bus.id]) {
            // Create new marker
            const el = createBusElement(index);
            const marker = new mapboxgl.Marker(el)
              .setLngLat(position)
              .addTo(map.current!);

            marker.getElement().addEventListener('click', () => {
              setSelectedBus(bus);
            });

            markersRef.current[bus.id] = marker;
          } else {
            // Update existing marker
            markersRef.current[bus.id].setLngLat(position);
            updateMarker(markersRef.current[bus.id], heading);
          }
        } catch (error) {
          console.error('Error updating bus position:', error);
        }
      });

      animationRef.current = requestAnimationFrame(updateBuses);
    };

    updateBuses();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [routePaths]);

  const getStageColor = (progress: number, threshold: number) => {
    return progress >= threshold ? 'green' : 'gray';
  };

  return (
    <Stack style={{ position: 'relative', height: '100vh' }}>
      <Paper
        style={{
          flex: 1,
          marginTop: isMobile ? 0 : 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          ref={mapContainer} 
          style={{ 
            width: '100%', 
            height: '100%'
          }} 
        />

        {/* Share Button */}
        <Button
          leftSection={<IconQrcode size={16} />}
          onClick={() => setShowQR(true)}
          variant="filled"
          style={{
            position: 'absolute',
            top: 16,
            right: 60,
            zIndex: 1000,
            background: 'white',
            color: 'black'
          }}
          size="sm"
        >
          See on iPhone
        </Button>

        {selectedBus && (
          <Card shadow="sm" p="md" radius="md" 
            style={{
              position: 'absolute',
              bottom: isMobile ? 80 : 20, // Adjust for mobile bottom nav
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '400px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000
            }}
          >
            <Stack>
              <Group justify="space-between">
                <Group>
                  <IconBus size={24} style={{ color: ROUTE_COLORS[parseInt(selectedBus.number) % ROUTE_COLORS.length] }} />
                  <div>
                    <Text fw={700} size="lg">Bus {selectedBus.number}</Text>
                    <Text size="sm" c="dimmed">{selectedBus.route}</Text>
                  </div>
                </Group>
                <Badge 
                  color={selectedBus.status === 'On Time' ? 'green' : 'yellow'}
                  variant="dot"
                  size="lg"
                >
                  {selectedBus.status}
                </Badge>
              </Group>

              <Timeline active={Math.floor(selectedBus.progress / 25)} bulletSize={24} 
                styles={{
                  item: { minHeight: 'auto' }
                }}
              >
                <Timeline.Item 
                  bullet={<IconRoute size={12} />} 
                  title="En Route"
                  color={getStageColor(selectedBus.progress, 0)}
                  lineVariant="dashed"
                >
                  <Text size="sm" mt={4}>{selectedBus.previousStop}</Text>
                </Timeline.Item>

                <Timeline.Item 
                  bullet={<IconBusStop size={12} />} 
                  title="Next Stop"
                  color={getStageColor(selectedBus.progress, 25)}
                  lineVariant="dashed"
                >
                  <Text size="sm" mt={4}>{selectedBus.nextStop}</Text>
                </Timeline.Item>

                <Timeline.Item 
                  bullet={<IconClock size={12} />} 
                  title="ETA"
                  color={getStageColor(selectedBus.progress, 50)}
                  lineVariant="dashed"
                >
                  <Text size="sm" mt={4}>{selectedBus.eta}</Text>
                </Timeline.Item>

                <Timeline.Item 
                  bullet={<IconFlag size={12} />} 
                  title="Final Stop"
                  color={getStageColor(selectedBus.progress, 75)}
                >
                  <Text size="sm" mt={4}>{selectedBus.finalStop}</Text>
                </Timeline.Item>
              </Timeline>

              <Button 
                variant="subtle" 
                color="gray" 
                size="sm"
                onClick={() => setSelectedBus(null)}
              >
                Close
              </Button>
            </Stack>
          </Card>
        )}

        {/* Mobile Bottom Navigation */}
        {isMobile && <BottomNavigation />}
      </Paper>

      <Modal
        opened={showQR}
        onClose={() => setShowQR(false)}
        title="Share Live Map"
        centered
        size="sm"
      >
        <Stack align="center" gap="lg">
          <Card
            style={{ 
              width: 200, 
              height: 200, 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid #e0e0e0'
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentURL)}`}
              alt="QR Code"
              style={{ width: 180, height: 180 }}
            />
          </Card>
          <Text size="sm" c="dimmed" ta="center">
            Scan this QR code with your phone's camera to open the live map
          </Text>
          <Button 
            fullWidth
            leftSection={<IconShare size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(currentURL);
            }}
          >
            Copy Link
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default LiveMap; 