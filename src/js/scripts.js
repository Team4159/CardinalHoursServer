// Attempts to sign in with cookie if it exists
$(document).ready(async function() {
  setInterval(async function(){
    showData(await getUserData(Cookies.get('password')));
  }, 1000);
  showData(await getUserData(Cookies.get('password')));
});

// Triggers the signin call for the server
async function signIn(password, did){
  let xmlhttp = new XMLHttpRequest();
  let data = await getUserData(password);
  xmlhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      if(this.responseText == '')
        $('#message').text("User not found");
      else
        $('#message').text('Welcome, ' + this.responseText);
      Cookies.set('password', password);
      showData(data);
    }
  }
  if(data["signedIn"])
    xmlhttp.open('GET', 'src/endpoints/signout.php?password=' + password + '&did=' + did, true);
  else
    xmlhttp.open('GET', 'src/endpoints/signin.php?password=' + password, true);
  xmlhttp.send();
}

// Gets all the data from the server
async function getUserData(password) {
  return new Promise(function (resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resolve(JSON.parse(this.responseText));
      }
    }
    xmlhttp.open('GET', 'src/endpoints/getuserdata.php?password=' + password, true);
    xmlhttp.send();
  });
}

async function getTime() {
  return new Promise(function (resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resolve(parseInt(this.responseText));
      }
    }
    xmlhttp.open('GET', 'src/endpoints/gettime.php', true);
    xmlhttp.send();
  });
}

// Shows the signed in users's data
async function showData(data){
  let message = '';
  if(Cookies.get('password') != undefined){
    var user = data;
    message += 'Welcome, ' + user["username"] + "<br> ";
    if(user["signedIn"]){
      $('#signIn').text("Sign out");
      message += "Signed in <br> Session time: " + parseTime(await getTime() - user["lastTime"]) + " <br> ";
      message += "Total time: " + parseTime(await getTime() - user["lastTime"] + user["totalTime"]);
      var did = document.getElementById("did");
      did.style.display = "block";
      } else {
      $('#signIn').text("Sign in");
      var did = document.getElementById("did");
      did.style.display = "none";
      message += "Signed out <br> ";
      message += "Total time: " + parseTime(user["totalTime"]);
    }
  } else {
    message = 'Please sign in'
  }
  $('#message').html(message);
}

// Sends a request to create a new user
function createUser(name, password) {
  if(name != "" && password != ""){
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        alert(this.responseText == 'User already exists' ? this.responseText : 'Successfully added user ' + this.responseText);
      }
    }
    xmlhttp.open('GET', 'src/endpoints/adduser.php?username=' + name + '&password=' + password, true);
    xmlhttp.send();
  }
}

// turns the seconds into human readable time
function parseTime(e, t) {
  var n = "";
  e = Math.round(e);
  if (e < 0)
    e = 0;
  if (typeof t == "undefined") {
    var t = true
  }
  var r = Math.floor(e / (60 * 60 * 24));
  e -= r * 60 * 60 * 24;
  var i = Math.floor(e / (60 * 60));
  e -= i * 60 * 60;
  var s = Math.floor(e / 60);
  e -= s * 60;
  if (r > 0) {
    n = r + " day" + (r != 1 ? "s" : "");
    if (i == 0 && s == 0 && e == 0) {
      return n
    }
    n += ", ";
    n += i + " hour" + (i != 1 ? "s" : "");
    if (s == 0 && e == 0) {
      return n
    }
    n += ", ";
    n += s + " minute" + (s != 1 ? "s" : "");
    if (e == 0 || !t) {
      return n
    }
    n += ", " + e + " second" + (e != 1 ? "s" : "");
    return n
  }
  if (i > 0) {
    n = i + " hour" + (i != 1 ? "s" : "");
    if (s == 0 && e == 0) {
      return n
    }
    n += ", ";
    n += s + " minute" + (s != 1 ? "s" : "");
    if (e == 0 || !t) {
      return n
    }
    n += ", " + e + " second" + (e != 1 ? "s" : "");
    return n
  }
  if (s > 0) {
    n = s + " minute" + (s != 1 ? "s" : "");
    if (e == 0 || !t) {
      return n
    }
    n += ", " + e + " second" + (e != 1 ? "s" : "");
    return n
  }
  return e + " second" + (e != 1 ? "s" : "")
}
