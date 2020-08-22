<?php
require('aws.php');
require('cors.php');

$MAX_TIME = 43200; // 12 hours

cors();

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  $userData = getUser($_REQUEST['password']);
  $lastTime = $userData["lastTime"];
  $totalTime = $userData["totalTime"];
  $sessionTime = time() - $lastTime;
  if($userData["signedIn"]){
    $eav = $marshaler->marshalJson('
      {
        ":sessions": "'.$userData["sessions"].'",
          ":lastTime": "'.time().'",
          ":totalTime": "'.$totalTime + ($sessionTime < $MAX_TIME ? $sessionTime : 0).'",
          ":signedIn": "'.false.'"
      }
    ');
    updateUser($_REQUEST['password'], $eav);
    echo $userData["username"];
  } else {
    $eav = $marshaler->marshalJson('
      {
          ":sessions": "'.$userData["sessions"].'",
          ":lastTime": "'.$lastTime.'",
          ":totalTime": "'.$totalTime.'",
          ":signedIn": "'.true.'"
      }
    ');
    updateUser($_REQUEST['password'], $eav);
    echo $userData["username"];
  }
}

?>
