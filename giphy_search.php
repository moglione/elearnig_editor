<?php
// giphy_search.php

// Configura tu API key de Giphy
$giphyApiKey = "ogL11TqE2yn1np4MN3Yfc9EagPyHHcJU"; // Reemplaza con tu API key real

// Establece el encabezado de respuesta para JSON
header('Content-Type: application/json');

// Recupera los parámetros de la consulta
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 24;

// Si no se ha proporcionado una consulta, devuelve un error
if (empty($query)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Falta el parámetro de consulta (q).'
    ]);
    exit;
}

// Construir la URL de la API de Giphy
$giphyUrl = "https://api.giphy.com/v1/gifs/search?api_key=" . urlencode($giphyApiKey) .
            "&q=" . urlencode($query) .
            "&limit=" . $limit;

// Inicializar cURL para realizar la solicitud
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $giphyUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);

// Verificar si se produjo algún error en cURL
if (curl_errno($ch)) {
    echo json_encode([
        'status' => 'error',
        'message' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Devolver la respuesta recibida de la API de Giphy
echo $response;
?>
