"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { useAcademy } from "@/components/academy-provider";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";
import type { GeocodedLocation } from "@/lib/maps/geocoding-types";

const STORE_ICON = divIcon({
  className: "store-directory-marker",
  html: '<span class="store-directory-marker__dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

function FitStores({ stores }: { stores: StoreDirectoryEntry[] }) {
  const map = useMap();
  const positions = useMemo(
    () => stores.flatMap((store) => store.latitude === null || store.longitude === null
      ? []
      : [[store.latitude, store.longitude] as [number, number]]),
    [stores],
  );

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0] as LatLngExpression, 13, { animate: false });
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [32, 32], maxZoom: 13, animate: false });
    }
  }, [map, positions]);

  return null;
}

function FocusSearchLocation({ location }: { location: GeocodedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (location.boundingBox) {
      const [south, north, west, east] = location.boundingBox;
      map.fitBounds([[south, west], [north, east]], { padding: [40, 40], maxZoom: 16, animate: true });
      return;
    }
    map.setView([location.latitude, location.longitude], 16, { animate: true });
  }, [location, map]);

  return null;
}

function countryName(code: string, locale: string) {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

export default function StoreMapCanvas({
  stores,
  showEmployees = true,
  fitStores = true,
  searchLocation = null,
}: {
  stores: StoreDirectoryEntry[];
  showEmployees?: boolean;
  fitStores?: boolean;
  searchLocation?: GeocodedLocation | null;
}) {
  const { language, t } = useAcademy();
  const locale = { pl: "pl-PL", en: "en-US", de: "de-DE", cs: "cs-CZ", fr: "fr-FR", it: "it-IT" }[language];
  const center: LatLngExpression = [50, 15];

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[420px] w-full bg-background-secondary-default sm:h-[520px]"
      aria-label="Mapa sklepów Xzone"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {fitStores ? <FitStores stores={stores} /> : null}
      {searchLocation ? <FocusSearchLocation location={searchLocation} /> : null}
      {stores.map((store) => {
        if (store.latitude === null || store.longitude === null) return null;
        return (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={STORE_ICON}
            title={store.name}
            alt={store.name}
            keyboard
          >
            <Popup>
              <div className="flex min-w-48 max-w-64 flex-col gap-2">
                <div>
                  <h3 className="text-body-medium text-text-primary">{store.name}</h3>
                  <p className="text-body-2-regular text-text-secondary">{store.city} · {countryName(store.countryCode, locale)}</p>
                </div>
                <p className="text-body-2-regular text-text-secondary">{store.streetAddress}, {store.postalCode} {store.city}</p>
                {showEmployees ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-caption-1-semibold text-text-primary">{t("popupEmployees")}</p>
                    {store.employeeNames.length ? (
                      <ul className="flex flex-col gap-1">
                        {store.employeeNames.map((employeeName, index) => (
                          <li key={`${employeeName}-${index}`} className="text-body-2-regular text-text-secondary">{employeeName}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-body-2-regular text-text-secondary">{t("noAssignedEmployees")}</p>
                    )}
                  </div>
                ) : null}
                {!store.isActive ? <p className="text-caption-1-semibold text-text-tertiary">{t("inactiveStore")}</p> : null}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {searchLocation ? (
        <Marker
          position={[searchLocation.latitude, searchLocation.longitude]}
          icon={STORE_ICON}
          title={searchLocation.displayName}
          alt={searchLocation.displayName}
          keyboard
        >
          <Popup>
            <p className="text-body-2-regular text-text-primary">{searchLocation.displayName}</p>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
