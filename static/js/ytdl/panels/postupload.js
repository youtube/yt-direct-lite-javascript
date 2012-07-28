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

define(['jquery', '../utils', '../globals'], function($, utils, globals) {
  return {
    init: function() {
      var status = globals.parsedUrl.queryKey.status;
      if (status == 200) {
        var youtubeUrl = utils.format('http://youtu.be/{0}', globals.parsedUrl.queryKey.id);
        $('#youtube-link').attr('href', youtubeUrl);
        $('#upload-success').show();

        window._gaq.push(['_trackEvent', 'Submission', 'Upload', 'Success']);
      } else {
        $('#upload-success').hide();
        utils.showMessage(utils.format('Your video could not be submitted. (Error: {0})', globals.parsedUrl.queryKey.code));

        window._gaq.push(['_trackEvent', 'Submission', 'Upload', 'Error']);
      }
    }
  };
});