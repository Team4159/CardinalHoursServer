<?php
require('aws.php');
require('cors.php');

cors();

if (isset($_REQUEST['newPassword']) && isset($_REQUEST['password'])) {
  if(getUser($_REQUEST['newPassword']) === null && getUser($_REQUEST['password']) != null && $_REQUEST['newPassword'] != '' && $_REQUEST['password'] != ''){
    changePassword($_REQUEST['username'], $_REQUEST['newPassword']);
    echo $_REQUEST['newPassword'];
  } else
    http_response_code(404);
}

?>
