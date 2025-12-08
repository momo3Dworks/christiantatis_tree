'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useSupabaseCollection } from '@/lib/supabase/hooks/use-collection';
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

export default function ProfilePage() {
  const { user, isLoading: isUserLoading, supabase } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const [isReloading, setIsReloading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [churchToDelete, setChurchToDelete] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  const { t, locale } = useTranslation();
  const dateLocales: { [key: string]: any } = { es, fr, pt };

  // Phone Verification State
  const [phone, setPhone] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');

  const handleUpdateWhatsapp = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { whatsapp: whatsapp }
      });
      if (error) throw error;
      toast({ title: 'WhatsApp Guardado', description: 'Tu número de WhatsApp se ha guardado correctamente.' });
      handleReloadUser();
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateAddress = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { address: address }
      });
      if (error) throw error;
      toast({ title: 'Dirección Guardada', description: 'Tu dirección se ha guardado correctamente.' });
      handleReloadUser();
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // MFA State
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMfaFactors();
      if (user.phone) {
        setPhone(user.phone);
      }
      if (user.user_metadata?.whatsapp) {
        setWhatsapp(user.user_metadata.whatsapp);
      }
      if (user.user_metadata?.address) {
        setAddress(user.user_metadata.address);
      }
    }
  }, [user]);

  const fetchMfaFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (data) {
      setMfaFactors(data.all);
    }
  };

  // Filters for My Churches
  const myChurchesFilters = useMemo(() => {
    if (!user) return undefined;
    return [{ column: 'creatorId', operator: 'eq', value: user.id }] as any;
  }, [user]);

  const { data: createdChurches, isLoading: isLoadingChurches } = useSupabaseCollection('home_churches', myChurchesFilters);

  // Filters for Reserved Churches
  const reservedChurchesFilters = useMemo(() => {
    if (!user) return undefined;
    // Assuming 'reservations' is an array of UUIDs
    return [{ column: 'reservations', operator: 'cs', value: `{${user.id}}` }] as any;
  }, [user]);

  const { data: reservedChurches, isLoading: isLoadingReservations } = useSupabaseCollection('home_churches', reservedChurchesFilters);

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
          description: 'No se pudo enviar el correo de verificación. Inténtalo de nuevo más tarde.',
        });
      } else {
        toast({
          title: 'Correo de Verificación Enviado',
          description: 'Revisa tu bandeja de entrada para verificar tu cuenta.',
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
          title: 'Estado Actualizado',
          description: 'Se ha comprobado el estado del usuario.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo recargar el estado del usuario.',
        });
      } finally {
        setIsReloading(false);
      }
    }
  };

  // Phone Logic
  const handleUpdatePhone = async () => {
    if (!phone) return;
    try {
      const { error } = await supabase.auth.updateUser({ phone: phone });
      if (error) throw error;
      setIsVerifyingPhone(true);
      toast({ title: 'Código enviado', description: 'Revisa tu teléfono para el código de verificación.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleVerifyPhone = async () => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: verifyOtp,
        type: 'sms',
      });
      if (error) throw error;

      setIsVerifyingPhone(false);
      setVerifyOtp('');
      toast({ title: 'Teléfono Verificado', description: 'Tu número ha sido guardado y verificado.' });
      handleReloadUser();
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  // MFA Logic
  const handleEnrollMfa = async () => {
    setIsEnrollingMfa(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setIsEnrollingMfa(false);
      return;
    }

    setMfaSecret(data.id);
    QRCode.toDataURL(data.totp.qr_code, (err, url) => {
      if (err) {
        console.error(err);
        return;
      }
      setMfaQr(url);
    });
  };

  const handleVerifyMfa = async () => {
    if (!mfaSecret) return;

    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaSecret,
      code: mfaCode,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'MFA Activado', description: 'Autenticación de dos pasos activada exitosamente.' });
      setIsEnrollingMfa(false);
      setMfaQr(null);
      setMfaCode('');
      fetchMfaFactors();
    }
  };

  const handleUnenrollMfa = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'MFA Desactivado', description: 'Autenticación de dos pasos eliminada.' });
      fetchMfaFactors();
    }
  }

  const handleDeleteChurch = async () => {
    if (!churchToDelete) return;

    try {
      const { error } = await supabase.from('home_churches').delete().eq('id', churchToDelete);
      if (error) throw error;

      toast({
        title: 'Iglesia Eliminada',
        description: 'La iglesia ha sido eliminada correctamente.',
      });
      window.location.reload();
    } catch (error) {
      console.error("Error deleting church: ", error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar la iglesia.',
      });
    } finally {
      setShowDeleteAlert(false);
      setChurchToDelete(null);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationToCancel || !user) return;
    try {
      const { data: church, error: fetchError } = await supabase
        .from('home_churches')
        .select('reservations')
        .eq('id', reservationToCancel)
        .single();

      if (fetchError || !church) throw fetchError || new Error("Church not found");

      const updatedReservations = (church.reservations as string[] || []).filter(id => id !== user.id);

      const { error: updateError } = await supabase
        .from('home_churches')
        .update({ reservations: updatedReservations })
        .eq('id', reservationToCancel);

      if (updateError) throw updateError;

      toast({
        title: 'Reserva Cancelada',
        description: 'Tu reserva ha sido cancelada exitosamente.',
      });
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling reservation: ", error);
      toast({
        variant: 'destructive',
        title: 'Error al Cancelar',
        description: 'No se pudo cancelar la reserva.',
      });
    } finally {
      setShowCancelAlert(false);
      setReservationToCancel(null);
    }
  };

  const formatSchedule = (church: any) => {
    if (!church.meetingDate || !church.meetingTime) {
      return church.meetingSchedule;
    }
    const date = new Date(church.meetingDate);
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

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
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
              <h1 className="text-4xl font-bold">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </header>

        <main className="space-y-12">

          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Perfil y Seguridad</TabsTrigger>
              <TabsTrigger value="churches">Mis Iglesias y Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8 mt-6">
              {/* ID Verification Section (Email) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Verificación de Correo</CardTitle>
                  <CardDescription>
                    Estado de verificación de tu correo electrónico.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.email_confirmed_at ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Tu correo electrónico ha sido verificado.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-orange-700 dark:text-orange-300 sm:flex-row sm:items-center">
                      <div className="flex flex-grow items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">Tu correo electrónico no está verificado.</p>
                      </div>
                      <div className="flex w-full sm:w-auto sm:items-center gap-2">
                        <Button onClick={handleSendVerificationEmail} variant="outline" className="w-full bg-transparent sm:w-auto flex-grow">
                          Reenviar Verificación
                        </Button>
                        <Button onClick={handleReloadUser} variant="outline" size="icon" className="bg-transparent" disabled={isReloading} title="Refrescar estado" >
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
                  <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Verificación Telefónica</CardTitle>
                  <CardDescription>Agrega un número de teléfono para asegurar tu cuenta y gestionar reservas.</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.phone_confirmed_at ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Tu número ({user.phone}) está verificado.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="phone">Número de Teléfono (con código de país, ej: +1...)</Label>
                        <div className="flex gap-2">
                          <Input type="tel" id="phone" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isVerifyingPhone} />
                          <Button onClick={handleUpdatePhone} disabled={isVerifyingPhone || !phone}>Enviar Código</Button>
                        </div>
                      </div>
                      {isVerifyingPhone && (
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="otp">Código de Verificación (SMS)</Label>
                          <div className="flex gap-2">
                            <Input type="text" id="otp" placeholder="123456" value={verifyOtp} onChange={(e) => setVerifyOtp(e.target.value)} />
                            <Button onClick={handleVerifyPhone} disabled={!verifyOtp}>Verificar</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-green-600" /> WhatsApp de Contacto</CardTitle>
                  <CardDescription>Agrega un número de WhatsApp para que el anfitrión pueda contactarte fácilmente (opcional).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="whatsapp">Número de WhatsApp</Label>
                      <div className="flex gap-2">
                        <Input type="tel" id="whatsapp" placeholder="+1234567890" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                        <Button onClick={handleUpdateWhatsapp} disabled={!whatsapp || whatsapp === user.user_metadata?.whatsapp}>Guardar</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Este número se compartirá con el anfitrión cuando reserves.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">📍 Dirección</CardTitle>
                  <CardDescription>Guarda tu dirección para facilitar la coordinación.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="address">Dirección Completa</Label>
                      <div className="flex gap-2">
                        <Input type="text" id="address" placeholder="Calle Ejemplo 123, Ciudad" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <Button onClick={handleUpdateAddress} disabled={!address || address === user.user_metadata?.address}>Guardar</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MFA Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Autenticación de Dos Pasos (MFA)</CardTitle>
                  <CardDescription>Aumenta la seguridad de tu cuenta usando una aplicación autenticadora (ej: Google Authenticator).</CardDescription>
                </CardHeader>
                <CardContent>
                  {mfaFactors.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-medium">MFA está activado en tu cuenta.</p>
                      </div>
                      {mfaFactors.map(factor => (
                        <div key={factor.id} className="flex justify-between items-center p-2 border rounded">
                          <span>{factor.friendly_name || 'Authenticator App'} ({factor.factor_type})</span>
                          <Button variant="destructive" size="sm" onClick={() => handleUnenrollMfa(factor.id)}>Desactivar</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!isEnrollingMfa ? (
                        <Button onClick={handleEnrollMfa}><QrCode className="mr-2 h-4 w-4" /> Configurar App Autenticadora</Button>
                      ) : (
                        <div className="space-y-4 border p-4 rounded-lg">
                          <h3 className="font-semibold">Escanea el código QR</h3>
                          <p className="text-sm text-muted-foreground">Usa tu aplicación de autenticación para escanear este código.</p>
                          {mfaQr && (
                            <div className="flex justify-center bg-white p-4 rounded w-fit mx-auto">
                              <img src={mfaQr} alt="QR Code for MFA" />
                            </div>
                          )}
                          <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
                            <Label htmlFor="mfa-code">Introduce el código de la app</Label>
                            <div className="flex gap-2">
                              <Input type="text" id="mfa-code" placeholder="123456" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
                              <Button onClick={handleVerifyMfa}>Activar</Button>
                            </div>
                          </div>
                          <Button variant="ghost" onClick={() => setIsEnrollingMfa(false)} className="w-full">Cancelar</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="churches" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Iglesias que has creado</CardTitle>
                  <CardDescription>
                    Aquí aparecerá una lista de las iglesias que has registrado en la plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingChurches ? (
                    <p>Cargando iglesias...</p>
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
                            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", {
                              "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300": church.status === 'Open',
                              "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300": church.status !== 'Open',
                            })}>
                              {church.status}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Más opciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({ title: 'Próximamente', description: 'La edición estará disponible pronto.' })}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setChurchToDelete(church.id);
                                    setShowDeleteAlert(true);
                                  }}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No has creado ninguna iglesia todavía.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visitas que has reservado</CardTitle>
                  <CardDescription>
                    Aquí aparecerá una lista de los lugares que has reservado para visitar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  {isLoadingReservations ? (
                    <p>Cargando reservas...</p>
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
                            Cancelar Reserva
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Aún no has reservado ninguna visita.</p>
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
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la iglesia de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChurchToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChurch}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar Reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Liberarás tu lugar en esta iglesia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservationToCancel(null)}>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReservation}>Sí, cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}