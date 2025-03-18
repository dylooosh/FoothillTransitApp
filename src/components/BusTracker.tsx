import React from 'react';
import { Card, Text, Group, Badge, Stack } from '@mantine/core';
import { mockBuses } from '../data/mockData';

const BusTracker = () => {
  return (
    <Stack>
      <Text fw={700} size="xl" mb="md">Active Buses</Text>
      {mockBuses.map((bus) => (
        <Card key={bus.id} shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500}>Bus #{bus.number}</Text>
            <Badge color={bus.status === 'On Time' ? 'green' : 'yellow'}>
              {bus.status}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">Route: {bus.route}</Text>
          <Text size="sm" c="dimmed">Next Stop: {bus.nextStop}</Text>
          <Text size="sm" c="dimmed">ETA: {bus.eta}</Text>
        </Card>
      ))}
    </Stack>
  );
};

export default BusTracker; 