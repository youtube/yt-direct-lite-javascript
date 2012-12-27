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
          var video = $(this).data('video');

          if (!('tags' in video.snippet)) {
            video.snippet.tags = [];
          }

          if ($.inArray(constants.DEFAULT_KEYWORD, video.snippet.tags) == -1) {
            video.snippet.tags.push(constants.DEFAULT_KEYWORD);
          }

          var keyword = utils.generateKeywordFromPlaylistId(globals.hashParams.playlist);
          if ($.inArray(keyword, video.snippet.tags) == -1) {
            video.snippet.tags.push(keyword);
          }

          delete video.contentDetails;
          delete video.status;

          var request = gapi.client[constants.YOUTUBE_API_SERVICE_NAME].videos.update({
            part: 'snippet',
            resource: video
          });
          request.execute(function(response) {
            if ('error' in response) {
              utils.showMessage('Submission failed. ' + utils.getErrorResponseString(response));
              $(this).removeAttr('disabled');
              window._gaq.push(['_trackEvent', 'Submission', 'Existing', 'Error']);
            } else {
              utils.showMessage('Your submission was received.');
              window._gaq.push(['_trackEvent', 'Submission', 'Existing', 'Success']);
            }
          });
        }
      }, '.submit-video-button');

      utils.getAllItems('playlistItems', {
        part: 'snippet',
        playlistId: lscache.get(constants.UPLOADS_LIST_ID_CACHE_KEY)
      }, function(items) {
        var videoIds = $.map(items, function(item) {
          return item.snippet.resourceId.videoId;
        });
        utils.getInfoForVideoIds(videoIds, function(videos) {
          videos.sort(function(a, b) {
            return a.snippet.publishedAt > b.snippet.publishedAt ? -1 : 1;
          });

          $.each(videos, function() {
            if (this.status.uploadStatus != 'processed' || this.status.privacyStatus != 'public') {
              return true;
            }

            var videoLi = $(utils.format(constants.VIDEO_CONTAINER_TEMPLATE, {
              thumbnailUrl: this.snippet.thumbnails.high.url,
              uploadedDate: new Date(this.snippet.publishedAt).toDateString(),
              duration: utils.formatPeriodOfTime(this.contentDetails.duration),
              title: this.snippet.title,
              videoId: this.id
            }));
            videoLi.find('.submit-video-button').data('video', this);
            videoLi.appendTo('#existing-videos');
          });
        });
      });
    }
  };
});