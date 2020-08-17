<?php
require('sheets.php');
require('datafuncs.php');

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUserData($_REQUEST['password']);
  $lastTime = intval(userData[3]);
  $totalTime = intval(userData[4]);
  $currentTime = intval(time());
  $sessionTime = $currentTime - $lastTime;
  if($userData[2] == "FALSE"){
    $values = [
      ["TRUE", strval($currentTime), strval($sessionTime)]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    echo json_encode($userData);
    changeData($values, $range);
    echo $userData[0];
  } else if($userData[2] == "TRUE"){
    $values = [
      ["FALSE", strval($currentTime), strval($sessionTime)]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    echo json_encode($userData);
    changeData($values, $range);
    echo $userData[0];
  }
}

?>
