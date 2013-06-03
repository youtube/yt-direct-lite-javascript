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

      var keyword = utils.format('{0}{1}', constants.DEFAULT_KEYWORD, playlistId);
      keyword = keyword.replace(/\W/g, '');
      if (keyword.length > constants.MAX_KEYWORD_LENGTH) {
        keyword = keyword.substring(0, constants.MAX_KEYWORD_LENGTH);
      }
      return keyword;
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

      if ('media$group' in entry && 'media$thumbnail' in entry['media$group']) {
        $.each(entry['media$group']['media$thumbnail'], function(i, thumbnailEntry) {
          if (thumbnailEntry['yt$name'] == thumbnailName) {
            thumbnailUrl = thumbnailEntry['url'];
          }
        });
      }

      return thumbnailUrl;
    },

    currentUrlWithoutParams: function() {
      return utils.format('{0}://{1}{2}', globals.parsedUrl.protocol, globals.parsedUrl.authority, globals.parsedUrl.path);
    },

    itemsInResponse: function(response) {
      return ('items' in response && response.items.length > 0);
    },

    getErrorResponseString: function(response) {
      var errorString = 'Unknown error.';

      if ('error' in response && 'data' in response.error && response.error.data.length > 0) {
        var error = response.error.data[0];
        errorString = utils.format('{0}: {1}', error.reason || 'Error', error.message);
        if (error.location) {
          errorString += utils.format(' ({0})', error.location);
        }
      }

      return errorString;
    },

    getAllItems: function(service, params, callback, items) {
      if (!items) {
        items = [];
      }
      params['maxResults'] = constants.PAGE_SIZE;

      var request = gapi.client.request({
        path: utils.format('/{0}/{1}/{2}', constants.YOUTUBE_API_SERVICE_NAME, constants.YOUTUBE_API_VERSION, service),
        method: 'GET',
        params: params
      });
      request.execute(function(response) {
        if (utils.itemsInResponse(response)) {
          items = items.concat(response.items);
        } else if ('error' in response) {
          utils.showMessage('Request failed. ' + utils.getErrorResponseString(response));
        }

        if ('nextPageToken' in response && items.length < constants.MAX_ITEMS_TO_RETRIEVE) {
          params['pageToken'] = response.nextPageToken;
          utils.getAllItems(service, params, callback, items);
        } else {
          callback(items);
        }
      });
    },

    getInfoForVideoIds: function(videoIds, callback, videos) {
      if (!videos) {
        videos = [];
      }

      var pageOfVideoIds = videoIds.splice(0, constants.PAGE_SIZE);
      if (pageOfVideoIds.length > 0) {
        var request = gapi.client[constants.YOUTUBE_API_SERVICE_NAME].videos.list({
          id: pageOfVideoIds.join(','),
          part: 'snippet,contentDetails,status'
        });
        request.execute(function(response) {
          if (utils.itemsInResponse(response)) {
            videos = videos.concat(response.items);
            utils.getInfoForVideoIds(videoIds, callback, videos);
          } else {
            utils.showMessage('Unable to retrieve info about videos. ' + utils.getErrorResponseString(response));
            callback(videos);
          }
        });
      } else {
        callback(videos);
      }
    },

    formatPeriodOfTime: function(duration) {
      var matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S/);

      var hours = parseInt(matches[1]) || 0;
      var minutes = parseInt(matches[2]) || 0;
      minutes += hours * 60;
      var seconds = parseInt(matches[3]) || 0;
      if (seconds < 10) {
        seconds = '0' + seconds;
      }

      return utils.format('{0}:{1}', minutes, seconds);
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
      var matches = /playlists\/([^/]+)\//.exec(editUrl);
      if (matches.length > 1) {
        return matches[1];
      }

      return '';
    },

    getPlaylists: function(callback) {
      utils.getAllItems('playlists', {
        part: 'id,snippet',
        mine: true
      }, function(playlists) {
        var entriesToReturn = [];
        $.each(playlists, function() {
          if (this.snippet.title == constants.REJECTED_VIDEOS_PLAYLIST) {
            globals.rejectedPlaylistId = this.id;
          } else {
            entriesToReturn.push(this);
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
      });
    },

    addPlaylist: function(name, isPrivate, callback) {
      lscache.remove(utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER));

      var request = gapi.client.youtube.playlists.insert({
        part: 'snippet,status',
        resource: {
          snippet: {
            title: name
          },
          status: {
            privacyStatus: isPrivate ? 'private' : 'public'
          }
        }
      });
      request.execute(function(response) {
        if ('error' in response) {
          utils.showMessage('Could not create playlist. ' + utils.getErrorResponseString(response));
        } else {
          callback(response.id);
        }
      });

      window._gaq.push(['_trackEvent', 'Admin', 'Create Playlist']);
    },

    getMetadataFromEntry: function(entry) {
      var durationInSeconds = 0;
      if ('yt$duration' in entry['media$group']) {
        durationInSeconds = entry['media$group']['yt$duration']['seconds'];
      }

      return {
        thumbnailUrl: utils.getThumbnailUrlFromEntry(entry, 'hqdefault'),
        uploadedDate: new Date(entry['published']['$t']).toDateString(),
        duration: utils.formatDuration(durationInSeconds),
        uploader: entry['media$group']['media$credit'][0]['yt$display'],
        videoId: entry['media$group']['yt$videoid']['$t'],
        title: entry['title']['$t']
      };
    },

    addVideoToPlaylist: function(playlistId, videoId) {
      lscache.remove(utils.format('{0}/feeds/api/users/default/playlists', constants.GDATA_SERVER));
      lscache.remove(playlistId);

      var request = gapi.client.youtube.playlistItems.insert({
        part: 'snippet',
        resource: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            },
            position: 0
          }
        }
      });
      request.execute(function(response) {
        if ('error' in response) {
          utils.showMessage('Could not add video playlist. ' + utils.getErrorResponseString(response));
        } else {
          utils.showMessage('Success!');
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
              var allRejectedIds = [];
              var rejectedIds = [];

              $.each(rejectedPlaylistEntries, function() {
                var rejectedId = this['media$group']['yt$videoid']['$t'];
                if (!(rejectedId in videoIdToPlaylistEntryId)) {
                  allRejectedIds.push(rejectedId);
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
                    } else if ($.inArray(searchId, allRejectedIds) != -1) {
                      rejectedIds.push(searchId);
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