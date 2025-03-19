import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Text, Stack, Group, Badge, Modal, Card, Button, Tooltip, useMantineTheme, Progress, Timeline, ThemeIcon, Overlay, Container } from '@mantine/core';
import { IconMapPin, IconCircleCheck, IconQrcode, IconBus, IconClock, IconRoute, IconBusStop, IconFlag, IconSchool, IconAlertTriangle, IconCalendarEvent, IconShare } from '@tabler/icons-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockBuses, mockBusStops } from '../data/mockData';
import BottomNavigation from './BottomNavigation';
import length from '@turf/length';
import along from '@turf/along';
import bearing from '@turf/bearing';
import { point } from '@turf/helpers';

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

// Define the bus sprite image (only using bus0.png)
const BUS_SPRITE = 'bus-sprites/bus0.png';

// Mapbox access token and route coordinates
const ACCESS_TOKEN = mapboxgl.accessToken;
const ROUTE_COORDINATES = [
  // Route 1: Cal Poly Pomona to Downtown Pomona
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8250, 34.0580], // Cal Poly Pomona North Campus
    [-117.8280, 34.0580], // Cal Poly Pomona East Campus
    [-117.8300, 34.0570], // Temple Ave & Valley Blvd
    [-117.8280, 34.0550], // Downtown Pomona
    [-117.8250, 34.0540], // Pomona Civic Center
    [-117.8220, 34.0530], // Pomona Mall
    [-117.8200, 34.0540], // Back to Temple Ave
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
  // Route 2: Diamond Bar to Cal Poly Pomona
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8200, 34.0590], // Cal Poly Pomona South Campus
    [-117.8180, 34.0600], // Grand Ave & Temple Ave
    [-117.8160, 34.0610], // Diamond Bar Blvd
    [-117.8140, 34.0620], // Diamond Bar Town Center
    [-117.8120, 34.0610], // Diamond Bar High School
    [-117.8140, 34.0600], // Back to Diamond Bar Blvd
    [-117.8180, 34.0590], // Back to Grand Ave
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
  // Route 3: Pomona Valley Hospital to Cal Poly Pomona
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8240, 34.0560], // Cal Poly Pomona West Campus
    [-117.8260, 34.0550], // Pomona Valley Hospital
    [-117.8280, 34.0540], // Pomona Valley Medical Center
    [-117.8300, 34.0530], // Pomona Valley Mall
    [-117.8280, 34.0520], // Pomona Valley Park
    [-117.8260, 34.0530], // Back to Hospital
    [-117.8240, 34.0540], // Back to Campus
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
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

  // Function to create a bus marker element
  const createBusElement = (routeIndex: number) => {
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    
    const img = document.createElement('img');
    img.src = BUS_SPRITE;
    img.style.width = '32px';
    img.style.height = '32px';
    img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
    img.style.transition = 'transform 0.3s ease';
    
    el.appendChild(img);
    return el;
  };

  // Update marker with rotation based on angle
  const updateMarker = (marker: mapboxgl.Marker, angle: number) => {
    const el = marker.getElement();
    const img = el.querySelector('img');
    if (img) {
      // Adjust angle to make the bus face the direction of travel
      // Subtract 90 because the bus0.png is facing north (90 degrees)
      img.style.transform = `rotate(${angle - 90}deg)`;
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

  // Initialize map and create routes
  useEffect(() => {
    if (!mapContainer.current) return;
    
    console.log('Initializing map...');

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-117.8221, 34.0579],
      zoom: 12,
      pitch: 0
    });

    // Fetch snapped routes from Mapbox Map Matching API
    const fetchRoutes = async () => {
      console.log('Fetching snapped routes...');
      
      try {
        const snappedRoutes = await Promise.all(
          ROUTE_COORDINATES.map(async (coords) => {
            // Convert coordinates to the format expected by the API
            const coordinates = coords.map(coord => coord.join(',')).join(';');
            
            // Construct the API URL
            const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${ACCESS_TOKEN}`;
            
            console.log('Fetching route from:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received route data:', data);
            
            if (!data.matchings || data.matchings.length === 0) {
              throw new Error('No route matching found');
            }
            
            return data.matchings[0].geometry;
          })
        );
        
        console.log('All routes fetched successfully');
        setRoutePaths(snappedRoutes);
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

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

    // Call the fetchRoutes function
    fetchRoutes();

    return () => {
      map.current?.remove();
      Object.values(markersRef.current).forEach(marker => marker.remove());
      busStopMarkersRef.current.forEach(marker => marker.remove());
    };
  }, []);

  // Update bus positions when routes are loaded
  useEffect(() => {
    if (!map.current || routePaths.length === 0) {
      console.log('Map or routes not ready yet. Map:', !!map.current, 'Routes:', routePaths.length);
      return;
    }

    console.log('Starting bus updates with', routePaths.length, 'routes');

    // Update buses
    const updateBuses = () => {
      mockBuses.forEach((bus, index) => {
        const time = Date.now() / 1000;
        const speed = 0.02; // Slower speed for more realistic movement
        
        // Use a different path for each bus
        const pathIndex = index % routePaths.length;
        const pathFeature = routePaths[pathIndex];
        if (!pathFeature) {
          console.warn(`No path found for bus ${bus.id} at index ${pathIndex}`);
          return;
        }

        try {
          // Validate the geometry type
          if (!pathFeature.geometry || pathFeature.geometry.type !== 'LineString') {
            console.error(`Invalid geometry for bus ${bus.id}:`, pathFeature);
            return;
          }
          
          // Calculate the total length of the path
          const pathLength = length(pathFeature);
          
          // Calculate position along the snapped path
          const pathProgress = (time * speed) % pathLength;
          const pointOnLine = along(pathFeature, pathProgress);
          
          // Ensure coordinates are correctly typed
          const position: [number, number] = pointOnLine.geometry.coordinates as [number, number];
          
          // Calculate a point slightly ahead for heading
          const nextPointOnLine = along(pathFeature, Math.min(pathProgress + 0.01, pathLength));
          const nextPosition: [number, number] = nextPointOnLine.geometry.coordinates as [number, number];
          
          // Calculate heading
          const headingValue = bearing(
            point(position),
            point(nextPosition)
          );

          if (!markersRef.current[bus.id]) {
            // Create new marker
            const el = createBusElement(pathIndex);
            const marker = new mapboxgl.Marker(el)
              .setLngLat(position)
              .addTo(map.current!);

            marker.getElement().addEventListener('click', () => {
              setSelectedBus(bus);
            });

            markersRef.current[bus.id] = marker;
            console.log(`Created marker for bus ${bus.id} at position:`, position);
          } else {
            // Update existing marker
            markersRef.current[bus.id].setLngLat(position);
            updateMarker(markersRef.current[bus.id], headingValue);
          }
        } catch (error) {
          console.error(`Error updating bus ${bus.id}:`, error);
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