// app/track/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Package, User, Phone, MapPin, Clock, ArrowLeft, Mail } from 'lucide-react';

export default function TrackPage() {
  const params = useParams();
  const trackingId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (trackingId) {
      fetchTrackingData();
    }
  }, [trackingId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch package by tracking number
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('tracking_number', trackingId)
        .single();

      if (pkgError || !pkg) {
        setError('Package not found');
        setLoading(false);
        return;
      }

      setPackageData(pkg);

      // Fetch tracking events
      const { data: eventsData, error: eventsError } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('package_id', pkg.id)
        .order('created_at', { ascending: true });

      if (!eventsError) {
        setEvents(eventsData || []);
      }

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_verification: 'Pending Verification',
      pending_dropoff: 'Pending Drop-off',
      received_at_pickup: 'Received at Pickup',
      in_transit: 'In Transit',
      at_destination_hub: 'At Hub',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700 border-green-200',
      in_transit: 'bg-blue-100 text-blue-700 border-blue-200',
      out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
      pending_verification: 'bg-gray-100 text-gray-700 border-gray-200',
      pending_dropoff: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      received_at_pickup: 'bg-purple-100 text-purple-700 border-purple-200',
      at_destination_hub: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showFullDetails = !!user;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Looking up your package...</p>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h1>
          <p className="text-gray-700 mb-6">{error || 'No package found'}</p>
          <Link href={user ? "/packages" : "/"} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition inline-block font-medium">
            {user ? 'View My Packages' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href={user ? "/packages" : "/"} className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1 font-medium">
            <ArrowLeft size={14} />
            {user ? 'Back to Packages' : 'Back to Home'}
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3">
            <h1 className="text-2xl font-bold text-white">Track Your Package</h1>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-sm font-mono font-medium text-white mt-2 sm:mt-0">
              {packageData.tracking_number}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Current Status</p>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(packageData.status)}`}>
                {getStatusLabel(packageData.status)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
              {packageData.status === 'delivered' ? '✅ Delivered' : 
               packageData.status === 'out_for_delivery' ? '🚚 Out for delivery today' :
               `📅 Est. ${new Date(packageData.estimated_delivery || Date.now() + 86400000 * 3).toLocaleDateString('en-US', { 
                 weekday: 'long', 
                 month: 'long', 
                 day: 'numeric', 
                 year: 'numeric' 
               })}`}
            </div>
          </div>
        </div>

        {/* Sender & Receiver - Full details if logged in */}
        {showFullDetails ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-blue-600 mb-3">
                  <User size={18} />
                  <h3 className="font-semibold text-gray-800">Sender</h3>
                </div>
                <p className="font-semibold text-gray-900 text-base">{packageData.sender_name}</p>
                <p className="text-gray-700 text-sm flex items-center gap-2 mt-1.5">
                  <Phone size={14} className="text-gray-500" />
                  {packageData.sender_phone || 'Not provided'}
                </p>
                {packageData.sender_email && (
                  <p className="text-gray-700 text-sm flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-gray-500" />
                    {packageData.sender_email}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <User size={18} />
                  <h3 className="font-semibold text-gray-800">Receiver</h3>
                </div>
                <p className="font-semibold text-gray-900 text-base">{packageData.receiver_name}</p>
                <p className="text-gray-700 text-sm flex items-center gap-2 mt-1.5">
                  <Phone size={14} className="text-gray-500" />
                  {packageData.receiver_phone}
                </p>
                {packageData.receiver_phone_alt && (
                  <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-gray-400" />
                    Alt: {packageData.receiver_phone_alt}
                  </p>
                )}
                {packageData.receiver_email && (
                  <p className="text-gray-700 text-sm flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-gray-500" />
                    {packageData.receiver_email}
                  </p>
                )}
              </div>
            </div>

            {/* Package Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                <p className="font-semibold text-gray-900">{packageData.description || 'No description'}</p>
                <p className="text-sm text-gray-700 mt-1">{packageData.weight_kg} kg</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> From
                </p>
                <p className="font-semibold text-gray-900">{packageData.pickup_point_name}</p>
                <p className="text-sm text-gray-700">{packageData.pickup_address}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> To
                </p>
                <p className="font-semibold text-gray-900">{packageData.destination_city}</p>
                <p className="text-sm text-gray-700">{packageData.delivery_address}</p>
              </div>
            </div>
          </>
        ) : (
          // Limited Info for Public (not logged in)
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Pickup Location
                </p>
                <p className="font-semibold text-gray-900">{packageData.pickup_point_name}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Destination
                </p>
                <p className="font-semibold text-gray-900">{packageData.destination_city}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1">Package</p>
                <p className="font-semibold text-gray-900">{packageData.description || 'No description'}</p>
                <p className="text-sm text-gray-700 mt-1">{packageData.weight_kg} kg</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600 mb-1">Tracking Number</p>
                <p className="font-mono font-bold text-blue-600 text-base">{packageData.tracking_number}</p>
              </div>
            </div>

            {/* Login Prompt */}
            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-200 mb-6">
              <p className="text-sm font-medium text-blue-700">
                🔒 Login to see sender and receiver details
              </p>
              <Link href="/login" className="mt-3 inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                Login to Your Account
              </Link>
            </div>
          </>
        )}

        {/* Tracking Timeline */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">Tracking History</h2>
          </div>
          
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tracking events yet</p>
          ) : (
            <div className="relative">
              <div className="space-y-0">
                {events.map((event, index) => {
                  const isLast = index === events.length - 1;
                  return (
                    <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0 z-10 mt-1 ${
                          event.status === 'delivered' ? 'bg-green-500' :
                          event.status === 'pending_verification' ? 'bg-gray-400' :
                          event.status === 'in_transit' ? 'bg-blue-500' :
                          'bg-blue-400'
                        }`}></div>
                        {!isLast && <div className="w-0.5 flex-1 min-h-[30px] bg-gray-300"></div>}
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 pb-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="font-semibold text-gray-900 text-base">{getStatusLabel(event.status)}</p>
                          <p className="text-sm font-medium text-gray-500">
                            {formatDate(event.created_at)}
                          </p>
                        </div>
                        {event.notes && (
                          <p className="text-gray-700 text-sm mt-1 leading-relaxed">{event.notes}</p>
                        )}
                        {event.location && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                            <span>📍</span>
                            {event.location}
                          </p>
                        )}
                        {event.triggered_by && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <span>👤</span>
                            {event.triggered_by}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}