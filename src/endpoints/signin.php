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
  if(getUser($_REQUEST['password']) === null)
    echo 'User does not exist';
  else
    signIn($_REQUEST['password']);
}
?>
