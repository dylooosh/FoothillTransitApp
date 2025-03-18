import React from 'react';
import { Card, Text, Group, Stack, Badge } from '@mantine/core';
import { mockBusStops } from '../data/mockData';

const BusStops = () => {
  return (
    <Stack>
      <Text fw={700} size="xl" mb="md">Bus Stops</Text>
      {mockBusStops.map((stop) => (
        <Card key={stop.id} shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500}>{stop.name}</Text>
            <Badge color="blue">{stop.routes.length} Routes</Badge>
          </Group>
          <Text size="sm" c="dimmed">Address: {stop.address}</Text>
          <Text size="sm" c="dimmed" mt="xs">Routes: {stop.routes.join(', ')}</Text>
          <Text size="sm" c="dimmed" mt="xs">
            Amenities: {stop.amenities.join(', ')}
          </Text>
        </Card>
      ))}
    </Stack>
  );
};

export default BusStops; 