require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use 3000 as fallback if PORT is not set
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI || !JWT_SECRET) {
    console.error('Missing env vars');
    process.exit(1);
}

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(e => {
        console.error('MongoDB connection error:', e);
        console.error('Make sure your MongoDB Atlas cluster has the correct IP whitelist settings');
        process.exit(1);
    });

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
        }
    }
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String
}));
const Idea=mongoose.model('Idea',new mongoose.Schema({title:String,description:String,price:Number,userId:{type:mongoose.Types.ObjectId,ref:'User'}}));

function sign(u){return jwt.sign({id:u._id,name:u.name},JWT_SECRET,{expiresIn:'7d'});} 
function auth(req,res,next){const t=req.cookies.token;if(!t)return res.status(401).end();try{req.user=jwt.verify(t,JWT_SECRET);next();}catch{res.status(401).end();}}

app.post('/api/register',async(req,res)=>{const{ name,email,password}=req.body;if(!name||!email||!password||password.length<8)return res.status(400).end();if(await User.findOne({email}))return res.status(409).end();const u=await User.create({name,email,passwordHash:await bcrypt.hash(password,12)});res.cookie('token',sign(u),{httpOnly:true,sameSite:'lax'});res.json({id:u._id,name:u.name});});
app.post('/api/login',async(req,res)=>{const{email,password}=req.body;const u=await User.findOne({email});if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).end();res.cookie('token',sign(u),{httpOnly:true,sameSite:'lax'});res.json({id:u._id,name:u.name});});
app.post('/api/logout',(_req,res)=>{res.clearCookie('token');res.json({ok:true});});

app.get('/api/ideas',async(_req,res)=>{const list=await Idea.find().sort('-_id').populate('userId','name');res.json(list.map(i=>({_id:i._id,title:i.title,description:i.description,price:i.price,userId:i.userId._id,userName:i.userId.name})));});
app.post('/api/ideas',auth,async(req,res)=>{const{title,description,price}=req.body;if(!title||!description||price==null)return res.status(400).end();const idea=await Idea.create({title,description,price:Number(price),userId:req.user.id});res.json(idea);});
app.get('/api/ideas/:id',async(req,res)=>{const i=await Idea.findById(req.params.id).populate('userId','name');if(!i)return res.status(404).end();res.json({_id:i._id,title:i.title,description:i.description,price:i.price,userId:i.userId._id,userName:i.userId.name});});
app.delete('/api/ideas/:id',auth,async(req,res)=>{const i=await Idea.findById(req.params.id);if(!i)return res.status(404).end();if(i.userId.toString()!==req.user.id)return res.status(403).end();await i.deleteOne();res.json({ok:true});});

const SPA_HTML=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sell Your Ideas</title><style>body{font-family:Arial,Helvetica,sans-serif;margin:2rem;max-width:700px}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}input,textarea{display:block;margin:0.5rem 0;padding:0.5rem;width:100%;max-width:400px}button{padding:0.5rem 1rem;margin:0.25rem}button.small{padding:0.25rem 0.5rem;font-size:0.8rem}.idea{border:1px solid #ccc;padding:1rem;margin:1rem 0;border-radius:6px}.idea h3{margin:0 0 0.25rem}</style></head><body><header><h1>Sell Your Ideas</h1><nav id="auth"></nav></header><div id="main"></div><script>
const API='/api';
let me=null;
function req(u,o={}){o.credentials='include';o.headers={'Content-Type':'application/json'};return fetch(u,o).then(r=>r.ok?r.json():r.text().then(t=>{throw t}))}
function alertErr(e){alert(e);} 
function renderAuth(){document.getElementById('auth').innerHTML=me?'Hi, '+me.name+' <button onclick="logout()">Logout</button> <button onclick="showNew()">Post Idea</button>':'<button onclick="showLogin()">Login</button> <button onclick="showReg()">Register</button>';}
function refresh(){req(API+'/ideas').then(list=>{let html='';list.forEach(i=>{html+='<div class="idea" onclick="view(\''+i._id+'\')"><h3>'+i.title+'</h3><p>'+i.description+'</p><strong>$'+i.price.toFixed(2)+'</strong><br><small>by '+i.userName+'</small>'+(me&&me.id===i.userId?' <button class="small" onclick="event.stopPropagation();del(\''+i._id+'\')">Delete</button>':'')+'</div>';});document.getElementById('main').innerHTML=html;}).catch(alertErr);} 
function view(id){req(API+'/ideas/'+id).then(i=>{document.getElementById('main').innerHTML='<h2>'+i.title+'</h2><p>'+i.description+'</p><p><strong>$'+i.price.toFixed(2)+'</strong></p><p>by '+i.userName+'</p>'+(me&&me.id===i.userId?' <button onclick="del(\''+i._id+'\')">Delete</button>':'')+' <button onclick="refresh()">Back</button>';}).catch(alertErr);} 
function del(id){req(API+'/ideas/'+id,{method:'DELETE'}).then(refresh).catch(alertErr);} 
function showLogin(){document.getElementById('main').innerHTML='<h2>Login</h2><input id="email" placeholder="Email"><input id="pass" type="password" placeholder="Password"><button onclick="login()">Login</button>';}
function login(){req(API+'/login',{method:'POST',body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('pass').value})}).then(u=>{me=u;renderAuth();refresh();}).catch(alertErr);} 
function showReg(){document.getElementById('main').innerHTML='<h2>Register</h2><input id="name" placeholder="Name"><input id="email" placeholder="Email"><input id="pass" type="password" placeholder="Password (8+)"><button onclick="register()">Register</button>';}
function register(){req(API+'/register',{method:'POST',body:JSON.stringify({name:document.getElementById('name').value,email:document.getElementById('email').value,password:document.getElementById('pass').value})}).then(u=>{me=u;renderAuth();refresh();}).catch(alertErr);} 
function logout(){req(API+'/logout',{method:'POST'}).then(()=>{me=null;renderAuth();refresh();});}
function showNew(){if(!me){alert('Login first');return;}document.getElementById('main').innerHTML='<h2>New Idea</h2><input id="title" placeholder="Title"><textarea id="desc" placeholder="Description"></textarea><input id="price" type="number" min="0" step="0.01" placeholder="Price"><button onclick="postIdea()">Publish</button>';}
function postIdea(){req(API+'/ideas',{method:'POST',body:JSON.stringify({title:document.getElementById('title').value,description:document.getElementById('desc').value,price:Number(document.getElementById('price').value)})}).then(refresh).catch(alertErr);} 
renderAuth();refresh();
</script></body></html>`;

app.get('*',(_req,res)=>res.send(SPA_HTML));

app.listen(PORT,()=>console.log('up '+PORT));
