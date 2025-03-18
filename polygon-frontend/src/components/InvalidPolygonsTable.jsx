import React from 'react';

function InvalidPolygonsTable({ invalidPolygons, onSelectInvalid, onClear }) {
    return (
        <div className="invalid-polygons-table">
            <h2>Неуспешные записи (пересечения)</h2>
            <button onClick={onClear} style={{ marginBottom: '10px' }}>
                Очистить записи
            </button>
            <table>
                <thead>
                <tr>
                    <th>Название</th>
                    <th>Информация о пересечениях</th>
                </tr>
                </thead>
                <tbody>
                {invalidPolygons.map((invPoly) => (
                    <tr
                        key={invPoly.id}
                        onClick={() => onSelectInvalid(invPoly)}
                        style={{ cursor: 'pointer' }}
                    >
                        <td>{invPoly.name}</td>
                        <td>
                            {invPoly.intersections &&
                                invPoly.intersections.map((inter, idx) => (
                                    <div key={idx}>
                                        <strong>{inter.name}:</strong>{' '}
                                        {JSON.stringify(inter.intersection.coordinates)}
                                    </div>
                                ))}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default InvalidPolygonsTable;


