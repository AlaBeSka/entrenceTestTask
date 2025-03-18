import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

function ClickableMap({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        }
    });
    return null;
}

function PolygonForm({ onPolygonAdded, onError }) {
    const [name, setName] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [coordinates, setCoordinates] = useState([]);
    const [useMapInput, setUseMapInput] = useState(false);

    const addCoordinateManually = () => {
        if (lat === '' || lng === '') {
            onError("Введите значения широты и долготы.");
            return;
        }
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) {
            onError("Неверный формат координат.");
            return;
        }
        setCoordinates([...coordinates, [lngNum, latNum]]);
        setLat('');
        setLng('');
    };

    const handleMapClick = (latlng) => {
        setCoordinates([...coordinates, [latlng.lng, latlng.lat]]);
    };

    const clearCoordinates = () => {
        setCoordinates([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            onError("Укажите название полигона.");
            return;
        }
        if (coordinates.length < 3) {
            onError("Введите минимум 3 координаты для полигона.");
            return;
        }
        let polygonCoords = [...coordinates];
        const first = polygonCoords[0];
        const last = polygonCoords[polygonCoords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            polygonCoords.push(first);
        }
        const polygon = {
            type: "Polygon",
            coordinates: [polygonCoords]
        };

        // Проверка самопересечения с помощью Turf.js
        try {
            const turfPolygon = turf.polygon(polygon.coordinates);
            const kinks = turf.kinks(turfPolygon);
            if (kinks.features.length > 0) {
                onError("Самопересечение контура");
                return;
            }
        } catch (error) {
            onError("Ошибка при проверке самопересечения контура.");
            console.error(error);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/polygons/', { name, polygon });
            onPolygonAdded(response.data);
            setName('');
            setCoordinates([]);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                onError(error.response.data.error, error.response.data.details);
            } else {
                onError("Ошибка при отправке полигона.");
            }
            console.error(error);
        }
    };

    return (
        <div className="polygon-form">
            <h2>Добавить полигон</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Название:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label>Режим ввода координат:</label>
                    <select
                        value={useMapInput ? "map" : "manual"}
                        onChange={(e) => setUseMapInput(e.target.value === "map")}
                    >
                        <option value="manual">Ввод вручную</option>
                        <option value="map">Выбор на карте</option>
                    </select>
                </div>
                {useMapInput ? (
                    <div style={{ height: '300px', marginBottom: '10px' }}>
                        <MapContainer
                            center={[55.751244, 37.618423]}
                            zoom={4}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            <ClickableMap onMapClick={handleMapClick} />
                            {coordinates.length > 0 && (
                                <Polyline positions={coordinates.map(coord => [coord[1], coord[0]])} />
                            )}
                        </MapContainer>
                    </div>
                ) : (
                    <>
                        <div>
                            <label>Широта:</label>
                            <input
                                type="text"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Долгота:</label>
                            <input
                                type="text"
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                            />
                        </div>
                        <button type="button" onClick={addCoordinateManually}>
                            Добавить координату
                        </button>
                    </>
                )}
                <div>
                    <label>Координаты полигона (массив):</label>
                    <textarea
                        readOnly
                        value={JSON.stringify(coordinates, null, 2)}
                        rows="5"
                        cols="50"
                    />
                </div>
                <div>
                    <button type="button" onClick={clearCoordinates}>
                        Очистить координаты
                    </button>
                </div>
                <button type="submit">Отправить полигон</button>
            </form>
        </div>
    );
}

export default PolygonForm;

