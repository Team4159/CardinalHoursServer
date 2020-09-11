<?php
require('aws.php');
require('sheets.php');

$hours = $service->spreadsheets_values->get($spreadsheetId, 'Friday Meetings/Hours')->getValues(); // Gets all relevant data from sheets

function getUserRow($first, $last){
  global $hours;
  $firstNameRow = 0;
  $lastNameRow = 1;
  if (empty($hours)) {
    return 'Uh Oh. Something broke.\n';
  } else {
    $num = count($hours);
    for ($i = 1; $i < $num; $i++) { // Starts at 1 to exclude the top labels
      if($hours[$i][$firstNameRow] == $first && $hours[$i][$lastNameRow] == $last){
        return $i + 1;
      }
    }
  }
}

function syncUser($password){
  $dbData = getUser($password);
  $first = explode(' ', $dbData["username"]["S"], 2)[0];
  $last = explode(' ', $dbData["username"]["S"], 2)[1];

  $row = getUserRow($first, $last);
  // Data of the user from the database

  // Update the hours
  $teamHours = ("'Friday Meetings/Hours'!") . ("H" . $row);
  changeData([[$dbData["totalTime"]["N"]/3600]], $teamHours);

  // Update the meetings
  $meetings = ("'Friday Meetings/Hours'!") . ("E" . $row);
  changeData([[countFridays($password)]], $meetings);
}

?>
