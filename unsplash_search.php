<?php
// unsplash_search.php

// Clave de acceso de Unsplash (reemplaza con la tuya)
$accessKey = "YOUR_UNSPLASH_ACCESS_KEY";

// Establece el encabezado de respuesta para JSON
header('Content-Type: application/json');

// Recupera los parámetros de la consulta
$query = isset($_GET['q']) ? trim($_GET['q']) : "";
$perPage = isset($_GET['per_page']) ? intval($_GET['per_page']) : 24;

// Si no se proporciona una consulta, devuelve un error
if (empty($query)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Falta el parámetro de consulta (q).'
    ]);
    exit;
}

// Construir la URL de búsqueda de Unsplash
$unsplashUrl = "https://api.unsplash.com/search/photos?client_id=" . urlencode($accessKey) .
               "&query=" . urlencode($query) .
               "&per_page=" . $perPage;

// Inicializar cURL para hacer la solicitud a Unsplash
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $unsplashUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);

// Verificar si ocurrió algún error
if (curl_errno($ch)) {
    echo json_encode([
        'status' => 'error',
        'message' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Devolver la respuesta obtenida (la API de Unsplash ya devuelve JSON)
echo $response;
?>
