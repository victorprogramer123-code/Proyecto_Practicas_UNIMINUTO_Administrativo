# Gestión de Documentación — Prácticas Profesionales UNIMINUTO

Este es el sitio que se usara en la Oficina de Personal de Apoyo para llevar el control de la
documentación de los estudiantes que están haciendo sus prácticas profesionales. Es una página
estática (HTML, CSS y JavaScript puro), sin backend ni base de datos externa, así que toda la
información queda guardada en el localStorage del navegador donde se use.

## Qué se puede hacer con esto

Se registra a cada estudiante con su nombre, número de identificación y la modalidad de
práctica que escogió. A cada uno se le puede marcar si su documentación está completa o
incompleta, y si está incompleta se marca cuáles documentos faltan (cédula, EPS, ARL,
certificado laboral, etc.).

En el dashboard se ve todo de un vistazo: cuántos estudiantes hay en total, cuántos ya
completaron, cuántos les falta algo, y un porcentaje de avance general. También se puede buscar
por nombre o número de identificación, y filtrar por estado o por modalidad.

Hay una pestaña aparte para generar los correos automáticamente: se elige un estudiante y el
sitio arma el mensaje según si le falta documentación o ya está todo en orden, para copiarlo o
abrirlo directo en el correo.

Y en cualquier momento se puede descargar toda la base en un Excel, para pasarlo a quien lo
necesite.

## Cómo está armado el código

* index.html — toda la estructura de la página: el dashboard, el formulario de registro y la
  sección del generador de correos.
* assets/css/styles.css — los estilos y los colores de la universidad (dorado, negro y
  blanco).
* assets/js/storage.js — es el que guarda, edita y borra los estudiantes en el localStorage.
  También tiene las listas de documentos y modalidades.
* assets/js/emailGenerator.js — arma el texto del correo dependiendo de si la documentación
  del estudiante está completa o no.
* assets/js/excelExport.js — genera el archivo Excel para descargar, usando la librería
  SheetJS.
* assets/js/app.js — es el que conecta todo: escucha los clics, cambia entre pestañas,
  actualiza la tabla y los formularios.

En index.html se cargan esos cuatro archivos .js en ese orden, porque app.js depende de
que los demás ya estén cargados antes.

## Para personalizarlo

Si en algún momento cambian los documentos que se piden o las modalidades de práctica, eso se
edita directamente en assets/js/storage.js, en las listas DOCUMENTOS_BASE y MODALIDADES.

Si se quiere poner el logo real de la universidad en vez del bloque de texto "MD" del
encabezado, solo hay que reemplazar ese div en index.html por una etiqueta img con la
imagen del logo.