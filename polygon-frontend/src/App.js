import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PolygonForm from './components/PolygonForm';
import MapComponent from './components/MapComponent';
import PolygonTable from './components/PolygonTable';
import EditPolygonForm from './components/EditPolygonForm';
import InvalidPolygonsTable from './components/InvalidPolygonsTable';
import './index.css';

function App() {
  const [polygons, setPolygons] = useState([]);
  const [invalidPolygons, setInvalidPolygons] = useState([]);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [editingPolygon, setEditingPolygon] = useState(null);
  const [notification, setNotification] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedInvalid, setSelectedInvalid] = useState(null);
  const [hideIntersections, setHideIntersections] = useState(false);

  useEffect(() => {
    fetchPolygons();
  }, []);

  const fetchPolygons = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/polygons/');
      const features = response.data.features || response.data;
      setPolygons(features);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePolygonAdded = (newPolygon) => {
    setNotification("Полигон успешно добавлен!");
    fetchPolygons();
  };

  const handleError = (msg, details) => {
    setNotification(msg);
    if (details) {
      setInvalidPolygons(prev => [
        ...prev,
        {
          id: new Date().getTime(), // временный ID
          name: msg,
          intersections: details
        }
      ]);
    }
  };

  const handleSelectPolygon = (poly) => {
    setSelectedPolygon(poly);
  };

  const handleDeletePolygon = async (poly) => {
    const name = poly.properties ? poly.properties.name : poly.name;
    if (window.confirm(`Удалить полигон "${name}"?`)) {
      try {
        await axios.delete(`http://localhost:8000/api/polygons/${poly.id}/`);
        setNotification("Полигон успешно удалён!");
        fetchPolygons();
      } catch (error) {
        setNotification("Ошибка при удалении полигона.");
        console.error(error);
      }
    }
  };

  const handleEditPolygon = (poly) => {
    setEditingPolygon(poly);
  };

  const handleSaveEditedPolygon = (updatedPolygon) => {
    setNotification("Полигон успешно обновлён!");
    setEditingPolygon(null);
    fetchPolygons();
  };

  const handleCancelEdit = () => {
    setEditingPolygon(null);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const searchTerm = e.target.value;
      const found = polygons.find(
          poly => (poly.properties ? poly.properties.name : poly.name).toLowerCase() === searchTerm.toLowerCase()
      );
      if (found) {
        setSelectedPolygon(found);
      } else {
        setNotification("Полигон с таким названием не найден.");
      }
    }
  };


  const handleSelectInvalid = (invPoly) => {
    setSelectedPolygon(invPoly);
    setHideIntersections(false);
  };


  const handleClearInvalid = () => {
    setInvalidPolygons([]);
    setSelectedInvalid(null);
    setHideIntersections(true);
  };

  return (
      <div className="App">
        {notification && <div className="notification">{notification}</div>}
        {editingPolygon ? (
            <EditPolygonForm
                polygon={editingPolygon}
                onSave={handleSaveEditedPolygon}
                onCancel={handleCancelEdit}
                onError={handleError}
            />
        ) : (
            <>
              <PolygonForm onPolygonAdded={handlePolygonAdded} onError={handleError} />
              <div>
                <input
                    type="text"
                    placeholder="Поиск по названию полигона"
                    onKeyDown={handleSearch}
                />
              </div>
              <PolygonTable
                  polygons={polygons}
                  onSelect={handleSelectPolygon}
                  onDelete={handleDeletePolygon}
                  onEdit={handleEditPolygon}
              />
              <MapComponent
                  polygons={polygons}
                  selectedPolygon={selectedPolygon}
                  hideIntersections={hideIntersections}
              />
              {invalidPolygons.length > 0 && (
                  <InvalidPolygonsTable
                      invalidPolygons={invalidPolygons}
                      onSelectInvalid={handleSelectInvalid}
                      onClear={handleClearInvalid}
                  />
              )}
            </>
        )}
      </div>
  );
}

export default App;





