const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function withId(payload) {
  return { id: crypto.randomUUID(), ...payload };
}

function setupCollectionRoutes(name) {
  app.get(`/api/${name}`, (req, res) => {
    res.json(readDb()[name]);
  });

  app.post(`/api/${name}`, (req, res) => {
    const db = readDb();
    const item = withId(req.body);
    db[name].push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  app.put(`/api/${name}/:id`, (req, res) => {
    const db = readDb();
    const index = db[name].findIndex((x) => x.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }
    db[name][index] = { ...db[name][index], ...req.body, id: req.params.id };
    writeDb(db);
    res.json(db[name][index]);
  });

  app.delete(`/api/${name}/:id`, (req, res) => {
    const db = readDb();
    const index = db[name].findIndex((x) => x.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }
    const removed = db[name].splice(index, 1)[0];
    writeDb(db);
    res.json(removed);
  });
}

setupCollectionRoutes('medications');
setupCollectionRoutes('appointments');
setupCollectionRoutes('caregivers');

app.post('/api/notifications', (req, res) => {
  const db = readDb();
  const notice = withId({ ...req.body, createdAt: new Date().toISOString() });
  db.notifications.unshift(notice);
  db.notifications = db.notifications.slice(0, 200);
  writeDb(db);
  res.status(201).json(notice);
});

app.get('/api/notifications', (req, res) => {
  res.json(readDb().notifications);
});

app.get('/api/dashboard', (req, res) => {
  const db = readDb();
  const upcoming = [];

  for (const med of db.medications) {
    for (const t of med.times || []) {
      upcoming.push({
        type: '用药',
        title: `${med.name} ${med.dosage || ''}`.trim(),
        date: new Date().toISOString().slice(0, 10),
        time: t,
      });
    }
  }

  for (const appt of db.appointments) {
    upcoming.push({
      type: '复诊',
      title: appt.title,
      date: appt.date,
      time: appt.time || '09:00',
    });
  }

  upcoming.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  res.json({
    counts: {
      medications: db.medications.length,
      appointments: db.appointments.length,
      caregivers: db.caregivers.length,
    },
    upcoming: upcoming.slice(0, 20),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Elder Med Reminder running at http://localhost:${PORT}`);
});
