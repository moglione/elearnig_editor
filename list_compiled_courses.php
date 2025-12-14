<?php
header("Content-Type: application/json");

$coursesDir = "cursos/";
if (!is_dir($coursesDir)) {
    echo json_encode([]);
    exit;
}

$courses = [];
foreach (scandir($coursesDir) as $file) {
    if ($file === "." || $file === "..") continue;
    if (pathinfo($file, PATHINFO_EXTENSION) === "json") {
        $courses[] = pathinfo($file, PATHINFO_FILENAME);
    }
}
echo json_encode($courses);
?>
