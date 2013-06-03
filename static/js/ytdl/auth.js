/*
  Copyright 2012 Google Inc. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

define(['jquery', './utils', './constants', './config', './globals'], function($, utils, constants, config, globals) {
  var auth = {
    initAuth: function() {
      window[constants.CLIENT_LIB_LOAD_CALLBACK] = function() {
        gapi.auth.init(function() {
          if (lscache.get(constants.DISPLAY_NAME_CACHE_KEY)) {
            window.setTimeout(function() {
              gapi.auth.authorize({
                client_id: config.OAUTH2_CLIENT_ID,
                scope: [constants.OAUTH2_SCOPE],
                immediate: true
              }, auth.onAuthResult);
            }, 1);
          } else {
            utils.redirect('login');
          }
        });
      };

      $.getScript(constants.CLIENT_LIB_URL + constants.CLIENT_LIB_LOAD_CALLBACK);
    },

    onAuthResult: function(authResult) {
      if (authResult) {
        gapi.client.load(constants.YOUTUBE_API_SERVICE_NAME, constants.YOUTUBE_API_VERSION, auth.onYouTubeClientLoad);
      } else {
        lscache.flush();
        utils.redirect('login');
      }
    },

    onYouTubeClientLoad: function() {
      var nextState = globals.hashParams.state || '';
      if (nextState == 'login') {
        nextState = '';
      }

      if (lscache.get(constants.DISPLAY_NAME_CACHE_KEY)) {
        utils.redirect(nextState);
      } else {
        var request = gapi.client[constants.YOUTUBE_API_SERVICE_NAME].channels.list({
          mine: true,
          part: 'snippet,contentDetails,status'
        });
        request.execute(function(response) {
          if (utils.itemsInResponse(response)) {
            if (response.items[0].status.isLinked) {
              lscache.set(constants.UPLOADS_LIST_ID_CACHE_KEY, response.items[0].contentDetails.relatedPlaylists.uploads);
              lscache.set(constants.DISPLAY_NAME_CACHE_KEY, response.items[0].snippet.title);
              lscache.set(constants.PROFILE_PICTURE_CACHE_KEY, response.items[0].snippet.thumbnails.default.url);
              utils.redirect(nextState);
            } else {
              utils.showHtmlMessage('Your account cannot upload videos. Please visit <a target="_blank" href="https://www.youtube.com/signin?next=/create_channel">https://www.youtube.com/signin?next=/create_channel</a> to add a YouTube channel to your account, and try again.');
            }
          } else {
            utils.showMessage('Unable to retrieve channel info. ' + utils.getErrorResponseString(response));
          }
        });
      }
    }
  };

  return auth;
});