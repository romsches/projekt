// Express-Anwendung erstellen
const express = require('express');
const app = express();

// MySQL2-Modul für die Datenbankverbindung
const mysql = require('mysql2');

// Pfadmodul für das Arbeiten mit Dateipfaden
const path = require('path');

// Body-Parser für das Verarbeiten von Anforderungskörpern
const bodyParser = require('body-parser');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL-Datenbankverbindung erstellen
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'world',
  password: 'mysql',
});

// CORS-Header für Cross-Origin-Anfragen setzen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Statische Dateien (CSS, JS, Bilder) bereitstellen
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/img', express.static(path.join(__dirname, 'views/img')));

// GET-Anfrage für die Startseite, rendert die Login-Seite
app.get('/', (req, res) => {
  res.render('login.ejs');
});

// POST-Anfrage für den Login-Prozess, überprüft die SpenderID und rendert die Tabelle
app.post('/login', (req, res) => {
  // SpenderID aus dem Anforderungskörper abrufen
  const donorID = req.body.SpenderID;

  // Überprüfen, ob die SpenderID vorhanden ist
  if (!donorID) {
    res.render('login-error.ejs', { error: 'Bitte geben Sie Ihre SpenderID ein.' });
    return;
  }

  // SQL-Abfrage für den Spender mit der gegebenen SpenderID
  const sqlQuery = `SELECT * FROM SPENDER WHERE SpenderID = ${donorID}`;
  connection.query(sqlQuery, (error, results) => {
    if (error) {
      console.error('Fehler bei der Ausführung der Anfrage:', error);
      res.status(500).send(`Interner Serverfehler: ${error.message}`);
    } else {
      if (results.length > 0) {
        // Spenderdaten abrufen und Datum der letzten Spende überprüfen
        const donor = results[0];
        const lastDonationDate = new Date(donor.Spendedatum);
        const currentDate = new Date();
        const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));

        // Überprüfen, ob der Spender spenden darf
        const canDonate = daysSinceLastDonation >= 30;

        // SQL-Abfrage für alle Spendertermine
        const sqlQueryMeetings = 'SELECT * FROM SPENDER_TERMINE';

        // Anfrage an die Datenbank für Spendertermine
        connection.query(sqlQueryMeetings, (error, meetingsResults) => {
          if (error) {
            console.error('Fehler bei der Ausführung der Anfrage:', error);
            res.status(500).send(`Interner Serverfehler: ${error.message}`);
          } else {
            // Tabelle mit Spenderterminen rendern
            res.render('table.ejs', { meetings: meetingsResults, canDonate });
          }
        });
      } else {
        // Fehlermeldung für ungültige SpenderID rendern
        res.render('login-error.ejs', { error: 'Ungültige SpenderID.' });
      }
    }
  });
});

// GET-Anfrage für das Aktualisieren der Tabelle basierend auf Filterkriterien
app.get('/updateTable', (req, res) => {
  // Ausgewählter Ort und Datum aus der Anfrage abrufen
  const selectedLocation = req.query.location;
  const selectedDate = req.query.date;

  // SQL-Abfrage für alle Spendertermine vorbereiten
  let sqlQuery = 'SELECT * FROM SPENDER_TERMINE';
  const filterConditions = [];

  // Filterbedingungen basierend auf ausgewähltem Ort hinzufügen
  if (selectedLocation && selectedLocation !== 'Alle Standorte') {
    filterConditions.push(`Ort = '${selectedLocation}'`);
  }

  // Filterbedingungen basierend auf ausgewähltem Datum hinzufügen
  if (selectedDate) {
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
    filterConditions.push(`Datum = '${formattedDate}'`);
  }

  // Filterbedingungen zur SQL-Abfrage hinzufügen, falls vorhanden
  if (filterConditions.length > 0) {
    sqlQuery += ' WHERE ' + filterConditions.join(' AND ');
  }

  // Anfrage an die Datenbank für aktualisierte Spendertermine
  connection.query(sqlQuery, (error, results) => {
    if (error) {
      console.error('Fehler bei der Ausführung der Anfrage:', error);
      res.status(500).json({ error: 'FEHLER DURCH SERVER' });
    } else {
      // Ergebnisse formatieren und als JSON zurücksenden
      const formattedResults = results.map(result => ({
        ...result,
        Datum: new Date(result.Datum).toLocaleDateString('de-DE'),
      }));
      res.json({ meetings: formattedResults, canDonate: true });
    }
  });
});

// Server starten und auf einem bestimmten Port lauschen
const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
  console.log(`Der Server läuft auf dem Port -> ${PORT}`);
});
