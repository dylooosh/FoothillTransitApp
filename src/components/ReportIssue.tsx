import React, { useState } from 'react';
import { Container, Title, Text, Card, Stack, TextInput, Textarea, Button, Select, Group } from '@mantine/core';
import { IconAlertTriangle, IconSend, IconPhone } from '@tabler/icons-react';

const issueTypes = [
  { value: 'safety', label: 'Safety Concern' },
  { value: 'cleanliness', label: 'Cleanliness Issue' },
  { value: 'service', label: 'Service Problem' },
  { value: 'facility', label: 'Facility Maintenance' },
  { value: 'other', label: 'Other' }
];

const ReportIssue = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success message or handle response
    }, 1000);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Report an Issue</Title>
          <Text size="lg" c="dimmed">
            Help us improve your transit experience by reporting any issues
          </Text>
        </div>

        <Card withBorder p="xl" radius="md">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Select
                label="Type of Issue"
                placeholder="Select the type of issue"
                data={issueTypes}
                required
              />

              <TextInput
                label="Location"
                placeholder="Bus route number, stop location, or facility"
                required
              />

              <Textarea
                label="Description"
                placeholder="Please provide details about the issue"
                minRows={4}
                required
              />

              <TextInput
                label="Contact Information (Optional)"
                placeholder="Email or phone number for follow-up"
                type="email"
              />

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  loading={loading}
                  leftSection={<IconSend size={16} />}
                >
                  Submit Report
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>

        <Card withBorder p="xl" radius="md">
          <Group>
            <IconAlertTriangle size={24} style={{ color: 'var(--mantine-color-orange-6)' }} />
            <div>
              <Text fw={500} size="lg">Emergency?</Text>
              <Text size="sm" c="dimmed">
                For immediate assistance or emergencies, please call (800) 555-0123
              </Text>
            </div>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
};

export default ReportIssue; 