import React from 'react';
import { Card, Group, Button, Text, Image, Box } from '@mantine/core';
import { IconBus, IconAlertTriangle, IconCalendarEvent, IconSchool } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: <IconBus size={16} />, label: 'Map', path: '/live-map' },
    { icon: <IconAlertTriangle size={16} />, label: 'Report', path: '/report-issue' },
    null, // Center placeholder for logo
    { icon: <IconCalendarEvent size={16} />, label: 'Events', path: '/events' },
    { icon: <IconSchool size={16} />, label: 'Pass', path: '/class-pass' },
  ];

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }}
      p="xs"
    >
      <Group justify="space-between" gap={2}>
        {navItems.map((item, index) => 
          item === null ? (
            <Box 
              key="logo" 
              component={Link} 
              to="/"
              style={{ 
                width: '20%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image
                src="/foothill-transit1.jpg"
                alt="Foothill Transit"
                w={50}
                h={32}
                style={{ objectFit: 'contain' }}
                key={Date.now()}
              />
            </Box>
          ) : (
            <Button
              key={item.path}
              variant="subtle"
              color={currentPath === item.path ? 'blue' : 'gray'}
              component={Link}
              to={item.path}
              styles={{
                root: {
                  flex: '1 1 0',
                  padding: '2px',
                  minWidth: 0,
                  height: 'auto',
                  width: '20%'
                },
                inner: {
                  flexDirection: 'column',
                  gap: 1
                }
              }}
            >
              {item.icon}
              <Text size="xs" lh={1} mt={1}>
                {item.label}
              </Text>
            </Button>
          )
        )}
      </Group>
    </Card>
  );
};

export default BottomNavigation; 