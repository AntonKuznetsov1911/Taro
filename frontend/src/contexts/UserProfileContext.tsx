import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userProfileStore, UserProfile, PartialUserProfile } from '../stores/userProfileStore';

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  hasProfile: boolean;
  saveProfile: (data: PartialUserProfile) => Promise<UserProfile>;
  clearProfile: () => Promise<void>;
  getGreeting: () => string;
  isBirthday: () => boolean;
  getAge: () => number | null;
  getDaysToBirthday: () => number | null;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await userProfileStore.init();
      setProfile(userProfileStore.getProfile());
      setIsLoading(false);
    };
    init();

    const unsubscribe = userProfileStore.subscribe(() => {
      setProfile(userProfileStore.getProfile());
    });

    return unsubscribe;
  }, []);

  const saveProfile = async (data: PartialUserProfile): Promise<UserProfile> => {
    const saved = await userProfileStore.saveProfile(data);
    setProfile(saved);
    return saved;
  };

  const clearProfile = async () => {
    await userProfileStore.clearProfile();
    setProfile(null);
  };

  const value: UserProfileContextType = {
    profile,
    isLoading,
    hasProfile: profile?.isComplete ?? false,
    saveProfile,
    clearProfile,
    getGreeting: () => userProfileStore.getGreeting(),
    isBirthday: () => userProfileStore.isBirthday(),
    getAge: () => userProfileStore.getAge(),
    getDaysToBirthday: () => userProfileStore.getDaysToBirthday(),
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
}
