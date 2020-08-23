<?php
require('aws.php');
require('cors.php');

cors();

function signIn($password){
  $userData = getUser($password);
  if(!$userData["signedIn"]["BOOL"]){
    $data = [
      ':signedIn' => ['BOOL' => true],
      ':lastTime' => ['N' => strval(time())],
      ':totalTime' => ['N' => $userData["totalTime"]["N"]]
    ];
    updateUser($password, $data);
    echo $userData["username"]["S"];
  }
}
// start tracking time on signin
if (isset($_REQUEST['password'])) {
    signIn($_REQUEST['password']);
}
signIn("123");
?>
