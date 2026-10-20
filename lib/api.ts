// lib/api.ts
import { TrackingData } from './types';

// Default mock data
const DEFAULT_MOCK_DATA: Record<string, TrackingData> = {
  'SND-12345': {
    package: {
      id: '1',
      tracking_number: 'SND-12345',
      status: 'delivered',
      sender_name: 'John Doe',
      sender_phone: '+1 (555) 123-4567',
      sender_email: 'john@example.com',
      receiver_name: 'Jane Smith',
      receiver_phone: '+1 (555) 987-6543',
      pickup_address: '123 Pickup St, Lagos',
      pickup_point_name: 'Lagos Main Pickup Center',
      delivery_address: '456 Delivery Ave, Abuja',
      destination_city: 'Abuja',
      weight_kg: 2.5,
      description: 'Electronics - Laptop',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      estimated_delivery: new Date(Date.now() - 86400000).toISOString(),
    },
    events: [
      {
        id: 'e1',
        status: 'pending_dropoff',
        notes: 'Package registered and ready for drop-off',
        location: 'Online',
        triggered_by: 'John Doe',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'e2',
        status: 'received_at_pickup',
        notes: 'Package received at pickup point',
        location: 'Lagos Main Pickup Center',
        triggered_by: 'Mary (Staff)',
        created_at: new Date(Date.now() - 86400000 * 4.5).toISOString(),
      },
      {
        id: 'e3',
        status: 'in_transit',
        notes: 'Package en route to Abuja',
        location: 'Lagos to Abuja Highway',
        triggered_by: 'David (Driver)',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'e4',
        status: 'at_destination_hub',
        notes: 'Arrived at Abuja sorting hub',
        location: 'Abuja Sorting Hub',
        triggered_by: 'Sarah (Staff)',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'e5',
        status: 'out_for_delivery',
        notes: 'Out for delivery to recipient',
        location: 'Abuja Delivery Route',
        triggered_by: 'Michael (Driver)',
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
      {
        id: 'e6',
        status: 'delivered',
        notes: 'Package delivered successfully',
        location: '456 Delivery Ave, Abuja',
        triggered_by: 'Michael (Driver)',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  'SND-67890': {
    package: {
      id: '2',
      tracking_number: 'SND-67890',
      status: 'in_transit',
      sender_name: 'Alice Johnson',
      sender_phone: '+1 (555) 234-5678',
      sender_email: 'alice@example.com',
      receiver_name: 'Bob Williams',
      receiver_phone: '+1 (555) 876-5432',
      pickup_address: '789 Pickup Rd, Port Harcourt',
      pickup_point_name: 'Port Harcourt Pickup Point',
      delivery_address: '101 Delivery St, Enugu',
      destination_city: 'Enugu',
      weight_kg: 1.2,
      description: 'Business Documents',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      estimated_delivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    events: [
      {
        id: 'e1',
        status: 'pending_dropoff',
        notes: 'Package registered',
        location: 'Online',
        triggered_by: 'Alice Johnson',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'e2',
        status: 'received_at_pickup',
        notes: 'Package received at pickup point',
        location: 'Port Harcourt Pickup Point',
        triggered_by: 'Grace (Staff)',
        created_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
      },
      {
        id: 'e3',
        status: 'in_transit',
        notes: 'Package in transit to Enugu',
        location: 'Port Harcourt to Enugu',
        triggered_by: 'Peter (Driver)',
        created_at: new Date(Date.now() - 86400000 * 1.2).toISOString(),
      },
    ],
  },
};

// Load mock data from localStorage or use default
const loadMockData = (): Record<string, TrackingData> => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sendit_mock_data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        return DEFAULT_MOCK_DATA;
      }
    }
  }
  return DEFAULT_MOCK_DATA;
};

export async function getTrackingData(trackingNumber: string): Promise<TrackingData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockData = loadMockData();
  const data = mockData[trackingNumber];
  
  if (!data) {
    throw new Error('Package not found');
  }
  return data;
}

export async function createPackage(formData: any): Promise<{ success: boolean; tracking_number: string; message: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a random tracking number
  const trackingNumber = `SND-${Math.floor(Math.random() * 90000 + 10000)}`;
  
  return {
    success: true,
    tracking_number: trackingNumber,
    message: 'Package created successfully!',
  };
}

// Export for use in packages context
export function addPackageToMockData(pkg: any) {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sendit_mock_data') || '{}';
    const mockData = JSON.parse(stored);
    mockData[pkg.tracking_number] = {
      package: pkg,
      events: [
        {
          id: 'e1',
          status: 'pending_dropoff',
          notes: 'Package registered. Please drop off at pickup point.',
          location: 'Online',
          triggered_by: pkg.sender_name,
          created_at: new Date().toISOString(),
        },
      ],
    };
    localStorage.setItem('sendit_mock_data', JSON.stringify(mockData));
  }
}