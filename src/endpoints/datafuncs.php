<?php
// Functions that require grabbing all data
// Gets the data of a single user
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
