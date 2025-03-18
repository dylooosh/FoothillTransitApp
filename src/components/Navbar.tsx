import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppShell, Group, Button, Image, Burger, Drawer, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const Navbar = () => {
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure(false);

  const NavButtons = () => (
    <Stack gap="xs">
      <Link to="/map" style={{ textDecoration: 'none' }}>
        <Button 
          variant={location.pathname === '/map' ? 'filled' : 'subtle'}
          color="foothill-green"
          fullWidth
        >
          Live Map & Stops
        </Button>
      </Link>
      <Link to="/report" style={{ textDecoration: 'none' }}>
        <Button 
          variant={location.pathname === '/report' ? 'filled' : 'subtle'}
          color="foothill-green"
          fullWidth
        >
          Report Issue
        </Button>
      </Link>
      <Link to="/events" style={{ textDecoration: 'none' }}>
        <Button 
          variant={location.pathname === '/events' ? 'filled' : 'subtle'}
          color="foothill-green"
          fullWidth
        >
          Events
        </Button>
      </Link>
      <Link to="/class-pass" style={{ textDecoration: 'none' }}>
        <Button 
          variant={location.pathname === '/class-pass' ? 'filled' : 'subtle'}
          color="foothill-blue"
          fullWidth
        >
          Class Pass
        </Button>
      </Link>
    </Stack>
  );

  return (
    <AppShell.Header bg="white" style={{ borderBottom: '3px solid #35A635' }}>
      <Group justify="space-between" h="100%" px="md">
        <Group>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Image
              src="/foothill-transit.webp"
              alt="Foothill Transit"
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </Link>
        </Group>

        {/* Desktop Navigation */}
        <Group visibleFrom="sm">
          <NavButtons />
        </Group>

        {/* Mobile Navigation */}
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
        <Drawer
          opened={opened}
          onClose={close}
          size="100%"
          padding="md"
          title="Menu"
          hiddenFrom="sm"
        >
          <NavButtons />
        </Drawer>
      </Group>
    </AppShell.Header>
  );
};

export default Navbar; 