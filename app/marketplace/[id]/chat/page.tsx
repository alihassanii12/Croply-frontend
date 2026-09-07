"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getListing, Listing } from "@/lib/api";
import { Spinner } from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";

function ChatRedirect() {
  const params = useParams();
  const router = useRouter();
  const { user, isFarmer } = useAuth();
  const listingId = parseInt(params.id as string);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const handleRedirect = async () => {
      try {
        if (isFarmer) {
          // Farmers should go to chats page to select which buyer to chat with
          router.push('/chats');
        } else {
          // Buyers should go directly to chat with the farmer
          const listing = await getListing(listingId);
          router.push(`/marketplace/${listingId}/chat/${listing.seller_id}`);
        }
      } catch (err) {
        console.error("Failed to redirect:", err);
        // Fallback to chats page
        router.push('/chats');
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [user, isFarmer, listingId, router]);

  if (loading) return <Spinner />;
  return null;
}

export default function ChatPage() {
  return (
    <RouteGuard>
      <ChatRedirect />
    </RouteGuard>
  );
}
