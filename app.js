// ---------- UTILITÁRIOS BÁSICOS ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = "finlife-data-v1";

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      renda: [],
      dividas: [],
      metas: [],
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { renda: [], dividas: [], metas: [] };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function showToast(msg) {
  const container = $("#toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<i class='bx bx-check-circle'></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 200);
  }, 2600);
}

// ---------- ESTADO GLOBAL ----------
let state = loadData();

// ---------- NAVEGAÇÃO ENTRE SEÇÕES ----------
function initNavigation() {
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const sectionId = btn.dataset.section;
      $$(".section").forEach((sec) => sec.classList.remove("active"));
      $(`#section-${sectionId}`).classList.add("active");
    });
  });
}

// ---------- THEME ----------
function initTheme() {
  const btn = $("#btnToggleTheme");
  btn.addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}

// ---------- MODAL GENÉRICO ----------
const modalBackdrop = $("#modal-backdrop");
const modalTitle = $("#modal-title");
const modalBody = $("#modal-body");
const modalConfirm = $("#modal-confirm");
const modalCancel = $("#modal-cancel");
const modalClose = $("#modal-close");

let modalConfirmHandler = null;

function openModal({ title, bodyHTML, onConfirm, confirmText = "Salvar" }) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalConfirm.textContent = confirmText;
  modalConfirmHandler = onConfirm;
  modalBackdrop.classList.add("open");
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  modalConfirmHandler = null;
}

modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
modalConfirm.addEventListener("click", () => {
  if (modalConfirmHandler) modalConfirmHandler();
});

// ---------- Renda ----------
function renderRenda() {
  const tbody = $("#renda-tbody");
  const empty = $("#renda-empty");
  tbody.innerHTML = "";
  if (!state.renda.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  state.renda.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.descricao}</td>
      <td>${formatCurrency(r.valor)}</td>
      <td>${r.tipo}</td>
      <td>${new Date(r.data).toLocaleDateString("pt-BR")}</td>
      <td>${r.recorrencia}</td>
      <td>
        <button class="icon-btn" data-edit-renda="${r.id}" title="Editar">
          <i class="bx bx-edit"></i>
        </button>
        <button class="icon-btn" data-del-renda="${r.id}" title="Excluir">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // listeners
  $$("#renda-tbody [data-edit-renda]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editRenda;
      const r = state.renda.find((x) => x.id === id);
      if (r) openRendaModal(r);
    });
  });
  $$("#renda-tbody [data-del-renda]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delRenda;
      state.renda = state.renda.filter((x) => x.id !== id);
      saveData();
      renderAll();
      showToast("Renda removida.");
    });
  });
}

function openRendaModal(renda = null) {
  const isEdit = !!renda;
  openModal({
    title: isEdit ? "Editar renda" : "Nova renda",
    bodyHTML: `
      <div>
        <label>Descrição</label>
        <input id="renda-descricao" type="text" value="${renda ? renda.descricao : ""}" />
      </div>
      <div class="form-row">
        <div>
          <label>Valor (R$)</label>
          <input id="renda-valor" type="number" step="0.01" min="0" value="${renda ? renda.valor : ""}" />
        </div>
        <div>
          <label>Tipo</label>
          <select id="renda-tipo">
            <option value="Fixa" ${renda && renda.tipo === "Fixa" ? "selected" : ""}>Fixa</option>
            <option value="Variável" ${renda && renda.tipo === "Variável" ? "selected" : ""}>Variável</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div>
          <label>Data de recebimento</label>
          <input id="renda-data" type="date" value="${renda ? renda.data.substring(0, 10) : ""}" />
        </div>
        <div>
          <label>Recorrência</label>
          <select id="renda-recorrencia">
            <option value="Mensal" ${renda && renda.recorrencia === "Mensal" ? "selected" : ""}>Mensal</option>
            <option value="Única" ${renda && renda.recorrencia === "Única" ? "selected" : ""}>Única</option>
          </select>
        </div>
      </div>
    `,
    onConfirm: () => {
      const desc = $("#renda-descricao").value.trim();
      const valor = parseFloat($("#renda-valor").value);
      const tipo = $("#renda-tipo").value;
      const data = $("#renda-data").value || new Date().toISOString();
      const recorrencia = $("#renda-recorrencia").value;

      if (!desc || !valor || valor <= 0) {
        alert("Preencha descrição e valor corretamente.");
        return;
      }

      if (isEdit) {
        renda.descricao = desc;
        renda.valor = valor;
        renda.tipo = tipo;
        renda.data = data;
        renda.recorrencia = recorrencia;
      } else {
        state.renda.push({
          id: generateId(),
          descricao: desc,
          valor,
          tipo,
          data,
          recorrencia,
        });
      }
      saveData();
      renderAll();
      closeModal();
      showToast("Renda salva.");
    },
  });
}

$("#btnAddRenda").addEventListener("click", () => openRendaModal());

// ---------- Dívidas & Gastos ----------
function renderDividas() {
  const tbody = $("#dividas-tbody");
  const empty = $("#dividas-empty");
  tbody.innerHTML = "";
  if (!state.dividas.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  state.dividas.forEach((d) => {
    const tr = document.createElement("tr");
    const vencimentoStr = new Date(d.vencimento).toLocaleDateString("pt-BR");
    const statusBadge = d.pago
      ? `<span class="chip chip-green">Pago</span>`
      : `<span class="chip ${isOverdue(d.vencimento) ? "chip-red" : "chip-yellow"}">${
          isOverdue(d.vencimento) ? "Atrasado" : "Em aberto"
        }</span>`;
    tr.innerHTML = `
      <td>${d.descricao}</td>
      <td>${d.categoria}</td>
      <td>${d.tipo}</td>
      <td>${formatCurrency(d.valor)}</td>
      <td>${vencimentoStr}</td>
      <td>${d.essencial ? "Sim" : "Não"}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="icon-btn" data-toggle-pago="${d.id}" title="Marcar pago/não pago">
          <i class="bx bx-check-square"></i>
        </button>
        <button class="icon-btn" data-edit-divida="${d.id}" title="Editar">
          <i class="bx bx-edit"></i>
        </button>
        <button class="icon-btn" data-del-divida="${d.id}" title="Excluir">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $$("#dividas-tbody [data-toggle-pago]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.togglePago;
      const d = state.dividas.find((x) => x.id === id);
      if (d) {
        d.pago = !d.pago;
        saveData();
        renderAll();
        showToast(d.pago ? "Pagamento marcado como concluído." : "Pagamento marcado como em aberto.");
      }
    });
  });

  $$("#dividas-tbody [data-edit-divida]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editDivida;
      const d = state.dividas.find((x) => x.id === id);
      if (d) openDividaModal(d);
    });
  });

  $$("#dividas-tbody [data-del-divida]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delDivida;
      state.dividas = state.dividas.filter((x) => x.id !== id);
      saveData();
      renderAll();
      showToast("Dívida/gasto removido.");
    });
  });
}

function isOverdue(vencimento) {
  const hoje = new Date();
  const data = new Date(vencimento);
  data.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  return data < hoje;
}

function openDividaModal(divida = null) {
  const isEdit = !!divida;
  openModal({
    title: isEdit ? "Editar dívida/gasto" : "Nova dívida/gasto",
    bodyHTML: `
      <div>
        <label>Descrição</label>
        <input id="divida-descricao" type="text" value="${divida ? divida.descricao : ""}" />
      </div>
      <div class="form-row">
        <div>
          <label>Categoria</label>
          <input id="divida-categoria" type="text" value="${divida ? divida.categoria : ""}" placeholder="Ex.: Aluguel, Cartão..." />
        </div>
        <div>
          <label>Tipo</label>
          <select id="divida-tipo">
            <option value="Dívida" ${divida && divida.tipo === "Dívida" ? "selected" : ""}>Dívida</option>
            <option value="Gasto" ${divida && divida.tipo === "Gasto" ? "selected" : ""}>Gasto</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div>
          <label>Valor (R$)</label>
          <input id="divida-valor" type="number" step="0.01" min="0" value="${divida ? divida.valor : ""}" />
        </div>
        <div>
          <label>Vencimento</label>
          <input id="divida-vencimento" type="date" value="${divida ? divida.vencimento.substring(0, 10) : ""}" />
        </div>
      </div>
      <div class="form-row">
        <div>
          <label>Essencial?</label>
          <select id="divida-essencial">
            <option value="true" ${divida && divida.essencial ? "selected" : ""}>Sim</option>
            <option value="false" ${divida && !divida.essencial ? "selected" : ""}>Não</option>
          </select>
        </div>
        <div>
          <label>Recorrência</label>
          <select id="divida-recorrencia">
            <option value="Única" ${divida && divida.recorrencia === "Única" ? "selected" : ""}>Única</option>
            <option value="Mensal" ${divida && divida.recorrencia === "Mensal" ? "selected" : ""}>Mensal</option>
          </select>
        </div>
      </div>
    `,
    onConfirm: () => {
      const desc = $("#divida-descricao").value.trim();
      const categoria = $("#divida-categoria").value.trim() || "Outros";
      const tipo = $("#divida-tipo").value;
      const valor = parseFloat($("#divida-valor").value);
      const vencimento = $("#divida-vencimento").value || new Date().toISOString();
      const essencial = $("#divida-essencial").value === "true";
      const recorrencia = $("#divida-recorrencia").value;

      if (!desc || !valor || valor <= 0) {
        alert("Preencha descrição e valor corretamente.");
        return;
      }

      if (isEdit) {
        divida.descricao = desc;
        divida.categoria = categoria;
        divida.tipo = tipo;
        divida.valor = valor;
        divida.vencimento = vencimento;
        divida.essencial = essencial;
        divida.recorrencia = recorrencia;
      } else {
        state.dividas.push({
          id: generateId(),
          descricao: desc,
          categoria,
          tipo,
          valor,
          vencimento,
          essencial,
          recorrencia,
          pago: false,
        });
      }
      saveData();
      renderAll();
      closeModal();
      showToast("Dívida/gasto salvo.");
    },
  });
}

$("#btnAddDivida").addEventListener("click", () => openDividaModal());

// ---------- Metas ----------
function renderMetas() {
  const grid = $("#metas-grid");
  const empty = $("#metas-empty");
  grid.innerHTML = "";
  if (!state.metas.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  state.metas.forEach((m) => {
    const div = document.createElement("div");
    const perc = Math.min(100, Math.round((m.acumulado / m.valorAlvo) * 100));
    div.className = "meta-card";
    div.innerHTML = `
      <div class="meta-header">
        <div>
          <div class="meta-title">${m.nome}</div>
          <div class="meta-target">Meta: ${formatCurrency(m.valorAlvo)}</div>
        </div>
        <button class="icon-btn" data-del-meta="${m.id}" title="Excluir meta">
          <i class="bx bx-trash"></i>
        </button>
      </div>
      <div class="meta-progress-bar">
        <div class="meta-progress-bar-inner" style="width: ${perc}%"></div>
      </div>
      <div class="meta-footer">
        <span>Progresso: ${perc}%</span>
        <span>Acumulado: ${formatCurrency(m.acumulado)}</span>
      </div>
    `;
    grid.appendChild(div);
  });

  $$("#metas-grid [data-del-meta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delMeta;
      state.metas = state.metas.filter((m) => m.id !== id);
      saveData();
      renderAll();
      showToast("Meta removida.");
    });
  });
}

function openMetaModal(meta = null) {
  const isEdit = !!meta;
  openModal({
    title: isEdit ? "Editar meta" : "Nova meta",
    bodyHTML: `
      <div>
        <label>Nome da meta</label>
        <input id="meta-nome" type="text" value="${meta ? meta.nome : ""}" placeholder="Ex.: Reserva de emergência" />
      </div>
      <div class="form-row">
        <div>
          <label>Valor alvo (R$)</label>
          <input id="meta-valor" type="number" step="0.01" min="0" value="${meta ? meta.valorAlvo : ""}" />
        </div>
        <div>
          <label>Valor acumulado (R$)</label>
          <input id="meta-acumulado" type="number" step="0.01" min="0" value="${meta ? meta.acumulado : 0}" />
        </div>
      </div>
      <div>
        <label>Prazo desejado (opcional)</label>
        <input id="meta-prazo" type="date" value="${meta && meta.prazo ? meta.prazo.substring(0, 10) : ""}" />
      </div>
    `,
    onConfirm: () => {
      const nome = $("#meta-nome").value.trim();
      const valorAlvo = parseFloat($("#meta-valor").value);
      const acumulado = parseFloat($("#meta-acumulado").value || 0);
      const prazo = $("#meta-prazo").value || "";

      if (!nome || !valorAlvo || valorAlvo <= 0) {
        alert("Preencha nome e valor alvo.");
        return;
      }

      if (isEdit) {
        meta.nome = nome;
        meta.valorAlvo = valorAlvo;
        meta.acumulado = acumulado;
        meta.prazo = prazo || null;
      } else {
        state.metas.push({
          id: generateId(),
          nome,
          valorAlvo,
          acumulado,
          prazo: prazo || null,
        });
      }
      saveData();
      renderAll();
      closeModal();
      showToast("Meta salva.");
    },
  });
}

$("#btnAddMeta").addEventListener("click", () => openMetaModal());

// ---------- Dashboard: KPIs, Score e Sugestões ----------
function calcTotals() {
  const totalRenda = state.renda.reduce((sum, r) => sum + (r.valor || 0), 0);
  const totalDividas = state.dividas.reduce((sum, d) => sum + (d.valor || 0), 0);
  return { totalRenda, totalDividas, sobra: totalRenda - totalDividas };
}

function renderKPIs() {
  const { totalRenda, totalDividas, sobra } = calcTotals();
  $("#kpi-renda").textContent = formatCurrency(totalRenda);
  $("#kpi-dividas").textContent = formatCurrency(totalDividas);
  $("#kpi-sobra").textContent = formatCurrency(sobra);

  const label = $("#kpi-sobra-label");
  if (!totalRenda && !totalDividas) {
    label.textContent = "Comece cadastrando renda e dívidas.";
  } else if (sobra > 0) {
    label.textContent = "Você está fechando o mês no azul.";
  } else if (sobra < 0) {
    label.textContent = "Atenção: você está fechando o mês no vermelho.";
  } else {
    label.textContent = "Você está no zero a zero.";
  }
}

function calcFinancialHealthScore() {
  const { totalRenda, totalDividas, sobra } = calcTotals();
  if (totalRenda <= 0) return { score: 0, status: "Em análise", desc: "Cadastre sua renda para calcular o índice." };

  const dti = totalDividas / totalRenda; // dívida/renda
  const sup = state.dividas.filter((d) => !d.essencial);
  const supTotal = sup.reduce((sum, d) => sum + d.valor, 0);
  const supPerc = totalRenda ? supTotal / totalRenda : 0;

  let score = 100;

  // DTI: até 0.3 ok, 0.3–0.5 médio, >0.5 ruim [web:7][web:10]
  if (dti <= 0.3) score -= 0;
  else if (dti <= 0.5) score -= 20;
  else if (dti <= 0.7) score -= 35;
  else score -= 50;

  // Supérfluos: até 0.2 ok, 0.2–0.35 médio, >0.35 ruim [web:5]
  if (supPerc <= 0.2) score -= 0;
  else if (supPerc <= 0.35) score -= 15;
  else score -= 30;

  // Sobra
  if (sobra < 0) score -= 20;
  else if (sobra > 0 && sobra < totalRenda * 0.1) score -= 5;

  // Limites
  if (score < 5) score = 5;
  if (score > 100) score = 100;

  // Status
  let status = "";
  let desc = "";
  if (score >= 80) {
    status = "Saudável";
    desc = "Sua saúde financeira está boa. Mantenha os hábitos e considere aumentar investimentos.";
  } else if (score >= 50) {
    status = "Em atenção";
    desc = "Você está no meio do caminho. Ajustes em dívidas e supérfluos podem melhorar o cenário.";
  } else {
    status = "Em risco";
    desc = "Risco alto. Foque em reduzir dívidas caras e cortar gastos supérfluos.";
  }

  return { score, status, desc };
}

function renderHealthScore() {
  const { score, status, desc } = calcFinancialHealthScore();
  $("#health-score-value").textContent = score;
  const circle = $("#health-score-circle");
  const circumference = 339.292;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  const statusEl = $("#health-status");
  statusEl.textContent = status;
  statusEl.className = "badge";

  if (status === "Saudável") statusEl.classList.add("badge-good");
  else if (status === "Em atenção") statusEl.classList.add("badge-warning");
  else if (status === "Em risco") statusEl.classList.add("badge-bad");
  else statusEl.classList.add("badge-neutral");

  $("#health-desc").textContent = desc;
}

function renderSuggestions() {
  const container = $("#suggestions-list");
  container.innerHTML = "";

  const { totalRenda, totalDividas, sobra } = calcTotals();
  if (!totalRenda && !totalDividas) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-bulb'></i>
      <div>
        <strong>Comece pelo básico</strong>
        <p>Lance sua renda e pelo menos um gasto fixo (como aluguel ou contas) para começar o diagnóstico.</p>
      </div>`;
    container.appendChild(pill);
    return;
  }

  const dti = totalRenda ? totalDividas / totalRenda : 0;
  const sup = state.dividas.filter((d) => !d.essencial);
  const supTotal = sup.reduce((sum, d) => sum + d.valor, 0);
  const supPerc = totalRenda ? supTotal / totalRenda : 0;

  // Sugestão 1: Dívida alta
  if (dti > 0.5) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-error-circle'></i>
      <div>
        <strong>Dívida compromete grande parte da renda</strong>
        <p>Seu percentual de dívidas sobre a renda está elevado. Priorize quitar dívidas caras (cartão, cheque especial) e evite novas parcelas neste momento.</p>
      </div>`;
    container.appendChild(pill);
  } else {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-check-circle'></i>
      <div>
        <strong>Nível de dívida razoável</strong>
        <p>Seu nível de dívidas está sob controle. Aproveite para criar uma reserva de emergência e manter disciplina nos próximos meses.</p>
      </div>`;
    container.appendChild(pill);
  }

  // Sugestão 2: Supérfluos
  if (supPerc > 0.3) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-cut'></i>
      <div>
        <strong>Reduza gastos supérfluos</strong>
        <p>Mais de ${Math.round(supPerc * 100)}% da sua renda está indo para itens não essenciais. Defina um teto mensal para lazer, delivery e compras por impulso.</p>
      </div>`;
    container.appendChild(pill);
  } else if (supPerc > 0.15) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-trending-up'></i>
      <div>
        <strong>Bom equilíbrio de supérfluos</strong>
        <p>Seus gastos supérfluos estão moderados. Continue monitorando para não ultrapassar ${Math.round(0.3 * 100)}% da renda nessa categoria.</p>
      </div>`;
    container.appendChild(pill);
  }

  // Sugestão 3: Sobra
  if (sobra > 0) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-donate-heart'></i>
      <div>
        <strong>Transforme sobra em investimento</strong>
        <p>Você fecha o mês com aproximadamente ${formatCurrency(sobra)} de sobra. Considere destinar parte fixa desse valor para uma meta de longo prazo.</p>
      </div>`;
    container.appendChild(pill);
  } else if (sobra < 0) {
    const pill = document.createElement("div");
    pill.className = "suggestion-pill";
    pill.innerHTML = `
      <i class='bx bx-sad'></i>
      <div>
        <strong>Mês no vermelho</strong>
        <p>Seus gastos superam a renda. Revise dívidas parceladas, renegocie juros quando possível e corte temporariamente despesas não essenciais.</p>
      </div>`;
    container.appendChild(pill);
  }
}

// ---------- Lembretes / Próximos pagamentos ----------
function renderUpcomingAndLembretes() {
  const upcomingList = $("#upcoming-list");
  const lembretesList = $("#lembretes-list");
  upcomingList.innerHTML = "";
  lembretesList.innerHTML = "";

  const hoje = new Date();
  const items = state.dividas
    .filter((d) => !d.pago)
    .map((d) => {
      const data = new Date(d.vencimento);
      const diffDays = Math.round((data - hoje) / (1000 * 60 * 60 * 24));
      return { ...d, diffDays, data };
    })
    .sort((a, b) => a.data - b.data)
    .slice(0, 5);

  if (!items.length) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<div class="list-item-left">
        <span class="list-item-title">Sem compromissos</span>
        <span class="list-item-sub">Nenhuma dívida em aberto com vencimento próximo.</span>
      </div>`;
    upcomingList.appendChild(li);
    const li2 = li.cloneNode(true);
    lembretesList.appendChild(li2);
    return;
  }

  items.forEach((d) => {
    const chipClass = d.diffDays < 0 ? "chip-red" : d.diffDays <= 3 ? "chip-yellow" : "chip-green";
    const chipText =
      d.diffDays < 0 ? "Atrasado" : d.diffDays === 0 ? "Hoje" : d.diffDays === 1 ? "Amanhã" : `Em ${d.diffDays} dias`;
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="list-item-left">
        <span class="list-item-title">${d.descricao} (${d.categoria})</span>
        <span class="list-item-sub">${formatCurrency(d.valor)} • Vence em ${d.data.toLocaleDateString("pt-BR")}</span>
      </div>
      <span class="chip ${chipClass}">${chipText}</span>
    `;
    upcomingList.appendChild(li);

    const li2 = li.cloneNode(true);
    lembretesList.appendChild(li2);
  });
}

// ---------- RENDER GERAL ----------
function renderAll() {
  renderRenda();
  renderDividas();
  renderMetas();
  renderKPIs();
  renderHealthScore();
  renderSuggestions();
  renderUpcomingAndLembretes();
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTheme();
  renderAll();
});

