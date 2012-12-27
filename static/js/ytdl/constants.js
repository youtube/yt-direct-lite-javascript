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

define({
  CATEGORIES_CACHE_EXPIRATION_MINUTES: 3 * 24 * 60,
  CATEGORIES_CACHE_KEY: 'categories',
  DISPLAY_NAME_CACHE_KEY: 'display_name',
  UPLOADS_LIST_ID_CACHE_KEY: 'uploads_list_id',
  PROFILE_PICTURE_CACHE_KEY: 'profile_picture',
  GENERIC_PROFILE_PICTURE_URL: '//s.ytimg.com/yt/img/no_videos_140-vfl1fDI7-.png',
  OAUTH2_TOKEN_TYPE: 'Bearer',
  OAUTH2_SCOPE: 'https://gdata.youtube.com',
  GDATA_SERVER: 'https://gdata.youtube.com',
  CLIENT_LIB_LOAD_CALLBACK: 'onClientLibReady',
  CLIENT_LIB_URL: 'https://apis.google.com/js/client.js?onload=',
  YOUTUBE_API_SERVICE_NAME: 'youtube',
  YOUTUBE_API_VERSION: 'v3',
  PAGE_SIZE: 50,
  MAX_ITEMS_TO_RETRIEVE: 200,
  FEED_CACHE_MINUTES: 5,
  STATE_CACHE_MINUTES: 15,
  MAX_KEYWORD_LENGTH: 30,
  KEYWORD_UPDATE_XML_TEMPLATE: '<?xml version="1.0"?> <entry xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:yt="http://gdata.youtube.com/schemas/2007" xmlns:gd="http://schemas.google.com/g/2005" gd:fields="media:group/media:keywords"> <media:group> <media:keywords>{0}</media:keywords> </media:group> </entry>',
  WIDGET_EMBED_CODE: '<iframe width="420" height="500" src="{0}#playlist={1}"></iframe>',
  PLAYLIST_EMBED_CODE: '<iframe width="640" height="360" src="//www.youtube.com/embed/?listType=playlist&list={0}&showinfo=1" frameborder="0" allowfullscreen></iframe>',
  SUBMISSION_RSS_FEED: 'https://gdata.youtube.com/feeds/api/videos?v=2&alt=rss&orderby=published&category=%7Bhttp%3A%2F%2Fgdata.youtube.com%2Fschemas%2F2007%2Fkeywords.cat%7D{0}',
  DEFAULT_KEYWORD: 'ytdl',
  WEBCAM_VIDEO_TITLE: 'Webcam Submission',
  WEBCAM_VIDEO_DESCRIPTION: 'Uploaded via a webcam.',
  REJECTED_VIDEOS_PLAYLIST: 'Rejected YTDL Submissions',
  NO_THUMBNAIL_URL: '//i.ytimg.com/vi/hqdefault.jpg',
  VIDEO_CONTAINER_TEMPLATE: '<li><div class="video-container {additionalClass}"><input type="button" class="submit-video-button" value="Submit Video"><div><span class="video-title">{title}</span><span class="video-duration">({duration})</span></div><div class="video-uploaded">Uploaded on {uploadedDate}</div><div class="thumbnail-container" data-video-id="{videoId}"><img src="{thumbnailUrl}" class="thumbnail-image"><img src="images/play.png" class="play-overlay"></div></div></li>',
  VIDEO_LI_TEMPLATE: '<li><div class="video-container {0}"><input type="button" class="submit-video-button" data-video-id="{1}" data-existing-keywords="{2}" value="Submit Video"><div><span class="video-title">{3}</span><span class="video-duration">({5})</span></div><div class="video-uploaded">Uploaded on {4}</div><div class="thumbnail-container" data-video-id="{1}"><img src="{6}" class="thumbnail-image"><img src="./images/play.png" class="play-overlay"></div></div></li>',
  ADMIN_VIDEO_LI_TEMPLATE: '<li><div class="video-container">{buttonsHtml}<div><span class="video-title">{title}</span><span class="video-duration">({duration})</span></div><div class="video-uploaded">Uploaded on {uploadedDate} by {uploader}</div><div class="thumbnail-container" data-video-id="{videoId}"><img src="{thumbnailUrl}" class="thumbnail-image"><img src="./images/play.png" class="play-overlay"></div></div></li>',
  PLAYLIST_LI_TEMPLATE: '<li data-playlist-name="{playlistName}" data-state="embed-codes" data-playlist-id="{playlistId}">{playlistName}</li>'
});