-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-03-2026 a las 04:47:21
-- Versión del servidor: 10.1.37-MariaDB
-- Versión de PHP: 7.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `funnelchat`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agentes_ia`
--

CREATE TABLE `agentes_ia` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'gpt-4',
  `instrucciones` text COLLATE utf8mb4_unicode_ci,
  `personalidad` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '0',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agente_contactos`
--

CREATE TABLE `agente_contactos` (
  `id` int(11) NOT NULL,
  `agente_id` int(11) NOT NULL,
  `contacto_jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `automatizaciones`
--

CREATE TABLE `automatizaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_disparador` enum('palabra_clave','nuevo_contacto','horario','cualquier_mensaje') COLLATE utf8mb4_unicode_ci DEFAULT 'palabra_clave',
  `palabra_clave` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `nodos` text COLLATE utf8mb4_unicode_ci,
  `conexiones` text COLLATE utf8mb4_unicode_ci,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campanas`
--

CREATE TABLE `campanas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_media` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('borrador','programado','enviando','completado','fallido') COLLATE utf8mb4_unicode_ci DEFAULT 'borrador',
  `total_enviados` int(11) DEFAULT '0',
  `total_fallidos` int(11) DEFAULT '0',
  `programado_para` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campana_grupos`
--

CREATE TABLE `campana_grupos` (
  `id` int(11) NOT NULL,
  `campana_id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nombre_negocio` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensaje_bienvenida` text COLLATE utf8mb4_unicode_ci,
  `mensaje_fuera_horario` text COLLATE utf8mb4_unicode_ci,
  `idioma` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'es',
  `zona_horaria` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'America/Guayaquil',
  `notificaciones_email` tinyint(1) DEFAULT '1',
  `notificaciones_push` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos`
--

CREATE TABLE `contactos` (
  `id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_lead` enum('nuevo','interesado','en_negociacion','cerrado','perdido') COLLATE utf8mb4_unicode_ci DEFAULT 'nuevo',
  `agente_asignado_id` int(11) DEFAULT NULL,
  `mensajes_sin_leer` int(11) DEFAULT '0',
  `ultimo_mensaje` text COLLATE utf8mb4_unicode_ci,
  `ultima_vez_visto` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contacto_etiquetas`
--

CREATE TABLE `contacto_etiquetas` (
  `id` int(11) NOT NULL,
  `contacto_id` int(11) NOT NULL,
  `etiqueta_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `destinatarios_envio`
--

CREATE TABLE `destinatarios_envio` (
  `id` int(11) NOT NULL,
  `envio_id` int(11) NOT NULL,
  `contacto_id` int(11) NOT NULL,
  `estado` enum('pendiente','enviado','fallido') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `mensaje_error` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enviado_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dispositivos`
--

CREATE TABLE `dispositivos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Mi WhatsApp',
  `numero_telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('conectado','desconectado','conectando') COLLATE utf8mb4_unicode_ci DEFAULT 'desconectado',
  `codigo_qr` text COLLATE utf8mb4_unicode_ci,
  `conectado_en` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `envios_masivos`
--

CREATE TABLE `envios_masivos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_media` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('borrador','programado','enviando','completado','fallido') COLLATE utf8mb4_unicode_ci DEFAULT 'borrador',
  `total_enviados` int(11) DEFAULT '0',
  `total_fallidos` int(11) DEFAULT '0',
  `total_pendientes` int(11) DEFAULT '0',
  `programado_para` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `etiquetas`
--

CREATE TABLE `etiquetas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#6366f1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupos`
--

CREATE TABLE `grupos` (
  `id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `mensajes_sin_leer` int(11) DEFAULT '0',
  `ultimo_mensaje` text COLLATE utf8mb4_unicode_ci,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios_atencion`
--

CREATE TABLE `horarios_atencion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dia_semana` enum('lunes','martes','miercoles','jueves','viernes','sabado','domingo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `activo` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

CREATE TABLE `mensajes` (
  `id` int(11) NOT NULL,
  `mensaje_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `chat_jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `de_jid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_mio` tinyint(1) DEFAULT '0',
  `es_grupo` tinyint(1) DEFAULT '0',
  `texto` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('texto','imagen','video','audio','documento','sticker') COLLATE utf8mb4_unicode_ci DEFAULT 'texto',
  `url_media` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_media` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` tinyint(4) DEFAULT '0' COMMENT '0=pendiente,1=enviado,2=entregado,3=leido',
  `fecha_mensaje` datetime NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas`
--

CREATE TABLE `notas` (
  `id` int(11) NOT NULL,
  `contacto_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('info','exito','advertencia','error') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `leido` tinyint(1) DEFAULT '0',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `suscripcion_id` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `moneda` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `metodo_pago` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_pago` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','completado','fallido','reembolsado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `pagado_en` datetime DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `participantes_grupo`
--

CREATE TABLE `participantes_grupo` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('miembro','admin','superadmin') COLLATE utf8mb4_unicode_ci DEFAULT 'miembro'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id`, `nombre`, `descripcion`) VALUES
(1, 'ver_chats', 'Ver conversaciones'),
(2, 'responder_chats', 'Responder mensajes'),
(3, 'ver_contactos', 'Ver lista de contactos'),
(4, 'editar_contactos', 'Editar información de contactos'),
(5, 'ver_automatizaciones', 'Ver flujos automáticos'),
(6, 'editar_automatizaciones', 'Crear y editar flujos'),
(7, 'ver_envios_masivos', 'Ver envíos masivos'),
(8, 'crear_envios_masivos', 'Crear y enviar campañas masivas'),
(9, 'ver_reportes', 'Ver tableros y métricas'),
(10, 'gestionar_usuarios', 'Crear y administrar agentes'),
(11, 'gestionar_dispositivos', 'Conectar dispositivos WhatsApp'),
(12, 'gestionar_ia', 'Configurar agentes de IA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planes`
--

CREATE TABLE `planes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio_mensual` decimal(10,2) DEFAULT '0.00',
  `precio_anual` decimal(10,2) DEFAULT '0.00',
  `max_dispositivos` int(11) DEFAULT '1',
  `max_agentes` int(11) DEFAULT '1',
  `max_contactos` int(11) DEFAULT '500',
  `max_envios_masivos` int(11) DEFAULT '100',
  `max_automatizaciones` int(11) DEFAULT '5',
  `permite_ia` tinyint(1) DEFAULT '0',
  `permite_whalink` tinyint(1) DEFAULT '0',
  `permite_grupos` tinyint(1) DEFAULT '0',
  `permite_campanas` tinyint(1) DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `planes`
--

INSERT INTO `planes` (`id`, `nombre`, `descripcion`, `precio_mensual`, `precio_anual`, `max_dispositivos`, `max_agentes`, `max_contactos`, `max_envios_masivos`, `max_automatizaciones`, `permite_ia`, `permite_whalink`, `permite_grupos`, `permite_campanas`, `activo`, `creado_en`) VALUES
(1, 'Gratis', 'Para probar la plataforma', '0.00', '0.00', 1, 1, 500, 50, 3, 0, 0, 0, 0, 1, '2026-03-05 15:34:39'),
(2, 'Básico', 'Para pequeños negocios', '19.99', '199.99', 2, 3, 2000, 500, 10, 0, 1, 1, 0, 1, '2026-03-05 15:34:39'),
(3, 'Profesional', 'Para negocios en crecimiento', '49.99', '499.99', 5, 10, 10000, 2000, 50, 1, 1, 1, 1, 1, '2026-03-05 15:34:39'),
(4, 'Empresarial', 'Para equipos grandes', '99.99', '999.99', 10, 50, 999999, 9999, 999, 1, 1, 1, 1, 1, '2026-03-05 15:34:39'),
(5, 'Superadmin', 'Plan interno sin límites', '0.00', '0.00', 999, 999, 999999, 999999, 999, 1, 1, 1, 1, 1, '2026-03-05 15:34:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recordatorios`
--

CREATE TABLE `recordatorios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `contacto_id` int(11) NOT NULL,
  `nota` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `completado` tinyint(1) DEFAULT '0',
  `recordar_en` datetime NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registros_automatizacion`
--

CREATE TABLE `registros_automatizacion` (
  `id` int(11) NOT NULL,
  `automatizacion_id` int(11) NOT NULL,
  `contacto_jid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje_disparador` text COLLATE utf8mb4_unicode_ci,
  `respuesta_enviada` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('exitoso','fallido') COLLATE utf8mb4_unicode_ci DEFAULT 'exitoso',
  `ejecutado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `respuestas_rapidas`
--

CREATE TABLE `respuestas_rapidas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `atajo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('texto','imagen','documento') COLLATE utf8mb4_unicode_ci DEFAULT 'texto',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_permisos`
--

CREATE TABLE `rol_permisos` (
  `id` int(11) NOT NULL,
  `rol` enum('superadmin','admin','agente','visor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `permiso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

CREATE TABLE `sesiones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token_jwt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivo_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `expira_en` datetime NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suscripciones`
--

CREATE TABLE `suscripciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `estado` enum('activa','vencida','cancelada','prueba') COLLATE utf8mb4_unicode_ci DEFAULT 'prueba',
  `periodo` enum('mensual','anual') COLLATE utf8mb4_unicode_ci DEFAULT 'mensual',
  `fecha_inicio` datetime NOT NULL,
  `fecha_vencimiento` datetime NOT NULL,
  `renovacion_auto` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `suscripciones`
--

INSERT INTO `suscripciones` (`id`, `usuario_id`, `plan_id`, `estado`, `periodo`, `fecha_inicio`, `fecha_vencimiento`, `renovacion_auto`, `creado_en`) VALUES
(1, 1, 5, 'activa', 'anual', '2026-03-05 15:34:39', '2125-03-05 15:34:39', 1, '2026-03-05 15:34:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tableros`
--

CREATE TABLE `tableros` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widgets` text COLLATE utf8mb4_unicode_ci,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto_perfil` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_personal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zona_horaria` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'America/Guayaquil',
  `rol` enum('superadmin','admin','agente','visor') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `correo`, `contrasena_hash`, `foto_perfil`, `whatsapp_personal`, `zona_horaria`, `rol`, `activo`, `creado_en`, `ultimo_acceso`) VALUES
(1, 'Angel Oswaldo Espinoza Veintimilla', 'geodiinnovate@gmail.com', '$2b$12$reemplaza_con_hash_real', NULL, NULL, 'America/Guayaquil', 'superadmin', 1, '2026-03-05 15:34:39', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `whalinks`
--

CREATE TABLE `whalinks` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dispositivo_id` int(11) NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje_bienvenida` text COLLATE utf8mb4_unicode_ci,
  `url_redireccion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `total_clics` int(11) DEFAULT '0',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `agentes_ia`
--
ALTER TABLE `agentes_ia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- Indices de la tabla `agente_contactos`
--
ALTER TABLE `agente_contactos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `agente_contacto_unico` (`agente_id`,`contacto_jid`);

--
-- Indices de la tabla `automatizaciones`
--
ALTER TABLE `automatizaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- Indices de la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- Indices de la tabla `campana_grupos`
--
ALTER TABLE `campana_grupos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campana_grupo_unico` (`campana_id`,`grupo_id`),
  ADD KEY `grupo_id` (`grupo_id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `contactos`
--
ALTER TABLE `contactos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contacto_unico` (`dispositivo_id`,`jid`),
  ADD KEY `agente_asignado_id` (`agente_asignado_id`);

--
-- Indices de la tabla `contacto_etiquetas`
--
ALTER TABLE `contacto_etiquetas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `etiqueta_unica` (`contacto_id`,`etiqueta_id`),
  ADD KEY `etiqueta_id` (`etiqueta_id`);

--
-- Indices de la tabla `destinatarios_envio`
--
ALTER TABLE `destinatarios_envio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `envio_id` (`envio_id`),
  ADD KEY `contacto_id` (`contacto_id`);

--
-- Indices de la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dispositivo_id` (`dispositivo_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `envios_masivos`
--
ALTER TABLE `envios_masivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- Indices de la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grupo_unico` (`dispositivo_id`,`jid`);

--
-- Indices de la tabla `horarios_atencion`
--
ALTER TABLE `horarios_atencion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `horario_unico` (`usuario_id`,`dia_semana`);

--
-- Indices de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mensaje_unico` (`dispositivo_id`,`mensaje_id`),
  ADD KEY `idx_chat` (`dispositivo_id`,`chat_jid`),
  ADD KEY `idx_fecha` (`fecha_mensaje`);

--
-- Indices de la tabla `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `contacto_id` (`contacto_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `suscripcion_id` (`suscripcion_id`);

--
-- Indices de la tabla `participantes_grupo`
--
ALTER TABLE `participantes_grupo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grupo_id` (`grupo_id`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `planes`
--
ALTER TABLE `planes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `recordatorios`
--
ALTER TABLE `recordatorios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `contacto_id` (`contacto_id`);

--
-- Indices de la tabla `registros_automatizacion`
--
ALTER TABLE `registros_automatizacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `automatizacion_id` (`automatizacion_id`);

--
-- Indices de la tabla `respuestas_rapidas`
--
ALTER TABLE `respuestas_rapidas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `rol_permisos`
--
ALTER TABLE `rol_permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rol_permiso_unico` (`rol`,`permiso_id`),
  ADD KEY `permiso_id` (`permiso_id`);

--
-- Indices de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indices de la tabla `tableros`
--
ALTER TABLE `tableros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `whalinks`
--
ALTER TABLE `whalinks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `dispositivo_id` (`dispositivo_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `agentes_ia`
--
ALTER TABLE `agentes_ia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `agente_contactos`
--
ALTER TABLE `agente_contactos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `automatizaciones`
--
ALTER TABLE `automatizaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `campanas`
--
ALTER TABLE `campanas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `campana_grupos`
--
ALTER TABLE `campana_grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `contactos`
--
ALTER TABLE `contactos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `contacto_etiquetas`
--
ALTER TABLE `contacto_etiquetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `destinatarios_envio`
--
ALTER TABLE `destinatarios_envio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `envios_masivos`
--
ALTER TABLE `envios_masivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `horarios_atencion`
--
ALTER TABLE `horarios_atencion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mensajes`
--
ALTER TABLE `mensajes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `participantes_grupo`
--
ALTER TABLE `participantes_grupo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `planes`
--
ALTER TABLE `planes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `recordatorios`
--
ALTER TABLE `recordatorios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registros_automatizacion`
--
ALTER TABLE `registros_automatizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `respuestas_rapidas`
--
ALTER TABLE `respuestas_rapidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rol_permisos`
--
ALTER TABLE `rol_permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tableros`
--
ALTER TABLE `tableros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `whalinks`
--
ALTER TABLE `whalinks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `agentes_ia`
--
ALTER TABLE `agentes_ia`
  ADD CONSTRAINT `agentes_ia_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agentes_ia_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `agente_contactos`
--
ALTER TABLE `agente_contactos`
  ADD CONSTRAINT `agente_contactos_ibfk_1` FOREIGN KEY (`agente_id`) REFERENCES `agentes_ia` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `automatizaciones`
--
ALTER TABLE `automatizaciones`
  ADD CONSTRAINT `automatizaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `automatizaciones_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD CONSTRAINT `campanas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `campanas_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `campana_grupos`
--
ALTER TABLE `campana_grupos`
  ADD CONSTRAINT `campana_grupos_ibfk_1` FOREIGN KEY (`campana_id`) REFERENCES `campanas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `campana_grupos_ibfk_2` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD CONSTRAINT `configuracion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `contactos`
--
ALTER TABLE `contactos`
  ADD CONSTRAINT `contactos_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contactos_ibfk_2` FOREIGN KEY (`agente_asignado_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `contacto_etiquetas`
--
ALTER TABLE `contacto_etiquetas`
  ADD CONSTRAINT `contacto_etiquetas_ibfk_1` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contacto_etiquetas_ibfk_2` FOREIGN KEY (`etiqueta_id`) REFERENCES `etiquetas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `destinatarios_envio`
--
ALTER TABLE `destinatarios_envio`
  ADD CONSTRAINT `destinatarios_envio_ibfk_1` FOREIGN KEY (`envio_id`) REFERENCES `envios_masivos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `destinatarios_envio_ibfk_2` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dispositivos`
--
ALTER TABLE `dispositivos`
  ADD CONSTRAINT `dispositivos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `envios_masivos`
--
ALTER TABLE `envios_masivos`
  ADD CONSTRAINT `envios_masivos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `envios_masivos_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `etiquetas`
--
ALTER TABLE `etiquetas`
  ADD CONSTRAINT `etiquetas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `horarios_atencion`
--
ALTER TABLE `horarios_atencion`
  ADD CONSTRAINT `horarios_atencion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`suscripcion_id`) REFERENCES `suscripciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `participantes_grupo`
--
ALTER TABLE `participantes_grupo`
  ADD CONSTRAINT `participantes_grupo_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recordatorios`
--
ALTER TABLE `recordatorios`
  ADD CONSTRAINT `recordatorios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recordatorios_ibfk_2` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registros_automatizacion`
--
ALTER TABLE `registros_automatizacion`
  ADD CONSTRAINT `registros_automatizacion_ibfk_1` FOREIGN KEY (`automatizacion_id`) REFERENCES `automatizaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `respuestas_rapidas`
--
ALTER TABLE `respuestas_rapidas`
  ADD CONSTRAINT `respuestas_rapidas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `rol_permisos`
--
ALTER TABLE `rol_permisos`
  ADD CONSTRAINT `rol_permisos_ibfk_1` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD CONSTRAINT `suscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `suscripciones_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`);

--
-- Filtros para la tabla `tableros`
--
ALTER TABLE `tableros`
  ADD CONSTRAINT `tableros_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `whalinks`
--
ALTER TABLE `whalinks`
  ADD CONSTRAINT `whalinks_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `whalinks_ibfk_2` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
