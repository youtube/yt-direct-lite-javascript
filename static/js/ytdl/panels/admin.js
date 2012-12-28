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

define(['jquery', '../utils', '../constants'], function($, utils, constants) {
  var admin = {
    init: function() {
      admin.attachClickHandler();
    },

    display: function() {
      $('#tabs').hide();
      $('#switch').hide();
      $('#moderation-message').hide();

      utils.getPlaylists(function(playlists) {
        var lis = [];
        $.each(playlists, function() {
          lis.push(utils.format(constants.PLAYLIST_LI_TEMPLATE, {
            playlistId: this.id,
            playlistName: this.snippet.title
          }));
        });
        $('#playlists').html(lis.sort().join(''));
        $('#playlists').append('<li><div id="create-playlist-inputs"><input id="new-playlist-name" type="text" size="40" placeholder="Playlist Name"/><input id="create-playlist" type="button" value="Create New Playlist"/></div></li>');

        admin.attachClickHandler();
      });
    },

    // TODO: This is a bit of a hack to work around the fact that the #create-playlist button is
    // recreated each time display() is called. There's obviously better ways of dealing with that.
    attachClickHandler: function() {
      $('#create-playlist').click(function() {
        $(this).attr('disabled', true);
        var playlistName = $('#new-playlist-name').val();
        if (playlistName) {
          utils.addPlaylist(playlistName, false, function(playlistId) {
            utils.redirect('embed-codes', playlistId);
          });
        } else {
          utils.showMessage('Please enter a name for the playlist.');
        }

        $(this).removeAttr('disabled');
      });
    }
  };

  return admin;
});