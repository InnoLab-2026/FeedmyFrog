'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  CITY_COORDS,
  DEFAULT_RADIUS_KM,
  RADII,
  findNearestTown,
} from '@/lib/geo';

export interface LocationFilter {
  /**
   * The place itself, never a translated label — a stored label would keep
   * saying "Near Reutlingen" in English after the reader switches language.
   * The label is built at render time from this plus `approximate`.
   */
  city: string;
  /** True when the place was derived from a GPS fix rather than picked. */
  approximate?: boolean;
  lat: number;
  lng: number;
  radius: number;
}

/*
 * Town-level is all this feature needs, so ask the browser for the cheap,
 * coarse network fix rather than switching on the GPS chip, and accept a
 * recent cached one. The timeout matters: without it the success callback can
 * simply never arrive and the spinner turns forever.
 */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30 * 60 * 1000,
  timeout: 10_000,
};


interface LocationSearchProps {
  value: LocationFilter | null;
  onChange: (value: LocationFilter | null) => void;
}

export default function LocationSearch({
  value,
  onChange,
}: LocationSearchProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [pendingRadius, setPendingRadius] = useState(value?.radius ?? DEFAULT_RADIUS_KM);

  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleInput = (text: string) => {
    setInput(text);
    setGpsError('');

    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    const q = text.toLowerCase();
    const matches = Object.keys(CITY_COORDS).filter((city) =>
      city.toLowerCase().includes(q),
    );
    setSuggestions(matches);
  };

  const selectCity = (city: string) => {
    const coords = CITY_COORDS[city];
    onChange({
      city,
      lat: coords.lat,
      lng: coords.lng,
      radius: value?.radius ?? pendingRadius,
    });
    setInput('');
    setSuggestions([]);
    setOpen(false);
  };

  const useGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(t('gps_unavailable'));
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);

        /*
         * The reader's own coordinates exist only inside this callback. They
         * answer one question — which town? — and are then dropped; what gets
         * stored is that town's coordinates, so nothing downstream can see a
         * position more precise than a town centre.
         */
        const nearest = findNearestTown(
          position.coords.latitude,
          position.coords.longitude,
        );

        if (!nearest) {
          setGpsError(t('gps_out_of_area'));
          return;
        }

        const town = CITY_COORDS[nearest.town];

        onChange({
          city: nearest.town,
          approximate: true,
          lat: town.lat,
          lng: town.lng,
          radius: value?.radius ?? pendingRadius,
        });
        setOpen(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError(t('gps_error'));
      },
      GEOLOCATION_OPTIONS,
    );
  };

  const setRadius = (radius: number) => {
    setPendingRadius(radius);
    if (!value) return;
    onChange({
      ...value,
      radius,
    });
  };

  const clear = () => {
    onChange(null);
    setInput('');
    setSuggestions([]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center text-left"
        style={{
          height: '44px',
          paddingLeft: '16px',
          paddingRight: '14px',
          gap: '10px',
          background: 'white',
          color: value ? '#444' : '#555',
          border: `1px solid ${open ? '#8DC63F' : 'rgba(47,47,47,0.15)'}`,
          borderRadius: '10px',
          boxShadow: open ? '0 0 0 3px rgba(141,198,63,0.10)' : 'none',
          fontSize: 'var(--fs-control-input)',
          cursor: 'pointer',
        }}
      >
        <MapPin
          style={{
            width: '17px',
            height: '17px',
            color: value ? '#8DC63F' : '#666',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value
            ? value.approximate
              ? t('gps_near_city', { city: value.city })
              : value.city
            : t('location_label')}
        </span>
        {value && (
          <>
            <span
              style={{
                color: '#8DC63F',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {value.radius} km
            </span>
            <span
              role="button"
              onClick={(event) => {
                event.stopPropagation();
                clear();
              }}
              style={{ display: 'flex', color: '#aaa' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: '14px',
            background: 'white',
            border: '1px solid rgba(47,47,47,0.13)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 200,
          }}
        >
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <MapPin
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: '#aaa',
              }}
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => handleInput(event.target.value)}
              placeholder={t('location_enter')}
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '40px',
                paddingRight: '36px',
                background: 'white',
                border: '1px solid rgba(47,47,47,0.2)',
                borderRadius: '8px',
                fontSize: 'var(--fs-md)',
                outline: 'none',
              }}
            />
            {input && (
              <X
                onClick={() => {
                  setInput('');
                  setSuggestions([]);
                }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#aaa',
                  cursor: 'pointer',
                }}
              />
            )}
          </div>

          {suggestions.length > 0 && (
            <div
              style={{
                marginBottom: '10px',
                border: '1px solid rgba(47,47,47,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {suggestions.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => selectCity(city)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'white',
                    border: 'none',
                    fontSize: 'var(--fs-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <MapPin
                    style={{
                      width: '16px',
                      height: '16px',
                      color: '#8DC63F',
                    }}
                  />
                  {city}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={useGPS}
            disabled={gpsLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(141,198,63,0.07)',
              border: '1px solid rgba(141,198,63,0.25)',
              borderRadius: '8px',
              color: '#1a3200',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              cursor: gpsLoading ? 'default' : 'pointer',
            }}
          >
            <Navigation
              style={{
                width: '18px',
                height: '18px',
                color: '#8DC63F',
              }}
            />
            {gpsLoading ? t('gps_loading') : t('gps_use')}
          </button>

          {gpsError && (
            <p
              style={{
                marginTop: '8px',
                color: '#dc2626',
                fontSize: 'var(--fs-2xs)',
              }}
            >
              {gpsError}
            </p>
          )}

          <div style={{ marginTop: '14px' }}>
            <p
              style={{
                marginBottom: '7px',
                color: '#777',
                fontSize: 'var(--fs-2xs)',
                fontWeight: 500,
              }}
            >
              {t('radius')}
            </p>
            <div style={{ display: 'flex', gap: '7px' }}>
              {RADII.map((radius) => {
                const active = (value?.radius ?? pendingRadius) === radius;
                return (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setRadius(radius)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      background: active ? '#8DC63F' : 'white',
                      color: active ? '#1a3200' : '#2F2F2F',
                      border: `1px solid ${
                        active ? '#8DC63F' : 'rgba(47,47,47,0.2)'
                      }`,
                      borderRadius: '7px',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {radius} km
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
