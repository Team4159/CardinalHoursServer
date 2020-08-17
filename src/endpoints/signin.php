<?php
require('sheets.php');
require('datafuncs.php');

// start tracking time on signin
if (isset($_REQUEST['password'])) {
  echo getUserData($_REQUEST['password'])[3];
  if(getUserData($_REQUEST['password'])[3] == FALSE){
    echo getUserData($_REQUEST['password'])[0];
  }
}

?>
