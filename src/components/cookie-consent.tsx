
"use client";

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';
import { GeolocationContext } from '@/context/GeolocationContext';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const { t } = useTranslation();
  const geolocation = useContext(GeolocationContext);

  useEffect(() => {
    const consent = Cookies.get('cookie_consent');
    if (!consent) {
      setShowConsent(true);
    } else {
        handleGeolocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGeolocation = () => {
    if (navigator.geolocation && geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          geolocation.setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          geolocation.setError(error.message);
        }
      );
    }
  };

  const acceptConsent = () => {
    setShowConsent(false);
    Cookies.set('cookie_consent', 'true', { expires: 365 });
    handleGeolocation();
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500",
        showConsent ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-lg animated-gradient backdrop-blur-[5px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground">
            {t('cookies.message')}
          </p>
          <Button onClick={acceptConsent} className="flex-shrink-0">
            {t('cookies.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
