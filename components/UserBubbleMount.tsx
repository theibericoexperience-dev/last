"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import UserBubble from './UserBubble';

export default function UserBubbleMount() {
  const pathname = usePathname();
  // Do not render the floating/global UserBubble on the landing page — landing has its own hero buttons
  if (!pathname) return null;
  if (pathname === '/' || pathname === '') return null;
  return <UserBubble />;
}
