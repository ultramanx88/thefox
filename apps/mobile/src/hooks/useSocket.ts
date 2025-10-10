import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketConfig } from '@/config/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const config = getSocketConfig();
    const newSocket = io(config.url, config.options);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected };
};

// Hook สำหรับ driver-specific events
export const useDriverSocket = () => {
  const { socket, isConnected } = useSocket();
  const [offers, setOffers] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for new delivery offers
    socket.on('new_offer', (offer) => {
      console.log('New delivery offer:', offer);
      setOffers(prev => [...prev, offer]);
    });

    // Listen for offer updates
    socket.on('offer_update', (updatedOffer) => {
      setOffers(prev => 
        prev.map(offer => 
          offer.id === updatedOffer.id ? updatedOffer : offer
        )
      );
    });

    // Listen for job assignment
    socket.on('job_assigned', (job) => {
      console.log('Job assigned:', job);
      setCurrentJob(job);
      setOffers([]); // Clear offers when job is assigned
    });

    // Listen for job updates
    socket.on('job_update', (updatedJob) => {
      setCurrentJob(updatedJob);
    });

    return () => {
      socket.off('new_offer');
      socket.off('offer_update');
      socket.off('job_assigned');
      socket.off('job_update');
    };
  }, [socket]);

  const joinDriverRoom = (driverId: string) => {
    if (socket) {
      socket.emit('join_driver_room', driverId);
    }
  };

  const leaveDriverRoom = (driverId: string) => {
    if (socket) {
      socket.emit('leave_driver_room', driverId);
    }
  };

  const acceptOffer = (offerId: string) => {
    if (socket) {
      socket.emit('accept_offer', offerId);
    }
  };

  const declineOffer = (offerId: string) => {
    if (socket) {
      socket.emit('decline_offer', offerId);
    }
  };

  const updateJobStatus = (jobId: string, status: string, data?: any) => {
    if (socket) {
      socket.emit('update_job_status', { jobId, status, data });
    }
  };

  const sendLocationUpdate = (location: { lat: number; lng: number }) => {
    if (socket) {
      socket.emit('location_update', location);
    }
  };

  return {
    socket,
    isConnected,
    offers,
    currentJob,
    joinDriverRoom,
    leaveDriverRoom,
    acceptOffer,
    declineOffer,
    updateJobStatus,
    sendLocationUpdate,
  };
};
