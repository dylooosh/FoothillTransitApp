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

  // Get the current URL for QR code
  const currentURL = window.location.origin + '/live-map';

  // Function to create a modern vehicle marker
  const createBusElement = (status: string, routeIndex: number) => {
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];
    el.innerHTML = `
      <div style="
        width: 36px;
        height: 36px;
        cursor: pointer;
        transform-origin: center;
        transition: transform 0.3s ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      ">
        <svg width="36" height="36" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Direction indicator -->
          <path d="M30 5 L40 25 L30 20 L20 25 Z" 
                fill="${color}"
                stroke="#FFFFFF"
                stroke-width="2"/>
          
          <!-- Main body -->
          <rect x="15" y="20" width="30" height="35" rx="4" 
                fill="${color}"
                stroke="#FFFFFF"
                stroke-width="2"/>
          
          <!-- Windows -->
          <rect x="18" y="24" width="24" height="8" rx="1" 
                fill="#FFFFFF"
                fill-opacity="0.9"/>
          
          <!-- Wheels -->
          <circle cx="20" cy="50" r="3" fill="#FFFFFF"/>
          <circle cx="40" cy="50" r="3" fill="#FFFFFF"/>
        </svg>
      </div>
    `;
    return el;
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
        // Generate a circular path around the center
        const radius = 0.02;
        const angle = Math.random() * Math.PI * 2;
        const busLng = lng + Math.cos(angle) * radius;
        const busLat = lat + Math.sin(angle) * radius;

        const el = createBusElement(bus.status, index);
        
        const marker = new mapboxgl.Marker({
          element: el,
          rotationAlignment: 'map',
          pitchAlignment: 'map'
        })
          .setLngLat([busLng, busLat])
          .addTo(mapInstance);

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
        el.innerHTML = `
          <div style="
            width: 12px;
            height: 12px;
            background: #FFFFFF;
            border: 2px solid #666;
            border-radius: 50%;
            cursor: pointer;
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

          // Update marker rotation to face movement direction
          const el = marker.getElement();
          const rotationAngle = (angle * 180 / Math.PI) + 90;
          // Remove skew and just use rotation for clean look
          (el.querySelector('.vehicle-marker > div') as HTMLElement).style.transform = 
              `rotate(${rotationAngle}deg)`;
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