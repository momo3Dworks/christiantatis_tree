'use client';

import { useSupabase, useUser } from '@/lib/supabase/provider';
import { useSupabaseCollection } from '@/lib/supabase/hooks/use-collection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Mail, AlertCircle, Upload, RefreshCw, Church, MoreHorizontal, Pencil, Trash2, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Filters for My Churches
  const myChurchesFilters = useMemo(() => {
    if (!user) return undefined;
    return [{ column: 'creatorId', operator: 'eq', value: user.id }] as any;
  }, [user]);

  const { data: createdChurches, isLoading: isLoadingChurches } = useSupabaseCollection('home_churches', myChurchesFilters);

  // Filters for Reserved Churches (Assuming reservations is an array column)
  const reservedChurchesFilters = useMemo(() => {
    if (!user) return undefined;
    return [{ column: 'reservations', operator: 'cs', value: `{${user.id}}` }] as any;
  }, [user]);

  const { data: reservedChurches, isLoading: isLoadingReservations } = useSupabaseCollection('home_churches', reservedChurchesFilters);

  const handleSendVerificationEmail = async () => {
    if (user && !user.email_confirmed_at) { // Supabase check
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
          description: 'Se ha comprobado el estado de verificación de tu correo.',
        });
      } catch (error) {
        console.error('Error reloading user:', error);
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

  const handleDeleteChurch = async () => {
    if (!churchToDelete) return;

    try {
      const { error } = await supabase.from('home_churches').delete().eq('id', churchToDelete);
      if (error) throw error;

      toast({
        title: 'Iglesia Eliminada',
        description: 'La iglesia ha sido eliminada correctamente.',
      });
      // The hook might rely on realtime or manual refresh. 
      // For now, assume realtime or reload page.
      window.location.reload();
    } catch (error) {
      console.error("Error deleting church: ", error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar la iglesia. Puede que no tengas los permisos necesarios.',
      });
    } finally {
      setShowDeleteAlert(false);
      setChurchToDelete(null);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationToCancel || !user) return;

    try {
      // Fetch current church to get reservations
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
        description: 'No se pudo cancelar la reserva. Inténtalo de nuevo más tarde.',
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
          <Card>
            <CardHeader>
              <CardTitle>Verificación de Correo</CardTitle>
              <CardDescription>
                Verifica tu correo electrónico para asegurar tu cuenta y acceder a todas las funcionalidades.
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
                    <Button
                      onClick={handleSendVerificationEmail}
                      variant="outline"
                      className="w-full bg-transparent sm:w-auto flex-grow"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar Verificación
                    </Button>
                    <Button
                      onClick={handleReloadUser}
                      variant="outline"
                      size="icon"
                      className="bg-transparent"
                      disabled={isReloading}
                      title="Refrescar estado de verificación"
                    >
                      <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Refrescar Estado</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Tabs defaultValue="created-churches">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="created-churches">Mis Iglesias Creadas</TabsTrigger>
              <TabsTrigger value="reserved-visits">Mis Reservas</TabsTrigger>
            </TabsList>
            <TabsContent value="created-churches" className="mt-6">
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
            </TabsContent>
            <TabsContent value="reserved-visits" className="mt-6">
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