const PLANTILLA_CLUB = [
    {id: 1, name: "JACOBO #23"}, {id: 2, name: "JOSE MARÍA #7"},
    {id: 3, name: "CARLOS #11"}, {id: 4, name: "ENRIQUE #55"},
    {id: 5, name: "DAVID #3"}, {id: 6, name: "ANTONIO #0"},
    {id: 7, name: "JOSUÉ #18"}, {id: 8, name: "JORGE #78"},
    {id: 9, name: "ANSELMO #34"}, {id: 10, name: "RICARDO #22"},
    {id: 11, name: "GERMÁN #16"}, {id: 12, name: "GODOY #33"},
    {id: 13, name: "IVÁN #13"}, {id: 14, name: "GERMÁN #16"}
];

let players = [];
let rivalScore = 0;
let rivalReb = 0;
let teamTurnovers = 0;
let log = [];

function initApp() {
    const savedStats = JSON.parse(localStorage.getItem('basketV18_stats'));
    rivalScore = parseInt(localStorage.getItem('basketV18_rival')) || 0;
    rivalReb = parseInt(localStorage.getItem('basketV18_rivalReb')) || 0;
    teamTurnovers = parseInt(localStorage.getItem('basketV18_to')) || 0;
    
    players = PLANTILLA_CLUB.map(p => {
        if (savedStats && savedStats[p.id]) return { ...p, ...savedStats[p.id] };
        return { 
            ...p, pts1: 0, miss1: 0, pts2: 0, miss2: 0, pts3: 0, miss3: 0, 
            reb: 0, ast: 0, foul: 0, active: false 
        };
    });
    render();
}

function updateNames() {
    const local = document.getElementById('localNameInput').value.toUpperCase() || "NOSOTROS";
    const visit = document.getElementById('visitNameInput').value.toUpperCase() || "RIVAL";
    document.getElementById('localLabel').innerText = local;
    document.getElementById('visitLabel').innerText = visit;
}

function togglePlayer(id) {
    const p = players.find(x => x.id === id);
    const activos = players.filter(x => x.active).length;
    if (!p.active && activos >= 5) { return; }
    p.active = !p.active;
    render();
}

function addRival(n) { rivalScore += n; log.push({ type: 'rival', val: n }); render(); }
function addRivalReb() { rivalReb++; log.push({ type: 'rivalReb', val: 1 }); render(); }
function addTurnover() { teamTurnovers++; log.push({ type: 'teamTO', val: 1 }); render(); }

function drag(ev) { ev.dataTransfer.setData("type", ev.target.dataset.type); }
function allowDrop(ev) { ev.preventDefault(); ev.currentTarget.classList.add('drag-over'); }
function clearStyles(el) { el.classList.remove('drag-over'); }

function drop(ev, playerId) {
    ev.preventDefault();
    clearStyles(ev.currentTarget);
    const type = ev.dataTransfer.getData("type");
    const p = players.find(x => x.id === playerId);
    
    if (players.filter(x => x.active).length !== 5) {
        document.getElementById('warning-msg').style.display = 'block';
        setTimeout(() => { document.getElementById('warning-msg').style.display = 'none'; }, 3000);
    }
    if(!p || !p.active) return;
    p[type]++;
    log.push({ playerId, type });
    render();
}

function render() {
    localStorage.setItem('basketV18_stats', JSON.stringify(players.reduce((acc, p) => ({...acc, [p.id]: p}), {})));
    localStorage.setItem('basketV18_rival', rivalScore);
    localStorage.setItem('basketV18_rivalReb', rivalReb);
    localStorage.setItem('basketV18_to', teamTurnovers);

    document.getElementById('local-score').innerText = players.reduce((s, p) => s + (p.pts1 * 1) + (p.pts2 * 2) + (p.pts3 * 3), 0);
    document.getElementById('visit-score').innerText = rivalScore;
    document.getElementById('team-turnovers').innerText = teamTurnovers;

    document.getElementById('active-list').innerHTML = players.filter(p => p.active).map(p => {
        const pts = (p.pts1 * 1) + (p.pts2 * 2) + (p.pts3 * 3);
        const att = (p.pts1+p.miss1) + (p.pts2+p.miss2)*2 + (p.pts3+p.miss3)*3;
        return `
        <div class="player-card" ondrop="drop(event, ${p.id})" ondragover="allowDrop(event)" ondragleave="clearStyles(this)">
            <span>${p.name}</span>
            <div style="display:flex; align-items:center; gap:8px">
                <div style="font-size:0.75rem; color:#888; text-align:right; font-weight:500">P:${pts}/${att} R:${p.reb} A:${p.ast} F:${p.foul}</div>
                <b style="color:var(--blue-light); font-size:1.35rem">${pts}</b>
                <button class="btn-toggle active" onclick="togglePlayer(${p.id})">OUT</button>
            </div>
        </div>`;
    }).join('');

    document.getElementById('bench-list').innerHTML = players.filter(p => !p.active).map(p => `
        <div class="player-card bench">
            <span>${p.name}</span>
            <button class="btn-toggle" onclick="togglePlayer(${p.id})">IN</button>
        </div>
    `).join('');
}

function undo() {
    const last = log.pop();
    if (!last) return;
    if (last.type === 'rival') rivalScore -= last.val;
    else if (last.type === 'rivalReb') rivalReb--;
    else if (last.type === 'teamTO') teamTurnovers--;
    else { const p = players.find(x => x.id === last.playerId); if (p) p[last.type]--; }
    render();
}

function exportCSV() {
    let csv = "Jugador,Pts,TL,T2,T3,Reb,Ast,Foul\n";
    players.forEach(p => {
        const total = (p.pts1 * 1) + (p.pts2 * 2) + (p.pts3 * 3);
        csv += `"${p.name}",${total},${p.pts1}/${p.pts1+p.miss1},${p.pts2}/${p.pts2+p.miss2},${p.pts3}/${p.pts3+p.miss3},${p.reb},${p.ast},${p.foul}\n`;
    });
    csv += `\nEQUIPO,Pérdidas: ${teamTurnovers},Rival Reb: ${rivalReb}\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `BasketStats.csv`; a.click();
}

function copySummary() {
    const local = players.reduce((s, p) => s + (p.pts1 * 1) + (p.pts2 * 2) + (p.pts3 * 3), 0);
    let txt = `🏀 FINAL: ${local} - ${rivalScore}\n`;
    txt += `Pérdidas: ${teamTurnovers} | Reb. Rival: ${rivalReb}\n\n`;
    players.filter(p => (p.pts1+p.pts2+p.pts3+p.reb+p.ast+p.foul) > 0).forEach(p => {
        const total = (p.pts1 * 1) + (p.pts2 * 2) + (p.pts3 * 3);
        txt += `• ${p.name}: ${total}p (TL:${p.pts1}/${p.pts1+p.miss1} T2:${p.pts2}/${p.pts2+p.miss2} T3:${p.pts3}/${p.pts3+p.miss3}) R:${p.reb} A:${p.ast} F:${p.foul}\n`;
    });
    navigator.clipboard.writeText(txt); alert("Copiado!");
}

function resetGame() { if(confirm("¿RESET?")) { localStorage.clear(); location.reload(); } }
initApp();
