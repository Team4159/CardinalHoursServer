<?php
require('sheets.php');
require('datafuncs.php');
require('cors.php');
cors();
echo json_encode(getUserData($_REQUEST['password']));
?>
