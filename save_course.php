<?php
header("Content-Type: application/json");

// Directorio para guardar cursos
$coursesDir = "cursos_sin_compilar/";
if (!is_dir($coursesDir)) {
    mkdir($coursesDir, 0777, true);
}

// Obtener datos del cuerpo de la petición
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data['courseName']) || !isset($data['courseData'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Datos inválidos"
    ]);
    exit;
}

// Sanitizar el nombre del curso
$courseName = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['courseName']);
$filePath = $coursesDir . $courseName . ".json";

if (file_put_contents($filePath, json_encode($data['courseData'], JSON_PRETTY_PRINT))) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "No se pudo guardar el curso"
    ]);
}
?>
