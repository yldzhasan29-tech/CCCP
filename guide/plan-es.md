# Poputka AI — plan del proyecto para el hackathon (actualizado)

**Fecha límite: 8 de septiembre (el mismo día es la presentación)**
**Inicio del trabajo: hoy, 4 de septiembre**

---

## 1. Qué vamos a hacer

Caso 10 del PDF del hackathon: sistema de coche compartido entre estudiantes, entre el centro y el campus de Novokoltsovsky de la UrFU. Los estudiantes conductores publican sus rutas habituales, los estudiantes pasajeros encuentran compañeros de viaje según ruta/horario/calificación. El precio es más bajo que un taxi, pero con compensación de combustible para el conductor.

**Objetivo:** un MVP funcional que muestre al jurado, en pocos minutos, un escenario real de viaje de principio a fin, usando IA.

---

## 2. Formato: aplicación web (React), no un bot

Al principio planeamos un bot de Telegram, pero los organizadores dijeron que un bot es una solución demasiado simple. Por eso pasamos a una **aplicación web independiente**.

La lógica y toda la parte de "servidor" que ya habíamos diseñado se mantienen casi sin cambios — solo cambia la interfaz:

| Se mantiene igual | Cambia |
|---|---|
| Datos sintéticos (30–50 conductores/pasajeros) | Mensaje de chat → formulario/pantalla |
| Fórmula de puntuación (ruta/horario/calificación/preferencias) | Botón inline → botón HTML normal |
| Integración del LLM (Groq/Gemini, gratis) | Librería de bot (aiogram) → React |
| Explicación de «por qué la coincidencia» por plantilla | — |
| Sin backend/BD real, sin autenticación real | En lugar de verificación por correo → pantalla simple de «introduce tu nombre» |
| Fórmula de precio (distancia × coeficiente) | — |

---

## 3. Stack decidido

- **React (con Vite)** — se configura rápido, apto para principiantes
- **Vercel/Netlify** — despliegue gratuito con un clic (el enlace funciona sin depender del portátil, lo que reduce el riesgo en la demo)
- **Groq API o Google Gemini API** — plan gratuito
- Sin backend/BD real — los datos se guardan en el estado de React / localStorage

---

## 4. Restricciones

- Equipo: 7 personas, todas con nivel principiante
- Presupuesto: cero, solo planes gratuitos
- No se proporcionaron APIs por parte de los organizadores — usamos nuestras propias claves gratuitas
- Tiempo: hoy + ~3.5 días de desarrollo, el 8 de septiembre es el día de la presentación
- Duración de la presentación aún desconocida

---

## 5. Qué hacemos (obligatorio) y qué NO hacemos

### Obligatorio:
- Tres pantallas: pantalla principal (elección de rol + formulario), lista de resultados, confirmación de reserva
- Datos sintéticos (30–50 usuarios «falsos»)
- Puntuación: ruta 40%, horario 30%, calificación 15%, preferencias 15%
- Una sola llamada al LLM: interpretar texto libre en un JSON estructurado
- Explicación de «por qué la coincidencia» — por plantilla, sin LLM
- Fórmula de precio simple, sin tráfico real
- Tarjetas de resultados con diseño claro + botón «Reservar»

### NO hacemos:
- Registro real / verificación por correo → solo un campo de «introduce tu nombre/usuario»
- Integración real con mapas → como máximo un Leaflet estático (gratis, sin clave) o una descripción textual de la ruta
- Predicción de demanda y «Smart Crew» → solo mencionados en la presentación como «planes futuros»
- Servidor backend separado y base de datos real

---

## 6. Plan por días

**Día 1 (4 de septiembre, hoy) — recuperamos el tiempo perdido:**
- Configuración de React + Vite, repositorio de GitHub, conexión con Vercel (desplegar incluso un «Hello World» vacío para verificar de inmediato que el despliegue funciona)
- Esqueleto de las tres pantallas
- 3 subgrupos: (1) pantallas/UI, (2) datos simulados + lógica de puntuación, (3) integración del LLM + un integrador

**Día 2:**
- Datos sintéticos finales y fórmula de puntuación
- Flujo completo «pantalla principal → lista de resultados» con datos fijos, sin IA

**Día 3:**
- Integración del LLM: formulario de texto libre → JSON (probar de antemano las frases que se usarán en la demo)
- Explicación por plantilla de «por qué la coincidencia» + cálculo de precio + pantalla de confirmación

**Día 4:**
- Pulido de UI (tarjetas, colores, iconos — el jurado evalúa el UX/UI por separado)
- (opcional) mapa simple con Leaflet
- Mínimo 3 ensayos completos de la demo, verificar que el enlace de Vercel realmente funcione; preparar capturas de pantalla como respaldo por si acaso

**Día 5 (8 de septiembre — presentación):**
- Verificación final y ensayo por la mañana
- Versión corta de la demo (3–4 minutos) y versión extendida (5–7 minutos) — ambas ensayadas

---

## 7. Estructura de la defensa

1. Problema — los estudiantes pierden tiempo y dinero en el trayecto al campus
2. Solución — la aplicación conecta a los estudiantes según su ruta
3. IA — el LLM entiende la solicitud en lenguaje natural y explica las coincidencias
4. Demo — la parte más importante
5. Impacto — más barato, menos asientos vacíos en los coches
6. Futuro — predicción de demanda, Smart Crew, integración con la universidad (solo mencionado verbalmente)

---

## 8. Qué hay que aclarar
- Duración exacta de la presentación
- Quién de los 7 sabe Python/JS, para repartir los subgrupos
