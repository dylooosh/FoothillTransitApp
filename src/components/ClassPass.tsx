import React from 'react';
import { Container, Title, Text, List, Button, Card, Stack, Group, ThemeIcon } from '@mantine/core';
import { IconSchool, IconBus, IconCheck } from '@tabler/icons-react';

const ClassPass = () => {
  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Student Class Pass</Title>
          <Text size="lg" c="dimmed">
            Get unlimited FREE rides on Foothill Transit buses with your student ID
          </Text>
        </div>

        <Card withBorder p="xl" radius="md">
          <Stack gap="lg">
            <Group>
              <ThemeIcon size={40} radius="md" color="blue">
                <IconSchool size={24} />
              </ThemeIcon>
              <div>
                <Text fw={500} size="lg">Eligibility</Text>
                <Text size="sm" c="dimmed">
                  Available to all currently enrolled students
                </Text>
              </div>
            </Group>

            <List
              spacing="sm"
              size="sm"
              center
              icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Valid student ID required</List.Item>
              <List.Item>Must be enrolled in current semester</List.Item>
              <List.Item>Includes all bus routes</List.Item>
              <List.Item>No cost - completely FREE</List.Item>
            </List>
          </Stack>
        </Card>

        <Card withBorder p="xl" radius="md">
          <Stack gap="lg">
            <Group>
              <ThemeIcon size={40} radius="md" color="green">
                <IconBus size={24} />
              </ThemeIcon>
              <div>
                <Text fw={500} size="lg">Benefits</Text>
                <Text size="sm" c="dimmed">
                  Unlimited rides throughout the semester
                </Text>
              </div>
            </Group>

            <List
              spacing="sm"
              size="sm"
              center
              icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Unlimited rides on all routes</List.Item>
              <List.Item>Valid for entire semester</List.Item>
              <List.Item>Save money on transportation</List.Item>
              <List.Item>Reduce your carbon footprint</List.Item>
            </List>
          </Stack>
        </Card>

        <Button 
          size="lg" 
          fullWidth
          leftSection={<IconBus size={20} />}
        >
          Get Your Free Class Pass
        </Button>
      </Stack>
    </Container>
  );
};

export default ClassPass; 