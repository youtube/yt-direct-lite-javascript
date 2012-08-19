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
  './config',
  'third-party/jquery.parseparams'
], function($, constants, globals, config) {
  var utils = {
    format: function() {
      var replacements = Array.prototype.slice.call(arguments);
      var originalString = replacements.shift();
      if ($.isPlainObject(replacements[0])) {
        replacements = replacements[0];
      }
      if (originalString) {
        return originalString.replace(/{(\w+)}/g, function(match, i) {
          return typeof replacements[i] != 'undefined' ? replacements[i] : '';
        });
      } else {
        return '';
      }
    },

    generateYouTubeApiHeaders: function(extraHeaders) {
      var headers = extraHeaders || {};
      headers['Authorization'] = utils.format('{0} {1}', constants.OAUTH2_TOKEN_TYPE, gapi.auth.getToken().access_token);
      headers['GData-Version'] = 2;
      headers['X-GData-Key'] = utils.format('key={0}', config.DEVELOPER_KEY);
      headers['X-GData-Client'] = utils.format('{0}-{1}', constants.DEFAULT_KEYWORD, globals.parsedUrl.authority);
      return headers;
    },

    escapeXmlEntities: function(input) {
      if (input) {
        return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      } else {
        return '';
      }
    },

    showMessage: function(message) {
      $('#message').text(message);
      $('#message').show();
    },

    showHtmlMessage: function(message) {
      $('#message').html(message);
      $('#message').show();
    },

    hideMessage: function() {
      $('#message').hide();
      $('#message').text();
    },

    animateModeration: function(target, destination) {
      var currentPosition = target.position();
      var destinationPosition = destination.position();
      var originalHeight = target.height();
      var originalWidth = target.width();

      target.css({
        position: 'absolute',
        left: currentPosition.left,
        top: currentPosition.top
      });

      target.animate({
        opacity: 0.5,
        left: destinationPosition.left,
        top: destinationPosition.top,
        height: originalHeight * 0.1,
        width: originalWidth * 0.1
      }, 'slow', function() {
        target.hide();
      });
    },

    updateHashParams: function() {
      globals.hashParams = $.parseParams(decodeURIComponent(window.location.hash.replace('#', '')));
    },

    generateKeywordFromPlaylistId: function(playlistId) {
      playlistId = playlistId || '';

      if (playlistId.indexOf('PL') == 0) {
        playlistId = playlistId.substring(2);
      }
      return utils.format('{0}{1}', constants.DEFAULT_KEYWORD, playlistId);
    },

    formatDuration: function(durationInSeconds) {
      var minutes = parseInt(durationInSeconds / 60);
      var seconds = durationInSeconds - (minutes * 60);
      if (seconds < 10) {
        seconds = utils.format('0{0}', seconds);
      }
      return utils.format('{0}:{1}', minutes, seconds);
    },

    redirect: function(panel, playlist) {
      var hash = utils.format('state={0}&playlist={1}', panel, playlist || globals.hashParams.playlist);
      window.location.hash = hash;
      if (panel == globals.hashParams.state) {
        $(window).trigger('hashchange');
      }
    },

    getFeed: function(options) {
      var startIndex = options.startIndex || 1;
      var maxResults = options.maxResults || 1000;
      var results = options.results || [];

      var url = options.url;
      if (url.indexOf('?') == -1) {
        url += '?';
      } else {
        url += '&';
      }
      url = utils.format('{0}max-results={1}&alt=json&start-index={2}', url, constants.PAGE_SIZE, startIndex);

      if (options.cacheMinutes && results.length == 0) {
        results = lscache.get(options.url);
        if (results == null) {
          results = [];
        } else {
          (options.callback)(results);
          return;
        }
      }

      $.ajax({
        dataType: 'json',
        type: 'GET',
        url: url,
        headers: utils.generateYouTubeApiHeaders(),
        success: function(responseJson) {
          if ('entry' in responseJson['feed']) {
            $.merge(results, responseJson['feed']['entry']);

            if (results.length < maxResults && responseJson['feed']['entry'].length == constants.PAGE_SIZE) {
              utils.getFeed({
                cacheMinutes: options.cacheMinutes,
                callback: options.callback,
                maxResults: maxResults,
                results: results,
                startIndex: startIndex + constants.PAGE_SIZE,
                url: options.url
              });
            } else {
              if (options.cacheMinutes) {
                lscache.set(options.url, results, options.cacheMinutes);
              }
              (options.callback)(results);
            }
          } else {
            if (options.cacheMinutes) {
              lscache.set(options.url, results, options.cacheMinutes);
            }
            (options.callback)(results);
          }
        },
        error: function(jqXHR) {
          if (results.length > 0) {
            (options.callback)(results);
          } else {
            utils.showMessage('Your request could not be completed: ' + jqXHR.responseText);
          }
        }
      });
    },

    getThumbnailUrlFromEntry: function(entry, thumbnailName) {
      var thumbnailUrl = constants.NO_THUMBNAIL_URL;

      $.each(entry['media$group']['media$thumbnail'], function(i, thumbnailEntry) {
        if (thumbnailEntry['yt$name'] == thumbnailName) {
          thumbnailUrl = thumbnailEntry['url'];
        }
      });

      return thumbnailUrl;
    },

    currentUrlWithoutParams: function() {
      return utils.format('{0}://{1}{2}', globals.parsedUrl.protocol, globals.parsedUrl.authority, globals.parsedUrl.path);
    },

    isUnlisted: function(entry) {
      var isUnlisted = false;

      if ('yt$accessControl' in entry) {
        $.each(entry['yt$accessControl'], function() {
          if (this.action == 'list') {
            isUnlisted = this.permission == 'denied';
          }
        });
      }

      return isUnlisted;
    },

    getEditLinkUrlFromEntry: function(entry) {
      var editLinkUrl = '';
      $.each(entry['link'], function(i, link) {
        if (link['rel'] == 'edit') {
          editLinkUrl = link['href'];
        }
      });
      return editLinkUrl;
    },

    getPlaylistIdFromEditUrl: function(editUrl) {
      var matches = /playlists\/(\w+)\//.exec(editUrl);
      if (matches.length > 1) {
        return matches[1];
      }

      return '';
    },

    getPlaylists: function(callback) {
      utils.getFeed({
        url: utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER),
        cacheMinutes: constants.FEED_CACHE_MINUTES,
        callback: function(entries) {
          var entriesToReturn = [];
          $.each(entries, function(i, entry) {
            if (entry['title']['$t'] == constants.REJECTED_VIDEOS_PLAYLIST) {
              globals.rejectedPlaylistId = entry['yt$playlistId']['$t'];
            } else {
              entriesToReturn.push(entry);
            }
          });

          if (globals.rejectedPlaylistId) {
            callback(entriesToReturn);
          } else {
            utils.addPlaylist(constants.REJECTED_VIDEOS_PLAYLIST, true, function(playlistId) {
              globals.rejectedPlaylistId = playlistId;

              callback(entriesToReturn);
            });
          }
        }
      });
    },

    addPlaylist: function(name, isPrivate, callback) {
      lscache.remove(utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER));

      var jsonBody = {
        data: { title: name }
      };

      if (isPrivate) {
        jsonBody.data.privacy = 'private';
      }

      $.ajax({
        dataType: 'json',
        type: 'POST',
        url: utils.format('{0}/feeds/api/users/default/playlists?alt=jsonc', constants.GDATA_SERVER),
        contentType: 'application/json',
        headers: utils.generateYouTubeApiHeaders(),
        processData: false,
        data: JSON.stringify(jsonBody),
        success: function(responseJson) {
          callback(responseJson.data.id);
        },
        error: function(jqXHR) {
          utils.showMessage(utils.format('Could not create playlist "{0}": {1}', name, jqXHR.responseText));
        }
      });

      window._gaq.push(['_trackEvent', 'Admin', 'Create Playlist']);
    },

    getMetadataFromEntry: function(entry) {
      return {
        thumbnailUrl: utils.getThumbnailUrlFromEntry(entry, 'hqdefault'),
        uploadedDate: new Date(entry['published']['$t']).toDateString(),
        duration: utils.formatDuration(entry['media$group']['yt$duration']['seconds']),
        uploader: entry['media$group']['media$credit'][0]['yt$display'],
        videoId: entry['media$group']['yt$videoid']['$t'],
        title: entry['title']['$t']
      };
    },

    addVideoToPlaylist: function(playlistId, videoId) {
      lscache.remove(utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER));
      lscache.remove(playlistId);

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
          utils.showMessage('Success!');
        },
        error: function(jqXHR) {
          utils.showMessage(utils.format('Could not add video {0} to playlist: {1}', videoId, jqXHR.responseText));
        }
      });
    },

    removeVideoFromPlaylist: function(editUrl) {
      var playlistId = utils.getPlaylistIdFromEditUrl(editUrl);
      if (playlistId) {
        lscache.remove(playlistId);
      }
      lscache.remove(utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER));

      $.ajax({
        type: 'DELETE',
        url: editUrl,
        headers: utils.generateYouTubeApiHeaders(),
        success: function() {
          utils.showMessage('Success!');
        },
        error: function(jqXHR) {
          utils.showMessage(utils.format('Could not remove video from playlist: {0}', jqXHR.responseText));
        }
      });
    },

    getStateOfSubmissions: function(callback) {
      var state = lscache.get(globals.hashParams.playlist);
      if (state) {
        callback(state);
        return;
      }

      if (!globals.rejectedPlaylistId) {
        callback();
        return;
      }

      utils.getFeed({
        url: utils.format('{0}/feeds/api/playlists/{1}', constants.GDATA_SERVER, globals.hashParams.playlist),
        callback: function(playlistEntries) {
          var videoIdToPlaylistEntryId = {};
          var videoIdToMetadata = {};
          var approvedIds = [];

          $.each(playlistEntries, function() {
            var approvedId = this['media$group']['yt$videoid']['$t'];
            approvedIds.push(approvedId);
            videoIdToPlaylistEntryId[approvedId] = utils.getEditLinkUrlFromEntry(this);
            videoIdToMetadata[approvedId] = utils.getMetadataFromEntry(this);
          });

          utils.getFeed({
            url: utils.format('{0}/feeds/api/playlists/{1}', constants.GDATA_SERVER, globals.rejectedPlaylistId),
            callback: function(rejectedPlaylistEntries) {
              var rejectedIds = [];

              $.each(rejectedPlaylistEntries, function() {
                var rejectedId = this['media$group']['yt$videoid']['$t'];
                if (!(rejectedId in videoIdToPlaylistEntryId)) {
                  rejectedIds.push(rejectedId);
                  videoIdToPlaylistEntryId[rejectedId] = utils.getEditLinkUrlFromEntry(this);
                  videoIdToMetadata[rejectedId] = utils.getMetadataFromEntry(this);
                }
              });

              var keyword = utils.generateKeywordFromPlaylistId(globals.hashParams.playlist);
              utils.getFeed({
                url: utils.format('{0}/feeds/api/videos?category=%7Bhttp%3A%2F%2Fgdata.youtube.com%2Fschemas%2F2007%2Fkeywords.cat%7D{1}', constants.GDATA_SERVER, keyword),
                callback: function(searchEntries) {
                  var pendingIds = [];
                  $.each(searchEntries, function() {
                    var searchId = this['media$group']['yt$videoid']['$t'];
                    if (!(searchId in videoIdToPlaylistEntryId)) {
                      pendingIds.push(searchId);
                      videoIdToMetadata[searchId] = utils.getMetadataFromEntry(this);
                    }
                  });

                  state = {
                    videoIdToPlaylistEntryId: videoIdToPlaylistEntryId,
                    videoIdToMetadata: videoIdToMetadata,
                    pendingIds: pendingIds,
                    approvedIds: approvedIds,
                    rejectedIds: rejectedIds
                  };

                  lscache.set(globals.hashParams.playlist, state, constants.STATE_CACHE_MINUTES);
                  callback(state);
                }
              });
            }
          });
        }
      });
    }
  };

  return utils;
});