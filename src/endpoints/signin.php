<?php
require('sheets.php');
require('datafuncs.php');
require('cors.php');

$MAX_TIME = 43200; // 12 hours

cors();

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUser($_REQUEST['password']);
  $lastTime = $userData["lastTime"];
  $totalTime = $userData["totalTime"];
  if($userData["signedIn"]){
    $eav = $marshaler->marshalJson('
      {
          ":sessions": ' . $userData["sessions"] . ',
          ":lastTime": ' . $lastTime . ',
          ":totalTime": ' . $totalTime . ',
          ":signedIn": ' . false . '
      }
    ');
    updateUser($_REQUEST['password'], $eav);
  } else {
    $eav = $marshaler->marshalJson('
      {
          ":sessions": ' . $userData["sessions"] . ',
          ":lastTime": ' . $lastTime . ',
          ":totalTime": ' . $totalTime . ',
          ":signedIn": ' . false . '
      }
    ');
    updateUser($_REQUEST['password'], $eav);
  }
}

?>
