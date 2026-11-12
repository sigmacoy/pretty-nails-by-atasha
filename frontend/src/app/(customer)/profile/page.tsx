'use client';

import { useEffect, useState } from 'react';
import { Mail, Shield, Calendar, User, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import type { UserDto } from '@/types';

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [userData, setUserData] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authApi.me();
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load profile data</p>
      </div>
    );
  }

  const roleLabel = userData.role === 'ADMIN' ? 'Administrator' : 'Customer';
  const roleColor = userData.role === 'ADMIN'
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <Avatar name={userData.name} size="xl" src={userData.image} alt={userData.name} />
            <div>
              <CardTitle className="text-2xl">{userData.name}</CardTitle>
              <p className="text-muted-foreground">{userData.email}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
            {roleLabel}
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {userData.phone ? (
                <>
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{userData.phone}</p>
                  </div>
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-muted-foreground opacity-50" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-muted-foreground">Not set</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="font-medium">{formatDate(userData.createdAt)}</p>
              </div>
            </div>
          </div>

          {userData.nickname && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Nickname</p>
                <p className="font-medium">{userData.nickname}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Form */}
      <ProfileForm />

      {/* Change Password Form */}
      <ChangePasswordForm />
    </div>
  );
}