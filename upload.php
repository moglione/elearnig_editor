<?php
header('Content-Type: application/json');

// Definir la carpeta de subida
$targetDir = "uploads/";

// Crear la carpeta si no existe
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if(isset($_FILES['file'])) {
    $file = $_FILES['file'];
    // Generar un nombre único para evitar sobreescritura
    $uniqueName = uniqid() . "_" . basename($file['name']);
    $targetFile = $targetDir . $uniqueName;
    
    // (Opcional: validar tamaño, tipo MIME, etc.)
    
    if(move_uploaded_file($file['tmp_name'], $targetFile)) {
        // Devolver la URL relativa; ajuste si necesita URL absoluta
        echo json_encode([
            'status' => 'success',
            'url' => $targetFile
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Error al mover el archivo.'
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'No se ha recibido ningún archivo.'
    ]);
}
?>
