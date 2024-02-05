// Klasse für ein benutzerdefiniertes HTML-Element 'SpecialHeader'
class SpecialHeader extends HTMLElement {
  // Wird aufgerufen, wenn das Element mit dem DOM verbunden wird
  connectedCallback() {
      this.innerHTML = `
      <div class="header_container">
          <div class="logo">
              <img src="/views/img/label.png" alt="Blutspende Logo">
          </div>
          <nav>
              <ul>
                  <li><a href="#">Startseite</a></li>
                  <li><a href="#">Blutspende</a></li>
                  <li><a href="#">Blutspender werden</a></li>
                  <li><a href="#">Informationen</a></li>
                  <li><a href="#">Kontakt</a></li>
              </ul>
          </nav>
      </div>
      `;
  }
}

// Klasse für ein benutzerdefiniertes HTML-Element 'SpecialFooter'
class SpecialFooter extends HTMLElement {
  // Wird aufgerufen, wenn das Element mit dem DOM verbunden wird
  connectedCallback() {
      this.innerHTML = `
      <div class="footer_container">
          <div class="logo">
              <img src="/views/img/label.png" alt="Blutspende Logo">
          </div>
          <div>
              <ul class="links">
                  <a href="#">Impressum</a>
                  <a href="#">Datenschutz</a>
                  <a href="#">Nutzungsbedingungen</a>
              </ul>
          </div>
          <ul class="apps">
              <img src="/views/img/logo-facebook.svg" alt="fcb">
              <img src="/views/img/logo-instagram.svg" alt="inst">
              <img src="/views/img/logo-twitter.svg" alt="twit">
          </ul>
      </div>
      `;
  }
}

// Benutzerdefinierte HTML-Elemente registrieren
customElements.define('special-header', SpecialHeader);
customElements.define('special-footer', SpecialFooter);

// Event-Listener für das Laden des DOM-Inhalts
document.addEventListener('DOMContentLoaded', function () {
  // Formular für den Login abrufen
  const loginForm = document.querySelector('#login-form');

  // Wenn das Login-Formular existiert
  if (loginForm) {
      // Event-Listener für das Formular hinzufügen
      loginForm.addEventListener('submit', function (event) {
          event.preventDefault();

          // SpenderID aus dem Formular abrufen
          const donorID = document.getElementById('SpenderID').value;

          // POST-Anfrage an den Server senden
          fetch('/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ SpenderID: donorID }),
          })
              .then(response => response.text())
              .then(html => {
                  // Serverantwort als HTML in den Body einfügen
                  document.body.innerHTML = html;
              })
              .catch(error => console.error('Fehler beim Login:', error));
      });
  }

  // Funktion für die Aktualisierung der Tabelle
  async function updateTable() {
      try {
          // Ausgewählten Ort und Datum aus den Filterelementen abrufen
          const locationFilter = document.getElementById('location-filter').value;
          const dateFilter = document.getElementById('dtm').value;

          // GET-Anfrage an den Server für die aktualisierten Spendertermine senden
          const response = await fetch(`/updateTable?location=${encodeURIComponent(locationFilter)}&date=${encodeURIComponent(dateFilter)}`);
          const data = await response.json();

          // Tabelle im HTML leeren
          const tableBody = document.querySelector('#meeting-table tbody');
          tableBody.innerHTML = '';

          // Spendertermine in die Tabelle einfügen
          data.meetings.forEach(meeting => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${meeting.Datum}</td>
                  <td>${meeting.Ort}</td>
                  <td>${meeting.Uhrzeit}</td>
                  <td>${meeting.Status}</td>
              `;
              tableBody.appendChild(row);
          });

          // Anzeige von Hinweisen basierend auf der Spende-Berechtigung aktualisieren
          document.getElementById('donation-info').style.display = data.canDonate ? 'block' : 'none';
          document.getElementById('no-donation-info').style.display = data.canDonate ? 'none' : 'block';
      } catch (error) {
          console.error('Fehler bei der Aktualisierung der Tabelle:', error);
      }
  }

  // Die Funktion im globalen Bereich verfügbar machen
  window.updateTable = updateTable;
});
