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
    init: function() {
      $('#existing-panel').on({
        click: function() {
          $(this).attr('disabled', true);

          var videoId = $(this).data('video-id');
          var existingKeywords = $(this).data('existing-keywords');
          var keywords = existingKeywords.split('\s*,\s*');
          keywords.push(constants.DEFAULT_KEYWORD);
          keywords.push(utils.generateKeywordFromPlaylistId(globals.hashParams.playlist));
          var keywordString = keywords.join(', ');

          var xmlBody = utils.format(constants.KEYWORD_UPDATE_XML_TEMPLATE, utils.escapeXmlEntities(keywordString));

          $.ajax({
            dataType: 'xml',
            type: 'PATCH',
            url: utils.format('{0}/feeds/api/users/default/uploads/{1}', constants.GDATA_SERVER, videoId),
            contentType: 'application/xml',
            headers: utils.generateYouTubeApiHeaders(),
            processData: false,
            data: xmlBody,
            success: function(responseXml) {
              utils.showMessage('Your submission was received.');

              window._gaq.push(['_trackEvent', 'Submission', 'Existing', 'Success']);
            },
            error: function(jqXHR) {
              utils.showMessage('Submission failed: ' + jqXHR.responseText);
              $(this).removeAttr('disabled');

              window._gaq.push(['_trackEvent', 'Submission', 'Existing', 'Error']);
            }
          });
        }
      }, '.submit-video-button');

      utils.getFeed({
        url: utils.format('{0}/feeds/api/users/default/uploads', constants.GDATA_SERVER),
        cacheMinutes: constants.FEED_CACHE_MINUTES,
        callback: function(entries) {
          $.each(entries, function(i, entry) {
            if (entry['app$control'] != null) {
              return true;
            }

            if (utils.isUnlisted(entry)) {
              return true;
            }

            var thumbnailUrl = utils.getThumbnailUrlFromEntry(entry, 'hqdefault');
            var uploadedDate = new Date(entry['published']['$t']).toDateString();
            var duration = utils.formatDuration(entry['media$group']['yt$duration']['seconds']);
            var videoId = entry['media$group']['yt$videoid']['$t'];

            var videoLi = $(utils.format(constants.VIDEO_LI_TEMPLATE, '', videoId, entry['media$group']['media$keywords']['$t'], entry['title']['$t'], uploadedDate, duration, thumbnailUrl));
            videoLi.appendTo('#existing-videos');
          });
        }
      });
    }
  };
});