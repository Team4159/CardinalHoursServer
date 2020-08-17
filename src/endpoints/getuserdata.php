<?php
require('sheets.php');
require('datafuncs.php');
echo json_encode(getUserData($_REQUEST['password']));
?>
