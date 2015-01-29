function show(msg) {
  new Notification("group "+msg.subject.group_id, {
    icon: msg.subject.avatar_url,
    body: msg.subject.text
  });
}
chrome.storage.sync.get("token", function(items){
  if (items.token){
    setUpSocket(items.token);
  } else {
    openAuthTab();
  }
});
openAuthTab = function(){
  chrome.tabs.create({
    'url': chrome.extension.getURL('index.html')
  }, function(tab) {

  });
};
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == "setToken"){
    chrome.storage.sync.set({'token': request.value}, function() {
      sendResponse({data: "Token set"});
    });
  }
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    if (key === "token"){
      setUpSocket(changes[key].newValue);
    }
  }
});
getUserInfo = function(token, cb){
  var request = new XMLHttpRequest();
  request.open('GET', 'https://api.groupme.com/v3/users/me?token='+token, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var resp = request.responseText;
      cb(JSON.parse(resp).response);
    }
  };
  request.send();
};
setUpSocket = function(token){
  getUserInfo(token,function(user){
    subscribe(user.id);
  });
  var client = new Faye.Client('https://push.groupme.com/faye');
  client.addExtension({
    outgoing: function(message, callback){
      if (message.channel !== '/meta/subscribe'){
        return callback(message);
      }
      message.ext = message.ext || {};
      message.ext.access_token = token;
      message.ext.timestamp = Date.now()/1000 |0;
      callback(message);
    }
  });
  var subscribe = function(uid){
    var subscription = client.subscribe('/user/'+uid, function(message) {
        show(message);
    });
  };
};
