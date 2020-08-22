<?php
require('aws.php');
require('cors.php');
use Aws\DynamoDb\Marshaler;
$MAX_TIME = 43200; // 12 hours

# cors();

function signIn($password){
  global $MAX_TIME;
  $marshaler = new Marshaler();
  $userData = getUser($password);
  $lastTime = $userData["lastTime"]["N"];
  $totalTime = $userData["totalTime"]["N"];
  $sessionTime = time() - $lastTime;
  if($userData["signedIn"]){
    $eav = array(
      'sessions' => array('L' => $marshaler->marshalItem($userData["sessions"]["L"])),
      'signedIn' => array('BOOL' => false),
      'lastTime' => array('N' => strval(time())),
      'totalTime' => array('N' => strval($totalTime + ($sessionTime < $MAX_TIME ? $sessionTime : 0)))
    );
    updateUser($password, $eav);
    echo $userData["username"]["S"];
  } else {
    $eav = array(
      'sessions' => array('L' => $marshaler->marshalItem($userData["sessions"]["L"])),
      'signedIn' => array('BOOL' => true),
      'lastTime' => array('N' => strval(time())),
      'totalTime' => array('N' => $userData["totalTime"])
    );
    updateUser($password, $eav);
    echo $userData["username"]["S"];
  }
}
// start tracking time on signin
if (isset($_REQUEST['password'])) {
}

signIn("123");
?>
