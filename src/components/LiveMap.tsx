import React, { useState, useEffect, useRef } from 'react';
import { Paper, Text, Stack, Group, Badge, Modal, Card, Button, Tooltip, useMantineTheme, Progress, Timeline, ThemeIcon, Overlay, Container } from '@mantine/core';
import { IconMapPin, IconCircleCheck, IconQrcode, IconBus, IconClock, IconRoute, IconBusStop, IconFlag, IconSchool, IconAlertTriangle, IconCalendarEvent, IconShare } from '@tabler/icons-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockBuses, mockBusStops } from '../data/mockData';
import BottomNavigation from './BottomNavigation';

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

    // Function to update bus positions
    const updateBuses = () => {
      mockBuses.forEach((bus, index) => {
        // Calculate new position along a more realistic path
        const time = Date.now() / 1000;
        const speed = 0.1; // Slower speed for more realistic movement
        
        // Create a more complex path that follows roads
        const pathRadius = 0.01; // Smaller radius to adhere closer to roads
        const pathOffset = index * (Math.PI / 2); // Offset each bus's path
        
        // Add some variation to make it more realistic
        const variation = Math.sin(time * 0.5) * 0.0025;
        
        const lng = bus.baseLng + pathRadius * Math.cos(time * speed + pathOffset) + variation;
        const lat = bus.baseLat + pathRadius * Math.sin(time * speed + pathOffset) + variation;
        
        // Calculate heading (direction of movement)
        const dx = -pathRadius * Math.sin(time * speed + pathOffset) * speed;
        const dy = pathRadius * Math.cos(time * speed + pathOffset) * speed;
        const heading = (Math.atan2(dy, dx) * 180 / Math.PI + 90) % 360;

        if (!markersRef.current[bus.id]) {
          // Create new marker
          const el = createBusElement(index);
          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);

          marker.getElement().addEventListener('click', () => {
            setSelectedBus(bus);
          });

          markersRef.current[bus.id] = marker;
        } else {
          // Update existing marker
          markersRef.current[bus.id].setLngLat([lng, lat]);
          updateMarker(markersRef.current[bus.id], heading);
        }
      });

      requestAnimationFrame(updateBuses);
    };

    map.current.on('load', () => {
      updateBuses();
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