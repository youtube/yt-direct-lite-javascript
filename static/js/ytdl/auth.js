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
      window.onAuthReady = function() {
        gapi.auth.init(function() {
          if (lscache.get(constants.DISPLAY_NAME_CACHE_KEY)) {
            window.setTimeout(function() {
              gapi.auth.authorize({
                client_id: config.OAUTH2_CLIENT_ID,
                scope: [ constants.OAUTH2_SCOPE ],
                immediate: true
              }, auth.handleAuthResult);
            }, 1);
          } else {
            utils.redirect('login');
          }
        });
      };

      $.getScript('https://apis.google.com/js/auth.js?onload=onAuthReady');
    },

    handleAuthResult: function(authResult) {
      if (authResult) {
        var nextState = globals.hashParams.state || '';
        if (nextState == 'login') {
          nextState = '';
        }

        if (lscache.get(constants.DISPLAY_NAME_CACHE_KEY)) {
          utils.redirect(nextState);
        } else {
          $.ajax({
            dataType: 'json',
            type: 'GET',
            url: utils.format('{0}/feeds/api/users/default?alt=json', constants.GDATA_SERVER),
            headers: utils.generateYouTubeApiHeaders(),
            success: function(responseJson) {
              lscache.set(constants.DISPLAY_NAME_CACHE_KEY, responseJson['entry']['yt$username']['display']);
              lscache.set(constants.PROFILE_PICTURE_CACHE_KEY, responseJson['entry']['media$thumbnail']['url']);
              utils.redirect(nextState);
            },
            error: function(jqXHR) {
              if (jqXHR.responseText && jqXHR.responseText.indexOf('NoLinkedYouTubeAccount') == -1) {
                utils.showMessage('Unable to get display name: ' + jqXHR.responseText);
              } else {
                utils.showHtmlMessage('Your account cannot upload videos. Please visit <a target="_blank" href="https://www.youtube.com/signin?next=/create_channel">https://www.youtube.com/signin?next=/create_channel</a> to add a YouTube channel to your account, and try again.');
              }
            }
          });
        }
      } else {
        lscache.flush();
        utils.redirect('login');
      }
    }
  };

  return auth;
});