import React from 'react';
import { Paper, Group, Button, Image, Box } from '@mantine/core';
import { IconMap, IconCalendarEvent, IconSchool, IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: IconMap, path: '/live-map' },
    { icon: IconAlertTriangle, path: '/report-issue' },
    null, // Placeholder for logo
    { icon: IconCalendarEvent, path: '/events' },
    { icon: IconSchool, path: '/class-pass' }
  ];

  return (
    <Paper
      shadow="md"
      p="xs"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      <Group justify="space-between" px="xs">
        {navItems.map((item, index) => {
          if (item === null) {
            return (
              <Box
                key="logo"
                style={{
                  width: '20%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Image
                  src="/FoothillTransitApp/foothill-transit1.jpg"
                  alt="Foothill Transit"
                  w={50}
                  h={32}
                  style={{ objectFit: 'contain' }}
                  key={Date.now()}
                />
              </Box>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Button
              key={item.path}
              variant="subtle"
              color={isActive ? 'blue' : 'gray'}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                padding: '8px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon size={24} />
            </Button>
          );
        })}
      </Group>
    </Paper>
  );
};

export default BottomNavigation; 