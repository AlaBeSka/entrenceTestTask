## Функционал

### Frontend
- **Добавление полигона**
- **Отображение данных**
- **Редактирование и удаление**
- **Поиск по названию**
- **Уведомления**

### Backend1 (Polygons)
- CRUD-операции над полигонами с использованием Django REST Framework.
- Сохранение данных в базе PostgreSQL с расширением PostGIS.
- При добавлении полигона происходит вызов Backend 2 для проверки пересечения с другими полигонами.
- В случае неудачи полигон сохраняется в отдельной таблице с данными пересечений.

### Backend 2 (validator)
- API-эндпоинт для проверки пересечения нового полигона с уже существующими.
- Возвращает результат проверки (валиден или нет, с деталями пересечения).

## Установка и запуск

### Требования
- Python 3.8+
- React.js
- PostgreSQL с установленным расширением PostGIS

### Настройка виртуального окружения и установка зависимостей
1. Перейдите в каталог `geoapi` и создайте виртуальное окружение
   ```bash
   python -m venv venv
2. Активируйте виртуальное акружение
   ```bash
   source venv/bin/activate
3. Войдите в базу данных
   ```bash
   sudo -u postgres psql
4. Создание базы данных
   ```bash
   CREATE DATABASE polygons_db;
5. Создаем отдельного пользователя polygons_user с полными правами к polygons_db
   ```bash
   CREATE USER polygons_user WITH PASSWORD '2314';
   ALTER DATABASE polygons_db OWNER TO polygons_user;
   GRANT ALL PRIVILEGES ON DATABASE polygons_db TO polygons_user;
6. Подключаемся к новой базе
   ```bash
   \c polygons_db;
7. Активируем расширение PostGIS
   ```bash
   CREATE EXTENSION postgis;
8. В катологе `geoapi` установите зависимости 
   ```bash
   pip install -r requirements.txt
9. Запустите миграции для создания таблиц в базе данных
   ```bash
   python manage.py makemigrations
   python manage.py migrate
10. Запустите сервер
      ```bash
    python manage.py runserver
11. В каталоге `polygon-frontend` установите зависимоти для реакта
      ``` bash 
      npm install
12. react-leaflet-draw требует версию  React ^18.0.0, но так как у нас React 19.0.0 выполните команду
      ``` bash 
    npm install react-leaflet-draw leaflet-draw --legacy-peer-deps
13. Запустите фронт
   ``` bash 
   npm start