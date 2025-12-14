<?php
header('Content-Type: application/json');

// Verificar que el método sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido.'
    ]);
    exit;
}

// Verificar que se haya enviado un archivo
if (!isset($_FILES['file'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'No se recibió ningún archivo.'
    ]);
    exit;
}

$file = $_FILES['file'];
$error = $file['error'];
if ($error !== UPLOAD_ERR_OK) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error en la carga del archivo. Código: ' . $error
    ]);
    exit;
}

// Directorio de destino
$uploadDir = 'uploads/';

// Crear el directorio si no existe
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'No se pudo crear la carpeta de uploads.'
        ]);
        exit;
    }
}

// Obtener información del archivo
$originalName = $file['name'];
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Validar la extensión del archivo (ajusta según tus necesidades)
$allowedExtensions = ['mp4', 'avi', 'mov', 'mkv'];
if (!in_array($ext, $allowedExtensions)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Tipo de archivo no permitido.'
    ]);
    exit;
}

// Generar un nombre único para evitar colisiones
$uniqueName = time() . '_' . md5($originalName . rand()) . '.' . $ext;
$destination = $uploadDir . $uniqueName;

// Mover el archivo subido al directorio destino
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'No se pudo guardar el archivo.'
    ]);
    exit;
}

// Devolver la respuesta con la URL relativa del archivo subido
echo json_encode([
    'status' => 'success',
    'url' => $destination
]);
exit;
?>
