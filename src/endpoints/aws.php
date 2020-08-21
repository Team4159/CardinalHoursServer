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

  function getUserData($password){
    global $marshaler;
    global $tableName;
    global $dynamodb;
    $key = $marshaler->marshalJson('
      {
          "Password": "' . $password . '"
      }
    ');
    $params = [
      'TableName' => $tableName,
      'Key' => $key
    ];

    $result = $dynamodb->getItem($params);
    return json_decode($marshaler->unmarshalJson($result["Item"]), true);
  }

  function addUser($username, $password){
    global $marshaler;
    global $tableName;
    global $dynamodb;
    $item = $marshaler->marshalJson('
      {
        "Password": "' . $password . '",
        "Username": "' . $username . '",
        "Sessions": []
      }
    ');
    $params = [
      'TableName' => $tableName,
      'Item' => $item
    ];
    $dynamodb->putItem($params);
  }
  addUser("kai", "kailovespancakes");
  echo getUserData("123");
?>
