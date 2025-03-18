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
    if (!mapContainer.current || map.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: zoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false
    });

    mapInstance.on('load', () => {
      // Add bus markers with animation
      mockBuses.forEach((bus, index) => {
        // Calculate new position
        const time = Date.now() / 1000;
        const radius = 0.02;
        const speed = 0.5;
        const lng = bus.baseLng + radius * Math.cos(time * speed + index * Math.PI/2);
        const lat = bus.baseLat + radius * Math.sin(time * speed + index * Math.PI/2);
        
        // Calculate heading (direction of movement)
        const dx = -radius * Math.sin(time * speed + index * Math.PI/2) * speed;
        const dy = radius * Math.cos(time * speed + index * Math.PI/2) * speed;
        const heading = (Math.atan2(dy, dx) * 180 / Math.PI + 90) % 360;

        const el = createBusElement(index);
        
        const marker = new mapboxgl.Marker({
          element: el,
          rotationAlignment: 'map',
          pitchAlignment: 'map'
        })
          .setLngLat([lng, lat])
          .addTo(mapInstance);

        // Update marker rotation using sprite images
        updateMarker(marker, heading);

        // Add popup
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: false,
          className: 'modern-popup'
        })
          .setHTML(`
            <div style="
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              min-width: 240px;
            ">
              <div style="
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 12px;
                color: #333;
              ">Bus ${bus.number} · ${bus.route}</div>
              
              <div style="
                background: #F8F9FA;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
              ">
                <div style="
                  display: grid;
                  grid-template-columns: auto 1fr;
                  gap: 8px 12px;
                  font-size: 13px;
                ">
                  <div style="color: #666;">Status:</div>
                  <div style="font-weight: 500; color: ${bus.status === 'On Time' ? '#2F9E44' : '#E67700'};">
                    ${bus.status}
                  </div>
                  <div style="color: #666;">Next Stop:</div>
                  <div style="font-weight: 500;">${bus.nextStop}</div>
                  <div style="color: #666;">ETA:</div>
                  <div style="font-weight: 500;">${bus.eta}</div>
                </div>
              </div>

              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #666;
              ">
                <span>${bus.previousStop || 'Start'}</span>
                <div style="
                  flex: 1;
                  height: 2px;
                  background: #E9ECEF;
                  margin: 0 8px;
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: ${bus.progress}%;
                    background: ${ROUTE_COLORS[index % ROUTE_COLORS.length]};
                  "></div>
                </div>
                <span>${bus.finalStop || 'End'}</span>
              </div>
            </div>
          `);

        marker.setPopup(popup);

        el.addEventListener('click', () => {
          setSelectedBus({...bus, id: bus.id});
        });

        markersRef.current[bus.id] = marker;
      });

      // Add bus stop markers
      mockBusStops.forEach(stop => {
        const stopLng = lng + (Math.random() - 0.5) * 0.05;
        const stopLat = lat + (Math.random() - 0.5) * 0.05;

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

        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: false,
          className: 'modern-popup'
        })
          .setHTML(`
            <div style="
              padding: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <div style="
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 8px;
                color: #333;
              ">${stop.name}</div>
              <div style="
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
              ">Routes: ${stop.routes.join(', ')}</div>
              <div style="
                font-size: 12px;
                color: #999;
              ">${stop.address}</div>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([stopLng, stopLat])
          .setPopup(popup)
          .addTo(mapInstance);

        busStopMarkersRef.current.push(marker);
      });

      // Add navigation controls with custom styles
      const nav = new mapboxgl.NavigationControl({
        showCompass: false
      });
      mapInstance.addControl(nav, 'top-right');

      // Animate buses
      let startTime = performance.now();
      const animateBuses = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const speed = 0.00005; // Slower speed for smoother movement

        Object.values(markersRef.current).forEach((marker, index) => {
          const angle = (elapsed * speed + (index * (Math.PI * 2) / Object.keys(markersRef.current).length)) % (Math.PI * 2);
          const radius = 0.02;
          const newLng = lng + Math.cos(angle) * radius;
          const newLat = lat + Math.sin(angle) * radius;

          // Update marker position with smooth transition
          marker.setLngLat([newLng, newLat]);

          // Update marker rotation using sprite images
          updateMarker(marker, angle);
        });

        animationRef.current = requestAnimationFrame(animateBuses);
      };

      animationRef.current = requestAnimationFrame(animateBuses);
    });

    map.current = mapInstance;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      busStopMarkersRef.current.forEach(marker => marker.remove());
      busStopMarkersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [lng, lat, zoom]);

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