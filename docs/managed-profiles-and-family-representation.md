# Perfiles gestionados y representación familiar

## Principio de producto
Bayit no exige que cada persona tenga email, móvil ni cuenta propia. Una persona puede existir como perfil gestionado y participar en el hogar mediante la cuenta de un adulto responsable.

## Tipos de acceso
1. Cuenta propia: persona adulta con autenticación individual.
2. Perfil gestionado: persona sin credenciales, representada por uno o varios adultos autorizados.
3. Cuenta supervisada: menor con cuenta propia opcional, con permisos limitados y supervisión del adulto responsable.

## Relaciones y permisos
- La identidad personal (profile) es independiente de la cuenta de acceso (auth user).
- Una tabla de representantes relaciona perfil gestionado, usuario representante, hogar y tipo de permiso.
- Permisos explícitos: ver calendario, crear/editar compromisos, responder formularios, gestionar tareas, recibir notificaciones.
- Un representante solo puede actuar dentro de los hogares donde está autorizado.
- La autorización no se hereda automáticamente a otros hogares conectados.
- Si dos adultos representan al mismo menor, se conserva un único perfil y un calendario personal; ambos ven/gestionan solo lo permitido.
- Registro de auditoría: quién creó, editó, canceló o confirmó cada dato y cuándo.
- La interfaz debe indicar claramente «Gestionado por [adulto]» y diferenciar autor del cambio de persona a la que afecta.
- Los perfiles gestionados no tienen contraseñas compartidas ni credenciales inventadas.
- Cuando la persona sea suficientemente mayor y quiera tener cuenta, el adulto inicia una invitación de reclamación verificada. Se vincula el auth user al profile existente; se conservan calendario e historial. Se revoca el acceso del representante si corresponde.
- Para menores, el acceso propio es opcional y sujeto a la autorización/supervisión familiar que se defina.

## Formularios y cambios
- Un adulto puede completar el formulario mensual por el perfil gestionado.
- El formulario indica para quién se responde y quién lo ha completado.
- El adulto puede añadir planes de última hora y cancelar/modificar eventos.
- Antes de confirmar, se muestra la identidad del perfil afectado y la del representante.
- Los datos introducidos por un adulto no deben atribuirse falsamente al menor.

## Notificaciones
- El adulto representante elige si recibe recordatorios por cada perfil gestionado.
- Los avisos de tareas se envían al representante responsable cuando la persona asignada no tiene cuenta.
- Si el menor tiene cuenta supervisada, se puede avisar tanto al menor como al representante según preferencias.
- No enviar avisos a emails/teléfonos no verificados.

## UX
- Selector sencillo «Estoy organizando para: Yo / [perfil gestionado]».
- Acción «Añadir persona a mi hogar» no debe exigir email.
- Ficha con nombre, color de calendario, edad opcional (evitar recopilar fecha de nacimiento completa si no es necesaria), relación opcional, notas no sensibles y adultos representantes.
- Para familiares mayores que no usan tecnología, vista de agenda imprimible opcional.
