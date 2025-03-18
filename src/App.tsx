import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LiveMap from './components/LiveMap';
import ClassPass from './components/ClassPass';
import Events from './components/Events';
import ReportIssue from './components/ReportIssue';

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/live-map" replace />} />
        <Route path="/live-map" element={<LiveMap />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/events" element={<Events />} />
        <Route path="/class-pass" element={<ClassPass />} />
      </Routes>
    </Layout>
  );
};

export default App; 