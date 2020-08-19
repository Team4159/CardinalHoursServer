<?php
require('sheets.php');
require('cors.php');
cors();
$data = $service->spreadsheets_values->get($spreadsheetId, 'Data')->getValues(); // Gets all relevant data from sheets
echo json_encode($data)
?>
