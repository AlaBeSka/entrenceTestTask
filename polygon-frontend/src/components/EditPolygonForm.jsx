import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet';
import wellknown from 'wellknown';
import 'leaflet/dist/leaflet.css';

// Компонент для регистрации кликов на карте
function ClickableMap({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        }
    });
    return null;
}

// Функция для преобразования geometry: если это строка (WKT), парсим её в GeoJSON.
function parseGeometry(geometry) {
    if (typeof geometry === 'string') {
        const cleaned = geometry.replace(/^SRID=\d+;/, '');
        return wellknown.parse(cleaned);
    }
    return geometry;
}

function EditPolygonForm({ polygon, onSave, onCancel, onError }) {
    // Преобразуем geometry в GeoJSON, если необходимо
    const geojson = polygon && polygon.geometry ? parseGeometry(polygon.geometry) : null;

    // Извлекаем начальные координаты из GeoJSON и сохраняем их как строки для редактирования
    let initialCoords = [];
    if (geojson && geojson.coordinates && geojson.coordinates[0]) {
        const coords = geojson.coordinates[0];
        // Если полигон замкнут (первая координата равна последней), удаляем последний элемент
        if (
            coords.length > 1 &&
            coords[0][0] === coords[coords.length - 1][0] &&
            coords[0][1] === coords[coords.length - 1][1]
        ) {
            initialCoords = coords.slice(0, -1).map(([lng, lat]) => [lng.toString(), lat.toString()]);
        } else {
            initialCoords = coords.map(([lng, lat]) => [lng.toString(), lat.toString()]);
        }
    }

    const [name, setName] = useState(polygon.properties ? polygon.properties.name : polygon.name || '');
    const [coordinates, setCoordinates] = useState(initialCoords);
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [useMapInput, setUseMapInput] = useState(false);
    // Состояние для выбранного индекса координаты (выделение)
    const [selectedIndex, setSelectedIndex] = useState(null);
    // Состояние для пересечений (если валидатор сообщает о пересечениях)
    const [intersections, setIntersections] = useState([]);

    // Функция обновления координаты (сохраняем значения как строки)
    const updateCoordinate = (index, newLng, newLat) => {
        const newCoords = [...coordinates];
        newCoords[index] = [newLng, newLat];
        setCoordinates(newCoords);
    };

    // Удаление координаты
    const removeCoordinate = (index) => {
        const newCoords = coordinates.filter((_, i) => i !== index);
        setCoordinates(newCoords);
        if (selectedIndex === index) {
            setSelectedIndex(null);
        }
    };

    // Функция вставки новой координаты после выделенной
    const insertCoordinateAfter = () => {
        if (selectedIndex === null) return;
        const newCoords = [...coordinates];
        // Вставляем пустую координату (пустые строки) сразу после выбранной
        newCoords.splice(selectedIndex + 1, 0, ["", ""]);
        setCoordinates(newCoords);
        setSelectedIndex(selectedIndex + 1);
    };

    // Добавление координаты вручную
    const addCoordinateManually = () => {
        if (lat === '' || lng === '') {
            onError("Введите значения широты и долготы.");
            return;
        }
        setCoordinates([...coordinates, [lng, lat]]);
        setLat('');
        setLng('');
    };

    // Обработка клика по карте: если выбрана координата, обновляем её, иначе добавляем новую
    const handleMapClick = (latlng) => {
        const newLng = latlng.lng.toString();
        const newLat = latlng.lat.toString();
        if (selectedIndex !== null) {
            const newCoords = [...coordinates];
            newCoords[selectedIndex] = [newLng, newLat];
            setCoordinates(newCoords);
        } else {
            setCoordinates([...coordinates, [newLng, newLat]]);
        }
    };

    const clearCoordinates = () => {
        setCoordinates([]);
        setSelectedIndex(null);
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
        // Преобразуем строки в числа и формируем массив координат
        const polygonCoords = coordinates.map(coord => {
            const lngNum = parseFloat(coord[0]);
            const latNum = parseFloat(coord[1]);
            return [lngNum, latNum];
        });
        if (polygonCoords.some(([lng, lat]) => isNaN(lng) || isNaN(lat))) {
            onError("Все координаты должны быть числовыми.");
            return;
        }
        // Гарантируем, что полигон замкнут: если первая и последняя координаты не совпадают, добавляем первую
        const first = polygonCoords[0];
        const last = polygonCoords[polygonCoords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            polygonCoords.push(first);
        }
        const updatedPolygon = {
            type: "Polygon",
            coordinates: [polygonCoords]
        };

        // Выполняем валидацию через валидатор, передавая ID редактируемого полигона
        try {
            const validatorResponse = await axios.post('http://localhost:8000/validator/validate/', {
                id: polygon.id,
                name,
                polygon: updatedPolygon
            });
            if (!validatorResponse.data.is_valid) {
                // Если ошибка связана с самопересечением, выводим сообщение "Самопересечение контура"
                if (validatorResponse.data.error && validatorResponse.data.error.includes("самопересекается")) {
                    onError("Самопересечение контура");
                } else {
                    setIntersections(validatorResponse.data.intersections);
                    onError("Полигон пересекается с существующими", validatorResponse.data.intersections);
                }
                return;
            } else {
                setIntersections([]);
            }
        } catch (error) {
            onError("Ошибка при проверке полигона.");
            console.error(error);
            return;
        }

        // Если валидация прошла, отправляем PATCH-запрос на обновление полигона
        try {
            const response = await axios.patch(`http://localhost:8000/api/polygons/${polygon.id}/`, {
                name,
                polygon: updatedPolygon
            });
            onSave(response.data);
        } catch (error) {
            onError("Ошибка при обновлении полигона.");
            console.error(error);
        }
    };

    // Преобразуем координаты для отрисовки на карте ([lng, lat] -> [lat, lng])
    const polygonPositions = coordinates
        .map(coord => {
            const lngNum = parseFloat(coord[0]);
            const latNum = parseFloat(coord[1]);
            if (isNaN(lngNum) || isNaN(latNum)) return null;
            return [latNum, lngNum];
        })
        .filter(pos => pos !== null);

    return (
        <div className="edit-polygon-form">
            <h2>Редактировать полигон</h2>
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
                    <h3>Координаты:</h3>
                    {coordinates.map((coord, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '4px',
                                border: selectedIndex === index ? '2px solid blue' : '1px solid gray',
                                borderRadius: '4px',
                                marginBottom: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <input
                                type="number"
                                value={coord[0]}
                                onChange={(e) => updateCoordinate(index, e.target.value, coord[1])}
                                placeholder="Долгота"
                            />
                            <input
                                type="number"
                                value={coord[1]}
                                onChange={(e) => updateCoordinate(index, coord[0], e.target.value)}
                                placeholder="Широта"
                            />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeCoordinate(index); }}>
                                Удалить
                            </button>
                            {selectedIndex === index && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); insertCoordinateAfter(); }}>
                                    Добавить после
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div>
                    <label>Добавить координату вручную:</label>
                    <div>
                        <input
                            type="text"
                            value={lng}
                            onChange={(e) => setLng(e.target.value)}
                            placeholder="Долгота"
                        />
                        <input
                            type="text"
                            value={lat}
                            onChange={(e) => setLat(e.target.value)}
                            placeholder="Широта"
                        />
                        <button type="button" onClick={addCoordinateManually}>Добавить</button>
                    </div>
                </div>
                <div>
                    <label>Или выбрать на карте:</label>
                    <select
                        value={useMapInput ? "map" : "manual"}
                        onChange={(e) => setUseMapInput(e.target.value === "map")}
                    >
                        <option value="manual">Ввод вручную</option>
                        <option value="map">Выбор на карте</option>
                    </select>
                </div>
                {useMapInput && (
                    <div style={{ height: '300px', marginBottom: '10px' }}>
                        <MapContainer
                            center={polygonPositions[0] || [55.751244, 37.618423]}
                            zoom={4}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {polygonPositions.length > 0 && <Polygon positions={polygonPositions} />}
                            {selectedIndex !== null && polygonPositions[selectedIndex] && (
                                <CircleMarker
                                    center={polygonPositions[selectedIndex]}
                                    radius={8}
                                    color="blue"
                                    fillColor="blue"
                                    fillOpacity={0.5}
                                />
                            )}
                            <ClickableMap onMapClick={handleMapClick} />
                            {/* Отрисовка областей пересечения, если есть */}
                            {intersections.length > 0 && intersections.map((inter, idx) => {
                                let interGeojson = inter.intersection;
                                if (typeof interGeojson === 'string') {
                                    interGeojson = parseGeometry(interGeojson);
                                }
                                if (!interGeojson || !interGeojson.coordinates || !interGeojson.coordinates[0]) return null;
                                const interPositions = interGeojson.coordinates[0].map(coord => [coord[1], coord[0]]);
                                return (
                                    <Polygon
                                        key={`inter-${idx}`}
                                        positions={interPositions}
                                        pathOptions={{ color: 'red', fillOpacity: 0.3 }}
                                    />
                                );
                            })}
                        </MapContainer>
                    </div>
                )}
                <div>
                    <button type="button" onClick={clearCoordinates}>
                        Очистить координаты
                    </button>
                </div>
                <button type="submit">Сохранить изменения</button>
                <button type="button" onClick={onCancel}>Отмена</button>
            </form>
        </div>
    );
}

export default EditPolygonForm;
