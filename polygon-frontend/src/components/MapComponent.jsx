import React from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import wellknown from 'wellknown';
import 'leaflet/dist/leaflet.css';

/**
 * Вычисляет центр полигона по его координатам.
 * Принимает массив координат в формате [[lng, lat], ...]
 * и возвращает центр в формате [lat, lng].
 */
function getPolygonCenter(coordinates) {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coordinates.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    });
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    return [centerLat, centerLng]; // Leaflet ожидает формат [lat, lng]
}

/**
 * Компонент для установки центра карты.
 */
function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

/**
 * Функция для парсинга геометрии.
 * Если geometry – строка в формате WKT (с префиксом SRID), удаляет префикс
 * и преобразует строку в объект GeoJSON с помощью wellknown.
 * Если geometry уже объект, возвращает его.
 */
function parseGeometry(geometry) {
    if (typeof geometry === 'string') {
        const cleaned = geometry.replace(/^SRID=\d+;/, '');
        return wellknown.parse(cleaned);
    }
    return geometry;
}

/**
 * Основной компонент карты.
 * Отрисовывает карту, все полигоны и, если выбран полигон,
 * центрирует карту на нём и отображает его пересечения (если hideIntersections=false).
 */
function MapComponent({ polygons, selectedPolygon, hideIntersections }) {
    const defaultCenter = [55.751244, 37.618423]; // Центр Москвы по умолчанию
    let center = defaultCenter;

    // Если выбран полигон, вычисляем его центр
    if (selectedPolygon && selectedPolygon.geometry) {
        const geojson = parseGeometry(selectedPolygon.geometry);
        if (geojson && geojson.coordinates && geojson.coordinates[0]) {
            center = getPolygonCenter(geojson.coordinates[0]);
        }
    }

    return (
        <MapContainer center={center} zoom={6} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {/* Отрисовка всех полигонов */}
            {polygons.map((poly, idx) => {
                const geojson = parseGeometry(poly.geometry);
                if (!geojson || !geojson.coordinates || !geojson.coordinates[0]) {
                    console.warn("Некорректные данные полигона", poly);
                    return null;
                }
                // Преобразуем координаты из формата [lng, lat] в формат [lat, lng]
                const positions = geojson.coordinates[0].map(coord => [coord[1], coord[0]]);
                return <Polygon key={idx} positions={positions} />;
            })}
            {/* Если выбран полигон и пересечения есть, отрисовываем их только если hideIntersections не установлен */}
            {selectedPolygon && !hideIntersections && selectedPolygon.intersections &&
                selectedPolygon.intersections.map((inter, idx) => {
                    let interGeojson = inter.intersection;
                    if (typeof interGeojson === 'string') {
                        interGeojson = parseGeometry(interGeojson);
                    }
                    if (!interGeojson || !interGeojson.coordinates || !interGeojson.coordinates[0]) {
                        return null;
                    }
                    const interPositions = interGeojson.coordinates[0].map(coord => [coord[1], coord[0]]);
                    return (
                        <Polygon
                            key={`inter-${idx}`}
                            positions={interPositions}
                            pathOptions={{ color: 'red', fillOpacity: 0.3 }}
                        />
                    );
                })
            }
            <ChangeView center={center} zoom={6} />
        </MapContainer>
    );
}

export default MapComponent;








