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
  // REQUIRED
  // See https://developers.google.com/api-client-library/javascript/features/authentication
  // for instructions on registering for OAuth 2.
  // After generating your OAuth 2 client id, you MUST then visit the "Services" tab of
  // https://code.google.com/apis/console/ find the entry for "YouTube Data API v3"
  // and flip it to "ON".
  OAUTH2_CLIENT_ID: '',

  // REQUIRED
  // Register at https://code.google.com/apis/youtube/dashboard/gwt/index.html to get your own key.
  DEVELOPER_KEY: ''

  // If you'd like to enable Google Analytics statistics to your YouTube Direct Lite instance,
  // register for a Google Analytics account and enter your id code below.
  //,GOOGLE_ANALYTICS_ID: 'UA-########-#'

  // Setting any or all of these three fields are optional.
  // If set then the value(s) will be used for new video uploads, and your users won't be prompted for the corresponding fields on the video upload form.
  //,VIDEO_TITLE: 'Video Submission'
  //,VIDEO_DESCRIPTION: 'This is a video submission.'
  // Make sure that this corresponds to an assignable category!
  // See https://developers.google.com/youtube/2.0/reference#YouTube_Category_List
  //,VIDEO_CATEGORY: 'People'
});