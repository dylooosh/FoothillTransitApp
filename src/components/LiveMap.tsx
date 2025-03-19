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
  // Route 1: Cal Poly Pomona Campus Loop
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8240, 34.0580], // Cal Poly Pomona North Campus
    [-117.8260, 34.0580], // Cal Poly Pomona East Campus
    [-117.8280, 34.0575], // Temple Ave & Valley Blvd
    [-117.8285, 34.0565], // Downtown Pomona
    [-117.8275, 34.0555], // Pomona Civic Center
    [-117.8255, 34.0545], // Pomona Mall
    [-117.8235, 34.0555], // Back to Temple Ave
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
  // Route 2: Cal Poly Pomona to Diamond Bar Loop
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8210, 34.0585], // Cal Poly Pomona South Campus
    [-117.8190, 34.0595], // Grand Ave & Temple Ave
    [-117.8170, 34.0605], // Diamond Bar Blvd
    [-117.8150, 34.0615], // Diamond Bar Town Center
    [-117.8130, 34.0605], // Diamond Bar High School
    [-117.8110, 34.0595], // Diamond Bar Park
    [-117.8090, 34.0585], // Diamond Bar Library
    [-117.8110, 34.0575], // Diamond Bar Community Center
    [-117.8130, 34.0565], // Back to Diamond Bar Blvd
    [-117.8150, 34.0555], // Back to Grand Ave
    [-117.8190, 34.0565], // Back to Campus
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
  // Route 3: Walnut to Pomona Loop
  [
    [-117.8221, 34.0579], // Cal Poly Pomona Campus Center
    [-117.8235, 34.0565], // Cal Poly Pomona West Campus
    [-117.8255, 34.0555], // Pomona Valley Hospital
    [-117.8275, 34.0545], // Pomona Valley Medical Center
    [-117.8295, 34.0535], // Pomona Valley Mall
    [-117.8315, 34.0525], // Pomona Valley Park
    [-117.8335, 34.0515], // Walnut Creek Park
    [-117.8355, 34.0505], // Walnut Creek Mall
    [-117.8375, 34.0495], // Walnut Creek Library
    [-117.8355, 34.0485], // Back to Walnut Creek Park
    [-117.8335, 34.0495], // Back to Pomona Valley Park
    [-117.8315, 34.0505], // Back to Pomona Valley Mall
    [-117.8295, 34.0515], // Back to Hospital
    [-117.8275, 34.0525], // Back to Campus
    [-117.8221, 34.0579], // Return to Cal Poly
  ],
];

// Define GeoJSON types
type GeoJSONFeature = {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

const LiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const busStopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const animationRef = useRef<number | null>(null);
  const [lng] = useState(-117.8221);
  const [lat] = useState(34.0579);
  const [zoom] = useState(11);
  const [selectedBus, setSelectedBus] = useState<BusDetails | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showTracker, setShowTracker] = useState(false);
  const [routePaths, setRoutePaths] = useState<any[]>([]);
  const theme = useMantineTheme();
  const startTimeRef = useRef<number>(Date.now());

  // Get the GitHub Pages URL
  const currentURL = 'https://dylooosh.github.io/FoothillTransitApp/#/live-map';

  // Function to create a bus marker element
  const createBusElement = (routeIndex: number) => {
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    
    const img = document.createElement('img');
    img.src = BUS_SPRITE;
    img.style.width = '48px';  // Increased from 32px
    img.style.height = '48px'; // Increased from 32px
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
      // The bus0.png is facing north (0 degrees), so we need to adjust the angle
      img.style.transform = `rotate(${angle}deg)`;
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
        // Calculate continuous time since start
        const time = (Date.now() - startTimeRef.current) / 1000;
        const speed = 0.02;
        
        // Use a different path for each bus
        const pathIndex = index % routePaths.length;
        const pathFeature = routePaths[pathIndex];
        if (!pathFeature) {
          console.warn(`No path found for bus ${bus.id} at index ${pathIndex}`);
          return;
        }

        try {
          // Create a proper GeoJSON Feature from the path
          const feature: GeoJSONFeature = {
            type: 'Feature',
            properties: {},
            geometry: pathFeature
          };
          
          // Calculate the total length of the path
          const pathLength = length(feature);
          console.log(`Bus ${bus.id} (Route ${pathIndex + 1}) path length:`, pathLength);
          
          // Calculate position along the snapped path
          const pathProgress = (time * speed) % pathLength;
          console.log(`Bus ${bus.id} (Route ${pathIndex + 1}) progress:`, pathProgress, 'of', pathLength);
          
          const pointOnLine = along(feature, pathProgress);
          
          // Ensure coordinates are correctly typed
          const position: [number, number] = pointOnLine.geometry.coordinates as [number, number];
          console.log(`Bus ${bus.id} (Route ${pathIndex + 1}) position:`, position);
          
          // Calculate a point further ahead for heading
          const nextPointOnLine = along(feature, Math.min(pathProgress + 0.05, pathLength));
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
            console.log(`Created marker for bus ${bus.id} on Route ${pathIndex + 1}`);
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

  // Initialize map and create routes
  useEffect(() => {
    if (!mapContainer.current) return;
    
    console.log('Initializing map...');

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-117.8221, 34.0579],
      zoom: 11,
      pitch: 0
    });

    // Wait for map to load before proceeding
    map.current.on('load', () => {
      console.log('Map loaded successfully');
      
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

      // Fetch snapped routes from Mapbox Map Matching API
      const fetchRoutes = async () => {
        console.log('Fetching snapped routes...');
        
        try {
          const snappedRoutes = await Promise.all(
            ROUTE_COORDINATES.map(async (coords, index) => {
              console.log(`Processing route ${index + 1} with ${coords.length} coordinates:`, coords);
              
              // Convert coordinates to the format expected by the API
              const coordinates = coords.map(coord => coord.join(',')).join(';');
              
              // Construct the API URL with additional parameters for better matching
              const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&tidy=true&access_token=${ACCESS_TOKEN}`;
              
              console.log(`Fetching route ${index + 1} from Mapbox API...`);
              
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              console.log(`Received route ${index + 1} data:`, {
                matchings: data.matchings?.length,
                code: data.code,
                message: data.message,
                confidence: data.matchings?.[0]?.confidence
              });
              
              if (!data.matchings || data.matchings.length === 0) {
                throw new Error(`No route matching found for route ${index + 1}`);
              }
              
              const geometry = data.matchings[0].geometry;
              console.log(`Route ${index + 1} geometry:`, {
                type: geometry.type,
                coordinates: geometry.coordinates.length,
                firstCoord: geometry.coordinates[0],
                lastCoord: geometry.coordinates[geometry.coordinates.length - 1]
              });
              
              return geometry;
            })
          );
          
          console.log('All routes fetched successfully:', snappedRoutes.length);
          setRoutePaths(snappedRoutes);
        } catch (error) {
          console.error('Error fetching routes:', error);
        }
      };

      // Call the fetchRoutes function
      fetchRoutes();
    });

    return () => {
      map.current?.remove();
      Object.values(markersRef.current).forEach(marker => marker.remove());
      busStopMarkersRef.current.forEach(marker => marker.remove());
    };
  }, []);

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