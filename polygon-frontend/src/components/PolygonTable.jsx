import React from 'react';
import wellknown from 'wellknown';

function getCoordinates(geometry) {
    let geojson;
    if (typeof geometry === 'string') {
        const cleaned = geometry.replace(/^SRID=\d+;/, '');
        geojson = wellknown.parse(cleaned);
    } else {
        geojson = geometry;
    }
    return geojson ? geojson.coordinates : null;
}

function PolygonTable({ polygons, onSelect, onDelete, onEdit }) {
    return (
        <div className="polygon-table">
            <h2>Сохранённые полигоны</h2>
            <table>
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Координаты</th>
                    <th>Пересечение антимеридиана</th>
                    <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {polygons.map((poly) => (
                    <tr key={poly.id} onClick={() => onSelect(poly)}>
                        <td>{poly.properties ? poly.properties.name : poly.name}</td>
                        <td>{JSON.stringify(getCoordinates(poly.geometry))}</td>
                        <td>{poly.properties && poly.properties.crosses_antimeridiadian ? 'True' : 'False'}</td>
                        <td>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(poly);
                                }}
                            >
                                Редактировать
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(poly);
                                }}
                            >
                                Удалить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default PolygonTable;
