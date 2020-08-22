<?php
require('aws.php');
require('cors.php');
$MAX_TIME = 43200; // 12 hours

# cors();

function signIn($password){
  global $MAX_TIME;
  $userData = getUser($password);
  $lastTime = $userData["lastTime"]["N"];
  $totalTime = $userData["totalTime"]["N"];
  $sessionTime = time() - $lastTime;
  if($userData["signedIn"]["BOOL"]){
    $eav = array(
      ':sessions' => $userData["sessions"],
      ':signedIn' => array('BOOL' => false),
      ':lastTime' => array('N' => strval(time())),
      ':totalTime' => array('N' => strval($totalTime + ($sessionTime < $MAX_TIME ? $sessionTime : 0)))
    );
    updateUser($password, $eav);
    echo $userData["username"]["S"];
  } else {
    $eav = array(
      ':sessions' => $userData["sessions"],
      ':signedIn' => array('BOOL' => true),
      ':lastTime' => array('N' => strval(time())),
      ':totalTime' => array('N' => $userData["totalTime"]["N"])
    );
    updateUser($password, $eav);
    echo $userData["username"]["S"];
  }
}
// start tracking time on signin
if (isset($_REQUEST['password'])) {
  signIn($_REQUEST['password']);
}
?>
