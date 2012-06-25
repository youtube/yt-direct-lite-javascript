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

define(['jquery', '../utils', '../constants', '../globals'], function($, utils, constants, globals) {
  return {
    needsPlaylist: true,
    display: function() {
      $('#tabs').show();
      $('#switch').show();
      $('#moderation-message').hide();

      $('#widget-embed-code').text(utils.format(constants.WIDGET_EMBED_CODE, utils.currentUrlWithoutParams().replace('admin.html', 'index.html'), globals.hashParams.playlist));
      $('#playlist-embed-code').text(utils.format(constants.PLAYLIST_EMBED_CODE, globals.hashParams.playlist));
      $('#rss-feed').attr('href', utils.format(constants.SUBMISSION_RSS_FEED, utils.generateKeywordFromPlaylistId(globals.hashParams.playlist)));
    }
  };
});