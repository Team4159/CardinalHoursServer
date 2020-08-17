<?php
require('sheets.php');
require('datafuncs.php');

$data = $service->spreadsheets_values->get($spreadsheetId, 'Data')->getValues(); // Gets all relevant data from sheets
// start tracking time on signin
if (isset($_REQUEST['password'])) {
  if(getUserData($_REQUEST['password'])[3] == FALSE){

  }
}

?>
