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
  // Route 1: Pomona & Cal Poly Pomona Loop
  [
    [-117.7508, 34.0560], // Pomona Transit Center
    [-117.7522, 34.0551], // Pomona City Hall
    [-117.7533, 34.0572], // Western University of Health Sciences
    [-117.7652, 34.0781], // Pomona Valley Hospital Medical Center
    [-117.7705, 34.0763], // Ganesha Park
    [-117.8216, 34.0584], // Cal Poly Pomona (Bronco Student Center)
    [-117.8232, 34.0576], // Cal Poly Pomona (University Drive Stop)
    [-117.7708, 34.0871], // Pomona Fairplex
    [-117.7926, 34.0882], // Pomona North Metrolink Station
    [-117.7652, 34.0781], // Pomona Valley Hospital Medical Center (Return)
    [-117.7533, 34.0572], // Western University of Health Sciences (Return)
    [-117.7508, 34.0560], // Pomona Transit Center (End)
  ],
  // Route 2: Walnut to San Dimas Loop
  [
    [-117.8653, 34.0203], // Walnut City Hall
    [-117.8459, 34.0505], // Mt. San Antonio College
    [-117.8216, 34.0584], // Cal Poly Pomona (Bronco Student Center)
    [-117.7508, 34.0560], // Pomona Transit Center
    [-117.7704, 34.1006], // La Verne University
    [-117.8067, 34.1064], // San Dimas Civic Center
    [-117.8182, 34.1068], // San Dimas Transit Center
    [-117.7704, 34.1006], // La Verne University (Return)
    [-117.7508, 34.0560], // Pomona Transit Center (Return)
    [-117.8216, 34.0584], // Cal Poly Pomona (Return)
    [-117.8459, 34.0505], // Mt. San Antonio College (Return)
    [-117.8653, 34.0203], // Walnut City Hall (End)
  ],
  // Route 3: West Covina to Cal Poly Pomona Loop
  [
    [-117.9302, 34.0689], // West Covina Plaza (Westfield West Covina)
    [-117.9385, 34.0681], // West Covina City Hall
    [-117.8876, 34.0729], // Eastland Center
    [-117.8904, 34.0902], // Covina Transit Center
    [-117.8459, 34.0505], // Mt. San Antonio College
    [-117.8216, 34.0584], // Cal Poly Pomona (Bronco Student Center)
    [-117.7508, 34.0560], // Pomona Transit Center
    [-117.8232, 34.0576], // Cal Poly Pomona (University Drive Stop)
    [-117.8459, 34.0505], // Mt. San Antonio College (Return)
    [-117.9380, 34.0683], // West Covina Civic Center
    [-117.9302, 34.0689], // West Covina Plaza (End)
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

    // Calculate base speed and route lengths
    const baseSpeed = 0.02;
    const routeLengths = routePaths.map(path => {
      const feature: GeoJSONFeature = {
        type: 'Feature',
        properties: {},
        geometry: path
      };
      return length(feature);
    });

    // Calculate speed multipliers to normalize route completion times
    const maxLength = Math.max(...routeLengths);
    const speedMultipliers = routeLengths.map(length => maxLength / length);

    // Update buses
    const updateBuses = () => {
      mockBuses.forEach((bus, index) => {
        // Calculate continuous time since start
        const time = (Date.now() - startTimeRef.current) / 1000;
        
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
          const pathLength = routeLengths[pathIndex];
          
          // Add an offset based on the bus index to distribute buses along the route
          const offset = (pathLength / 3) * (index % 3); // Distribute 3 buses per route evenly
          
          // Calculate position along the path with offset
          // Slower speed (0.005 instead of 0.02) for more realistic movement
          const normalizedSpeed = 0.005 * speedMultipliers[pathIndex];
          const pathProgress = ((time * normalizedSpeed) + offset) % pathLength;
          
          // Get current position
          const pointOnLine = along(feature, pathProgress);
          const position: [number, number] = pointOnLine.geometry.coordinates as [number, number];
          
          // Calculate next position for heading (looking further ahead for smoother rotation)
          const lookAheadDistance = Math.min(pathProgress + 0.1, pathLength);
          const nextPointOnLine = along(feature, lookAheadDistance);
          const nextPosition: [number, number] = nextPointOnLine.geometry.coordinates as [number, number];
          
          // Calculate heading
          const headingValue = bearing(
            point(position),
            point(nextPosition)
          );

          if (!markersRef.current[bus.id]) {
            // Create new marker
            const el = createBusElement(pathIndex);
            const marker = new mapboxgl.Marker({
              element: el,
              rotationAlignment: 'map',
              pitchAlignment: 'map'
            })
              .setLngLat(position)
              .addTo(map.current!);

            marker.getElement().addEventListener('click', () => {
              setSelectedBus(bus);
            });

            markersRef.current[bus.id] = marker;
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
              
              // Ensure the route is a complete loop by adding segments
              const routeSegments = [];
              for (let i = 0; i < coords.length - 1; i++) {
                const start = coords[i];
                const end = coords[i + 1];
                const segmentCoords = `${start.join(',')};${end.join(',')}`;
                
                // Fetch route segment
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${segmentCoords}?geometries=geojson&overview=full&access_token=${ACCESS_TOKEN}`;
                
                console.log(`Fetching segment ${i + 1} for route ${index + 1}...`);
                
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!data.routes || data.routes.length === 0) {
                  throw new Error(`No route found for segment ${i + 1} of route ${index + 1}`);
                }
                
                routeSegments.push(data.routes[0].geometry);
              }
              
              // Combine all segments into a single route
              const combinedCoordinates = routeSegments.reduce((acc, segment) => {
                // Remove the last point if it's the same as the first point of the next segment
                const coords = segment.coordinates;
                if (acc.length > 0 && acc[acc.length - 1][0] === coords[0][0] && acc[acc.length - 1][1] === coords[0][1]) {
                  return [...acc, ...coords.slice(1)];
                }
                return [...acc, ...coords];
              }, []);
              
              // Create the final geometry
              const geometry = {
                type: 'LineString',
                coordinates: combinedCoordinates
              };
              
              console.log(`Route ${index + 1} completed with ${geometry.coordinates.length} points`);
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