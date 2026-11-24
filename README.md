# Planificacion — Equilibra

## Wireframes

### Movil (una columna)

```text
+------------------------------------+
| Marca                 Empezar     |
| Calculadora   Sobre el IMC         |
+------------------------------------+
| Presentacion                       |
| Titulo, texto y beneficios         |
+------------------------------------+
| Calculadora                        |
| Peso [              ] kg           |
| Altura [            ] cm           |
| [ Calcular mi IMC ]                |
| [Error: dinamico]                  |
| Resultado [IMC: dinamico]          |
| Categoria: dinamica                |
| Indicador: dinamico                |
+------------------------------------+
| Aviso sobre el resultado           |
| [Mas informacion]                  |
+------------------------------------+
| Pie de pagina                      |
+------------------------------------+
```

### Escritorio (dos columnas)

```text
+-----------------------------------------------------------+
| Marca           Navegacion                 Empezar        |
+-----------------------------------------------------------+
| Presentacion                    | Calculadora             |
| Titulo y texto                  | Peso / altura           |
| Beneficios                      | Boton calcular          |
|                                 | Resultado dinamico      |
+-----------------------------------------------------------+
| Aviso y enlace a informacion                            |
+-----------------------------------------------------------+
| Pie de pagina                                              |
+-----------------------------------------------------------+
```

La informacion detallada vive en una segunda pagina enlazada. Los campos, el error, el valor IMC, la categoria, el marcador y el color del resultado son partes dinamicas.

## Funcionalidades

| Funcionalidad | Evento | Cambio en la pagina |
| --- | --- | --- |
| Validar peso y altura | Enviar el formulario y editar los campos tras un intento | Muestra errores junto a cada campo no valido y enfoca el primero. |
| Calcular IMC | Enviar el formulario con datos validos | Calcula peso / altura², muestra el valor con un decimal y desplaza la pagina al resultado. |
| Clasificar el resultado | Despues del calculo | Actualiza la etiqueta, el color de la tarjeta y la posicion del marcador. |
| Abrir o cerrar la navegacion movil | Pulsar el boton del menu | Alterna el menu y actualiza `aria-expanded`. |
| Mostrar los rangos de IMC | Cargar la pagina informativa | Crea una tarjeta por categoria a partir del array de objetos. |
| Filtrar categorias | Escribir en el buscador | Muestra solo las categorias cuyo nombre o intervalo coincide. |
| Recordar o borrar medidas | Marcar la casilla, calcular o pulsar borrar | Guarda o elimina el peso y la altura en `localStorage`, solo si se solicita. |
| Consultar informacion | Pulsar un enlace | Abre la pagina informativa o vuelve a la calculadora. |

## Datos

Las categorias se guardan como un array de objetos en `js/main.js`. Cada objeto contiene un identificador de estado CSS, el nombre visible y el limite superior del rango. La calculadora busca la primera categoria cuyo limite supere el IMC calculado; la pagina informativa crea sus tarjetas con esos mismos datos.
