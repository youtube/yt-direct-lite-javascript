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
  var moderate = {
    needsPlaylist: true,
    display: function() {
      function addVideoToPlaylist(playlistId, videoId) {
        var jsonBody = {
          data: {
            video: {
              id: videoId,
              position: 1
            }
          }
        };

        $.ajax({
          dataType: 'json',
          type: 'POST',
          url: utils.format('{0}/feeds/api/playlists/{1}', constants.GDATA_SERVER, playlistId),
          contentType: 'application/json',
          headers: utils.generateYouTubeApiHeaders(),
          processData: false,
          data: JSON.stringify(jsonBody),
          success: function() {
            utils.showMessage('The video was added to the playlist.');
          },
          error: function(jqXHR) {
            utils.showMessage(utils.format('Could not add video {0} to playlist: {1}', videoId, jqXHR.responseText));
          }
        });
      }

      function removeVideoFromPlaylist(editUrl) {
        $.ajax({
          type: 'DELETE',
          url: editUrl,
          headers: utils.generateYouTubeApiHeaders(),
          success: function() {
            utils.showMessage('The video was removed from the playlist.');
          },
          error: function(jqXHR) {
            utils.showMessage(utils.format('Could not remove video from playlist: {0}', jqXHR.responseText));
          }
        });
      }

      $('#moderation-container').hide();
      $('#widget-embed-code').text(utils.format(constants.WIDGET_EMBED_CODE, utils.currentUrlWithoutParams(), globals.hashParams.playlist));
      $('#playlist-embed-code').text(utils.format(constants.PLAYLIST_EMBED_CODE, globals.hashParams.playlist));
      $('#rss-feed').attr('href', utils.format(constants.SUBMISSION_RSS_FEED, utils.generateKeywordFromPlaylistId(globals.hashParams.playlist)));

      utils.getFeed({
        url: utils.format('{0}/feeds/api/playlists/{1}', constants.GDATA_SERVER, globals.hashParams.playlist),
        callback: function(playlistEntries) {
          var videoIdToPlaylistEntryId = {};
          $.each(playlistEntries, function(i, playlistEntry) {
            var videoId = playlistEntry['media$group']['yt$videoid']['$t'];
            videoIdToPlaylistEntryId[videoId] = getEditLinkUrlFromEntry(playlistEntry);
          });

          var keyword = utils.generateKeywordFromPlaylistId(globals.hashParams.playlist);
          utils.getFeed({
            url: utils.format('{0}/feeds/api/videos?category=%7Bhttp%3A%2F%2Fgdata.youtube.com%2Fschemas%2F2007%2Fkeywords.cat%7D{1}', constants.GDATA_SERVER, keyword),
            callback: function(entries) {
              var rejectedVideoIds = lscache.get(constants.REJECTED_VIDEO_IDS_CACHE_KEY) || [];

              var lis = [];
              $.each(entries, function(i, entry) {
                var thumbnailUrl = utils.getThumbnailUrlFromEntry(entry, 'hqdefault');
                var uploadedDate = new Date(entry['published']['$t']).toDateString();
                var duration = utils.formatDuration(entry['media$group']['yt$duration']['seconds']);
                var videoId = entry['media$group']['yt$videoid']['$t'];

                var extraClass = 'a-unreviewed';
                if (videoId in videoIdToPlaylistEntryId) {
                  extraClass = 'b-approved';
                } else if ($.inArray(videoId, rejectedVideoIds) != -1) {
                  extraClass = 'c-rejected';
                }

                lis.push(utils.format(constants.VIDEO_LI_TEMPLATE, extraClass, videoId, entry['media$group']['media$keywords']['$t'], entry['title']['$t'], uploadedDate, duration, thumbnailUrl));
              });
              if (lis.length > 0) {
                $('#submitted-videos').html(lis.sort().join(''));
                $('#moderation-container').show();
              }

              $('#approve-checked').unbind('click').click(function() {
                $(this).attr('disabled', true);

                $('#submitted-videos .a-unreviewed input:checked,#submitted-videos .c-rejected input:checked').each(function(i, input) {
                  var videoId = $(input).data('video-id');
                  addVideoToPlaylist(globals.hashParams.playlist, videoId);
                });

                $(this).removeAttr('disabled');

                moderate.display();
              });

              $('#reject-checked').unbind('click').click(function() {
                $(this).attr('disabled', true);

                $('#submitted-videos .a-unreviewed input:checked,#submitted-videos .b-approved input:checked').each(function(i, input) {
                  var videoId = $(input).data('video-id');

                  if ($.inArray(videoId, rejectedVideoIds) == -1) {
                    rejectedVideoIds.push(videoId);
                    lscache.set(constants.REJECTED_VIDEO_IDS_CACHE_KEY, rejectedVideoIds);
                  }

                  if (videoId in videoIdToPlaylistEntryId) {
                    removeVideoFromPlaylist(videoIdToPlaylistEntryId[videoId]);
                  }
                });

                $(this).removeAttr('disabled');

                moderate.display();
              });
            }
          });
        }
      });
    }
  };
  
  return moderate;
});