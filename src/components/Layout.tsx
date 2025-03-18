import React, { useState, useEffect } from 'react';
import { Box } from '@mantine/core';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box pb={isMobile ? 60 : 0}>
      {children}
      {isMobile && <BottomNavigation />}
    </Box>
  );
};

export default Layout; 