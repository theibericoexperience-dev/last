Entendimiento canónico del backend

Este proyecto tiene las siguientes reglas de backend que NO deben romperse:

Endpoint canónico de reservas

La UI de reservas se alimenta exclusivamente de GET /api/orders.

El endpoint devuelve { orders: [...] }.

Modelo real de datos

orders es la tabla base (select('*')).

tour es un enrichment opcional:

viene de tours si existe la fila

o de data/tourCanonicals como fallback

bookings NO participa en este endpoint.

Garantías reales

order.tour puede ser null.

order.tour_title puede ser null o no existir.

order.departure_date puede ser null o no existir.

El backend no garantiza un campo estructurado start_city.

Fuente de verdad

Fecha de inicio → tours.start_date (copiada a order.departure_date como fallback).

Ciudad de inicio → NO existe fuente estructurada hoy.

Responsabilidad

El backend no promete ciudad de inicio.

El frontend no debe deducir datos semánticos a partir de strings libres.

Cualquier cambio futuro debe respetar este contrato o modificarlo explícitamente.


"Dejar ReservationCard simple y correcta"

Este es EL prompt que tienes que darle ahora al agente de repo.

Cópialo tal cual.

PROMPT 2 — Simplificación extrema de ReservationCard

Ahora que el backend está completamente entendido, tu tarea es simplificar ReservationCard al máximo, respetando el contrato real de datos.

Objetivo

Que la card:

no deduzca

no parsee

no invente

solo renderice lo que el backend garantiza

Reglas innegociables

Prohibido inferir ciudad

❌ No hacer split, regex, parsing de title

❌ No usar heurísticas tipo "Madrid to Lisbon"

✅ Si no hay campo estructurado → mostrar TBD o no mostrar ciudad

Datos que SÍ se pueden usar

Título:

order.tour?.title

fallback: order.tour_title

Imagen:

order.tour?.card_image

fallback: placeholder

Fecha:

order.departure_date

fallback: order.tour?.start_date

Estado y viajeros:

status, travelers_count

Precio

No renderizar precio (ni lógica asociada).

Icono

Usar un icono simple (PaperAirplaneIcon está bien).

Sin lógica asociada.

Código

Eliminar helpers innecesarios.

Eliminar funciones tipo deriveStartCity.

El componente debe ser más corto que antes, no más largo.

Comportamiento ante datos ausentes

Campo no existe / null → TBD o no renderizar ese bloque.

Nunca romper la UI.

Entrega esperada

Un ReservationCard.tsx:

más simple

más declarativo

sin lógica “inteligente”

Breve explicación (5–6 líneas) de:

qué campos usa

qué hace cuando no existen

No intentes “mejorar” el modelo desde la UI.
Si falta un dato estructurado, se acepta explícitamente.

🚨 QUÉ ESTABA MAL EN LA LÓGICA ANTERIOR DEL AGENTE (importante)

No era un bug, era esto:

❌ Estaba parcheando una carencia del backend desde la UI

❌ Estaba convirtiendo una convención textual en una API implícita

❌ Estaba añadiendo lógica frágil en el lugar incorrecto

Eso funciona hoy, pero:

se rompe con idiomas

se rompe con marketing titles

se rompe con SEO

se rompe con tours “Madrid Experience 2026”

La decisión correcta es:

o backend añade start_city

o UI acepta que no existe

Y ahora ya estás en ese punto 👌
