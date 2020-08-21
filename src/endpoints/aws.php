<?php
  require '../../vendor/autoload.php';
  use Aws\DynamoDb\Exception\DynamoDbException;
  use Aws\DynamoDb\Marshaler;

  $sdk = new Aws\Sdk([
    'region'   => 'us-east-2',
    'version'  => 'latest'
  ]);

  $dynamodb = $sdk->createDynamoDb();
  $marshaler = new Marshaler();

  $tableName = 'Hours';

  $key = $marshaler->marshalJson('
    {
        "Password": "123"
    }
  ');

  $params = [
    'TableName' => $tableName,
    'Key' => $key
  ];

  try {
    $result = $dynamodb->getItem($params);
    print_r($result["Item"]);
  } catch (DynamoDbException $e) {
      echo "Unable to get item:\n";
      echo $e->getMessage() . "\n";
  }
?>
