/* =====================================================================
   AVENTURA 365 UAEMéx - Lógica de la experiencia
   JavaScript vanilla, compatible con GitHub Pages.
   ===================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIGURACIÓN EDITABLE
     Cambia aquí el número de WhatsApp si la campaña usa otro contacto.
     ------------------------------------------------------------------ */
  const CONFIG = {
    WHATSAPP_NUMBER: "527225123478",
  };
  const SHOW_ADMIN_EXPORT = false;

  const STORAGE_KEYS = {
    PARTICIPANT: "aventura365Participante",
    PROGRESS: "aventura365Progreso",
    RECORDS: "aventura365Registros",
    LEGACY_STATE: "ddePasaporteEstadoVisualV2",
    LEGACY_STATE_OLD: "ddePasaporteEstado",
    LEGACY_RECORDS: "ddePasaporteRegistros",
  };

  const STATIONS = [
    {
      id: "fomento",
      numero: 1,
      area: "Fomento Empresarial",
      titulo: "Estación 1: Fomento Empresarial",
      ubicacion: "Facultad de Arquitectura y Diseño",
      indicacion: "Dirígete a la Facultad de Arquitectura y Diseño. Busca el cartel de Fomento Empresarial, lee la información y responde la adivinanza para desbloquear la siguiente estación.",
      adivinanza: [
        "Nací de un problema que alguien logró observar,",
        "no soy negocio todavía, pero puedo comenzar.",
        "Si me estudias, preguntas y buscas solución,",
        "puedo convertirme en proyecto con visión.",
        "",
        "¿Qué soy?",
      ],
      respuestasAceptadas: ["oportunidad", "una oportunidad", "oportunidades"],
      mensajeCorrecto: "¡Correcto! Fomento Empresarial impulsa la cultura emprendedora, la detección de oportunidades y el desarrollo inicial de competencias. Ahora continúa hacia la Facultad de Derecho.",
      mensajeIncorrecto: "Aún no es la respuesta. Lee nuevamente la adivinanza del cartel y vuelve a intentarlo.",
      motivacion: "Primera pista resuelta. Ahora avanza a la Facultad de Derecho.",
      insignia: { nombre: "Fomento Empresarial", icono: "🧭" },
    },
    {
      id: "unidades",
      numero: 2,
      area: "Unidades de Emprendimiento",
      titulo: "Estación 2: Unidades de Emprendimiento",
      ubicacion: "Facultad de Derecho",
      indicacion: "Dirígete a la Facultad de Derecho. Busca el cartel de Unidades de Emprendimiento, lee la información y responde la adivinanza para desbloquear la última estación.",
      adivinanza: [
        "Una idea sola puede empezar,",
        "pero con más talento puede avanzar.",
        "Alguien crea, alguien organiza,",
        "otro comunica y otro analiza.",
        "",
        "Si todos colaboran con un mismo objetivo,",
        "el proyecto se vuelve más fuerte y creativo.",
        "",
        "¿Qué soy?",
      ],
      respuestasAceptadas: ["equipo", "un equipo", "equipo emprendedor", "trabajo en equipo"],
      mensajeCorrecto: "¡Muy bien! Las Unidades de Emprendimiento conectan talento universitario, equipos, retos y experiencias como Hackathon, Bootcamp, Emprende Academy 365 y Demo Day. Ya casi terminas la aventura.",
      mensajeIncorrecto: "Todavía no es la respuesta. Observa la pista: la clave está en colaborar con otros talentos.",
      motivacion: "¡Ya casi terminas Aventura 365! Solo falta la última estación.",
      insignia: { nombre: "Unidades de Emprendimiento", icono: "🤝" },
    },
    {
      id: "incubacion",
      numero: 3,
      area: "Incubación de la Innovación",
      titulo: "Estación 3: Incubación de la Innovación",
      ubicacion: "Facultad de Contaduría y Administración",
      indicacion: "Dirígete a la Facultad de Contaduría y Administración. Busca el cartel de Incubación de la Innovación, lee la información y responde la última adivinanza para completar Aventura 365.",
      adivinanza: [
        "No basta con tener una idea brillante,",
        "hay que saber para quién será importante.",
        "Defino cliente, valor y operación,",
        "también ingresos, mercado y proyección.",
        "",
        "Con mentoría puedo crecer,",
        "y hacia el mercado me puedo mover.",
        "",
        "¿Qué soy?",
      ],
      respuestasAceptadas: ["modelo de negocio", "modelo", "modelo empresarial", "modelo de negocios"],
      mensajeCorrecto: "¡Felicidades! Completaste las tres estaciones de Aventura 365. Ya conoces Fomento Empresarial, Unidades de Emprendimiento e Incubación de la Innovación.",
      mensajeIncorrecto: "Casi lo logras. La respuesta se relaciona con la forma en que un proyecto define cliente, valor, operación, mercado e ingresos.",
      motivacion: "¡Aventura completada! Desbloqueaste tu insignia de ganador.",
      insignia: { nombre: "Incubación de la Innovación", icono: "🚀" },
    },
  ];

  const AREAS = STATIONS.map((station) => station.id);
  const STATION_BY_ID = STATIONS.reduce((map, station) => {
    map[station.id] = station;
    return map;
  }, {});

  const DEFAULT_STATE = {
    participante: null,
    progreso: { fomento: false, unidades: false, incubacion: false },
    puntos: 0,
    folio: "",
    fechaFinalizacion: "",
    respuestasCorrectas: [],
    completado: false,
  };

  const $ = (selector, context) => (context || document).querySelector(selector);
  const $$ = (selector, context) => Array.from((context || document).querySelectorAll(selector));

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function migrateLegacyState() {
    const legacy = safeJsonParse(localStorage.getItem(STORAGE_KEYS.LEGACY_STATE), null)
      || safeJsonParse(localStorage.getItem(STORAGE_KEYS.LEGACY_STATE_OLD), null);
    if (!legacy || !legacy.participante) return cloneDefaultState();
    return {
      ...cloneDefaultState(),
      participante: legacy.participante,
    };
  }

  function loadState() {
    const state = cloneDefaultState();
    const participant = safeJsonParse(localStorage.getItem(STORAGE_KEYS.PARTICIPANT), null);
    const progress = safeJsonParse(localStorage.getItem(STORAGE_KEYS.PROGRESS), null);

    if (participant || progress) {
      state.participante = participant;
      if (progress && typeof progress === "object") {
        state.progreso = { ...state.progreso, ...(progress.progreso || {}) };
        state.puntos = Math.max(0, Number(progress.puntos) || 0);
        state.folio = progress.folio || "";
        state.fechaFinalizacion = progress.fechaFinalizacion || "";
        state.respuestasCorrectas = Array.isArray(progress.respuestasCorrectas) ? progress.respuestasCorrectas : [];
        state.completado = !!progress.completado;
      }
      return state;
    }

    return migrateLegacyState();
  }

  let state = loadState();
  let currentStation = null;
  let lastFocusedElement = null;

  const screens = $$("[data-screen]");
  const formRegistro = $("#formRegistro");
  const registroError = $("#registroError");
  const modalMission = $("#modalMision");
  const modalAction = $("#modalAccion");
  const missionPanel = $(".pas-modal__panel", modalMission);
  const actionPanel = $(".pas-modal__panel", modalAction);
  const viewPlay = $("#missionView-play");
  const viewResult = $("#missionView-result");
  const optionsContainer = $("#misionOpciones");
  const missionHint = $("#misionPista");
  const continueButton = $("#btnContinuarMapa");
  const exportButton = $("#btnExportar");

  function saveState() {
    try {
      if (state.participante) {
        localStorage.setItem(STORAGE_KEYS.PARTICIPANT, JSON.stringify(state.participante));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PARTICIPANT);
      }

      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({
        progreso: state.progreso,
        puntos: state.puntos,
        folio: state.folio,
        fechaFinalizacion: state.fechaFinalizacion,
        respuestasCorrectas: state.respuestasCorrectas,
        completado: state.completado,
      }));
    } catch (error) {
      showToast("El navegador no permitió guardar el progreso. Puedes continuar en esta sesión.");
    }
  }

  function clearAdventureStorage() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      /* La experiencia se reinicia aunque el navegador bloquee localStorage. */
    }
  }

  /* ------------------------------------------------------------------
     NAVEGACION, TOASTS Y MODALES
     ------------------------------------------------------------------ */
  function showScreen(id) {
    screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "pas-toast";
    toast.textContent = message;
    $("#toastRegion").appendChild(toast);
    window.setTimeout(() => toast.remove(), 4300);
  }

  function setBodyModalState() {
    const anyOpen = modalMission.classList.contains("is-open") || modalAction.classList.contains("is-open");
    document.body.classList.toggle("pas-modal-open", anyOpen);
  }

  function openMissionModal() {
    lastFocusedElement = document.activeElement;
    modalMission.classList.add("is-open");
    modalMission.setAttribute("aria-hidden", "false");
    setBodyModalState();
    window.setTimeout(() => missionPanel.focus(), 0);
  }

  function closeMissionModal() {
    modalMission.classList.remove("is-open");
    modalMission.setAttribute("aria-hidden", "true");
    currentStation = null;
    setBodyModalState();
    if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
  }

  function openActionModal({ eyebrow, title, text, buttons }) {
    lastFocusedElement = document.activeElement;
    $("#actionModalEyebrow").textContent = eyebrow || "Aventura 365";
    $("#actionModalTitle").textContent = title;
    $("#actionModalText").textContent = text || "";

    const buttonsContainer = $("#actionModalButtons");
    buttonsContainer.innerHTML = "";
    (buttons || []).forEach((buttonConfig) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pas-btn ${buttonConfig.className || "pas-btn--outline"}`;
      button.textContent = buttonConfig.label;
      button.addEventListener("click", buttonConfig.onClick);
      buttonsContainer.appendChild(button);
    });

    modalAction.classList.add("is-open");
    modalAction.setAttribute("aria-hidden", "false");
    setBodyModalState();
    window.setTimeout(() => actionPanel.focus(), 0);
  }

  function closeActionModal() {
    modalAction.classList.remove("is-open");
    modalAction.setAttribute("aria-hidden", "true");
    setBodyModalState();
    if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
  }

  /* ------------------------------------------------------------------
     REGISTRO DEL PARTICIPANTE
     ------------------------------------------------------------------ */
  function prefillRegistration() {
    if (!state.participante) return;
    const participant = state.participante;
    ["nombre", "espacio", "programa", "semestre", "correo", "telefono"].forEach((field) => {
      if (formRegistro.elements[field]) formRegistro.elements[field].value = participant[field] || "";
    });
    formRegistro.elements.consentimiento.checked = true;
  }

  function clearFieldErrors() {
    $$("[aria-invalid]", formRegistro).forEach((field) => field.removeAttribute("aria-invalid"));
    registroError.hidden = true;
    registroError.textContent = "";
  }

  function validateRegistration() {
    clearFieldErrors();
    const fields = ["nombre", "espacio", "programa", "semestre", "correo", "telefono"];
    const missing = fields.filter((name) => !String(formRegistro.elements[name].value || "").trim());
    const email = formRegistro.elements.correo.value.trim();
    const phoneDigits = formRegistro.elements.telefono.value.replace(/\D/g, "");

    if (missing.length) {
      missing.forEach((name) => formRegistro.elements[name].setAttribute("aria-invalid", "true"));
      return { valid: false, message: "Completa todos los campos marcados para iniciar Aventura 365." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formRegistro.elements.correo.setAttribute("aria-invalid", "true");
      return { valid: false, message: "Escribe un correo personal válido, por ejemplo: nombre@gmail.com." };
    }
    if (phoneDigits.length < 10) {
      formRegistro.elements.telefono.setAttribute("aria-invalid", "true");
      return { valid: false, message: "El teléfono debe tener al menos 10 dígitos." };
    }
    if (!formRegistro.elements.consentimiento.checked) {
      return { valid: false, message: "Necesitamos tu aceptación para registrar la participación y dar seguimiento." };
    }
    return { valid: true };
  }

  function participantFromForm() {
    return {
      nombre: formRegistro.elements.nombre.value.trim(),
      espacio: formRegistro.elements.espacio.value.trim(),
      programa: formRegistro.elements.programa.value.trim(),
      semestre: formRegistro.elements.semestre.value,
      correo: formRegistro.elements.correo.value.trim(),
      telefono: formRegistro.elements.telefono.value.trim(),
      registradoEn: new Date().toISOString(),
    };
  }

  formRegistro.addEventListener("submit", (event) => {
    event.preventDefault();
    const validation = validateRegistration();
    if (!validation.valid) {
      registroError.textContent = validation.message;
      registroError.hidden = false;
      registroError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    state.participante = participantFromForm();
    saveState();
    updateView();
    showScreen("screen-mapa");
      showToast(`¡Excelente, ${firstName(state.participante.nombre)}! Tu Aventura 365 ha comenzado. Dirígete a la primera estación para encontrar la primera pista.`);
  });

  function firstName(fullName) {
    return String(fullName || "explorador").trim().split(/\s+/)[0];
  }

  /* ------------------------------------------------------------------
     ESTADO VISUAL, DESBLOQUEOS Y PUNTOS
     ------------------------------------------------------------------ */
  function completedCount() {
    return AREAS.filter((area) => state.progreso[area]).length;
  }

  function isAreaUnlocked(area) {
    const index = AREAS.indexOf(area);
    return index === 0 || !!state.progreso[AREAS[index - 1]];
  }

  function motivationFor(count) {
    if (count === 1) return "Primera pista resuelta. Ahora avanza a la Facultad de Derecho.";
    if (count === 2) return "¡Ya casi terminas Aventura 365! Solo falta la última estación.";
    if (count === 3) return "¡Aventura completada! Desbloqueaste tu insignia de ganador.";
    return "Tu primera misión está lista. Dirígete a la Facultad de Arquitectura y Diseño.";
  }

  function updateView() {
    const count = completedCount();
    const percentage = (count / AREAS.length) * 100;

    $("#topbarPoints").textContent = state.puntos;
    $("#topbarCount").textContent = `${count}/3`;
    $("#topbarBadges").textContent = count;
    $("#pointsDisplay").textContent = state.puntos;
    $("#stationsDisplay").textContent = `${count}/3`;
    $("#badgesDisplay").textContent = count;
    $("#progressFill").style.width = `${percentage}%`;
    $("#progressLabel").textContent = `${count}/3 estaciones completadas`;
    $("#progressBar").setAttribute("aria-valuenow", String(count));
    $("#mapParticipantName").textContent = state.participante ? firstName(state.participante.nombre) : "explorador";

    const motivation = $("#motivationMessage");
    motivation.textContent = motivationFor(count);
    motivation.classList.toggle("is-almost", count === 2);

    STATIONS.forEach((station) => {
      const area = station.id;
      const stationCard = $(`.pas-station[data-area="${area}"]`);
      const button = $(`[data-open-mission="${area}"]`, stationCard);
      const status = $(".pas-station__status", stationCard);
      const complete = !!state.progreso[area];
      const unlocked = isAreaUnlocked(area);

      stationCard.classList.toggle("is-complete", complete);
      stationCard.classList.toggle("is-locked", !unlocked);
      button.disabled = complete || !unlocked;

      if (complete) {
        button.textContent = "Insignia obtenida";
        status.textContent = "Pista resuelta";
      } else if (unlocked) {
        button.textContent = "Responder adivinanza";
        status.textContent = "Disponible";
      } else {
        button.textContent = "🔒 Bloqueada";
        status.textContent = `Completa la estación ${station.numero - 1}`;
      }

      const badge = $(`.pas-badge[data-badge="${area}"]`);
      if (badge) badge.classList.toggle("is-earned", complete);
    });

    $("#btnVerFinal").hidden = count < 3;
  }

  function generateFolio() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
    return `A365-UAEMEX-${year}-${random}`;
  }

  function ensureCompletionData() {
    if (!state.folio) state.folio = generateFolio();
    if (!state.fechaFinalizacion) state.fechaFinalizacion = new Date().toISOString();
    state.completado = completedCount() === 3;
  }

  function stationById(id) {
    return STATION_BY_ID[id];
  }

  function completeStation(station, submittedAnswer) {
    if (state.progreso[station.id]) return;
    state.progreso[station.id] = true;
    state.puntos += 100;
    state.respuestasCorrectas.push({
      estacion: station.id,
      respuesta: submittedAnswer,
      fecha: new Date().toISOString(),
    });
    if (completedCount() === 3) ensureCompletionData();
    saveState();
    updateView();

    $("#resultBadgeIcon").textContent = station.insignia.icono;
    $("#resultBadgeName").textContent = station.insignia.nombre;
    $("#resultPoints").textContent = "+100 puntos";
    $("#resultMensaje").textContent = station.mensajeCorrecto;
    viewPlay.hidden = true;
    viewResult.hidden = false;
    launchConfetti(station.numero === 3 ? 85 : 48);
  }

  /* ------------------------------------------------------------------
     ESTACIONES CON ADIVINANZAS
     ------------------------------------------------------------------ */
  function normalizeAnswer(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,;:"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isCorrectAnswer(station, answer) {
    const normalized = normalizeAnswer(answer);
    return station.respuestasAceptadas.some((accepted) => normalizeAnswer(accepted) === normalized);
  }

  function renderRiddleStation(station) {
    $("#misionEstacion").textContent = `Estación ${station.numero}`;
    $("#misionTitulo").textContent = station.area;
    $("#misionSubtitulo").hidden = false;
    $("#misionSubtitulo").textContent = station.ubicacion;
    $("#misionInstruccion").textContent = station.indicacion;
    optionsContainer.innerHTML = "";
    optionsContainer.className = "pas-mission-options pas-mission-options--riddle";
    missionPanel.classList.remove("pas-modal__panel--game");
    missionHint.className = "pas-mission-hint";
    missionHint.textContent = "Escribe la respuesta que encontraste en el cartel físico.";

    const card = document.createElement("div");
    card.className = "pas-riddle-card";

    const location = document.createElement("p");
    location.className = "pas-riddle-card__location";
    location.textContent = `Ubicación: ${station.ubicacion}`;

    const riddle = document.createElement("div");
    riddle.className = "pas-riddle-card__text";
    station.adivinanza.forEach((line) => {
      if (!line) {
        riddle.appendChild(document.createElement("br"));
        return;
      }
      const span = document.createElement("span");
      span.textContent = line;
      riddle.appendChild(span);
    });

    const form = document.createElement("form");
    form.className = "pas-riddle-form";
    form.noValidate = true;

    const label = document.createElement("label");
    label.className = "pas-field pas-field--wide";

    const labelText = document.createElement("span");
    labelText.textContent = "Respuesta";
    const input = document.createElement("input");
    input.type = "text";
    input.name = "respuesta";
    input.autocomplete = "off";
    input.required = true;
    input.placeholder = "Escribe tu respuesta";

    label.append(labelText, input);

    const button = document.createElement("button");
    button.className = "pas-btn pas-btn--primary";
    button.type = "submit";
    button.textContent = station.numero === 3 ? "Completar aventura" : "Desbloquear siguiente estación";

    const feedback = document.createElement("p");
    feedback.className = "pas-riddle-feedback";
    feedback.setAttribute("role", "status");

    form.append(label, button, feedback);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const answer = input.value.trim();
      if (!answer) {
        input.setAttribute("aria-invalid", "true");
        feedback.className = "pas-riddle-feedback is-error";
        feedback.textContent = "Escribe una respuesta para continuar.";
        input.focus();
        return;
      }

      if (isCorrectAnswer(station, answer)) {
        input.removeAttribute("aria-invalid");
        feedback.className = "pas-riddle-feedback is-success";
        feedback.textContent = station.mensajeCorrecto;
        button.disabled = true;
        completeStation(station, answer);
        return;
      }

      state.puntos = Math.max(0, state.puntos - 10);
      saveState();
      updateView();
      input.setAttribute("aria-invalid", "true");
      feedback.className = "pas-riddle-feedback is-error";
      feedback.textContent = station.mensajeIncorrecto;
      missionHint.textContent = "Pierdes 10 puntos, pero puedes volver a intentarlo.";
      showToast(station.mensajeIncorrecto);
    });

    card.append(location, riddle, form);
    optionsContainer.appendChild(card);
    window.setTimeout(() => input.focus(), 80);
  }

  function openMission(area) {
    if (!state.participante) {
      showScreen("screen-bienvenida");
      showToast("Registra primero tu participación en Aventura 365.");
      return;
    }
    if (!isAreaUnlocked(area) || state.progreso[area]) return;

    currentStation = area;
    const station = stationById(area);
    viewPlay.hidden = false;
    viewResult.hidden = true;
    renderRiddleStation(station);
    openMissionModal();
  }

  continueButton.addEventListener("click", () => {
    const allComplete = completedCount() === 3;
    closeMissionModal();
    if (allComplete) {
      renderBadge();
      saveCompletedRecord();
      showScreen("screen-final");
      showToast("¡Aventura completada! Desbloqueaste tu insignia de ganador.");
      launchConfetti(85);
      return;
    }

    showScreen("screen-mapa");
    showToast(motivationFor(completedCount()));
  });

  $$("[data-open-mission]").forEach((button) => {
    button.addEventListener("click", () => openMission(button.dataset.openMission));
  });

  $$("[data-close-mission]").forEach((element) => element.addEventListener("click", closeMissionModal));
  $$("[data-close-action]").forEach((element) => element.addEventListener("click", closeActionModal));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (modalAction.classList.contains("is-open")) closeActionModal();
    else if (modalMission.classList.contains("is-open")) closeMissionModal();
  });

  /* ------------------------------------------------------------------
     INSIGNIA FINAL Y REGISTRO LOCAL
     ------------------------------------------------------------------ */
  function formatDate(isoDate) {
    if (!isoDate) return "—";
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(isoDate));
  }

  function initials(name) {
    const value = String(name || "A365").trim();
    if (!value) return "A365";
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function renderBadge() {
    if (!state.participante) return;
    ensureCompletionData();
    const participant = state.participante;
    $("#badgeInitials").textContent = initials(participant.nombre);
    $("#badgeName").textContent = participant.nombre;
    $("#badgeSpace").textContent = participant.espacio;
    $("#badgeProgram").textContent = participant.programa;
    $("#badgePoints").textContent = state.puntos;
    $("#badgeDate").textContent = formatDate(state.fechaFinalizacion);
    $("#badgeFolio").textContent = state.folio;
    saveState();
  }

  function getRecords() {
    const current = safeJsonParse(localStorage.getItem(STORAGE_KEYS.RECORDS), null);
    if (Array.isArray(current)) return current;
    const legacy = safeJsonParse(localStorage.getItem(STORAGE_KEYS.LEGACY_RECORDS), null);
    return Array.isArray(legacy) ? legacy : [];
  }

  function saveCompletedRecord() {
    if (!state.participante || completedCount() !== 3) return;
    ensureCompletionData();
    const record = {
      participante: state.participante,
      puntos: state.puntos,
      estacionesCompletadas: AREAS.filter((area) => state.progreso[area]),
      insignias: STATIONS.map((station) => station.insignia.nombre),
      folio: state.folio,
      fecha: state.fechaFinalizacion,
      respuestasCorrectas: state.respuestasCorrectas,
      estado: "completado",
    };
    const records = getRecords();
    const existingIndex = records.findIndex((item) => item.folio === record.folio);
    if (existingIndex >= 0) records[existingIndex] = record;
    else records.push(record);

    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (error) {
      showToast("La insignia está lista, pero el navegador no permitió añadirla al registro local.");
    }
  }

  $("#btnVerFinal").addEventListener("click", () => {
    renderBadge();
    saveCompletedRecord();
    showScreen("screen-final");
    launchConfetti(85);
  });

  /* ------------------------------------------------------------------
     ACCIONES FINALES
     ------------------------------------------------------------------ */
  function communityWhatsappMessage() {
    ensureCompletionData();
    const participant = state.participante;
    return `Hola, quiero integrarme a la Comunidad Empresarial UAEMéx.

Completé Aventura 365.

Mi nombre es: ${participant.nombre}
Espacio académico: ${participant.espacio}
Programa educativo: ${participant.programa}
Semestre: ${participant.semestre}
Correo personal: ${participant.correo}
Teléfono/WhatsApp: ${participant.telefono}
Puntos obtenidos: ${state.puntos}
Folio: ${state.folio}

Quiero recibir información para integrarme a las actividades de la Dirección de Desarrollo Empresarial.`;
  }

  function activitiesWhatsappMessage() {
    ensureCompletionData();
    const participant = state.participante;
    return `Hola, quiero conocer las próximas actividades de la Comunidad Empresarial UAEMéx.

Completé Aventura 365.

Mi nombre es: ${participant.nombre}
Espacio académico: ${participant.espacio}
Programa educativo: ${participant.programa}
Semestre: ${participant.semestre}
Correo personal: ${participant.correo}
Folio: ${state.folio}

Me gustaría recibir información sobre eventos, convocatorias, talleres o actividades de la Dirección de Desarrollo Empresarial.`;
  }

  function buildWhatsappUrl(message) {
    const number = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, "");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  $("#btnUnirme").addEventListener("click", () => {
    window.open(buildWhatsappUrl(communityWhatsappMessage()), "_blank");
  });

  $("#btnActividades").addEventListener("click", () => {
    window.open(buildWhatsappUrl(activitiesWhatsappMessage()), "_blank");
  });

  async function downloadBadgeAsImage() {
    const card = $("#aventura365-insignia");
    const button = $("#btnDescargar");
    const originalLabel = button.textContent;

    if (!card) {
      showToast("No se encontró la insignia para descargar.");
      return;
    }
    if (typeof window.html2canvas !== "function") {
      showToast("No se pudo descargar la insignia. Inténtalo de nuevo.");
      return;
    }

    button.disabled = true;
    button.textContent = "Generando insignia...";
    showToast("Generando insignia...");
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await window.html2canvas(card, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: Math.max(document.documentElement.clientWidth, 820),
        onclone: (clonedDocument) => {
          const clonedCard = clonedDocument.querySelector("#aventura365-insignia");
          if (!clonedCard) return;
          clonedCard.style.width = "760px";
          clonedCard.style.maxWidth = "760px";
          clonedCard.style.margin = "0";
        },
      });
      const link = document.createElement("a");
      link.download = `Insignia-Aventura-365-${state.folio || "participante"}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Insignia descargada correctamente.");
    } catch (error) {
      showToast("No se pudo descargar la insignia. Inténtalo de nuevo.");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  $("#btnDescargar").addEventListener("click", downloadBadgeAsImage);

  function resetGame(keepParticipant) {
    const participant = keepParticipant ? state.participante : null;
    state = cloneDefaultState();
    state.participante = participant;
    closeActionModal();

    if (keepParticipant) {
      saveState();
      prefillRegistration();
      updateView();
      showScreen("screen-mapa");
      showToast("Nuevo recorrido listo. Conservamos tus datos de participante.");
      return;
    }

    clearAdventureStorage();
    formRegistro.reset();
    clearFieldErrors();
    updateView();
    showScreen("screen-bienvenida");
    showToast("Se borraron los datos locales de Aventura 365.");
  }

  $("#btnReiniciar").addEventListener("click", () => {
    openActionModal({
      eyebrow: "Volver a jugar",
      title: "¿Quieres conservar tus datos de participante?",
      text: "En ambos casos se reiniciarán puntos, estaciones e insignias.",
      buttons: [
        { label: "Sí, conservar mis datos", className: "pas-btn--primary", onClick: () => resetGame(true) },
        { label: "No, borrar todo", className: "pas-btn--ghost", onClick: () => resetGame(false) },
      ],
    });
  });

  /* ------------------------------------------------------------------
     EXPORTACION CSV LOCAL
     ------------------------------------------------------------------ */
  function csvCell(value) {
    const normalized = Array.isArray(value)
      ? value.join(" | ")
      : typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value == null ? "" : value);
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  function exportRecords() {
    const records = getRecords();
    if (!records.length) {
      showToast("Todavía no hay aventuras completadas para exportar.");
      return;
    }
    const columns = ["participante", "puntos", "estacionesCompletadas", "insignias", "folio", "fecha", "respuestasCorrectas", "estado"];
    const rows = [
      columns.join(","),
      ...records.map((record) => columns.map((column) => csvCell(record[column])).join(",")),
    ];
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registros-aventura-365-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${records.length} registro${records.length === 1 ? "" : "s"} exportado${records.length === 1 ? "" : "s"}.`);
  }

  exportButton.hidden = !SHOW_ADMIN_EXPORT;
  exportButton.addEventListener("click", exportRecords);

  /* ------------------------------------------------------------------
     CONFETI CONTROLADO
     ------------------------------------------------------------------ */
  const canvas = $("#pasConfetti");
  const context = canvas.getContext("2d");
  const confettiColors = ["#00C2FF", "#7C3AED", "#EC4899", "#22C55E", "#FACC15", "#FB923C"];
  let particles = [];
  let animating = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = Math.min(window.innerHeight, 620);
  }

  function launchConfetti(amount) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const total = Math.min(amount || 45, 90);
    for (let index = 0; index < total; index += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        width: 5 + Math.random() * 5,
        height: 7 + Math.random() * 8,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        velocityY: 2.3 + Math.random() * 2.2,
        velocityX: -1.2 + Math.random() * 2.4,
        rotation: Math.random() * 360,
        rotationVelocity: -5 + Math.random() * 10,
      });
    }
    canvas.classList.add("is-active");
    if (!animating) {
      animating = true;
      requestAnimationFrame(drawConfetti);
    }
  }

  function drawConfetti() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.rotation += particle.rotationVelocity;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate((particle.rotation * Math.PI) / 180);
      context.fillStyle = particle.color;
      context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
      context.restore();
    });
    particles = particles.filter((particle) => particle.y < canvas.height + 20);
    if (particles.length) requestAnimationFrame(drawConfetti);
    else {
      animating = false;
      canvas.classList.remove("is-active");
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ------------------------------------------------------------------
     INICIALIZACION
     ------------------------------------------------------------------ */
  prefillRegistration();
  updateView();

  if (state.participante && completedCount() === 3) {
    ensureCompletionData();
    renderBadge();
    saveCompletedRecord();
    showScreen("screen-final");
  } else if (state.participante) {
    showScreen("screen-mapa");
  } else {
    showScreen("screen-bienvenida");
  }
})();
