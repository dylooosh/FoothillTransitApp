import React, { useState } from 'react';
import { Container, Title, Text, Card, Stack, TextInput, Textarea, Button, Select, Group, Divider } from '@mantine/core';
import { IconAlertTriangle, IconSend, IconPhone, IconShieldCheck } from '@tabler/icons-react';

const issueTypes = [
  { value: 'safety', label: 'Safety Concern' },
  { value: 'cleanliness', label: 'Cleanliness Issue' },
  { value: 'service', label: 'Service Problem' },
  { value: 'facility', label: 'Facility Maintenance' },
  { value: 'other', label: 'Other' }
];

const ReportIssue = () => {
  const [loading, setLoading] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Show success message or handle response
    }, 1000);
  };

  const handleEscortRequest = () => {
    // Open phone dialer with UPD number
    window.location.href = 'tel:+19098693070';
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Safety Escort Section */}
        <Card withBorder shadow="sm">
          <Stack gap="md">
            <Group>
              <IconShieldCheck size={24} color="blue" />
              <Title order={3}>Cal Poly Pomona Safety Escort</Title>
            </Group>
            <Text size="sm">
              Need a safety escort to/from a bus stop on campus? University Police Department provides free safety escorts 24/7.
            </Text>
            <Button
              leftSection={<IconPhone size={16} />}
              onClick={handleEscortRequest}
              variant="filled"
              color="blue"
            >
              Call UPD for Escort (909) 869-3070
            </Button>
          </Stack>
        </Card>

        <Divider />

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
                value={issueType}
                onChange={(value) => setIssueType(value || '')}
                data={issueTypes}
                required
              />

              <TextInput
                label="Location"
                placeholder="Bus route number, stop location, or facility"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Please provide details about the issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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