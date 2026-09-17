const ADMIN_PASSWORD = "StudPost2026!"; // PROTOTYPE ONLY — do not use this approach in production.

const U=()=>JSON.parse(localStorage.getItem("studpost_users")||"[]");
const P=()=>JSON.parse(localStorage.getItem("studpost_posts")||"[]");
const C=()=>JSON.parse(localStorage.getItem("studpost_codes")||"[]");
const saveU=x=>localStorage.setItem("studpost_users",JSON.stringify(x));
const saveC=x=>localStorage.setItem("studpost_codes",JSON.stringify(x));
const $=id=>document.getElementById(id);

$("adminLogin").addEventListener("submit",e=>{
  e.preventDefault();
  if($("adminPassword").value!==ADMIN_PASSWORD){
    $("adminMsg").textContent="Mot de passe incorrect.";
    return;
  }
  sessionStorage.setItem("studpost_admin","1");
  showPanel();
});

$("adminLogout").addEventListener("click",()=>{
  sessionStorage.removeItem("studpost_admin");
  location.reload();
});

function showPanel(){
  $("login").classList.add("hidden");
  $("panel").classList.remove("hidden");
  refresh();
}
function refresh(){
  const users=U(), posts=P();
  $("usersCount").textContent=users.length;
  $("postsCount").textContent=posts.length;
  $("certCount").textContent=users.filter(x=>x.certified).length;
  $("bizCount").textContent=users.filter(x=>x.business).length;
  $("codeUser").innerHTML=users.map(u=>`<option value="${u.id}">${esc(u.name)} — ${esc(u.phone)}</option>`).join("");
  search();
}
function search(){
  const q=$("userSearch").value.trim().toLowerCase();
  const users=U().filter(u=>!q||u.name.toLowerCase().includes(q));
  $("results").innerHTML=users.length?users.map(userRow).join(""):"<p class='muted'>Aucun compte trouvé.</p>";
  document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset.id));
}
function userRow(u){
  const status=u.business?"Business":u.certified?"Certifié":"Normal";
  return `<div class="user-row">
    <strong>${esc(u.name)}</strong> — ${esc(u.phone)}<br>
    <span class="muted">${esc(u.level)} · ${status}</span>
    <div class="actions">
      <button class="danger" data-action="delete" data-id="${u.id}">Supprimer le compte</button>
      <button class="blue" data-action="certify" data-id="${u.id}">Certifier le compte</button>
      <button class="green" data-action="business" data-id="${u.id}">Compte Business</button>
    </div>
  </div>`;
}
function action(type,id){
  let users=U(), u=users.find(x=>x.id===id);
  if(!u)return;
  if(type==="delete"){
    if(!confirm(`Supprimer le compte ${u.name} ?`))return;
    users=users.filter(x=>x.id!==id);
    saveU(users);
  }
  if(type==="certify"){u.certified=true;saveU(users);}
  if(type==="business"){u.business=true;saveU(users);}
  refresh();
}
$("searchBtn").onclick=search;
$("userSearch").addEventListener("input",search);

$("genAccess").onclick=()=>{
  const used=new Set(U().map(u=>u.accessCode));
  let code;
  do{code=String(Math.floor(1000000+Math.random()*9000000));}while(used.has(code));
  $("accessResult").innerHTML=`<strong>Code d'accès :</strong> ${code}<br><small>À transmettre à l'utilisateur.</small>`;
};

$("genPostCode").onclick=()=>{
  const userId=$("codeUser").value;
  let codes=C(), code;
  do{code=String(Math.floor(1000000000+Math.random()*9000000000));}while(codes.some(x=>x.code===code));
  const expires=new Date(); expires.setMonth(expires.getMonth()+3);
  codes.push({code,userId,createdAt:new Date().toISOString(),expiresAt:expires.toISOString(),used:false});
  saveC(codes);
  $("postCodeResult").innerHTML=`<strong>Code Poste :</strong> ${code}<br>Expire le : ${expires.toLocaleDateString("fr-FR")}`;
};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
if(sessionStorage.getItem("studpost_admin")==="1")showPanel();
