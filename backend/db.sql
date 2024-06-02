CREATE DATABASE IF NOT EXISTS SmartChargingStation;
USE SmartChargingStation;

CREATE TABLE Station (
    id int AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    lat DECIMAL(11, 8),
    lon DECIMAL(11, 8),
    price int,
    dismissed BOOLEAN,
    last_heartbeat DATETIME,
    notes TEXT,
    description TEXT
);

CREATE TABLE Connector (
    id int AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    power DECIMAL(11, 8)
);

CREATE TABLE StationConnector (
    station_id int,
    connector_id int,
    PRIMARY KEY (station_id, connector_id),
    FOREIGN KEY (station_id) REFERENCES Station(id),
    FOREIGN KEY (connector_id) REFERENCES Connector(id)
);

CREATE TABLE User (
    id int AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    surname VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    token_reset_time DATETIME,
    balance int,
    is_admin BOOLEAN
);

CREATE TABLE StationUsage (
    id int AUTO_INCREMENT PRIMARY KEY,
    user_id int,
    station_id int,
    start_time DATETIME,
    end_time DATETIME,
    reservation_time DATETIME,
    kw DECIMAL(11, 8) default 0,
    price int,
    deleted BOOLEAN default 0,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (station_id) REFERENCES Station(id)
);

CREATE TABLE ResetPasswordToken (
    id int AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    token VARCHAR(255),
    generated_time DATETIME,
    used BOOLEAN,
    FOREIGN KEY (email) REFERENCES User(email)
);

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 1', 44.41225398745292, 8.943041803651521, 421, 0, null, 'This is a note', 'description 1');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 2', 44.40973066556966, 8.937683635571881, 228, 0, null, 'This is a note', 'description 2');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 3', 44.40959225369384, 8.938335670510613, 259, 0, null, 'This is a note', 'description 3');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 4', 44.41490247844163, 8.948156087159589, 228, 0, null, 'This is a note', 'description 4');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 5', 44.41668083596903, 8.945843180774654, 428, 0, null, 'This is a note', 'description 5');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 6', 44.41298340189158, 8.939498167023588, 341, 0, null, 'This is a note', 'description 6');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 7', 44.410629875247835, 8.940450134372531, 167, 0, null, 'This is a note', 'description 7');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 8', 44.416008668901455, 8.94061536564911, 351, 0, null, 'This is a note', 'description 8');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 9', 44.41648755559513, 8.943489395794249, 320, 0, null, 'This is a note', 'description 9');

INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description)
            VALUES ('Station 10', 44.413023902482834, 8.938031770503345, 175, 0, null, 'This is a note', 'description 10');

INSERT INTO Connector (name, power) VALUES ('Type 1', 50);
INSERT INTO Connector (name, power) VALUES ('Type 2', 70);

INSERT INTO User(name, surname, email, password, token_reset_time, balance, is_admin) VALUES ('admin', 'admin', 'admin@scsms.com', '$2b$10$lzR/bXpFKl3hFF0yARn3aeYYVVdweeak2ge9IgJnHLurCcjzRuvLK', NOW(), 1000, 1);
