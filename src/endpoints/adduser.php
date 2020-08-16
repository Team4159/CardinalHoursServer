<?php
require('sheets.php');
require('getuser.php');

// Adds a user to sheets
function addUser($name, $password){
  global $data;
  global $client;
  global $service;
  global $spreadsheetId;
  $range = ("A". (count($data) + 1)) . (":E" . (count($data) + 1));
  $values = [
    [
        $name, $password, FALSE, time(), 0
    ],
  ];

  $params = [
    'valueInputOption' => 'USER_ENTERED'
  ];

  $body = new Google_Service_Sheets_ValueRange([
    'values' => $values
  ]);

  $service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
}

if (isset($_REQUEST['username']) && isset($_REQUEST['password'])) {
  if(getUserData($_REQUEST['password']) === null && $_REQUEST['username'] != '' && $_REQUEST['password'] != ''){
    addUser($_REQUEST['createUser'], $_REQUEST['password']);
    echo $_REQUEST['createUser'];
  } else
    echo 'User already exists';
}

?>
