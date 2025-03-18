import React, { useEffect, useState } from 'react';
import { Modal, Button, Text, Center, Stack } from '@mantine/core';

const QRCode = () => {
  const [opened, setOpened] = useState(false);
  const [networkUrl, setNetworkUrl] = useState('');

  useEffect(() => {
    // Get the network URL from the Vite dev server output
    const url = window.location.href;
    setNetworkUrl(url);
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(networkUrl)}`;

  return (
    <>
      <Button 
        onClick={() => setOpened(true)}
        variant="subtle"
        color="foothill-blue"
        style={{ position: 'fixed', bottom: '20px', right: '20px' }}
      >
        📱 Open on Phone
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Open on Your Phone"
        centered
        size="sm"
      >
        <Stack align="center" gap="md">
          <Text size="sm" c="dimmed" ta="center">
            Scan this QR code with your phone's camera to open the app
          </Text>
          <img src={qrCodeUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
          <Text size="xs" c="dimmed" ta="center">
            Make sure your phone is connected to the same WiFi network as this computer
          </Text>
          <Text size="sm" fw="bold" ta="center">
            {networkUrl}
          </Text>
        </Stack>
      </Modal>
    </>
  );
};

export default QRCode; 