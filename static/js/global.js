
const url_feed = 'https://facebook.tracking.exposed/feeds/0';
/* this URL is included in the produced feeds URL */

const palette = [ "#c136b3", "#f22a92", "#ff416d", "#ff6a46",
                  "#ff951b", "#f0bc00", "#c9e01c", "#90ff61" ];

var getToken = function() {
  const token = window.location.href.split('/').pop().substr(1, 40);
  if (_.size(token) != 40 ) {
    console.log("Wrong token length in the URL");
    return null;
  }
  const check = token.match(/^[0-9a-f]{40}$/i);
  return check ? token : null;
}

function buildApiUrl(apiName, option, apiv) {

    const SERVER = 'http://localhost:8000';
    let rv = null;
    const api_path = apiv ? `/api/v${apiv}` : "/api/v1";

    if(!_.startsWith(apiName, '/'))
      apiName = '/' + apiName;

    if (window.location.origin.match(/localhost/)) {
        const x = SERVER;
        rv = option ? `${x}${api_path}${apiName}/${option}` : `${x}${api_path}${apiName}`;
        console.log(`Builing URL by hardcoded domains (development) URL composed ${rv}`);
    } else {
        rv = option ? `${api_path}${apiName}/${option}` : `${api_path}${apiName}`;
        console.log(`Building URL by window...href (production) URL composed ${rv}`);
    }
    return rv;
}
