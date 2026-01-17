"use client";

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';
import { GeolocationContext } from '@/context/GeolocationContext';
import { MapPin, ShieldCheck, Info, X as CloseIcon } from 'lucide-react';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | 'loading'>('loading');
  const { t } = useTranslation();
  const geolocation = useContext(GeolocationContext);

  useEffect(() => {
    const checkPermissionStatus = async () => {
      const consent = Cookies.get('cookie_consent');

      if (!consent) {
        setShowConsent(true);
      }

      if (typeof navigator !== 'undefined' && "permissions" in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          const updateState = () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              if (consent) setShowConsent(false);
              handleGeolocation(true);
            } else if (!consent) {
              setShowConsent(true);
            }
          };
          updateState();
          result.onchange = updateState;
        } catch (error) {
          setPermissionState('prompt');
        }
      } else {
        setPermissionState('prompt');
      }
    };

    checkPermissionStatus();
  }, []);

  const handleGeolocation = (silent = false) => {
    if (!silent) setIsProcessing(true);

    if (navigator.geolocation && geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          geolocation.setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setShowConsent(false);
          setIsProcessing(false);
          geolocation.setError(null);
        },
        (error) => {
          console.error(`Error location: ${error.message}`);
          geolocation.setError(error.message);
          if (error.code === 1) setPermissionState('denied');
          if (!silent) setIsProcessing(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      if (!silent) setIsProcessing(false);
    }
  };

  const acceptConsent = () => {
    setIsProcessing(true);
    Cookies.set('cookie_consent', 'true', { expires: 365 });
    handleGeolocation();
  };

  const closeConsent = () => {
    setShowConsent(false);
    // If they close it, we save consent for 3 days so it doesn't bother them immediately
    Cookies.set('cookie_consent', 'true', { expires: 3 });
  };

  if (!showConsent) return null;

  const isBlocked = permissionState === 'denied';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative max-w-lg w-full overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95 duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground"
          onClick={closeConsent}
        >
          <CloseIcon className="h-5 w-5" />
        </Button>

        {/* Decoration */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/20 blur-[80px]" />

        <div className="relative p-8 flex flex-col items-center text-center">
          <div className="mb-6 flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", isBlocked ? "text-destructive bg-destructive/10" : "text-blue-500 bg-blue-500/10")}>
              <MapPin className="h-6 w-6" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 tracking-tight text-foreground">
            {isBlocked ? t('cookies.blockedTitle') : t('cookies.title')}
          </h2>

          <p className="text-muted-foreground leading-relaxed mb-8">
            {isBlocked ? t('cookies.blockedMessage') : t('cookies.message')}
          </p>

          <div className="flex flex-col w-full gap-3">
            {!isBlocked ? (
              <Button
                onClick={acceptConsent}
                disabled={isProcessing}
                className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all border-0 shadow-lg"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t('cookies.accept')}...
                  </span>
                ) : (
                  t('cookies.accept')
                )}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 border-0"
                >
                  {t('scene.return')} & Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={closeConsent}
                  className="w-full h-10 text-sm border-white/10 hover:bg-white/5"
                >
                  {t('contentPreview.registerChurch.cancel')} & Continue
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
              <Info className="h-3 w-3" />
              <span>{t('contentPreview.registerChurch.locationFeaturePlaceholder')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
