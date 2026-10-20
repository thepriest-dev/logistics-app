export type PackageStatus = 
  | 'pending_dropoff'
  | 'received_at_pickup'
  | 'in_transit'
  | 'at_destination_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Package {
  id: string;
  tracking_number: string;
  status: PackageStatus;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  pickup_address: string;
  pickup_point_name: string;
  delivery_address: string;
  destination_city: string;
  weight_kg: number;
  description: string;
  created_at: string;
  estimated_delivery: string;
}

export interface TrackingEvent {
  id: string;
  status: PackageStatus;
  notes: string;
  location: string;
  created_at: string;
  triggered_by: string;
}

export interface TrackingData {
  package: Package;
  events: TrackingEvent[];
}