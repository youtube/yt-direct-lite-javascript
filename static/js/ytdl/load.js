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

define([
  'jquery',
  './constants',
  './globals',
  './utils',
  './config',
  './player',
  'ytdl/panels/upload',
  'ytdl/panels/existing',
  'ytdl/panels/login',
  'ytdl/panels/logout',
  'ytdl/panels/postupload',
  'ytdl/panels/select',
  'ytdl/panels/webcam',
  'ytdl/panels/admin',
  'ytdl/panels/embed-codes',
  'ytdl/panels/pending',
  'ytdl/panels/approved',
  'ytdl/panels/rejected'
], function($, constants, globals, utils, config, player, upload) {
  return {
    onLoad: function(defaultTab) {
      window._gaq = window._gaq || [];

      if (config.GOOGLE_ANALYTICS_ID) {
        window._gaq.push(['_setAccount', config.GOOGLE_ANALYTICS_ID]);

        var analyticsScriptSrc = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        $.getScript(analyticsScriptSrc);
      }

      if (!config.OAUTH2_CLIENT_ID || !config.DEVELOPER_KEY) {
        utils.showHtmlMessage('YouTube Direct Lite isn\'t configured. Please see the <a href="http://code.google.com/p/youtube-direct-lite/wiki/HostingYourOwnInstance">setup guide</a> for more info.');
        return;
      }

      if (!$.support.cors) {
        if (defaultTab == 'admin') {
          utils.showHtmlMessage('Unfortunately, your browser is <a target="_blank" href="http://caniuse.com/cors">not supported</a>. Please try visiting this page using a recent version of Firefox, Safari, Opera, or Chrome.');
          window._gaq.push(['_trackPageview']);
          return;
        } else {
          defaultTab = 'existing';
          delete upload.init;
          delete upload.display;
          $('#upload-panel').html('<p>Your browser does not <a target="_blank" href="http://caniuse.com/cors">meet the requirements</a> needed to upload a new video. Please choose one of the other options.</p>');
        }
      }

      utils.updateHashParams();

      $('body').on({
        click: function() {
          utils.redirect($(this).attr('data-state'), $(this).attr('data-playlist-id'));
        }
      }, '[data-state]');

      $('#message').click(function() {
        $(this).hide();
      });

      $('body').on({
        click: function() {
          player.playVideo(this, $(this).data('video-id'));
        },
        mouseenter: function() {
          $(this).find('.play-overlay').fadeIn();
        },
        mouseleave: function() {
          $(this).find('.play-overlay').fadeOut();
        }
      }, '.thumbnail-container');

      $(window).bind('hashchange', function() {
        utils.updateHashParams();
        var state = globals.hashParams.state || defaultTab;

        $('#profile-picture').attr('src', lscache.get(constants.PROFILE_PICTURE_CACHE_KEY) || constants.GENERIC_PROFILE_PICTURE_URL);
        var displayName = lscache.get(constants.DISPLAY_NAME_CACHE_KEY);
        $('#display-name').text(displayName);
        if (displayName) {
          $('.login-required').show();
        } else {
          $('.login-required').hide();
        }

        var panel;
        try {
          panel = require(utils.format('ytdl/panels/{0}', state));
        } catch (e) {
          utils.showMessage(utils.format('Unknown panel: {0}', state));
          return;
        }

        utils.hideMessage();

        if (panel.needsPlaylist && !globals.hashParams.playlist) {
          utils.showMessage('The "playlist" URL parameter is missing.');
          return;
        }

        if ('init' in panel) {
          panel.init();
          delete panel.init;
        }

        if ('display' in panel) {
          panel.display();
        }

        $('.panel').hide();
        $(utils.format('#{0}-panel', state)).show();
        $('#tabs > li').removeClass('selected');
        $(utils.format('#tabs > li[data-state={0}]', state)).addClass('selected');

        window._gaq.push(['_trackPageview', utils.format('{0}#state={1}', location.pathname, state)]);
      });
    }
  };
});