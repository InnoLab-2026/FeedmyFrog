'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface LocationFilter {
  city: string;
  lat: number;
  lng: number;
  radius: number;
}

export const CITY_COORDS: Record<
  string,
  { lat: number; lng: number }
> = {
  Reutlingen: { lat: 48.4914, lng: 9.2042 },
  Stuttgart: { lat: 48.7758, lng: 9.1829 },
  Tübingen: { lat: 48.5216, lng: 9.0576 },
  Esslingen: { lat: 48.7394, lng: 9.3068 },
  Ludwigsburg: { lat: 48.8975, lng: 9.1916 },
  Waiblingen: { lat: 48.8302, lng: 9.3189 },
  Böblingen: { lat: 48.6831, lng: 9.0107 },
  Sindelfingen: { lat: 48.7155, lng: 9.0018 },
  Göppingen: { lat: 48.703, lng: 9.6531 },
  Fellbach: { lat: 48.8132, lng: 9.2755 },
};

const RADII = [3, 5, 10, 20];

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

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

  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const handleInput = (text: string) => {
    setInput(text);
    setGpsError('');

    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    const matches = Object.keys(CITY_COORDS).filter((city) =>
      city.toLowerCase().startsWith(text.toLowerCase()),
    );

    setSuggestions(matches);
  };

  const selectCity = (city: string) => {
    const coords = CITY_COORDS[city];

    onChange({
      city,
      lat: coords.lat,
      lng: coords.lng,
      radius: value?.radius ?? 10,
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

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let nearestCity = 'Reutlingen';
        let nearestDistance = Infinity;

        for (const [city, coords] of Object.entries(
          CITY_COORDS,
        )) {
          const distance = haversineKm(
            lat,
            lng,
            coords.lat,
            coords.lng,
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCity = city;
          }
        }

        onChange({
          city: `${t('location_label')} (≈ ${nearestCity})`,
          lat,
          lng,
          radius: value?.radius ?? 10,
        });

        setOpen(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError(t('gps_error'));
      },
    );
  };

  const setRadius = (radius: number) => {
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
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center text-left"
        style={{
          height: '72px',
          paddingLeft: '24px',
          paddingRight: '18px',
          gap: '14px',

          background: 'white',
          color: value ? '#444' : '#555',

          border: `1px solid ${
            open
              ? '#8DC63F'
              : 'rgba(47,47,47,0.15)'
          }`,

          borderRadius: '10px',

          boxShadow: open
            ? '0 0 0 3px rgba(141,198,63,0.10)'
            : 'none',

          fontSize: 'var(--fs-control-input)',
          cursor: 'pointer',
        }}
      >
        <MapPin
          style={{
            width: '24px',
            height: '24px',
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
          {value ? value.city : t('location_label')}
        </span>

        {value && (
          <>
            <span
              style={{
                color: '#8DC63F',
                fontSize: '13px',
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
              style={{
                display: 'flex',
                color: '#aaa',
              }}
            >
              <X
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
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

            border:
              '1px solid rgba(47,47,47,0.13)',

            borderRadius: '12px',

            boxShadow:
              '0 8px 24px rgba(0,0,0,0.12)',

            zIndex: 200,
          }}
        >
          <div
            style={{
              position: 'relative',
              marginBottom: '10px',
            }}
          >
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
              onChange={(event) =>
                handleInput(event.target.value)
              }
              placeholder={t('location_enter')}
              style={{
                width: '100%',
                height: '48px',

                paddingLeft: '40px',
                paddingRight: '36px',

                background: 'white',

                border:
                  '1px solid rgba(47,47,47,0.2)',

                borderRadius: '8px',

                fontSize: '15px',
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

                border:
                  '1px solid rgba(47,47,47,0.1)',

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

                    fontSize: '14px',
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

              border:
                '1px solid rgba(141,198,63,0.25)',

              borderRadius: '8px',

              color: '#1a3200',

              fontSize: '14px',
              fontWeight: 600,

              cursor: gpsLoading
                ? 'default'
                : 'pointer',
            }}
          >
            <Navigation
              style={{
                width: '18px',
                height: '18px',
                color: '#8DC63F',
              }}
            />

            {gpsLoading
              ? t('gps_loading')
              : t('gps_use')}
          </button>

          {gpsError && (
            <p
              style={{
                marginTop: '8px',
                color: '#dc2626',
                fontSize: '12px',
              }}
            >
              {gpsError}
            </p>
          )}

          {value && (
            <div
              style={{
                marginTop: '14px',
              }}
            >
              <p
                style={{
                  marginBottom: '7px',
                  color: '#777',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {t('radius')}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '7px',
                }}
              >
                {RADII.map((radius) => {
                  const active =
                    value.radius === radius;

                  return (
                    <button
                      key={radius}
                      type="button"
                      onClick={() =>
                        setRadius(radius)
                      }
                      style={{
                        flex: 1,

                        padding: '8px 0',

                        background: active
                          ? '#8DC63F'
                          : 'white',

                        color: active
                          ? '#1a3200'
                          : '#2F2F2F',

                        border: `1px solid ${
                          active
                            ? '#8DC63F'
                            : 'rgba(47,47,47,0.2)'
                        }`,

                        borderRadius: '7px',

                        fontSize: '13px',
                        fontWeight: active
                          ? 700
                          : 500,

                        cursor: 'pointer',
                      }}
                    >
                      {radius} km
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}