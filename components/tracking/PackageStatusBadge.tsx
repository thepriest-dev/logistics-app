interface PackageStatusBadgeProps {
  status: string;
}

export default function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending_dropoff':
        return { label: 'Awaiting Drop-off', color: 'bg-gray-200 text-gray-700' };
      case 'received_at_pickup':
        return { label: 'Received at Pickup', color: 'bg-blue-200 text-blue-700' };
      case 'in_transit':
        return { label: 'In Transit', color: 'bg-indigo-200 text-indigo-700' };
      case 'at_destination_hub':
        return { label: 'At Destination Hub', color: 'bg-purple-200 text-purple-700' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: 'bg-orange-200 text-orange-700' };
      case 'delivered':
        return { label: 'Delivered ✓', color: 'bg-green-200 text-green-700' };
      default:
        return { label: status, color: 'bg-gray-200 text-gray-700' };
    }
  };

  const info = getStatusInfo();

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}