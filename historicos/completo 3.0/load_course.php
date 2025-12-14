<?php
header("Content-Type: application/json");

$coursesDir = "cursos/";
if (!isset($_GET['course'])) {
    echo json_encode([
        "status" => "error",
        "message" => "No se especificó el curso"
    ]);
    exit;
}

$courseName = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['course']);
$filePath = $coursesDir . $courseName . ".json";

if (!file_exists($filePath)) {
    echo json_encode([
        "status" => "error",
        "message" => "Curso no encontrado"
    ]);
    exit;
}

echo file_get_contents($filePath);
?>
