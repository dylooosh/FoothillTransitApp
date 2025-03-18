import React, { useState } from 'react';
import { Paper, TextInput, Textarea, Button, Select, Stack, Text } from '@mantine/core';

const SafetyReport = () => {
  const [formData, setFormData] = useState({
    location: '',
    type: '',
    description: '',
    contact: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the data to a server
    console.log('Safety report submitted:', formData);
    alert('Thank you for your report. We will investigate this issue.');
    setFormData({ location: '', type: '', description: '', contact: '' });
  };

  return (
    <Paper p="xl" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text fw={700} size="xl" mb="md">Safety Report</Text>
          
          <Select
            label="Type of Issue"
            placeholder="Select issue type"
            data={[
              'Safety Concern',
              'Maintenance Issue',
              'Security Incident',
              'Accessibility Problem',
              'Other'
            ]}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value || '' })}
            required
          />

          <TextInput
            label="Location"
            placeholder="Bus stop, route number, or address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Please provide details about the issue"
            minRows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <TextInput
            label="Contact Information (Optional)"
            placeholder="Email or phone number"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />

          <Button type="submit" mt="md">
            Submit Report
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default SafetyReport; 