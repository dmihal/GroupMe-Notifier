Notifications = (function(){
  var notifications = {};

  var findNotificationById = function(id){
    for(var groupId in notifications){
      if (notifications[groupId].id === id){
        return notifications[groupId];
      }
    }
    return null;
  }

  var click = function(id){
    var notification = findNotificationById(id);
    if (notification){
      var newURL = "https://app.groupme.com/chats/" + notification.groupId;
      chrome.tabs.query({"url" : "https://app.groupme.com/*"}, function(tabs){
        if (tabs.length > 0){
          var matchedTab = tabs[0];
          chrome.windows.update(matchedTab.windowId, { 
            "focused" : true
          });
		  chrome.tabs.update(matchedTab.id, {
            "active" : true, "url" : newURL
			// changing url reloads the page (which may not be the best solution)
          });
        }
        else {
          chrome.tabs.create({
            url : newURL
          }, function(tab){});
        } 
      });
    }
  };
  chrome.notifications.onClicked.addListener(click);

  function _notification(group){
    this.id = "";
    this.groupId = group.id || "";
    this.messages = [];
    this.title = group.name || "GroupMe";
    this.image = group.image;
    this.url = group.url;
  }
  _notification.prototype.addMessage = function(msg){
    this.messages.push(msg);
  };
  _notification.prototype.render = function(){
    var self = this;
    var options = {
      title: this.title,
      message: ""
    };
    if (this.messages.length > 1){
      var items = [];
      for (var i = this.messages.length - 1; i >= 0; i--){
        var message = this.messages[i];
        items.push({
          title: message.name,
          message: message.text
        });
      }
      options.items = items;

      options.type = "list";
      options.iconUrl = this.image;
    } else {
      var message = this.messages[0];
      options.type = "basic";
      options.title = message.name;
      options.message = message.text;
      options.iconUrl = message.image;
    }
    chrome.notifications.create(this.id, options, function(id){
      self.id = id;
    });
    this.setTimer(10);
  };
  _notification.prototype.setTimer = function(seconds){
    if (this._timer){
      clearTimeout(this._timer);
    }
    var self = this;
    this._timer = setTimeout(function(){
      self.close();
    }, seconds * 1000);
  };
  _notification.prototype.close = function(){
    chrome.notifications.clear(this.id, function(){});
    delete notifications[this.groupId];
  };


  return {
    addNotification: function(group, message){
      var notification = notifications[group.id] || new _notification(group);
      notification.addMessage(message);
      notification.render();
      notifications[group.id] = notification;
    },
    showSimpleNotification: function(msg){
      var options = {
        type: 'basic',
        title: msg.title,
        message: msg.text,
        iconUrl: msg.image || chrome.extension.getURL("128.png")
      };
      chrome.notifications.create("", options, function(id){
        setTimeout(function(){
          chrome.notifications.clear(id, function(){});
        }, (options.timeout || 5) * 1000);
      });
    }
  };
})();
