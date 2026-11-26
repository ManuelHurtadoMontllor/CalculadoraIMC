// Los límites superiores son exclusivos; Infinity deja que la última categoría cubra cualquier IMC restante.
const categoriasIMC = [
    { id: "bajo", nombre: "Bajo peso", maximo: 18.5, rango: "IMC inferior a 18,5" },
    { id: "saludable", nombre: "Saludable", maximo: 25, rango: "IMC de 18,5 a menos de 25" },
    { id: "sobrepeso", nombre: "Sobrepeso", maximo: 30, rango: "IMC de 25 a menos de 30" },
    { id: "obesidad", nombre: "Obesidad", maximo: Infinity, rango: "IMC de 30 o más" }
];

const estadosIMC = categoriasIMC.map((categoria) => `estado--${categoria.id}`);
const formulario = document.getElementById("bmi-form");
const pesoInput = document.getElementById("weight");
const alturaInput = document.getElementById("height");
const pesoError = document.getElementById("weight-error");
const alturaError = document.getElementById("height-error");
const tarjetaResultado = document.getElementById("result");
const valorIMC = document.getElementById("bmi-value");
const categoriaIMC = document.getElementById("bmi-category");
const marcador = document.getElementById("gauge-marker");
const menuToggle = document.getElementById("menu-toggle");
const navegacion = document.getElementById("primary-nav");
const themeToggle = document.getElementById("theme-toggle");
const themeStatus = document.getElementById("theme-status");
const recordarMedidas = document.getElementById("remember-measures");
const borrarMedidasButton = document.getElementById("clear-saved-measures");
const estadoMedidasGuardadas = document.getElementById("saved-measures-status");
const buscadorRangos = document.getElementById("range-search");
const estadoBusquedaRangos = document.getElementById("range-search-status");
const CLAVE_PESO_GUARDADO = "equilibra.peso";
const CLAVE_ALTURA_GUARDADA = "equilibra.altura";
const CLAVE_TEMA_GUARDADO = "equilibra.tema";
let formularioEnviado = false;

function aplicarTema(temaOscuro) {
    document.body.classList.toggle("tema-oscuro", temaOscuro);
    themeToggle.setAttribute("aria-pressed", String(temaOscuro));
    document.querySelector('meta[name="theme-color"]').setAttribute("content", temaOscuro ? "#111827" : "#f6f7fb");
}

function mostrarErrorPreferenciaTema(error, accion) {
    if (!(error instanceof DOMException)) {
        throw error;
    }

    themeStatus.textContent = `No se pudo ${accion} la preferencia del tema en este navegador.`;
    themeStatus.classList.add("is-visible");
}

if (themeToggle && themeStatus) {
    try {
        aplicarTema(localStorage.getItem(CLAVE_TEMA_GUARDADO) === "oscuro");
    } catch (error) {
        aplicarTema(false);
        mostrarErrorPreferenciaTema(error, "leer");
    }

    themeToggle.addEventListener("click", () => {
        const temaOscuro = themeToggle.getAttribute("aria-pressed") !== "true";
        aplicarTema(temaOscuro);

        try {
            localStorage.setItem(CLAVE_TEMA_GUARDADO, temaOscuro ? "oscuro" : "claro");
            themeStatus.textContent = "";
            themeStatus.classList.remove("is-visible");
        } catch (error) {
            mostrarErrorPreferenciaTema(error, "guardar");
        }
    });
}

function calcularIMC(peso, alturaEnCentimetros) {
    const alturaEnMetros = alturaEnCentimetros / 100;
    return peso / (alturaEnMetros * alturaEnMetros);
}

function obtenerCategoria(imc) {
    return categoriasIMC.find((categoria) => imc < categoria.maximo);
}

function crearTarjetaRango(categoria) {
    const tarjeta = document.createElement("li");
    const titulo = document.createElement("h3");
    const rango = document.createElement("p");

    tarjeta.className = `rango-card rango--${categoria.id}`;
    titulo.textContent = categoria.nombre;
    rango.textContent = categoria.rango;
    tarjeta.append(titulo, rango);

    return tarjeta;
}

function renderizarRangos(categorias, contenedor) {
    contenedor.replaceChildren();

    // Mantiene el área informativa útil cuando la búsqueda no encuentra coincidencias.
    if (categorias.length === 0) {
        const mensajeVacio = document.createElement("li");
        mensajeVacio.className = "rango-vacio";
        mensajeVacio.textContent = "No se encontraron categorías con esa búsqueda.";
        contenedor.appendChild(mensajeVacio);
        return;
    }

    categorias.forEach((categoria) => {
        contenedor.appendChild(crearTarjetaRango(categoria));
    });
}

function normalizarTexto(texto) {
    // Quitar diacríticos permite buscar "mas" y encontrar "más".
    return texto.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filtrarRangos(categorias, consulta) {
    const termino = normalizarTexto(consulta.trim());

    // Se busca tanto en el nombre como en el texto del intervalo para admitir consultas por números.
    return categorias.filter((categoria) => {
        return normalizarTexto(`${categoria.nombre} ${categoria.rango}`).includes(termino);
    });
}

function validarCampo(input, mensaje, minimo, maximo, mensajeVacio, mensajeRango) {
    const tieneValor = input.value.trim() !== "";
    const valor = Number(input.value);
    const esValido = tieneValor && Number.isFinite(valor) && valor >= minimo && valor <= maximo;
    // No se avisa por un campo vacío hasta el primer envío; después, el error acompaña a cada edición.
    const mostrarError = !esValido && (tieneValor || formularioEnviado);
    const contenedorCampo = input.closest(".input-shell");

    input.setAttribute("aria-invalid", String(mostrarError));
    contenedorCampo.classList.toggle("campo--error", mostrarError);
    mensaje.textContent = mostrarError ? (tieneValor ? mensajeRango : mensajeVacio) : "";
    mensaje.classList.toggle("is-visible", mostrarError);

    return esValido;
}

function validarFormulario() {
    const pesoValido = validarCampo(
        pesoInput,
        pesoError,
        2,
        500,
        "Introduce tu peso.",
        "El peso debe estar entre 2 y 500 kg."
    );
    const alturaValida = validarCampo(
        alturaInput,
        alturaError,
        50,
        300,
        "Introduce tu altura.",
        "La altura debe estar entre 50 y 300 cm."
    );

    if (!pesoValido) {
        pesoInput.focus();
    } else if (!alturaValida) {
        alturaInput.focus();
    }

    return pesoValido && alturaValida;
}

function actualizarResultado(imc, categoria) {
    valorIMC.textContent = imc.toFixed(1);
    categoriaIMC.textContent = categoria.nombre;
    tarjetaResultado.classList.remove("estado--inicial", ...estadosIMC);
    tarjetaResultado.classList.add(`estado--${categoria.id}`);
    marcador.style.left = `${Math.max(3, Math.min(97, ((imc - 12) / 28) * 100))}%`;
    tarjetaResultado.classList.remove("is-updated");
    // Forzar el recálculo permite volver a lanzar la animación en cálculos consecutivos.
    void tarjetaResultado.offsetWidth;
    tarjetaResultado.classList.add("is-updated");
}

function mostrarEstadoGuardado(texto, esError = false) {
    estadoMedidasGuardadas.textContent = texto;
    estadoMedidasGuardadas.classList.toggle("is-error", esError);
    estadoMedidasGuardadas.classList.add("is-visible");
}

function manejarErrorDeAlmacenamiento(error, accion) {
    // Se informa de fallos propios del almacenamiento, pero los errores de programación siguen propagándose.
    if (!(error instanceof DOMException)) {
        throw error;
    }

    mostrarEstadoGuardado(`No se pudieron ${accion} las medidas en este navegador.`, true);
}

function medidasActualesValidas() {
    const peso = Number(pesoInput.value);
    const altura = Number(alturaInput.value);

    return pesoInput.value.trim() !== "" && alturaInput.value.trim() !== "" &&
        Number.isFinite(peso) && peso >= 2 && peso <= 500 &&
        Number.isFinite(altura) && altura >= 50 && altura <= 300;
}

// La casilla es el consentimiento para conservar estas medidas localmente; no se envían a ningún servicio.
function guardarMedidasGuardadas() {
    try {
        localStorage.setItem(CLAVE_PESO_GUARDADO, pesoInput.value);
        localStorage.setItem(CLAVE_ALTURA_GUARDADA, alturaInput.value);
        borrarMedidasButton.classList.add("is-visible");
        mostrarEstadoGuardado("Medidas guardadas solo en este navegador.");
    } catch (error) {
        manejarErrorDeAlmacenamiento(error, "guardar");
    }
}

function guardarMedidasSiProcede() {
    if (recordarMedidas.checked && medidasActualesValidas()) {
        guardarMedidasGuardadas();
    }
}

function cargarMedidasGuardadas() {
    try {
        // Al volver a la página, solo se restauran valores que sigan dentro de los límites aceptados.
        const pesoGuardado = localStorage.getItem(CLAVE_PESO_GUARDADO);
        const alturaGuardada = localStorage.getItem(CLAVE_ALTURA_GUARDADA);

        if (pesoGuardado === null && alturaGuardada === null) {
            return;
        }

        borrarMedidasButton.classList.add("is-visible");
        const pesoValido = pesoGuardado !== null && Number(pesoGuardado) >= 2 && Number(pesoGuardado) <= 500;
        const alturaValida = alturaGuardada !== null && Number(alturaGuardada) >= 50 && Number(alturaGuardada) <= 300;

        if (!pesoValido || !alturaValida) {
            mostrarEstadoGuardado("Los datos guardados no son válidos. Puedes borrarlos y volver a introducir tus medidas.", true);
            return;
        }

        pesoInput.value = pesoGuardado;
        alturaInput.value = alturaGuardada;
        recordarMedidas.checked = true;
        mostrarEstadoGuardado("Tus medidas guardadas se han recuperado de este navegador.");
    } catch (error) {
        manejarErrorDeAlmacenamiento(error, "leer");
    }
}

function borrarMedidasGuardadas() {
    try {
        localStorage.removeItem(CLAVE_PESO_GUARDADO);
        localStorage.removeItem(CLAVE_ALTURA_GUARDADA);
        recordarMedidas.checked = false;
        borrarMedidasButton.classList.remove("is-visible");
        mostrarEstadoGuardado("Se han borrado las medidas guardadas en este navegador.");
    } catch (error) {
        manejarErrorDeAlmacenamiento(error, "borrar");
    }
}

function alternarMenu() {
    const menuAbierto = menuToggle.getAttribute("aria-expanded") === "true";
    const nuevoEstado = !menuAbierto;

    // El atributo accesible y la clase visual describen el mismo estado del menú.
    menuToggle.setAttribute("aria-expanded", String(nuevoEstado));
    menuToggle.setAttribute("aria-label", nuevoEstado ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    navegacion.classList.toggle("is-open", nuevoEstado);
}

function cerrarMenu() {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
    navegacion.classList.remove("is-open");
}

const listaRangos = document.getElementById("bmi-ranges");
if (listaRangos) {
    // Este script se comparte entre páginas; solo la página informativa tiene la lista de rangos.
    renderizarRangos(categoriasIMC, listaRangos);

    if (buscadorRangos && estadoBusquedaRangos) {
        buscadorRangos.addEventListener("input", () => {
            const resultados = filtrarRangos(categoriasIMC, buscadorRangos.value);
            renderizarRangos(resultados, listaRangos);
            estadoBusquedaRangos.textContent = resultados.length === 0
                ? "No hay categorías coincidentes."
                : `${resultados.length} ${resultados.length === 1 ? "categoría encontrada" : "categorías encontradas"}.`;
        });
    }
}

if (menuToggle && navegacion) {
    menuToggle.addEventListener("click", alternarMenu);
    navegacion.addEventListener("click", (evento) => {
        if (evento.target.closest("a")) {
            cerrarMenu();
        }
    });
}

if (formulario) {
    // La misma lógica se carga también en páginas sin formulario, por eso se inicializa de forma condicional.
    cargarMedidasGuardadas();

    recordarMedidas.addEventListener("change", () => {
        if (!recordarMedidas.checked) {
            borrarMedidasGuardadas();
        } else if (medidasActualesValidas()) {
            guardarMedidasGuardadas();
        } else {
            mostrarEstadoGuardado("Se guardarán cuando introduzcas medidas válidas.");
        }
    });

    borrarMedidasButton.addEventListener("click", borrarMedidasGuardadas);

    pesoInput.addEventListener("input", () => {
        if (formularioEnviado) {
            validarCampo(pesoInput, pesoError, 2, 500, "Introduce tu peso.", "El peso debe estar entre 2 y 500 kg.");
        }
        guardarMedidasSiProcede();
    });

    alturaInput.addEventListener("input", () => {
        if (formularioEnviado) {
            validarCampo(alturaInput, alturaError, 50, 300, "Introduce tu altura.", "La altura debe estar entre 50 y 300 cm.");
        }
        guardarMedidasSiProcede();
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        formularioEnviado = true;

        if (!validarFormulario()) {
            return;
        }

        const imc = calcularIMC(Number(pesoInput.value), Number(alturaInput.value));
        actualizarResultado(imc, obtenerCategoria(imc));
        tarjetaResultado.scrollIntoView({ behavior: "smooth", block: "center" });

        if (recordarMedidas.checked) {
            guardarMedidasGuardadas();
        }
    });
}
