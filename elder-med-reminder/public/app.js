const $ = (sel) => document.querySelector(sel);

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function say(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  window.speechSynthesis.speak(utterance);
}

async function loadDashboard() {
  const data = await api('/api/dashboard');
  $('#stats').innerHTML = `
    <span>用药 ${data.counts.medications}</span>
    <span>复诊 ${data.counts.appointments}</span>
    <span>家属 ${data.counts.caregivers}</span>
  `;
  $('#upcoming').innerHTML = data.upcoming
    .map((x) => `<li>${x.type}｜${x.date} ${x.time}｜${x.title}</li>`)
    .join('');
}

async function loadList(path, target, render) {
  const list = await api(path);
  $(target).innerHTML = list.map(render).join('');
}

function setupForm(formId, path, mapper, afterSave) {
  $(formId).addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api(path, { method: 'POST', body: JSON.stringify(mapper(data)) });
    e.target.reset();
    await afterSave();
  });
}

async function saveNotification(message) {
  await api('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({ type: '提醒', message }),
  });
  await loadNotifications();
}

async function loadNotifications() {
  const list = await api('/api/notifications');
  $('#noticeList').innerHTML = list
    .slice(0, 20)
    .map((x) => `<li>${new Date(x.createdAt).toLocaleString()}｜${x.message}</li>`)
    .join('');
}

function tryBrowserNotice(text) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('用药提醒助手', { body: text });
  }
}

async function reminderTick() {
  const meds = await api('/api/medications');
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  for (const med of meds) {
    if ((med.times || []).includes(hhmm)) {
      const text = `请按时服用 ${med.name}，剂量 ${med.dosage}`;
      say(text);
      tryBrowserNotice(text);
      await saveNotification(text);
    }
  }
}

async function refreshAll() {
  await Promise.all([
    loadDashboard(),
    loadList('/api/medications', '#medList', (x) => `<li>${x.name}｜${x.dosage}｜${(x.times || []).join(', ')}</li>`),
    loadList('/api/appointments', '#apptList', (x) => `<li>${x.date} ${x.time}｜${x.title}${x.hospital ? `｜${x.hospital}` : ''}</li>`),
    loadList('/api/caregivers', '#careList', (x) => `<li>${x.name}｜${x.phone}${x.relationship ? `｜${x.relationship}` : ''}</li>`),
    loadNotifications(),
  ]);
}

setupForm('#medForm', '/api/medications', (d) => ({
  name: d.name,
  dosage: d.dosage,
  times: d.times.split(',').map((x) => x.trim()).filter(Boolean),
}), refreshAll);

setupForm('#apptForm', '/api/appointments', (d) => d, refreshAll);
setupForm('#careForm', '/api/caregivers', (d) => d, refreshAll);

$('#requestNotify').addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('当前浏览器不支持通知');
    return;
  }
  await Notification.requestPermission();
});

refreshAll();
setInterval(reminderTick, 60 * 1000);
