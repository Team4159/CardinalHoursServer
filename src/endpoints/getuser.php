<?php
// Shared function to get data of a single user from sheets
$data = $service->spreadsheets_values->get($spreadsheetId, 'Data')->getValues(); // Gets all relevant data from sheets
function getUserData($password){
  global $data;
  if (empty($data)) {
    return 'Uh Oh. Something broke.\n';
  } else {
    $num = count($data);
    for ($i = 1; $i < $num; $i++) {
      if($data[$i][1] == $password)
        return $data[$i];
    }
  }
}
?>
