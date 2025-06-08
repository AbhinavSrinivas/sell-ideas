// // sell-ideas-single.js – one‑file demo marketplace (CommonJS)
// // Quick start:
// //   npm install express
// //   node sell-ideas-single.js
// // NOTE: In‑memory storage. Restarting the server clears everything.

// const express = require('express');

// const PORT = process.env.PORT || 5000;
// const app  = express();
// app.use(express.json());

// // Log every request (method + URL) to help debug routing issues
// app.use((req, _res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // ───────────────────────────────────────────────────────────────
// // In‑memory store
// // ───────────────────────────────────────────────────────────────
// const ideas = [];
// let   nextId = 1;

// // ───────────────────────────────────────────────────────────────
// // REST API
// // ───────────────────────────────────────────────────────────────
// app.get('/api/ideas', (_req, res) => {
//   res.json([...ideas].reverse()); // newest first
// });

// app.post('/api/ideas', (req, res) => {
//   const { title, description, price } = req.body;
//   if (!title || !description || price == null) {
//     return res.status(400).json({ message: 'title, description and price are required' });
//   }
//   const idea = {
//     id: nextId++,
//     title,
//     description,
//     price: Number(price),
//     createdAt: Date.now(),
//   };
//   ideas.push(idea);
//   res.status(201).json(idea);
// });

// app.get('/api/ideas/:id', (req, res) => {
//   const idea = ideas.find(i => i.id === Number(req.params.id));
//   if (!idea) return res.status(404).json({ message: 'Not found' });
//   res.json(idea);
// });

// // ───────────────────────────────────────────────────────────────
// // Front‑end served as a literal HTML string
// // ───────────────────────────────────────────────────────────────
// const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sell Your Ideas</title><style>:root{color-scheme:light dark}body{font-family:system-ui,Arial,sans-serif;margin:0;padding:2rem;max-width:700px;margin-left:auto;margin-right:auto;line-height:1.5}h1,h2,h3{margin:0 0 .4em}a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}.btn{display:inline-block;padding:.45rem 1rem;background:#0366d6;color:#fff;border-radius:4px;margin:.6rem 0}.card{border:1px solid #ddd;padding:1rem;border-radius:6px;margin-top:1rem}input,textarea{width:100%;padding:.5rem;margin:.25rem 0;border:1px solid #ccc;border-radius:4px;font:inherit}</style></head><body><h1>Sell Your Ideas</h1><div id="app"></div><script>// ───── client-side router ─────
// function navigate(p){history.pushState(null,'',p);render()}window.addEventListener('popstate',render);document.addEventListener('click',e=>{const a=e.target.closest('a[data-link]');if(a){e.preventDefault();navigate(a.getAttribute('href'))}});// ───── fetch helper ─────
// async function api(p,opt={}){const r=await fetch(p,{headers:{'Content-Type':'application/json'},...opt});return r.json()}// ───── views ─────
// async function listView(){const list=await api('/api/ideas');const markup='<a data-link href="/new" class="btn">Post a new idea →</a>'+list.map(i=>'<div class="card"><h3><a data-link href="/idea/'+i.id+'">'+i.title+'</a></h3><p>'+i.description.replace(/</g,'&lt;').slice(0,120)+(i.description.length>120?'…':'')+'</p><strong>$'+i.price.toFixed(2)+'</strong></div>').join('');document.getElementById('app').innerHTML=markup}function formView(){document.getElementById('app').innerHTML='<a data-link href="/" >← Back</a><form id="ideaForm"><input name="title" placeholder="Title" required/><textarea name="description" rows="4" placeholder="Description" required></textarea><input name="price" type="number" step="0.01" min="0" placeholder="Price (USD)" required/><button class="btn" type="submit">Publish</button></form>';document.getElementById('ideaForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());data.price=Number(data.price);const idea=await api('/api/ideas',{method:'POST',body:JSON.stringify(data)});navigate('/idea/'+idea.id)})}async function detailView(id){const idea=await api('/api/ideas/'+id);if(idea.message){document.getElementById('app').innerHTML='<p>Idea not found.</p>';return;}document.getElementById('app').innerHTML='<a data-link href="/">← Back</a><div class="card"><h2>'+idea.title+'</h2><p style="white-space:pre-wrap">'+idea.description.replace(/</g,'&lt;')+'</p><strong style="font-size:1.3rem;">$'+idea.price.toFixed(2)+'</strong></div>'}// ───── render ─────
// function render(){const p=location.pathname;if(p==='/new')return formView();if(p.startsWith('/idea/'))return detailView(p.split('/').pop());return listView()}render();</script></body></html>`;

// // ───────────────────────────────────────────────────────────────
// // Routes that serve the SPA HTML (no regex magic — explicit paths)
// // ───────────────────────────────────────────────────────────────
// function sendHtml(_req, res){res.type('html').send(html);}  // helper

// app.get('/', sendHtml);        // root
// app.get('/new', sendHtml);     // create form
// app.get('/idea/:id', sendHtml); // idea detail

// // Catch‑all 404 for anything else not handled above
// app.use((req, res) => {
//   res.status(404).send('Not found');
// });

// app.listen(PORT, () => {
//   console.log(`🚀  Sell‑Ideas server running → http://localhost:${PORT}`);
// });
// sell-ideas-single.js – one‑file demo marketplace (CommonJS) with DELETE support
// Quick start:
//   npm install express
//   node sell-ideas-single.js
// NOTE: In‑memory storage. Restarting the server clears everything.

const express = require('express');

const PORT = process.env.PORT || 5000;
const app  = express();
app.use(express.json());

// Log every request (method + URL)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ───────────────────────────────────────────────────────────────
// In‑memory store
// ───────────────────────────────────────────────────────────────
const ideas = [];
let   nextId = 1;

// ───────────────────────────────────────────────────────────────
// REST API
// ───────────────────────────────────────────────────────────────
app.get('/api/ideas', (_req, res) => {
  res.json([...ideas].reverse()); // newest first
});

app.post('/api/ideas', (req, res) => {
  const { title, description, price } = req.body;
  if (!title || !description || price == null) {
    return res.status(400).json({ message: 'title, description and price are required' });
  }
  const idea = {
    id: nextId++,
    title,
    description,
    price: Number(price),
    createdAt: Date.now(),
  };
  ideas.push(idea);
  res.status(201).json(idea);
});

app.get('/api/ideas/:id', (req, res) => {
  const idea = ideas.find(i => i.id === Number(req.params.id));
  if (!idea) return res.status(404).json({ message: 'Not found' });
  res.json(idea);
});

// NEW: delete endpoint
app.delete('/api/ideas/:id', (req, res) => {
  const idx = ideas.findIndex(i => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  ideas.splice(idx, 1);
  res.status(204).end();
});

// ───────────────────────────────────────────────────────────────
// Front‑end served as a literal HTML string
// ───────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sell Your Ideas</title><style>:root{color-scheme:light dark}body{font-family:system-ui,Arial,sans-serif;margin:0;padding:2rem;max-width:700px;margin-left:auto;margin-right:auto;line-height:1.5}h1,h2,h3{margin:0 0 .4em}a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}.btn{display:inline-block;padding:.45rem 1rem;background:#0366d6;color:#fff;border-radius:4px;margin:.6rem 0;border:none;cursor:pointer}.danger{background:#e74c3c}.card{border:1px solid #ddd;padding:1rem;border-radius:6px;margin-top:1rem}input,textarea{width:100%;padding:.5rem;margin:.25rem 0;border:1px solid #ccc;border-radius:4px;font:inherit}</style></head><body><h1>Sell Your Ideas</h1><div id="app"></div><script>// ───── client-side router ─────\nfunction navigate(p){history.pushState(null,'',p);render()}window.addEventListener('popstate',render);document.addEventListener('click',e=>{const a=e.target.closest('a[data-link]');if(a){e.preventDefault();navigate(a.getAttribute('href'))}});// ───── fetch helper ─────\nasync function api(p,opt={}){const r=await fetch(p,{headers:{'Content-Type':'application/json'},...opt});if(!r.ok) return {message:(await r.text())||r.statusText};return r.status===204?{}:r.json()}// ───── views ─────\nasync function listView(){const list=await api('/api/ideas');const markup='<a data-link href="/new" class="btn">Post a new idea →</a>'+list.map(i=>'<div class="card"><h3><a data-link href="/idea/'+i.id+'">'+i.title+'</a></h3><p>'+i.description.replace(/</g,'&lt;').slice(0,120)+(i.description.length>120?'…':'')+'</p><strong>$'+i.price.toFixed(2)+'</strong></div>').join('');document.getElementById('app').innerHTML=markup}function formView(){document.getElementById('app').innerHTML='<a data-link href="/" >← Back</a><form id="ideaForm"><input name="title" placeholder="Title" required/><textarea name="description" rows="4" placeholder="Description" required></textarea><input name="price" type="number" step="0.01" min="0" placeholder="Price (USD)" required/><button class="btn" type="submit">Publish</button></form>';document.getElementById('ideaForm').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());data.price=Number(data.price);const idea=await api('/api/ideas',{method:'POST',body:JSON.stringify(data)});navigate('/idea/'+idea.id)})}async function detailView(id){const idea=await api('/api/ideas/'+id);if(idea.message){document.getElementById('app').innerHTML='<p>Idea not found.</p>';return;}const markup='<a data-link href="/">← Back</a><button id="delBtn" class="btn danger" style="float:right;">Delete</button><div class="card" style="clear:both"><h2>'+idea.title+'</h2><p style="white-space:pre-wrap">'+idea.description.replace(/</g,'&lt;')+'</p><strong style="font-size:1.3rem;">$'+idea.price.toFixed(2)+'</strong></div>';document.getElementById('app').innerHTML=markup;document.getElementById('delBtn').addEventListener('click',async()=>{if(!confirm('Delete this idea?')) return;await api('/api/ideas/'+id,{method:'DELETE'});navigate('/')});}// ───── render ─────\nfunction render(){const p=location.pathname;if(p==='/new')return formView();if(p.startsWith('/idea/'))return detailView(p.split('/').pop());return listView()}render();</script></body></html>`;

// ───────────────────────────────────────────────────────────────
// Routes that serve the SPA HTML
// ───────────────────────────────────────────────────────────────
function sendHtml(_req, res){res.type('html').send(html);}  // helper

app.get('/', sendHtml);
app.get('/new', sendHtml);
app.get('/idea/:id', sendHtml);

// Catch‑all 404 for anything else not handled above
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`🚀  Sell‑Ideas server running → http://localhost:${PORT}`);
});