// app/(dashboard)/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Pickup point locations in Ibadan
const PICKUP_POINTS = [
  { id: '1', name: 'SendIt - Challenge Branch', address: 'Opposite Challenge Police Station, Challenge, Ibadan' },
  { id: '2', name: 'SendIt - Dugbe Branch', address: '37, Dugbe Road, Dugbe, Ibadan' },
  { id: '3', name: 'SendIt - Bodija Branch', address: '123, Bodija Market Road, Bodija, Ibadan' },
  { id: '4', name: 'SendIt - Sango Branch', address: '45, Sango Road, Sango, Ibadan' },
  { id: '5', name: 'SendIt - Mokola Branch', address: '78, Mokola Road, Mokola, Ibadan' },
  { id: '6', name: 'SendIt - Iwo Road Branch', address: '22, Iwo Road, Ibadan' },
  { id: '7', name: 'SendIt - Jericho Branch', address: '56, Jericho Road, Jericho, Ibadan' },
  { id: '8', name: 'SendIt - Oluyole Branch', address: '89, Oluyole Estate Road, Oluyole, Ibadan' },
];

// Delivery locations in Lagos
const DELIVERY_POINTS = [
  { id: 'd1', name: 'SendIt - Ikeja Branch', address: '42, Obafemi Awolowo Way, Ikeja, Lagos' },
  { id: 'd2', name: 'SendIt - VI Branch', address: '15, Ahmadu Bello Way, Victoria Island, Lagos' },
  { id: 'd3', name: 'SendIt - Surulere Branch', address: '78, Adeniran Ogunsanya Street, Surulere, Lagos' },
  { id: 'd4', name: 'SendIt - Yaba Branch', address: '234, Herbert Macaulay Way, Yaba, Lagos' },
  { id: 'd5', name: 'SendIt - Lekki Branch', address: '56, Admiralty Way, Lekki Phase 1, Lagos' },
  { id: 'd6', name: 'SendIt - Ajah Branch', address: '123, Lekki-Epe Expressway, Ajah, Lagos' },
  { id: 'd7', name: 'SendIt - Apapa Branch', address: '89, Creek Road, Apapa, Lagos' },
  { id: 'd8', name: 'SendIt - Festac Branch', address: '45, 1st Avenue, Festac Town, Lagos' },
  { id: 'd9', name: 'SendIt - Ikorodu Branch', address: '67, Lagos Road, Ikorodu, Lagos' },
  { id: 'd10', name: 'SendIt - Ojo Branch', address: '34, Lagos-Badagry Expressway, Ojo, Lagos' },
];

export default function CreatePackagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_phone: '',
    receiver_phone_alt: '',
    receiver_email: '',
    pickup_point_id: '',
    delivery_point_id: '',
    weight_kg: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate
    if (!formData.receiver_name || !formData.receiver_phone || !formData.pickup_point_id || !formData.delivery_point_id) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Find selected pickup and delivery points
      const selectedPickup = PICKUP_POINTS.find(p => p.id === formData.pickup_point_id);
      const selectedDelivery = DELIVERY_POINTS.find(p => p.id === formData.delivery_point_id);

      // Generate tracking number
      const newTrackingNumber = `SND-${Math.floor(Math.random() * 90000 + 10000)}`;

      // Prepare package data
      const packageData = {
        tracking_number: newTrackingNumber,
        status: 'pending_verification',
        sender_id: user?.id || '',
        sender_name: user?.name || '',
        sender_phone: user?.phone || '',
        sender_email: user?.email || '',
        receiver_name: formData.receiver_name,
        receiver_phone: formData.receiver_phone,
        receiver_phone_alt: formData.receiver_phone_alt || '',
        receiver_email: formData.receiver_email || '',
        pickup_point_name: selectedPickup?.name || '',
        pickup_address: selectedPickup?.address || '',
        delivery_address: selectedDelivery?.address || '',
        destination_city: selectedDelivery?.name || 'Lagos',
        weight_kg: parseFloat(formData.weight_kg) || 0,
        description: formData.description || 'Package',
        verification_status: 'pending',
        payment_status: 'pending',
        fee: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating package with data:', packageData);

      // Insert into Supabase
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData])
        .select()
        .single();

      if (error) {
        console.error('Error creating package:', error);
        
        // If table doesn't exist, show a helpful message
        if (error.code === '42P01') {
          setError('The packages table does not exist. Please run the database migration.');
          setLoading(false);
          return;
        }
        
        setError('Failed to create package: ' + error.message);
        setLoading(false);
        return;
      }

      console.log('Package created successfully:', data);

      // Try to create tracking event (optional - don't fail if it doesn't work)
      try {
        const trackingEventData = {
          package_id: data.id,
          status: 'pending_verification',
          notes: 'Package registered and awaiting verification',
          triggered_by: user?.name || 'User',
          created_at: new Date().toISOString(),
        };
        
        console.log('Creating tracking event:', trackingEventData);
        
        const { error: trackingError } = await supabase
          .from('tracking_events')
          .insert([trackingEventData]);

        if (trackingError) {
          // Log error but don't fail the package creation
          console.warn('Tracking event creation failed (non-critical):', trackingError);
        }
      } catch (trackingErr) {
        console.warn('Tracking event error (non-critical):', trackingErr);
      }

      // Send notification to user
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: user?.id,
            title: 'Package Created 📦',
            message: `Your package ${newTrackingNumber} has been created and is awaiting verification.`,
            type: 'info',
            tracking_number: newTrackingNumber,
            is_read: false,
            created_at: new Date().toISOString(),
          }]);
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError);
      }

      setTrackingNumber(newTrackingNumber);
      setSuccess(`Package created successfully! Tracking number: ${newTrackingNumber}`);
      
      // Reset form
      setFormData({
        receiver_name: '',
        receiver_phone: '',
        receiver_phone_alt: '',
        receiver_email: '',
        pickup_point_id: '',
        delivery_point_id: '',
        weight_kg: '',
        description: '',
      });
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error creating package:', err);
      setError('Failed to create package. Please try again.');
      setLoading(false);
    }
  };

  const handleTrack = () => {
    router.push(`/track/${trackingNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-white/80 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Send a Package</h1>
          <p className="text-blue-100 text-sm">Fill in the details below to send your package</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Package Created Successfully!</h3>
                <p className="text-green-700 text-sm mt-1">{success}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={handleTrack}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Track Package Now →
                  </button>
                  <Link
                    href="/packages"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    View All Packages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span>❌</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Sender Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <span>👤</span> Sender Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-800 font-medium">{user?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-800 font-medium">{user?.phone || 'Not provided'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <p className="text-gray-800 font-medium">{user?.email || 'Not provided'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <span>🔒</span> This information is from your registered account
              </p>
            </div>
          </div>

          {/* Receiver Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <span>🎯</span> Receiver Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Phone Number *
                </label>
                <input
                  type="tel"
                  name="receiver_phone"
                  value={formData.receiver_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Phone Number
                </label>
                <input
                  type="tel"
                  name="receiver_phone_alt"
                  value={formData.receiver_phone_alt}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="receiver_email"
                  value={formData.receiver_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <span>📦</span> Package Details
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Point (Ibadan) *
                </label>
                <select
                  name="pickup_point_id"
                  value={formData.pickup_point_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a pickup point...</option>
                  {PICKUP_POINTS.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} - {point.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Point (Lagos) *
                </label>
                <select
                  name="delivery_point_id"
                  value={formData.delivery_point_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a delivery point...</option>
                  {DELIVERY_POINTS.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} - {point.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    required
                    step="0.1"
                    min="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Electronics, Documents, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Package...' : 'Send Package & Get Tracking Number'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            * Required fields
          </p>
        </form>
      </div>
    </div>
  );
}