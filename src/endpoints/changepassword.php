<?php
require('aws.php');
require('cors.php');

cors();

if (isset($_REQUEST['newpassword']) && isset($_REQUEST['password'])) {
  $userExists = getUser(['password' => ['S' => strval($_REQUEST['newpassword'])]]) !== null;
  if (!$userExists && getUser(['password' => ['S' => strval($_REQUEST['password'])]]) != null && $_REQUEST['newpassword'] != '' && $_REQUEST['password'] != ''){
    changePassword(['password' => ['S' => $_REQUEST['password']]], $_REQUEST['newpassword']);
    echo $_REQUEST['newpassword'];
  } else {
    if ($userExists) {
      echo 'An account with this password already exists.';
    }
    http_response_code(404);
  }
}

?>
