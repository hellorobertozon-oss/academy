"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { useAcademy } from "@/components/academy-provider";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";

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

function countryName(code: string, locale: string) {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

export default function StoreMapCanvas({ stores }: { stores: StoreDirectoryEntry[] }) {
  const { language, t } = useAcademy();
  const locale = language === "pl" ? "pl-PL" : "en-US";
  const center: LatLngExpression = [52.1, 19.4];

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={false}
      className="h-[420px] w-full bg-background-secondary-default sm:h-[520px]"
      aria-label="Mapa sklepów Xzone"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FitStores stores={stores} />
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
                {!store.isActive ? <p className="text-caption-1-semibold text-text-tertiary">{t("inactiveStore")}</p> : null}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
