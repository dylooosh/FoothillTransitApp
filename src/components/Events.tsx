import React from 'react';
import { Container, Title, Text, Card, Stack, Group, Badge, ActionIcon } from '@mantine/core';
import { IconCalendarEvent, IconMapPin, IconClock, IconShare } from '@tabler/icons-react';

const mockEvents = [
  {
    id: 1,
    title: "Transit Service Changes",
    date: "March 15, 2024",
    time: "All Day",
    location: "System-wide",
    description: "Spring service changes will take effect. Check your route for updated schedules.",
    type: "Service Update"
  },
  {
    id: 2,
    title: "Community Transit Meeting",
    date: "March 20, 2024",
    time: "6:00 PM - 7:30 PM",
    location: "City Hall",
    description: "Join us to discuss upcoming transit improvements and share your feedback.",
    type: "Meeting"
  },
  {
    id: 3,
    title: "Cal Poly Pomona Art Exhibit",
    date: "April 15, 2024",
    time: "10:00 AM - 4:00 PM",
    location: "Cal Poly Pomona Art Gallery",
    description: "Visit the student art exhibition showcasing transit-inspired artwork. Free shuttle service available from campus transit center.",
    type: "Event"
  },
  {
    id: 4,
    title: "Free Ride Day",
    date: "April 22, 2024",
    time: "All Day",
    location: "All Routes",
    description: "Celebrate Earth Day with free rides on all Foothill Transit routes!",
    type: "Promotion"
  },
  {
    id: 5,
    title: "Student Transportation Fair",
    date: "April 25, 2024",
    time: "11:00 AM - 2:00 PM",
    location: "Campus Center",
    description: "Learn about student transportation options and get your free Class Pass.",
    type: "Event"
  }
];

const Events = () => {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Upcoming Events</Title>
          <Text size="lg" c="dimmed">
            Stay informed about service changes and transit events
          </Text>
        </div>

        {mockEvents.map((event) => (
          <Card key={event.id} withBorder shadow="sm" radius="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Title order={3}>{event.title}</Title>
                  <Group gap="xs">
                    <IconCalendarEvent size={16} style={{ color: '#666' }} />
                    <Text size="sm" c="dimmed">{event.date}</Text>
                    <IconClock size={16} style={{ color: '#666' }} />
                    <Text size="sm" c="dimmed">{event.time}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={16} style={{ color: '#666' }} />
                    <Text size="sm" c="dimmed">{event.location}</Text>
                  </Group>
                </Stack>
                <Group>
                  <Badge 
                    variant="light" 
                    color={
                      event.type === 'Service Update' ? 'blue' :
                      event.type === 'Promotion' ? 'green' :
                      event.type === 'Meeting' ? 'orange' : 'gray'
                    }
                  >
                    {event.type}
                  </Badge>
                  <ActionIcon variant="subtle" color="gray">
                    <IconShare size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              <Text size="sm">{event.description}</Text>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
};

export default Events; 