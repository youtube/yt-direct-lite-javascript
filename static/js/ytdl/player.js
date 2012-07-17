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

define(['jquery'], function($) {
  var player = {
    playVideo: function(container, videoId) {
      if (typeof(YT) == 'undefined' || typeof(YT.Player) == 'undefined') {
        window.onYouTubeIframeAPIReady = function() {
          player.loadPlayer(container, videoId);
        };

        $.getScript('//www.youtube.com/iframe_api');
      } else {
        player.loadPlayer(container, videoId);
      }
    },

    loadPlayer: function(container, videoId) {
      new YT.Player(container, {
        videoId: videoId,
        width: 356,
        height: 200,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showInfo: 0
        }
      });
    }
  };

  return player;
});