import{initializeApp} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import{getDatabase, ref, get, child} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import{update} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import{remove, push} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

let currentStoreId = null;
let currentBooksSetId = null;


const firebaseConfig = {
  apiKey: "AIzaSyB6Nl4lf-bZtIID59MfBo6ubGg3veYrPFU",
  authDomain: "knjizare-2d39f.firebaseapp.com",
  databaseURL: "https://knjizare-2d39f-default-rtdb.firebaseio.com",
  projectId: "knjizare-2d39f",
  storageBucket: "knjizare-2d39f.firebasestorage.app",
  messagingSenderId: "907456705016",
  appId: "1:907456705016:web:64bea15ded19ee54be260d"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const rootRef = ref(db);
const getNode = (path) => get(child(rootRef, path)).then(s => s.exists() ? s.val() : null);

async function renderIndex(){
  const container = document.getElementById('lista-knjizara');
  if(!container) return;

  try {
    const knjizare = await getNode('knjizare');
    if(!knjizare){
      container.innerHTML = "<p>Nema podataka.</p>";
      return;
    }

    container.innerHTML = Object.entries(knjizare).map(([id, k]) => `
      <article class="knjizara">
        ${k.logo ? `<img src="${k.logo}" alt="Logo ${k.naziv}">` : ""}
        <h3>${k.naziv ?? ""}</h3>
        <p>${k.adresa ?? ""}</p>
        <a class="btn" href="knjizara.html?id=${id}">Otvori</a>
      </article>`).join('');
    } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Greska pri učitavanju podataka.</p>";
  }
}

renderIndex();


async function renderKnjizara(){
    if(!location.pathname.endsWith("knjizara.html")) return;

    const wrap = document.getElementById("knjizara-wrap");
    if(!wrap) return;

    const id = new URLSearchParams(location.search).get("id");
    if(!id){ 
        wrap.innerHTML = "<p>Nedostaje 'id' u URL-u (npr. knjizara.html?id=...)</p>";
        return;
    }

    const k = await getNode(`knjizare/${id}`);
    if(!k){ 
        wrap.innerHTML = "<p>Knjizara nije nadjena.</p>";
        return;
    }

    const headerHTML = `
        <section class="store-head">
            ${k.logo ? `<img src="${k.logo}" alt="Logo ${k.naziv}" width="200">` : ""}
            <div>
                <h3>${k.naziv ?? ""}</h3>
                <p><strong>Adresa:</strong> ${k.adresa ?? ""}</p>
                <p><strong>Godina osnivanja:</strong> ${k.godinaOsnivanja ?? ""}</p>
                <p><strong>Telefon:</strong> ${k.kontaktTelefon ?? ""}</p>
                <p><strong>Email:</strong> ${k.email ?? ""}</p>
            </div>
        </section>
    `;

    let booksHTML = "<p>Ova knjižara trenutno nema knjiga.</p>";
    if(k.knjige){
        const kolekcija = await getNode(`knjige/${k.knjige}`);
        if(kolekcija){
            const cards = Object.entries(kolekcija).map(([bid,bk]) => `
                <article class="knjiga">
                    ${Array.isArray(bk.slike) && bk.slike[0] ? `<img src="${bk.slike[0]}" alt="${bk.naziv} — naslovna">` : ""}
                    <h3>${bk.naziv ?? ""}</h3>
                    <p>${bk.autor ?? ""}</p>
                    ${bk.cena ? `<p><strong>${bk.cena} RSD</strong></p>` : ""}
                    <a class="btn" href="knjiga.html?k=${bid}&s=${k.knjige}">Detalji</a>
                </article>
            `).join("");

            booksHTML = `
                <section>
                    <h2>Knjige u ponudi</h2>
                    <section class="grid books">${cards}</section>
                </section>
            `;
        }
    }

    wrap.innerHTML = headerHTML + booksHTML;
}

renderKnjizara();

async function renderKnjiga(){
    if(!location.pathname.endsWith("knjiga.html")) return;

    const wrap = document.getElementById("book-wrap");
    if(!wrap) return;

    const q = new URLSearchParams(location.search);
    const kId = q.get("k");
    const sId = q.get("s");
    if(!kId || !sId){
        wrap.innerHTML = "<p>Nedostaju parametri u URL-u (ocekujem ?k=&s=).</p>";
        return;
    }

    const bk = await getNode(`knjige/${sId}/${kId}`);
    if(!bk){
        wrap.innerHTML = "<p>Knjiga nije nadjena.</p>";
        return;
    }

    const imgs = Array.isArray(bk.slike) ? bk.slike : [];
    const mainImg = imgs[0] ? `<img src="${imgs[0]}" alt="${bk.naziv} — naslovna">` : "";
    const thumbs  = imgs.slice(0,6).map(u => 
        `<img src="${u}" alt="Slika ${bk.naziv}">`
    ).join("");

    wrap.innerHTML = `
        <article class="book-detail">
        <div class="book-media">${mainImg}</div>
        <div class="book-info">
            <h2>${bk.naziv ?? ""}</h2>
            <p><strong>Autor:</strong> ${bk.autor ?? ""}</p>
            <p><strong>Zanr:</strong> ${bk.zanr ?? ""}</p>
            <p><strong>Format:</strong> ${bk.format ?? ""}</p>
            <p><strong>Broj strana:</strong> ${bk.brojStrana ?? ""}</p>
            ${bk.cena ? `<p class="price"><strong>Cena:</strong> ${bk.cena} RSD</p>` : ""}
            <h3>Opis</h3>
            <p>${bk.opis ?? ""}</p>
            ${thumbs ? `<div class="thumbs">${thumbs}</div>` : ""}
        </div>
        </article>
    `;

    const thumbsEl = wrap.querySelector(".thumbs");
    if(thumbsEl){
        thumbsEl.addEventListener("click", (e)=>{
            if(e.target.tagName === "IMG"){
                const main = wrap.querySelector(".book-media img");
                if(main) main.src = e.target.src;
            }
        });
    }
}

renderKnjiga();

async function renderAdminTabelaKnjizare(){

  if(!location.pathname.endsWith("admin-knjizare.html")) return;

  const tbody = document.getElementById("tabela-knjizara");
  if(!tbody) return;

  const knjizare = await getNode("knjizare");
  if(!knjizare){
        tbody.innerHTML = "<tr><td colspan='6'>Nema knjizara u bazi.</td></tr>";
        return;
  }

  tbody.innerHTML = Object.entries(knjizare).map(([id,k]) => `
    <tr>
      <td>${k.naziv ?? ""}</td>
      <td>${k.adresa ?? ""}</td>
      <td>${k.godinaOsnivanja ?? ""}</td>
      <td>${k.kontaktTelefon ?? ""}</td>
      <td>${k.email ?? ""}</td>
      <td>
        <button class="btn-sm btn-edit" data-id="${id}">Izmeni</button>
        <button class="btn-sm btn-del" data-id="${id}">Obrisi</button>
      </td>
    </tr>
  `).join("");
}

renderAdminTabelaKnjizare();

function initAdminKnjizare(){
    if(!location.pathname.endsWith("admin-knjizare.html")) return;

    const form = document.querySelector("form.admin");
    if(!form) return;

    document.addEventListener("click", async (e)=>{
        if(e.target.matches(".btn-edit[data-id]")){
            const id = e.target.dataset.id;

            const k = await getNode(`knjizare/${id}`);
            if(!k) return alert("Knjizara nije pronadjena!");

            const els = form.querySelectorAll("input");
            if(els[0]) els[0].value = id;
            if(els[1]) els[1].value = k.naziv ?? "";
            if(els[2]) els[2].value = k.godinaOsnivanja ?? "";
            if(els[3]) els[3].value = k.adresa ?? "";
            if(els[4]) els[4].value = k.kontaktTelefon ?? "";
            if(els[5]) els[5].value = k.email ?? "";
            if(els[6]) els[6].value = k.logo ?? "";

            currentStoreId = id;
            currentBooksSetId = k.knjige || null;
            renderAdminBooks(currentBooksSetId);

            form.scrollIntoView({behavior:"smooth"});
        }
    });
}

initAdminKnjizare();

function initAdminSaveKnjizara(){
    if(!location.pathname.endsWith("admin-knjizare.html")) return;

    const form = document.querySelector("form.admin");
    if(!form) return;

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const els = form.querySelectorAll("input");
        const id = els[0].value.trim();
        const naziv = els[1].value.trim();
        const godina = parseInt(els[2].value.trim());
        const adresa = els[3].value.trim();
        const telefon = els[4].value.trim();
        const email = els[5].value.trim();
        const logo = els[6].value.trim();

        if(!naziv){ alert("Naziv je obavezan!"); return; }
        if(!adresa){ alert("Adresa je obavezna!"); return; }
        if(!email.includes("@")){ alert("Email nije validan!"); return; }
        if(isNaN(godina) || godina < 1800 || godina > new Date().getFullYear()){
        alert("Godina osnivanja nije validna!"); return;
        }

        try {
            await update(ref(db, `knjizare/${id}`), {
                naziv, godinaOsnivanja: godina, adresa, kontaktTelefon: telefon, email, logo
            });

            alert("Izmene sacuvane!");
            renderAdminTabelaKnjizare();
        }   catch(err){
            console.error(err);
            alert("Greska pri cuvanju izmena.");
            }
    });
}

initAdminSaveKnjizara();

function initAdminDeleteKnjizara(){
    const tbody = document.getElementById("tabela-knjizara");
    if(!tbody) return;

    document.addEventListener("click", async (e)=>{
        if(e.target.matches(".btn-del[data-id]")){
            const id = e.target.dataset.id;

            if(!confirm("Da li ste sigurni da zelite da obrisete ovu knjizaru?")) return;

            try{
                await remove(ref(db, `knjizare/${id}`));
                alert("Knjizara je obrisana.");
                renderAdminTabelaKnjizare();
            }catch(err){
            console.error("Greska pri brisanju:", err);
            alert("Greska pri brisanju knjižare.");
            }
        }
    });
}

initAdminDeleteKnjizara();

async function renderAdminBooks(booksSetId){
    const list = document.getElementById("books-list");
    if(!list) return;

    if(!booksSetId){
        list.innerHTML = `<p>Ova knjizara nema povezanu kolekciju knjiga.</p>`;
        return;
    }

    const kolekcija = await getNode(`knjige/${booksSetId}`);
    if(!kolekcija){
        list.innerHTML = `<p>Jos nema dodatih knjiga.</p>`;
        return;
    }

    list.innerHTML = Object.entries(kolekcija).map(([bid, bk]) => `
        <article class="knjiga">
            ${Array.isArray(bk.slike) && bk.slike[0] ? `<img src="${bk.slike[0]}" alt="${bk.naziv}">` : ""}
            <h3>${bk.naziv ?? ""}</h3>
            <p>${bk.autor ?? ""}</p>
            ${bk.cena ? `<p><strong>${bk.cena} RSD</strong></p>` : ""}
            <button class="btn-sm btn-del btn-del-book" data-bid="${bid}" data-sid="${booksSetId}">Obrisi</button>
        </article>
    `).join("");
}

function initAdminDeleteBook(){
    const list = document.getElementById("books-list");
    if(!list) return;

    document.addEventListener("click", async (e)=>{
        if(e.target.matches(".btn-del-book[data-bid][data-sid]")){
            const bid = e.target.dataset.bid;
            const sid = e.target.dataset.sid;
            if(!confirm("Obrisati ovu knjigu?")) return;

            try{
                await remove(ref(db, `knjige/${sid}/${bid}`));
                alert("Knjiga obrisana.");
                renderAdminBooks(sid);
            }catch(err){
                console.error("Greska pri brisanju knjige:", err);
                alert("Neuspesno brisanje knjige.");
            }
        }
    });
}
initAdminDeleteBook();

function initAdminAddBook(){
    const formBook = document.getElementById("form-book");
    if(!formBook) return;

    formBook.addEventListener("submit", async (e)=>{
        e.preventDefault();

        if(!currentBooksSetId){
            alert("Prvo izaberite knjizaru (klikom na Izmeni), da bih znao u koju kolekciju dodajem.");
            return;
        }

        const els = formBook.querySelectorAll("input, textarea");
        const naziv  = els[0].value.trim();
        const autor  = els[1].value.trim();
        const zanr   = els[2].value.trim();
        const cena   = parseInt(els[3].value.trim());
        const brStr  = parseInt(els[4].value.trim());
        const format = els[5].value.trim();
        const slikeIn= els[6].value.trim();
        const opis   = els[7].value.trim();

        if(!naziv || !autor){ alert("Naziv i autor su obavezni."); return; }
        if(els[3].value && (isNaN(cena) || cena < 0)){ alert("Cena nije validna."); return; }
        if(els[4].value && (isNaN(brStr) || brStr < 1)){ alert("Broj strana nije validan."); return; }

        let slike = [];
        if(slikeIn){
            slike = slikeIn.split(",").map(s => s.trim()).filter(Boolean);
        }

        const nova ={
            naziv, autor,
            zanr: zanr || null,
            cena: isNaN(cena) ? null : cena,
            brojStrana: isNaN(brStr) ? null : brStr,
            format: format || null,
            opis: opis || null,
            slike: slike.length ? slike : null
        };

        try{
            await push(ref(db, `knjige/${currentBooksSetId}`), nova);
            alert("Knjiga dodata.");
            formBook.reset();
            renderAdminBooks(currentBooksSetId);
        }catch(err){
            console.error("Greska pri dodavanju knjige:", err);
            alert("Neuspesno dodavanje knjige.");
        }
    });
}
initAdminAddBook();

async function renderAdminTabelaKorisnici(){
    const tbody = document.getElementById("tabela-korisnika");
    if(!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6">Ucitavam...</td></tr>`;

    try{
        const korisnici = await getNode("korisnici");
        if(!korisnici || Object.keys(korisnici).length === 0){
            tbody.innerHTML = `<tr><td colspan="6">Nema korisnika u bazi.</td></tr>`;
            return;
        }

        tbody.innerHTML = Object.entries(korisnici).map(([id,u]) => `
            <tr>
                <td>${u.korisnickoIme ?? ""}</td>
                <td>${(u.ime ?? "")} ${(u.prezime ?? "")}</td>
                <td>${u.email ?? ""}</td>
                <td>${u.telefon ?? ""}</td>
                <td>${u.adresa ?? ""}</td>
                <td>
                    <button class="btn-sm btn-edit" data-id="${id}">Izmeni</button>
                    <button class="btn-sm btn-del"  data-id="${id}">Obriši</button>
                </td>
            </tr>
        `).join("");

    }catch(err){
        console.error("[admin] Greska pri citanju /korisnici:", err);
        tbody.innerHTML = `<tr><td colspan="6">Greska pri ucitavanju.</td></tr>`;
    }
}

renderAdminTabelaKorisnici();

function initAdminKorisniciEdit(){
    const form = document.querySelector("#admin-korisnik-form form.admin")
    if(!form) return;

    document.addEventListener("click", async (e)=>{
        if(e.target.matches(".btn-edit[data-id]")){
            const id = e.target.dataset.id;

            try{
                const u = await getNode(`korisnici/${id}`);
                if(!u){ alert("Korisnik nije pronadjen!"); return; }

                const els = form.querySelectorAll("input, textarea");
                if(els[0]) els[0].value = u.korisnickoIme ?? "";
                if(els[1]) els[1].value = u.lozinka ?? "";
                if(els[2]) els[2].value = u.ime ?? "";
                if(els[3]) els[3].value = u.prezime ?? "";
                if(els[4]) els[4].value = u.email ?? "";
                if(els[5]) els[5].value = u.datumRodjenja ?? "";
                if(els[6]) els[6].value = u.adresa ?? "";
                if(els[7]) els[7].value = u.telefon ?? "";
                if(els[8]) els[8].value = u.zanimanje ?? "";

                form.dataset.id = id;

                form.scrollIntoView({behavior:"smooth"});
            }catch(err){
                console.error("[admin] read user:", err);
                alert("Greska pri citanju korisnika.");
            }
        }
    });
}
initAdminKorisniciEdit();

function initAdminSaveKorisnik(){
    const form = document.querySelector("#admin-korisnik-form form.admin");
    if(!form) return;

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const id = form.dataset.id;
        if(!id){alert("Prvo izaberite korisnika klikom na Izmeni."); return;}

        const els = form.querySelectorAll("input, textarea");
        const korisnickoIme = els[0]?.value.trim();
        const lozinka       = els[1]?.value.trim();
        const ime           = els[2]?.value.trim();
        const prezime       = els[3]?.value.trim();
        const email         = els[4]?.value.trim();
        const datumRodjenja = els[5]?.value.trim();
        const adresa        = els[6]?.value.trim();
        const telefon       = els[7]?.value.trim();
        const zanimanje     = els[8]?.value.trim();

        if(!korisnickoIme){alert("Korisnicko ime je obavezno."); return;}
        if(!email || !email.includes("@")){alert("Email nije validan."); return;}

        try{
            await update(ref(db, `korisnici/${id}`), {
            korisnickoIme,
            lozinka,
            ime,
            prezime,
            email,
            datumRodjenja: datumRodjenja || null,
            adresa: adresa || null,
            telefon: telefon || null,
            zanimanje: zanimanje || null
        });

        alert("Izmene sacuvane!");
        renderAdminTabelaKorisnici();
        }catch(err){
            console.error("Greska pri cuvanju korisnika:", err);
            alert("Neuspesno cuvanje izmena.");
        }
    });
}
initAdminSaveKorisnik();

function initAdminDeleteKorisnik(){
    const tbody = document.getElementById("tabela-korisnika");
    if(!tbody) return;

    document.addEventListener("click", async (e)=>{
        if(e.target.matches(".btn-del[data-id]")){
            const id = e.target.dataset.id;
            if(!confirm("Obrisati ovog korisnika?")) return;

            try{
                await remove(ref(db, `korisnici/${id}`));
                alert("Korisnik obrisan.");
                renderAdminTabelaKorisnici();
            }catch(err){
                console.error("[admin] remove user:", err);
                alert("Greska pri brisanju.");
            }
        }
    });
}
initAdminDeleteKorisnik();

function openModal(which){
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById(`modal-${which}`);
    if(!modal || !overlay) return;

    overlay.hidden = false;
    modal.hidden = false;

    const firstInput = modal.querySelector('input');
    if(firstInput) firstInput.focus();

    document.body.style.overflow = 'hidden';
}

function closeModals(){
    document.getElementById('overlay')?.setAttribute('hidden','');
    document.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden',''));
    document.body.style.overflow = '';
}

function initAuthPopups(){
    document.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-open]');
        if(btn){
            e.preventDefault();
            const target = btn.getAttribute('data-open');
            openModal(target);
        }
        if(e.target.matches('[data-close]') || e.target.id === 'overlay'){
            closeModals();
        }
    });

    document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') closeModals();
    });
}

initAuthPopups();

let currentUser = null;

function updateAuthLinks(){
    const loginLink = document.getElementById("nav-login");
    const registerLink = document.getElementById("nav-register");
    const logoutLink = document.getElementById("nav-logout");

    if(currentUser){
        loginLink.hidden = true;
        registerLink.hidden = true;
        logoutLink.hidden = false;
    }else{
        loginLink.hidden = false;
        registerLink.hidden = false;
        logoutLink.hidden = true;
    }
}

function initAuthLinks(){
    const logoutLink = document.getElementById("nav-logout");
    if(logoutLink){
        logoutLink.addEventListener("click", (e)=>{
            e.preventDefault();
            currentUser = null;
            localStorage.removeItem("currentUser");
            updateAuthLinks();
            alert("Uspesno ste se odjavili.");
            
        });
    }
}

initAuthLinks();
updateAuthLinks();

function findUserByCreds(usersObj, username, password){
    for(const [id, u] of Object.entries(usersObj || {})){
        if((u.korisnickoIme || "").trim().toLowerCase() === username.toLowerCase()
            && (u.lozinka || "") === password){
            return { id, ...u };
        }
    }
    return null;
}

function initLogin(){
    const form = document.getElementById("login-form");
    if(!form) return;

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const els = form.querySelectorAll("input");
        const korisnickoIme = els[0].value.trim();
        const lozinka       = els[1].value.trim();

        if(!korisnickoIme || !lozinka){
            alert("Unesite korisnicko ime i lozinku.");
            return;
        }

        try{
            const users = await getNode("korisnici");
            const match = findUserByCreds(users, korisnickoIme, lozinka);

            if(!match){
                alert("Pogrešno korisničko ime ili lozinka.");
                return;
            }

            currentUser = { id: match.id, korisnickoIme: match.korisnickoIme };

            localStorage.setItem("currentUser", JSON.stringify(currentUser));

            form.reset();
            closeModals();
            updateAuthLinks();
            alert(`Dobro dosli, ${currentUser.korisnickoIme}!`);

        }catch(err){
            console.error("[login] greska:", err);
            alert("Greska pri prijavi. Pokusajte ponovo.");
        }
    });
}
initLogin();

(function restoreSession(){
    try{
        const raw = localStorage.getItem("currentUser");
        if(raw){
            currentUser = JSON.parse(raw);
        }
    }catch{}
    updateAuthLinks();
})();

function initRegister(){
    const form = document.getElementById("register-form");
    if(!form) return;

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const els = form.querySelectorAll("input");
        const korisnickoIme = els[0].value.trim();
        const lozinka       = els[1].value.trim();
        const ime           = els[2].value.trim();
        const prezime       = els[3].value.trim();
        const email         = els[4].value.trim();
        const telefon       = els[5].value.trim();
        const adresa        = els[6].value.trim();

        if(korisnickoIme.length < 3){ alert("Korisnicko ime mora imati bar 3 karaktera."); return; }
        if(lozinka.length < 6){ alert("Lozinka mora imati bar 6 karaktera."); return; }
        if(!email.includes("@")){ alert("Email nije validan."); return; }

        try{
            await push(ref(db, "korisnici"), {
                korisnickoIme,
                lozinka,
                ime,
                prezime,
                email,
                telefon: telefon || null,
                adresa: adresa || null,
                datumRegistracije: new Date().toISOString()
            });

            alert("Registracija uspesna!");
            form.reset();
            closeModals();

        }catch(err){
            console.error("[register] greska:", err);
            alert("Greska pri registraciji.");
        }
    });
}
initRegister();

let _cacheStoresIndex = null;

function debounce(fn, wait=200){
    let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

async function renderIndexStores(){
    const grid = document.getElementById("stores-grid");
    if(!grid) return;

    grid.innerHTML = `<p>Učitavam...</p>`;
    try{
        const knjizare = await getNode("knjizare");
        _cacheStoresIndex = knjizare || {};
        applyStoreSearchFilter();
    }catch(err){
        console.error("[index] /knjizare:", err);
        grid.innerHTML = `<p>Greška pri učitavanju podataka.</p>`;
    }
}

function applyStoreSearchFilter(){
    const grid = document.getElementById("stores-grid");
    if(!grid) return;
    const q = (document.getElementById("search-stores-input")?.value || "")
            .trim().toLowerCase();

    const entries = Object.entries(_cacheStoresIndex || {});
    const filtered = !q ? entries : entries.filter(([id,k])=>{
        return (k?.naziv ?? "").toLowerCase().includes(q);
    });

    if(filtered.length === 0){
        grid.innerHTML = `<p>Nema rezultata.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(([id,k])=> `
        <article class="knjizara">
            <img src="${k.logo || ''}" alt="${k.naziv || ''}">
            <h3>${k.naziv || ""}</h3>
            <p>${k.adresa || ""}</p>
            <a class="btn" href="knjizara.html?id=${id}">Otvori</a>
        </article>
    `).join("");
}

(function initIndexSearch(){
    const inp = document.getElementById("search-stores-input");
    if(!inp) return;
    inp.addEventListener("input", debounce(applyStoreSearchFilter, 120));
})();

renderIndexStores();

