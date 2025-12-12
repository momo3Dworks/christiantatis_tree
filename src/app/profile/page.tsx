'use client';

import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Mail,
  AlertCircle,
  Upload,
  RefreshCw,
  Church,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { es, fr, pt } from 'date-fns/locale';
import QRCode from 'qrcode';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { generateEmailHtml } from '@/lib/email-templates';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const router = useRouter();
  const [isReloading, setIsReloading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [churchToDelete, setChurchToDelete] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const { t, locale } = useTranslation();
  const dateLocales: { [key: string]: any } = { es, fr, pt };
  const [createdChurches, setCreatedChurches] = useState<any[]>([]);
  const [reservedChurches, setReservedChurches] = useState<any[]>([]);
  const [isLoadingChurches, setIsLoadingChurches] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Phone Verification State
  const [phone, setPhone] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');

  const handleUpdateWhatsapp = async () => {
    if (!user) return;
    const { data, error } = await supabase.auth.updateUser({
      data: { whatsapp_number: whatsapp }
    })
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update WhatsApp number.' });
    } else {
      toast({ title: 'WhatsApp Saved', description: 'Your WhatsApp number has been updated.' });
    }
  };

  const handleUpdateAddress = async () => {
    // This requires a custom backend function to update user metadata in Firebase Auth
    console.warn("Updating address is a backend operation not supported from client.");
    toast({ title: 'Address Saved (Simulated)', description: 'In a real app, this would be a secure backend operation.' });
  };

  // MFA State
  const [factors, setFactors] = useState<any[]>([]);
  const [enrollData, setEnrollData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);

  const [mfaError, setMfaError] = useState<string | null>(null);

  useEffect(() => {
    if (user && supabase) {
      supabase.auth.mfa.listFactors().then(({ data, error }) => {
        if (error) {
          console.error("MFA List Error:", error);
          setMfaError(error.message);
        } else if (data) {
          const verified = data.totp.filter((f: any) => f.status === 'verified');
          setFactors(verified);
        }
      });
    }
  }, [user, supabase]);

  const handleStartMfa = async () => {
    setIsMfaLoading(true);
    try {
      // Providing 'issuer' explicitly to prevent Supabase from defaulting to Site URL which might cause formatting errors.
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Christianitatis'
      });
      if (error) throw error;

      setEnrollData(data);

      // Manually construct the URI to ensure it is properly formatted, avoiding issuer/siteURL issues from Supabase config.
      const secret = data.totp.secret;
      const issuer = "Christianitatis";
      const accountName = user?.email || "User";
      const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      const url = await QRCode.toDataURL(uri);
      setQrCodeUrl(url);
    } catch (error: any) {
      console.error("MFA Start Error:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || "Could not start MFA enrollment." });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!enrollData || !verifyCode) return;
    setIsMfaLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: verifyCode
      });
      if (verifyError) throw verifyError;

      toast({ title: 'MFA Enabled', description: 'Two-factor authentication is now active.' });
      setEnrollData(null);
      setQrCodeUrl(null);
      setVerifyCode('');
      // Refresh factors
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) setFactors(data.totp.filter((f: any) => f.status === 'verified'));

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: error.message });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    const factor = factors[0]; // Assume 1 factor for simplicity
    if (!factor) return;
    setIsMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;

      setFactors([]);
      toast({ title: 'MFA Disabled', description: 'Two-factor authentication has been turned off.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsMfaLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && supabase) {
      const fetchChurches = async () => {
        setIsLoadingChurches(true);
        // Fetch created churches
        const { data: createdData, error: createdError } = await supabase
          .from('home_churches')
          .select('*')
          .eq('creatorId', user.id);
        if (createdError) console.error('Error fetching created churches:', createdError);
        else setCreatedChurches(createdData);

        // Fetch reserved churches
        const { data: allChurchesData, error: allChurchesError } = await supabase
          .from('home_churches')
          .select('*');
        if (allChurchesError) console.error('Error fetching all churches:', allChurchesError);
        else {
          const reserved = allChurchesData.filter(church => church.reservations?.includes(user.id));
          setReservedChurches(reserved);
        }

        setIsLoadingChurches(false);
      };
      fetchChurches();
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      if (user.phone) {
        setPhone(user.phone);
      }
      if (user.user_metadata?.whatsapp_number) {
        setWhatsapp(user.user_metadata.whatsapp_number);
      }
    }
  }, [user]);

  const handleSendVerificationEmail = async () => {
    if (user && !user.email_confirmed_at) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });
      if (error) {
        console.error('Error sending verification email:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send verification email. Please try again later.',
        });
      } else {
        toast({
          title: 'Verification Email Sent',
          description: 'Check your inbox to verify your account.',
        });
      }
    }
  };

  const handleReloadUser = async () => {
    if (user) {
      setIsReloading(true);
      try {
        await supabase.auth.refreshSession();
        toast({
          title: 'Status Updated',
          description: 'User status has been refreshed.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not reload user status.',
        });
      } finally {
        setIsReloading(false);
      }
    }
  };


  const handleDeleteChurch = async () => {
    if (!churchToDelete || !supabase) return;

    setIsDeleting(true);

    try {
      const { data: churchData, error: fetchError } = await supabase
        .from('home_churches')
        .select('*')
        .eq('id', churchToDelete)
        .single();

      if (fetchError || !churchData) {
        throw new Error("Church not found to delete");
      }

      // 2. Notify Reservants if any
      if (churchData && churchData.reservations && churchData.reservations.length > 0) {
        try {
          const emailHtml = generateEmailHtml(
            'Event Canceled',
            `
                 <p>We are very sorry, but the host of the church <strong>${churchData.name}</strong> has deleted the event or church.</p>
                 <p>Your reservation has been automatically canceled.</p>
                 <div class="info-box">
                    <p>If you have any questions, please search for other available churches on the map.</p>
                 </div>
                 <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/" class="button">Find Other Churches</a>
                 `
          );

          // Add timeout to prevent hanging UI
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userIds: churchData.reservations,
              subject: 'Important: Church Deleted - Christianitatis',
              html: emailHtml
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

        } catch (e: any) {
          if (e.name === 'AbortError') {
            console.warn("Email notification timed out, but deletion will proceed.");
          } else {
            console.error("Failed to send broadcast deletion email", e);
          }
        }
      }
      const { error: deleteError } = await supabase
        .from('home_churches')
        .delete()
        .eq('id', churchToDelete);

      if (deleteError) throw deleteError;

      setCreatedChurches(prev => prev.filter(c => c.id !== churchToDelete));

      toast({
        title: 'Church Deleted',
        description: 'The church has been successfully deleted.',
      });
    } catch (error: any) {
      console.error("Error deleting church: ", error);
      toast({
        variant: 'destructive',
        title: 'Error on deletion',
        description: error.message || 'Could not delete the church.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
      setChurchToDelete(null);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationToCancel || !user || !supabase) return;
    try {
      const { data: churchData, error: fetchError } = await supabase
        .from('home_churches')
        .select('*')
        .eq('id', reservationToCancel)
        .single();

      if (fetchError || !churchData) {
        throw new Error("Church not found");
      }

      const updatedReservations = churchData.reservations?.filter((id: string) => id !== user.id) || [];
      const { error: updateError } = await supabase
        .from('home_churches')
        .update({ reservations: updatedReservations })
        .eq('id', reservationToCancel);

      if (updateError) throw updateError;

      setReservedChurches(prev => prev.filter(c => c.id !== reservationToCancel));


      // Notify Creator of Cancellation
      try {
        const creatorEmailHtml = generateEmailHtml(
          'Reservation Canceled',
          `
            <p>User <strong>${user.email}</strong> has canceled their reservation for your church <strong>${churchData.name}</strong>.</p>
            <p>A spot has been freed up.</p>
            <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/profile" class="button">View Church Status</a>
            `
        );

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: churchData.creatorEmail || 'creator_lookup',
            creatorId: churchData.creatorId,
            subject: 'Reservation Canceled - Christianitatis',
            html: creatorEmailHtml
          })
        });
      } catch (e) {
        console.error("Failed to send cancellation email", e);
      }

      toast({
        title: 'Reservation Canceled',
        description: 'Your reservation has been successfully canceled.',
      });
      // UI will update automatically via hook
    } catch (error: any) {
      console.error("Error cancelling reservation: ", error);
      toast({
        variant: 'destructive',
        title: 'Error Canceling',
        description: error.message || 'Could not cancel the reservation.',
      });
    } finally {
      setShowCancelAlert(false);
      setReservationToCancel(null);
    }
  };

  const handleUpdateStatus = async (churchId: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error: updateError } = await supabase
        .from('home_churches')
        .update({ status: newStatus })
        .eq('id', churchId);

      if (updateError) throw updateError;

      // 2. Fetch Church to notify reservants
      const { data: churchData, error: fetchError } = await supabase
        .from('home_churches')
        .select('*')
        .eq('id', churchId)
        .single();

      if (churchData && churchData.reservations && churchData.reservations.length > 0) {
        const emailHtml = generateEmailHtml(
          'Status Update',
          `
                <p>The status of the church <strong>${churchData.name}</strong> has changed to: <strong>${newStatus}</strong>.</p>
                <p>Please check if this affects your plans.</p>
                <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/profile" class="button">View My Reservation</a>
                `
        );

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: churchData.reservations,
            subject: `Status Update: ${churchData.name}`,
            html: emailHtml
          })
        });
      }

      setCreatedChurches(prev => prev.map(c => c.id === churchId ? { ...c, status: newStatus } : c));

      toast({ title: 'Status Updated', description: `The church is now: ${newStatus}` });
      // UI will update from hook
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    }
  };


  const formatSchedule = (church: any) => {
    if (!church.meetingDate || !church.meetingTime) {
      return church.meetingSchedule;
    }
    const date = new Date(church.meetingDate); // Convert ISO string to Date
    const time = church.meetingTime;
    if (church.isRecurring) {
      const dayOfWeek = format(date, "EEEE", { locale: dateLocales[locale || 'en'] });
      return t('contentPreview.registerChurch.recurringSchedule', { day: dayOfWeek, time: time });
    } else {
      const formattedDate = format(date, "PPP", { locale: dateLocales[locale || 'en'] });
      return t('contentPreview.registerChurch.oneTimeSchedule', { date: formattedDate, time: time });
    }
  };


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const getInitials = (email: string | undefined | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you soon!"
    });
    router.push('/');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-green-500';
      case 'Full':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-24">
        <header className="mb-12 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.user_metadata?.full_name || 'User'} />
              <AvatarFallback className="text-3xl">{getInitials(user.email)}</AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 bg-background"
              onClick={() => alert('Feature coming soon!')}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload new avatar</span>
            </Button>
          </div>
          <div className="flex-grow flex justify-between items-center w-full">
            <div>
              <h1 className="text-4xl font-bold">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className='flex gap-2'>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </header>

        <main className="space-y-12">

          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile & Security</TabsTrigger>
              <TabsTrigger value="churches">My Churches & Reservations</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8 mt-6">
              {/* ID Verification Section (Email) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Verification</CardTitle>
                  <CardDescription>
                    Verification status of your email address.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.email_confirmed_at ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Your email address has been verified.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-orange-700 dark:text-orange-300 sm:flex-row sm:items-center">
                      <div className="flex flex-grow items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">Your email address is not verified.</p>
                      </div>
                      <div className="flex w-full sm:w-auto sm:items-center gap-2">
                        <Button onClick={handleSendVerificationEmail} variant="outline" className="w-full bg-transparent sm:w-auto flex-grow">
                          Resend Verification
                        </Button>
                        <Button onClick={handleReloadUser} variant="outline" size="icon" className="bg-transparent" disabled={isReloading} title="Refresh status" >
                          <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Phone Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Phone Verification</CardTitle>
                  <CardDescription>Add a phone number to secure your account and manage reservations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.phone ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Your number ({user.phone}) is verified.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Phone verification is not yet available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-green-600" /> Contact WhatsApp</CardTitle>
                  <CardDescription>Add a WhatsApp number so hosts can easily contact you (optional).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <div className="flex gap-2">
                        <Input type="tel" id="whatsapp" placeholder="+1234567890" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                        <Button onClick={handleUpdateWhatsapp} disabled={!whatsapp}>Save</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">This number will be shared with the host when you book.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">📍 Address</CardTitle>
                  <CardDescription>Save your address for easier coordination.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="address">Full Address</Label>
                      <div className="flex gap-2">
                        <Input type="text" id="address" placeholder="123 Main St, Anytown" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <Button onClick={handleUpdateAddress} disabled={!address}>Save</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MFA Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Two-Factor Authentication (MFA)</CardTitle>
                  <CardDescription>Increase your account security using an authenticator app (e.g. Google Authenticator).</CardDescription>
                </CardHeader>
                <CardContent>
                  {mfaError && (
                    <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-700 dark:text-red-300 mb-4">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">MFA Service Error: {mfaError}</p>
                      <p className="text-xs mt-1">Make sure MFA is enabled in your project settings.</p>
                    </div>
                  )}
                  {factors.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-medium">MFA is enabled on your account.</p>
                      </div>
                      <Button variant="destructive" onClick={handleDisableMfa} disabled={isMfaLoading}>
                        Disable MFA
                      </Button>
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-sm text-muted-foreground text-center">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                      <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48 border rounded-lg" />
                      <div className="w-full max-w-xs space-y-2">
                        <Label htmlFor="otp">Enter the 6-digit code</Label>
                        <Input
                          id="otp"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                        />
                        <div className="flex gap-2">
                          <Button className="w-full" onClick={handleVerifyMfa} disabled={isMfaLoading || verifyCode.length < 6}>Verify & Activate</Button>
                          <Button variant="ghost" onClick={() => { setQrCodeUrl(null); setEnrollData(null); }}>Cancel</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-4">
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account by requiring a code from an authenticator app when you log in.</p>
                      <Button onClick={handleStartMfa} disabled={isMfaLoading}>
                        Enable 2FA
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="churches" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Churches you've created</CardTitle>
                  <CardDescription>
                    A list of churches you have registered on the platform will appear here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingChurches ? (
                    <p>Loading churches...</p>
                  ) : createdChurches && createdChurches.length > 0 ? (
                    <ul className="space-y-4">
                      {createdChurches.map((church) => (
                        <li key={church.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-4">
                            <Church className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">{church.name}</p>
                              <p className="text-muted-foreground">{formatSchedule(church)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", getStatusColor(church.status))} />
                              <span className="text-xs text-muted-foreground">{church.status}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Change Status
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {['Open', 'Full', 'Closed', 'Temporarily Closed', 'Suspended'].map((status) => (
                                      <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(church.id, status)}>
                                        {status}
                                        {church.status === status && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => toast({ title: 'Coming Soon', description: 'Full editing will be available soon.' })}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setChurchToDelete(church.id);
                                    setShowDeleteAlert(true);
                                  }}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">You haven't created any churches yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visits you've booked</CardTitle>
                  <CardDescription>
                    A list of the places you've booked to visit will appear here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingChurches ? ( // Use the same loading state for simplicity
                    <p>Loading reservations...</p>
                  ) : reservedChurches && reservedChurches.length > 0 ? (
                    <ul className="space-y-4">
                      {reservedChurches.map((church) => (
                        <li key={church.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-4">
                            <Church className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">{church.name}</p>
                              <p className="text-muted-foreground">{formatSchedule(church)}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            setReservationToCancel(church.id);
                            setShowCancelAlert(true);
                          }}>
                            Cancel Reservation
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">You haven't booked any visits yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the church from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChurchToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteChurch} disabled={isDeleting}>
              {isDeleting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will release your spot at this church.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservationToCancel(null)}>No, keep</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReservation}>Yes, cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
