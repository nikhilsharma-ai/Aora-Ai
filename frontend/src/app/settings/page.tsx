'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/toast';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Camera,
  Mail,
  User,
  Copy,
  LogOut,
  Crown,
  Sparkles,
  Key,
  Pencil,
  Check,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

export default function SettingsPanel() {
  const { toast } = useToast();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user: storeUser, logout } = useAppStore();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  // Profile states
  const [name, setName] = useState('Nikhil Sharma');
  const [email, setEmail] = useState('nikhil06112@gmail.com');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  const [accessCode, setAccessCode] = useState('Not assigned');
  const [userId, setUserId] = useState('');
  const [joinedDate, setJoinedDate] = useState('Jul 4, 2026');

  // Upgrade Modal triggers
  const { openUpgradeModal } = useUIStore();

  // Sync state with Clerk / Store
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      setName(clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User');
      setEmail(clerkUser.primaryEmailAddress?.emailAddress || 'nikhil06112@gmail.com');
      setAvatar(clerkUser.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
      setUserId(clerkUser.id);

      if (clerkUser.createdAt) {
        const date = new Date(clerkUser.createdAt);
        setJoinedDate(date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }));
      }
    } else if (storeUser) {
      setName(storeUser.name || 'Nikhil Sharma');
      setEmail(storeUser.email || 'nikhil06112@gmail.com');
      setAvatar(storeUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

      // Load or generate a persistent local mock userId
      let localId = localStorage.getItem('aora_mock_userid');
      if (!localId) {
        localId = 'usr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('aora_mock_userid', localId);
      }
      setUserId(localId);

      // Load or generate a persistent local mock join date
      let localJoined = localStorage.getItem('aora_mock_joined');
      if (!localJoined) {
        localJoined = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        localStorage.setItem('aora_mock_joined', localJoined);
      }
      setJoinedDate(localJoined);
    }
  }, [clerkUser, isClerkLoaded, storeUser]);

  // Edit toggles
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAccessCode, setIsEditingAccessCode] = useState(false);

  // Format dynamic user ID
  const displayUserId = userId.length > 25 ? `${userId.substring(0, 25)}...` : userId;

  // Save actions
  const handleSaveName = () => {
    if (!name.trim()) {
      toast('Name cannot be empty', 'error');
      return;
    }
    useAppStore.setState((state) => ({
      user: state.user ? { ...state.user, name } : null
    }));
    setIsEditingName(false);
    toast('Profile name updated successfully', 'success');
  };

  const handleSaveAccessCode = () => {
    setIsEditingAccessCode(false);
    toast('Access code updated', 'success');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (isClerkLoaded && clerkUser) {
        try {
          toast('Uploading profile photo...', 'info');
          await clerkUser.setProfileImage({ file });
          toast('Profile picture updated successfully', 'success');
        } catch (err: any) {
          console.error('Failed to upload profile picture to Clerk:', err);
          toast(err.message || 'Failed to update profile picture', 'error');
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const dataUrl = event.target.result as string;
            setAvatar(dataUrl);
            useAppStore.setState((state) => ({
              user: state.user ? { ...state.user, avatarUrl: dataUrl } : null
            }));
            toast('Profile picture updated successfully', 'success');
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const copyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      toast('User ID copied to clipboard', 'success');
    }
  };

  const handleLogout = async () => {
    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    toast('Logging out...', 'info');
    if (hasClerk && clerkUser) {
      try {
        await signOut();
      } catch (err) {
        console.error('Clerk logout failed:', err);
      }
    } else {
      logout();
    }
    router.push('/');
  };

  const handleUpgrade = () => {
    openUpgradeModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8 text-left py-6 px-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-10 h-10 rounded-xl bg-[#EAE6F4] flex items-center justify-center">
          <Settings className="w-5.5 h-5.5 text-[#8B5CF6]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-800 leading-none">Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your account, subscription, and preferences
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left Column - Profile Card (4 cols) */}
        <div className="md:col-span-4">
          <div className="bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col items-center pb-6">
            {/* Banner Backdrop */}
            <div className="w-full h-24 bg-gradient-to-r from-[#D6CFFE] to-[#EAE6F4]" />

            {/* Avatar block */}
            <div className="relative mt-[-48px]">
              <img
                src={avatar}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm bg-gray-100"
              />
              <label className="absolute bottom-0 left-0 bg-white border border-brand-border/60 hover:bg-gray-50 rounded-full p-2 shadow-md cursor-pointer transition flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-gray-600" />
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>

            {/* Name and Member since */}
            <div className="w-full px-6 text-center mt-3">
              {isEditingName ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                    }}
                    className="border-b border-brand-primary outline-none text-center font-bold text-lg max-w-[160px] text-gray-800 py-0.5"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-1 rounded-full hover:bg-emerald-50 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 group">
                  <h2 className="text-lg font-bold font-display text-gray-800 leading-tight">
                    {name}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition p-1 rounded-full hover:bg-gray-100"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-1 font-medium">
                Member since {joinedDate}
              </p>
            </div>

            {/* Profile Info fields */}
            <div className="w-full px-6 space-y-3.5 mt-6">

              {/* Email Block */}
              <div className="border border-[#EBEBEB] bg-white rounded-2xl p-4 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#EBEBEB] flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider leading-none">
                      Email
                    </p>
                    <p className="text-xs font-semibold text-gray-700 mt-1.5 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* User ID Block */}
              <div className="border border-[#EBEBEB] bg-white rounded-2xl p-4 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#EBEBEB] flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider leading-none">
                      User ID
                    </p>
                    <p className="text-xs font-semibold text-gray-700 mt-1.5 truncate">
                      {displayUserId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyUserId}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Log out Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-[#FFECEE] hover:bg-[#FFD3D6] text-[#FF4D4D] rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold transition duration-200 cursor-pointer mt-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Log Out</span>
              </button>

            </div>
          </div>
        </div>

        {/* Right Column - Subscription Card (8 cols) */}
        <div className="md:col-span-8 flex flex-col justify-start">
          <div className="bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 relative flex flex-col">

            {/* Crown Icon top right */}
            <div className="absolute top-6 right-6">
              <Crown className="w-5 h-5 text-[#8B5CF6]" />
            </div>

            {/* Header info */}
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">
                Subscription
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Basic access with essential features
              </p>
            </div>

            {/* Plan and Upgrade */}
            <div className="flex items-center justify-between mt-6 bg-white border border-[#EBEBEB] rounded-2xl p-4.5">
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider leading-none">
                  Current Plan
                </p>
                <p className="text-xl font-bold font-display text-gray-800 mt-1.5">
                  {storeUser?.plan || 'Starter'}
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                className="bg-[#EAE6F4] hover:bg-[#DCD5F9] text-[#7C3AED] font-bold text-xs px-5 py-2.5 rounded-2xl border border-purple-100 flex items-center gap-2 cursor-pointer transition duration-150"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade</span>
              </button>
            </div>

            {/* Access Code Block */}
            <div className="border border-[#EBEBEB] bg-white rounded-2xl p-4 flex items-center justify-between mt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#EBEBEB] flex items-center justify-center">
                  <Key className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider leading-none">
                    Access Code
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-1.5">
                    {accessCode}
                  </p>
                </div>
              </div>
              <div>
                {isEditingAccessCode ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={accessCode === 'Not assigned' ? '' : accessCode}
                      onChange={(e) => setAccessCode(e.target.value || 'Not assigned')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveAccessCode();
                      }}
                      placeholder="Enter code"
                      className="border border-brand-border bg-white rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 outline-none max-w-[120px]"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAccessCode}
                      className="text-emerald-600 hover:text-emerald-700 cursor-pointer p-1 rounded-full hover:bg-emerald-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingAccessCode(true)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Assistance Footer info aligned bottom right / under card */}
          <div className="text-center mt-12 flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400 font-medium">
              Need assistance? Contact our support team
            </p>
            <a
              href="mailto:ds.nikhilsharma@gmail.com"
              className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] transition flex items-center gap-1 group"
            >
              <span>ds.nikhilsharma@gmail.com</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

      </div>

    </motion.div>
  );
}


