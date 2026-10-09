const $ = (s, r = document) => r.querySelector(s);
const C = window.APP_CONFIG, set = v => v && !v.startsWith('YOUR_');
const sb = set(C.SUPABASE_URL) && window.supabase ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;

const btn = $('.menu-btn'), nav = $('#nav');
btn.onclick = () => btn.setAttribute('aria-expanded', nav.classList.toggle('open'));
nav.onclick = e => { if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); } };
$('#year').textContent = new Date().getFullYear();

$('#contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, st = $('#form-status'), b = $('button', f);
  if (!f.checkValidity()) { st.className = 'err'; st.textContent = 'Please fill in every field with a valid email.'; return; }
  const d = Object.fromEntries(new FormData(f));
  if (d.botcheck) return;
  b.disabled = true; st.className = ''; st.textContent = 'Sending...';
  const jobs = [];
  if (sb) jobs.push(sb.from('messages').insert({ name: d.name, email: d.email, subject: d.subject, message: d.message }).then(r => { if (r.error) throw r.error; }));
  if (set(C.WEB3FORMS_ACCESS_KEY)) jobs.push(fetch('https://api.web3forms.com/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: C.WEB3FORMS_ACCESS_KEY, from_name: 'Deltessa Data website', name: d.name, email: d.email, subject: '[Website] ' + d.subject, message: d.message })
  }).then(r => r.json()).then(r => { if (!r.success) throw r; }));
  const res = await Promise.allSettled(jobs);
  if (res.some(r => r.status === 'fulfilled')) { f.reset(); st.className = 'ok'; st.textContent = 'Thank you. Your message has been sent.'; }
  else { st.className = 'err'; st.textContent = 'Your message was not sent. Please email us at ' + C.CONTACT_EMAIL + '.'; }
  b.disabled = false;
});
