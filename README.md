# CardinalHoursServer

## How2Run

Export `AWS_KEY` for the Access Key ID and `AWS_SECRET_KEY` for the Secret Access Key.

If running under Apache add the exports to `/etc/apache2/envvars` and install `libapache2-mod-php` and enable the endpoints by adding `/src/endpoints/*.php` to `/etc/apache2/mods-enabled/dir.conf`.

For sheets access, in the root folder create a file credentials.json with

```
{"web":{"client_id":"375372971746-dc790in67f7omi06ao9c6s2eab4gl7m4.apps.googleusercontent.com","project_id":"cardinalhours-1597455660382","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"hAnIzyuOwj2GheEuNjMgNs6x","redirect_uris":["http://ec2-18-221-165-138.us-east-2.compute.amazonaws.com/"]}}
```

run `php src/endpoints/sheets.php` and paste the resulting authentication token from the redirect url to authenticate the Google Sheets api.

## Documentation


### Endpoints:

To add a user:
```
src/endpoints/adduser.php
parameters: username, password
returns: Username on success and 'User already exists' if a user with the same password already exists
```

To get the time:
```
src/endpoints/gettime.php
parameters: none
returns: Unix time in seconds
```

To get data of a single user:
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
      "time": <int>, // How long the session lasted
    }
  ]
}
```

To sign a user in:
```
src/endpoints/signin.php
parameters: password
returns: Username on success, nothing if they're already signed in
```

To sign a user out:
```
src/endpoints/signout.php
parameters: password
returns: Username on success, nothing if they're already signed out
```
