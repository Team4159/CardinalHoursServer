# CardinalHoursServer

## Documentation


### Endpoints:
```
src/endpoints/adduser.php
parameters: username, password
returns: Username on success and 'User already exists' if a user with the same password already exists
```
```
src/endpoints/gettime.php
parameters: none
returns: Unix time in seconds
```
```
src/endpoints/getuserdata.php
parameters: password
returns: stringified json of all the requested user's data
JSON is in the format of
{
  "signedIn": <bool>, // True if the user is signed in and false if they are not
  "totalTime": <int>, // Total time in seconds of all the sessions of the user (log in + log out)
  "password": <String>, // The password of the user
  "sessions": [ // An array containing each session of the user
    {
      "date": <String>, // The date of the session in Month.Day.Year format
      "did": <String>, // What the user reported to have done during that session, is blank if nothing was reported
      "time": <int>, // The total time of the session
    }
  ]
}
```
```
src/endpoints/signin.php
parameters: password
returns: Username on success, nothing if they're already signed in
```
```
src/endpoints/signout.php
parameters: password
returns: Username on success, nothing if they're already signed out
```
