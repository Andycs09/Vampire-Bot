'use client';

import { useState, useCallback, useEffect } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Square, Trash2 } from 'lucide-react';

interface Coordinate {
  lat: number;
  lng: number;
}

interface GoogleMapPickerProps {
  onCoordinatesChange: (coordinates: Coordinate[]) => void;
}

export default function GoogleMapPicker({ onCoordinatesChange }: GoogleMapPickerProps) {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapCenter] = useState<Coordinate>({ lat: 20.5937, lng: 78.9629 }); // Center of India

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={isDrawing ? "destructive" : "default"}
          onClick={() => {
            if (isDrawing && coordinates.length >= 3) {
              setIsDrawing(false);
            } else if (!isDrawing) {
              setIsDrawing(true);
            }
          }}
          className="flex items-center space-x-2"
        >
          <Square className="w-4 h-4" />
          <span>
            {isDrawing 
              ? (coordinates.length >= 3 ? 'Finish Drawing' : `Drawing... (${coordinates.length} points)`)
              : 'Draw Land Boundary'
            }
          </span>
        </Button>
        
        {coordinates.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCoordinates([]);
              setIsDrawing(false);
              onCoordinatesChange([]);
            }}
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      <div className="relative w-full h-96 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY || ''}>
          <MapWithClickHandler
            mapCenter={mapCenter}
            isDrawing={isDrawing}
            coordinates={coordinates}
            onAddPoint={(point) => {
              const newCoordinates = [...coordinates, point];
              setCoordinates(newCoordinates);
              onCoordinatesChange(newCoordinates);
            }}
          />
        </APIProvider>
      </div>

      {coordinates.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-md">
          <h4 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
            <Square className="w-5 h-5 mr-2" />
            Land Boundary Details
          </h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <span className="text-blue-700 text-sm">Points Marked</span>
              <div className="font-bold text-blue-900 text-2xl">{coordinates.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <span className="text-blue-700 text-sm">Estimated Area</span>
              <div className="font-bold text-blue-900 text-2xl">{calculateArea(coordinates)} acres</div>
            </div>
          </div>
          
          <details className="mt-3">
            <summary className="text-sm text-blue-700 cursor-pointer hover:text-blue-900 font-medium">
              📍 View GPS Coordinates
            </summary>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {coordinates.map((point, index) => (
                <div key={index} className="flex justify-between font-mono bg-white px-3 py-2 rounded-lg text-sm">
                  <span className="font-bold text-blue-900">Point {index + 1}</span>
                  <span className="text-blue-700">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {!isDrawing && coordinates.length === 0 && (
        <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-700 font-medium mb-1">
            Ready to map your land?
          </p>
          <p className="text-gray-600 text-sm">
            Click "Draw Land Boundary" above to start marking your agricultural land on the map
          </p>
        </div>
      )}
    </div>
  );
}

// Separate component that uses useMap hook
function MapWithClickHandler({ 
  mapCenter, 
  isDrawing, 
  coordinates,
  onAddPoint 
}: { 
  mapCenter: Coordinate;
  isDrawing: boolean;
  coordinates: Coordinate[];
  onAddPoint: (point: Coordinate) => void;
}) {
  const map = useMap();
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Add click listener
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) {
        return;
      }

      const newPoint: Coordinate = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };

      onAddPoint(newPoint);
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, isDrawing, onAddPoint]);

  // Draw polygon and markers
  useEffect(() => {
    if (!map || coordinates.length === 0) {
      // Clear everything if no coordinates
      if (polygon) {
        polygon.setMap(null);
        setPolygon(null);
      }
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
      return;
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Clear existing polygon
    if (polygon) {
      polygon.setMap(null);
    }

    // Create new markers
    const newMarkers = coordinates.map((coord, index) => {
      const marker = new google.maps.Marker({
        position: coord,
        map: map,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        draggable: false,
        zIndex: 1000,
      });
      return marker;
    });

    setMarkers(newMarkers);

    // Create polygon if we have at least 2 points
    if (coordinates.length >= 2) {
      const newPolygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#ef4444',
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        geodesic: true,
        clickable: false,
        zIndex: 100,
      });
      
      newPolygon.setMap(map);
      setPolygon(newPolygon);

      // Auto-zoom to fit polygon (only if more than 2 points)
      if (coordinates.length > 2) {
        const bounds = new google.maps.LatLngBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds);
        
        // Add some padding
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 2) {
            map.setZoom(currentZoom - 1);
          }
        }, 100);
      }
    }
  }, [map, coordinates]); // Only depend on map and coordinates!

  return (
    <Map
      defaultCenter={mapCenter}
      defaultZoom={5}
      gestureHandling="greedy"
      mapId="fasal-munafa-map"
      className="w-full h-full"
      clickableIcons={false}
      disableDefaultUI={false}
      zoomControl={true}
      mapTypeControl={true}
      scaleControl={true}
      streetViewControl={false}
      rotateControl={false}
      fullscreenControl={true}
    />
  );
}

// Helper function
function calculateArea(coordinates: Coordinate[]) {
  if (coordinates.length < 3) return 0;
  
  // Use Google Maps Geometry library for accurate calculation
  if (typeof google !== 'undefined' && google.maps.geometry) {
    const path = coordinates.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(path);
    const acres = areaInSquareMeters * 0.000247105; // Convert to acres
    return acres.toFixed(2);
  }
  
  // Fallback calculation
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  area = Math.abs(area / 2);
  
  const acres = area * 1977000;
  return acres.toFixed(2);
}