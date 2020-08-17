<?php
require('sheets.php');
require('datafuncs.php');

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUserData($_REQUEST['password']);
  $lastTime = (int) userData[3];
  $totalTime = (int) userData[4];
  if($userData[2] == "FALSE"){
    $values = [
      ["TRUE", time(), (int) userData[4]]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    changeData($values, $range);
    echo $userData[0];
  } else if($userData[2] == "TRUE"){
    $values = [
      ["FALSE", time(), (int) userData[4] + time() - (int) userData[3]]
    ];
    $range = ("C" . getUserRow($_REQUEST['password'])) . (":E" . getUserRow($_REQUEST['password']));
    echo (int) time() - $lastTime;
    changeData($values, $range);
    echo $userData[0];
  }
}

?>
