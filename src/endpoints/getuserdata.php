<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
echo $marshaler->marshalItem(getUser($_REQUEST['password']));
?>
