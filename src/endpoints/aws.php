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

  // Might give you the requested user data if you pleased the god jeff besos
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
    try {
      $result = $dynamodb->getItem($params);
      return json_decode($marshaler->unmarshalJson($result['Item']));
    } catch (TypeError $e) {
      return null;
    }
  }

  // Might add a user, might not. 1 in 100000000000 chance to not work
  function addUser($username, $password){
    global $marshaler;
    global $tableName;
    global $dynamodb;
    $item = $marshaler->marshalJson('
      {
        "Password": "' . $password . '",
        "Username": "' . $username . '",
        "SignedIn": false,
        "LastTime": 0,
        "TotalTime": 0,
        "Sessions": []
      }
    ');
    $params = [
      'TableName' => $tableName,
      'Item' => $item
    ];
    $dynamodb->putItem($params);
  }
?>
