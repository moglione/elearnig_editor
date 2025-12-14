<?php
// download_giphy.php

// Configurar la cabecera de respuesta para JSON
header('Content-Type: application/json');

// Verificar que el método de la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit;
}

// Leer la entrada JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!$data || !isset($data['url'])) {
    echo json_encode(['status' => 'error', 'message' => 'No se proporcionó una URL.']);
    exit;
}

$url = $data['url'];

// Validar que la URL sea válida
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode(['status' => 'error', 'message' => 'URL inválida.']);
    exit;
}

// Definir la carpeta de destino
$uploads_dir = 'uploads';

// Verificar si la carpeta existe; de lo contrario, intentar crearla
if (!is_dir($uploads_dir)) {
    if (!mkdir($uploads_dir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'No se pudo crear la carpeta uploads.']);
        exit;
    }
}

// Generar un nombre de archivo único; se asume que la imagen es JPG (puedes ajustar si es necesario)
$extension = 'gif';
$filename = $uploads_dir . '/' . time() . '_' . md5($url) . '.' . $extension;

// Descargar el contenido de la imagen
$imageContent = @file_get_contents($url);
if ($imageContent === false) {
    echo json_encode(['status' => 'error', 'message' => 'Error al descargar la imagen.']);
    exit;
}

// Guardar la imagen en la carpeta uploads
if (file_put_contents($filename, $imageContent) === false) {
    echo json_encode(['status' => 'error', 'message' => 'Error al guardar la imagen.']);
    exit;
}

// Devolver la respuesta con la URL del archivo guardado (ruta relativa)
echo json_encode(['status' => 'success', 'url' => $filename]);
exit;
?>
