Auth = (function(){
  var clientId = 'Po6Si7nYiPunWKNnvxLbrepS7GHjpzz5gYmApy7YqAX9FruJ';
  var clientSecret = 'a1499b1a5780c8a21ed560b839741e803c4cc936';
  var baseUri = 'https://oauth.groupme.com/oauth/authorize';
  var redirectUri = chrome.identity.getRedirectURL();
  var redirectRe = new RegExp(redirectUri + '[#\?](.*)');

  var authUri = baseUri + '?client_id=' + clientId +
        '&redirect_uri=' + encodeURIComponent(redirectUri);

  return {
    getToken: function(interactive) {
      var options = {
        interactive: true,
        url: authUri
      }
      chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
        console.log('launchWebAuthFlow completed', chrome.runtime.lastError,
            redirectUri);

        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError);
          return;
        }

        // Upon success the response is appended to redirectUri, e.g.
        // https://{app_id}.chromiumapp.org/provider_cb#access_token={value}
        //     &refresh_token={value}
        // or:
        // https://{app_id}.chromiumapp.org/provider_cb#code={value}
        var matches = redirectUri.match(redirectRe);
        if (matches && matches.length > 1)
          handleProviderResponse(parseRedirectFragment(matches[1]));
        else
          callback(new Error('Invalid redirect URI'));
      });

      function parseRedirectFragment(fragment) {
        var pairs = fragment.split(/&/);
        var values = {};

        pairs.forEach(function(pair) {
          var nameval = pair.split(/=/);
          values[nameval[0]] = nameval[1];
        });

        return values;
      }

      function handleProviderResponse(values) {
        console.log('providerResponse', values);
        if (values.hasOwnProperty('access_token'))
          setAccessToken(values.access_token);
        else
          callback(new Error('Neither access_token nor code avialable.'));
      }

      function setAccessToken(token) {
        chrome.storage.sync.set({token: token}, function() {
          console.log("Token set");
        });
        console.log('Setting access_token: ', token);
      }
    }
  }
})();
