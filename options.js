var checkStatus = function(){
  chrome.storage.sync.get("token", function(items){
    if (items.token){
      document.getElementById("loggedin").style.display = "block";
      document.getElementById("loggedout").style.display = "none";
    } else {
      document.getElementById("loggedin").style.display = "none";
      document.getElementById("loggedout").style.display = "block";
    }
  });
}
checkStatus();
chrome.storage.onChanged.addListener(checkStatus);

document.querySelector("#loggedin button").addEventListener('click', function(){
  chrome.storage.sync.clear();
});
document.querySelector("#loggedout button").addEventListener('click', function(){
  Auth.getToken();
});

chrome.storage.sync.get("hide-auth-notif", function(result){
  document.getElementById("displaynotification").checked = !result.hide-auth-notif;
});
document.querySelector("#loggedin button").addEventListener('change', function(){
  chrome.storage.sync.set({'hide-auth-notif': !this.checked}, function(){});
});
