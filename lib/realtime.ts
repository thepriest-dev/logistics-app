// lib/realtime.ts

'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

// ============ GENERAL REALTIME HOOKS ============

// Generic realtime listener for any table
export function useRealtimeSubscription(
  table: string,
  filter: { column: string; value: string } | null,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channelName = `${table}-${user.id}-${Date.now()}`;
    const subscriptionConfig: any = {
      event: event,
      schema: 'public',
      table: table,
    };

    if (filter) {
      subscriptionConfig.filter = `${filter.column}=eq.${filter.value}`;
    }

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', subscriptionConfig, (payload) => {
        console.log(`🔄 Real-time update on ${table}:`, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log(`📡 ${table} subscription status:`, status);
      });

    return () => {
      // Use void operator to handle the promise
      void subscription.unsubscribe();
    };
  }, [user, table, filter?.column, filter?.value, callback, event]);
}

// ============ USER REALTIME (Admin) ============

export function useUserUpdates(callback: (payload: any) => void) {
  useRealtimeSubscription('users', null, callback);
}

// ============ PACKAGE REALTIME (All Roles) ============

export function usePackageUpdates(callback: (payload: any) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    // Admin sees all package updates
    if (user.role === 'admin') {
      const channel = supabase
        .channel('packages-admin')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'packages',
          },
          (payload) => {
            console.log('📦 Admin package update:', payload);
            callback(payload);
          }
        )
        .subscribe();
      subscription = channel;
    }

    // Storekeeper sees pending packages
    else if (user.role === 'storekeeper') {
      const channel = supabase
        .channel('packages-storekeeper')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'packages',
            filter: `status=in.(pending_verification,pending_dropoff)`,
          },
          (payload) => {
            console.log('📦 Storekeeper package update:', payload);
            callback(payload);
          }
        )
        .subscribe();
      subscription = channel;
    }

    // Driver sees their assigned packages
    else if (user.role === 'driver') {
      const channel = supabase
        .channel('packages-driver')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'packages',
            filter: `driver_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📦 Driver package update:', payload);
            callback(payload);
          }
        )
        .subscribe();
      subscription = channel;
    }

    // Regular user sees their sent packages
    else if (user.role === 'user') {
      const channel = supabase
        .channel('packages-user')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'packages',
            filter: `sender_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📦 User package update:', payload);
            callback(payload);
          }
        )
        .subscribe();
      subscription = channel;
    }

    return () => {
      if (subscription) {
        void subscription.unsubscribe();
      }
    };
  }, [user, callback]);
}

// ============ NOTIFICATION REALTIME (All Roles) ============

export function useNotificationUpdates(callback: (payload: any) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [user, callback]);
}

// ============ DRIVER STATUS REALTIME (Admin/Storekeeper) ============

export function useDriverUpdates(callback: (payload: any) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Only admin and storekeeper need driver updates
    if (user.role !== 'admin' && user.role !== 'storekeeper') {
      return;
    }

    const channel = supabase
      .channel('drivers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          console.log('🚗 Driver update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [user, callback]);
}

// ============ TRACKING EVENTS REALTIME ============

export function useTrackingUpdates(packageId: string, callback: (payload: any) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !packageId) return;

    const channel = supabase
      .channel(`tracking-${packageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
          filter: `package_id=eq.${packageId}`,
        },
        (payload) => {
          console.log('📍 Tracking update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [user, packageId, callback]);
}

// ============ REALTIME STATUS CHECK ============

export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('status-check')
      .subscribe((status) => {
        console.log('🔌 Realtime connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  return isConnected;
}