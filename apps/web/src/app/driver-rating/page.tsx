import RatingForm from '@/components/driver-rating/RatingForm';

export default function RatingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <RatingForm 
          orderId="order_demo_001"
          driverId="driver_001"
          driverName="สมชาย ใจดี"
        />
      </div>
    </div>
  );
}