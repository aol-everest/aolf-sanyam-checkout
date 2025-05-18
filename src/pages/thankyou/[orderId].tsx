/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchOrder, type OrderData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function getServerSideProps({
  params,
}: {
  params: { orderId: string };
}) {
  try {
    const order = await fetchOrder(params.orderId);
    return {
      props: {
        order,
        orderId: params.orderId,
      },
    };
  } catch (error) {
    console.error('Error fetching order in getServerSideProps:', error);
    return {
      props: {
        orderId: params.orderId,
      },
    };
  }
}

export default function ThankYouPage({
  order: initialOrder,
  orderId,
}: {
  order?: OrderData;
  orderId: string;
}) {
  const [order, setOrder] = useState<OrderData | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (initialOrder) return;

    const loadOrder = async () => {
      try {
        const data = await fetchOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, initialOrder]);

  if (loading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  if (!order) {
    return <div className="container py-12 text-center">Order not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-center mb-8">
        <Image
          src="/images/ic-logo.svg"
          alt="Art of Living Logo"
          width={115}
          height={45}
          className="h-16 w-auto"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8 flex items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white">
          ✓
        </div>
        <p className="text-lg font-medium">You&apos;re going!</p>
      </div>

      <h1 className="text-3xl font-bold mb-8">{order.courseTitle}</h1>

      <p className="text-lg mb-4">
        You&apos;re registered for {order.courseTitle}, from Fri,{' '}
        {order.courseDate}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <Button variant="outline" className="w-full">
            Add to Calendar
          </Button>
        </div>
        <div>
          <Image
            src="/images/meditation-image.jpg"
            alt="Meditation"
            width={500}
            height={300}
            className="rounded-lg w-full h-auto"
          />
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">
          Download the app and relax with a meditation
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="#"
            className="bg-black text-white rounded-md px-6 py-2 flex items-center gap-2"
          >
            <Image
              src="/images/apple-icon.svg"
              alt="App Store"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            Download on the App Store
          </Link>
          <Link
            href="#"
            className="bg-black text-white rounded-md px-6 py-2 flex items-center gap-2"
          >
            <Image
              src="/images/google-play-icon.svg"
              alt="Google Play"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            Get it on Google Play
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Program details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">
                <Image
                  src="/images/calendar-icon.svg"
                  alt="Calendar"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </span>
              <div>
                <p>{order.courseDate}</p>
                <p className="text-sm text-muted-foreground">
                  {order.courseTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline">Add to Calendar</Button>
      </div>
    </div>
  );
}
