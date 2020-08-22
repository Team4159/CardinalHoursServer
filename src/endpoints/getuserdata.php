<?php
require('aws.php');
require('cors.php');
cors();
use Aws\DynamoDb\Marshaler;
$marshaler = new Marshaler();
echo $marshaler->unmarshalItem(getUser($_REQUEST['password']));
?>
