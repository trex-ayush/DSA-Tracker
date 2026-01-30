import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import api from '../services/api';
import { clearCache } from '../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const Layout = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        // Fetch server's last updated time
        const { data } = await api.get('/questions/metadata');
        const serverLastUpdated = data?.lastUpdated;

        if (!serverLastUpdated) return;

        // Check local last sync time
        const localLastSync = localStorage.getItem('dsa_last_sync');

        // If never synced, or server is newer -> Clear Cache
        if (!localLastSync || serverLastUpdated > parseInt(localLastSync)) {
          console.log('Server data is newer. Clearing cache...');

          // 1. Clear LocalStorage Cache (for api.js)
          clearCache();

          // 2. Clear React Query Cache (for active hooks)
          queryClient.invalidateQueries();

          // 3. Update sync time
          localStorage.setItem('dsa_last_sync', Date.now().toString());
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };

    checkUpdates();
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

export default Layout;
