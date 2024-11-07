import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { RegionWithEvents } from "../lib/meetup-scraper"
import { useTranslation } from "react-i18next"
import Image from "next/image"

interface RegionsMapProps {
  regions: RegionWithEvents[]
}

const RegionsMap = ({ regions }: RegionsMapProps) => {
  const { t } = useTranslation("common", { keyPrefix: "region" })

  const customIcon = new L.Icon({
    iconUrl: "/map/icons/javabin-pin.png",
    iconSize: [45, 90],
    iconAnchor: [21, 52],
    popupAnchor: [0, -24],
  })

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
      }}
    >
      <MapContainer
        center={[65.5, 14.5]}
        zoom={4.5}
        zoomSnap={0.5}
        zoomControl={false}
        style={{
          width: "100%",
          height: "100%",
        }}
        minZoom={4.5}
        maxZoom={13}
      >
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {regions.map((region) => (
          <Marker
            key={region.name}
            position={[region.location.lat, region.location.lng]}
            icon={customIcon}
          >
            <Popup className="meetup-popup">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">javaBin {region.name}</h3>

                {region.organizer && (
                  <div className="mt-2">
                    <h4 className="mb-2 text-sm font-semibold">
                      {t("organizer")}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <div
                        key={region.organizer.id}
                        className="flex items-center gap-2"
                      >
                        <Image
                          src={region.organizer.photoUrl}
                          alt={region.organizer.name}
                          width={34}
                          height={34}
                          className="rounded-full border border-solid border-red-400 object-cover"
                        />
                        <a
                          href={region.organizer.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:underline"
                        >
                          {region.organizer.name}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {region.events && region.events.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t("nextMeetup")}:
                    </h4>
                    <div className="text-sm">
                      <a
                        href={region.events[0]?.eventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {region.events[0]?.name}
                      </a>
                      <div className="text-gray-600">
                        {region.events[0]?.dateTimeFormatted}
                        {region.events[0]?.venue && (
                          <div>📍 {region.events[0].venue}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {t("noUpcomingEvents")}
                  </p>
                )}

                {region.memberCount && (
                  <div className="text-sm">
                    👥 {t("memberCount", { count: region.memberCount })}
                  </div>
                )}

                <a
                  href={region?.meetupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  View on Meetup
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default RegionsMap
