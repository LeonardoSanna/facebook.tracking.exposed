let $grid;

/* in regards to the API used in this file, please consult
 * the file in content/api-documentation.md */

const posts = {};
const token = getToken();
let days = [];
let selectedDay = null;
let overviewCount = 3;
let overviewPlace = 0;

function initializeReality(page) {
  if (token) {
    $('#token').text(token);
    initializeDaily(token, page);
  } else {
    $('#get-started').removeClass('d-none');
  }
}

function renderDay(item, count) {
    daily = `<div id="day-${item.day}" class="graph-day flex-fill pl-3 pr-3 graph-day-border" data-day="${item.day}">
        <span class="text-muted">${moment(item.day).format('LL')}</span><br>
        <p>
            <br>
            <span class="text-right align-right">${item.npost} Posts</span><br>
            <span class="posts">${item.duration}</span>
            <br>
        </span></p>
        <div id="daily-pie-${count}" class="daily-pie"></div>
        <p>
            <span class="posts">${item.ntimelines}</span>
            ${item.ntimelines > 1 ? "sessions" : "session"}
        </p>
    </div>`;

    if (count == 0) {
        $('#daily-overview').prepend(daily)
    } else if (count > 0) {
        $('#daily-overview').append(daily)
    } else {
        console.log('weird count in renderDay');
    }

    let pieId = `#daily-pie-${count}`;
    let pieChart = c3.generate({
        bindto: pieId,
        data: {
            columns: [
                ['organic', item.nature.organic],
                ['ads', item.nature.sponsored]
            ],
            type: 'pie',
            labels: false
        },
        color: {
            pattern: ['#3b5898', '#d9d9d9']
        },
        legend: {
            show: false
        },
        size: {
            height: 180,
            width: 180
        }
    });
}

function determineState(data) {

    if(data.error) {
        console.log(data, "error", data.message);
        $('#loading-fetching').addClass('d-none');
        $('#loading-error').removeClass('d-none');
        $('#error-details').text(data.message);
        return false;
    }

    if (data.length > 0) {
        var hasNature = _.find(data, function(item) {
            return Object.keys(item.nature).length > 0; 
        });
        if (hasNature != undefined) {
            console.log('timeline:', hasNature)
            return true;
        }
    }
    // where the api has no objects at all returned 
    // where api has data but item.nature is empty object
    console.log("this looks like a sad day for the db");
    $('#loading-fetching').addClass('d-none');
    $('#loading-empty').removeClass('d-none');

    return false;
}

function initializeDaily(token, page) {
    $('#loading-data').removeClass('d-none');
    $('#daily-overview').html('');
    $('#daily-timeline').html('');

    $('#dailyTab a').on('click', function(e) {
        e.preventDefault()
        var goToTab = $(this)[0].hash.replace('#daily-', '');
        if (goToTab == 'timeline-pane') {
            console.log("click on timeline pane: selectedDay", selectedDay);
            $('#daily-overview-pane').addClass('d-none').removeClass('d-block flex-row d-flex');
            $('#daily-timeline-pane').removeClass('d-none').addClass('d-block');
            $('#daily-settings-pane').addClass('d-none').removeClass('d-block');
            renderTimelineDay(selectedDay);
        } else if(goToTab == 'overview-pane' ) {
            $('#daily-overview-pane').removeClass('d-none').addClass('d-block flex-row d-flex');
            $('#daily-timeline-pane').addClass('d-none').removeClass('d-block');
            $('#daily-settings-pane').addClass('d-none').removeClass('d-block');
        } else if(goToTab == 'settings-pane') {
            $('#daily-overview-pane').addClass('d-none').removeClass('d-block flex-row d-flex');
            $('#daily-timeline-pane').addClass('d-none').removeClass('d-block');
            $('#daily-settings-pane').removeClass('d-none').addClass('d-block');
        }
    });

    $('#loading-data').addClass('d-none');
    $('#profile').removeClass('d-none');
    $('#visualization').removeClass('d-none');

    let url = buildApiUrl(`/personal/${token}/daily`, page, 2);

    $.getJSON(url, (dailyStats) => {
        if (determineState(dailyStats.stats)) {

            if(!_.size($('#profile-name').text()))
                $('#profile-name').html(dailyStats.pseudo.replace(/-/gi, ' '));

            _.each(_.reverse(dailyStats.stats), function(item, count) { 
                renderDay(item, count);

                if(!selectedDay) {
                    $(".graph-day").addClass('selected-day');
                    selectedDay = $(".graph-day")[0].getAttribute('data-day');
                    $("#timeline-tab").text("View posts of " + selectedDay);
                }
            });

            if (dailyStats.stats.length == 3) {
                var btnBack = $('.btn-overview-inactive')[0];
                $(btnBack).removeClass('btn-overview-inactive').addClass('btn-overview-paginate');
                paginateButtons();            
            }

        }

        $('.graph-day').on('click', function() {
            console.log("clicked");
            if(!$(this).hasClass('selected-day')) {
                $('.selected-day').removeClass('selected-day');
                $(this).addClass('selected-day');
                selectedDay = $(this)[0].getAttribute('data-day');
                $("#timeline-tab").text("View posts of " + selectedDay);
            } else {console.log("bravo")}
        })
    });
}

var updateRenders = function(overviewPlace, viewCount, itemCount) {
    var page = overviewCount + '-' + overviewPlace;
    let url = buildApiUrl(`/personal/${token}/daily/`, page, 2);
    $.getJSON(url, (data) => {
      if (data.length > 0) {
        var hasNature = _.find(data, function(item) {
            return Object.keys(item.nature).length > 0; 
        });

        if (hasNature != undefined) {
            renderDay(data[itemCount], viewCount);

            _.each(data, function(item) {
                days.push(item.day)
            });
            renderTimeline(_.reverse(days));
        }
      }
    });
}

// paginate buttons
var paginateButtons = function() {
    $('.btn-overview-paginate').on('click', function() {
        days = [];
        $('#daily-timeline').html('');

        // back / next
        if ($(this).data('direction') == 'back') {
            console.log( $('#daily-overview') );
            if( $('#daily-overview').children() && $('#daily-overview').children().length )
                $('#daily-overview').children()[2].remove();

            overviewPlace = overviewPlace + 1;
            updateRenders(overviewPlace, 0, 2);
        } else if ($(this).data('direction') == 'next' && overviewPlace > 0) {
            $('#daily-overview').children()[0].remove();
            overviewPlace = overviewPlace - 1;
            updateRenders(overviewPlace, 2, 0);
        } else {
            console.log('invalid pagination update');
        }

        // activate btns
        var btnsPage = $('.btn-overview-inactive');
        if (btnsPage.length > 0) {
            $(btnsPage).removeClass('btn-overview-inactive').addClass('btn-overview-paginate');
            paginateButtons();
        }
    });
}

/*
function renderTimeline(days) {
    console.log("Rendering timelines", days);
    _.each(_.reverse(days), function(day) {
        renderTimelineDay(day);
    });
}
*/

function renderTimelineDay(day) {
    // this is called when a new day is selected or when
    // the label in the navigation tab is pressed.
    // the callback resume the execution handling the flex-row shit
    const url = buildApiUrl(`/personal/${token}/enrich`, day, 2);

    $.getJSON(url, (data) => {

        $('#status-info').text(
            _.size(data) + " impressions " +
            moment(_.first(data).impressionTime).format('h:mm a') + ' — ' +
            moment(_.last(data).impressionTime).format('h:mm a') );

        const semanticIds = {};

        // build topics
        _.each(data, function(item, count) {
            if (item.labels != undefined || true) { // remind Claudio you add this 'cos labels might miss
                // depending on occurence count, update the 'Seen $x (times)' or 'Once' is default
                if (semanticIds[item.semanticId]) {
                    semanticIds[item.semanticId] = semanticIds[item.semanticId] + 1;
                    $('#daily-seen-' + item.semanticId).html(
                        'Seen ' + semanticIds[item.semanticId] + 'x'
                    );
                } else {
                    semanticIds[item.semanticId] = 1;

                    let isAd = '';
                    let isHidden = '';
                    let showAllLink = '';
                    let seenCount = 'Seen Once';
                    let topicsCount = [];

                    // topics
                    _.each(item.labels, function(topic, index) { 
                        var exists = _.find(topicsCount, { 'topic':  topic });
                        if (exists) {
                            exists.count = exists.count + 1;
                        } else {
                            topicsCount.push({
                                topic: topic,
                                count: 1
                            });
                        }        
                    });

                    let topicsOrdered = _.orderBy(topicsCount, ['count'], ['desc']);
                    let htmlTopic = '';
                    _.each(topicsOrdered, function(item, index) {
                        let topicText = item.topic;
                        if (item.topic.length > 27) {
                            topicText = `<span title="${item.topic}">
                                ${item.topic.substring(0, 27)}...
                            </span>`;
                        }
                        if (index >= 4) {
                            isHidden = 'd-none';
                        }
                        htmlTopic += `
                        <li class="list-item mb-2 ${isHidden}">
                            <span class="topic-count num-${item.count}">
                                ${item.count}
                            </span>
                            ${topicText}
                        </li>`;
                    });

                    if (topicsOrdered.length >= 4) {
                        showAllLink = `
                        <a class="show-topics text-muted" data-semid="${item.semanticId}" title="Show all topics" href="#${token}">
                            ...
                        </a>`;
                    }

                    if (item.nature == 'sponsored') {
                        isAd = '(Sponsored)';
                    }

                    const textList = _.replace(item.fullText, '\n', '</br>')

                    if(_.size(item.attributions) > 1) {
                        console.log("multiple attribution wasn't happening since the shared post were working", item);
                    }

                    const displaySource = item.attributions && item.attributions[0] ? 
                        item.attributions[0].display : "";
                    const sourceLink = item.attributions && item.attributions[0] && _.size(item.attributions[0].fblink) ?
                            item.attributions[0].fblink : 
                                ( item.feed_id && item.feed_id.authorId ? 
                                'https://facebook.com/' + item.feed_id.authorId : "#" );
                    const cleanSource = item.attributions && item.attributions[0] ? 
                        item.attributions[0].content : "";
                    const permaLink = item.permaLink ? 'https://facebook.com' + item.permaLink : "#";

                    const htmlItem = `
                    <li id="daily-${day}-${item.semanticId}" class="row table-item ${item.nature}">
                        <div id="daily-topics-${day}-${item.semanticId}" class="col-sm-4 col-md-4 col-lg-3 pl-0">
                            <strong>Topics</strong>
                            <ul id="topics-${item.semanticId}" class="list m-0 mt-2 p-0">
                                ${htmlTopic}
                            </ul>
                            ${showAllLink}
                        </div>
                        <div id="daily-post-${day}-${item.semanticId}" class="col-sm-8 col-md-8 col-lg-9 pr-0">
                            <strong class="float-left ">
                                <i class="impressionOrder">${item.impressionOrder}</i> —
                                <a class="username" title="${displaySource}" href="${sourceLink}">
                                    ${displaySource}
                                </a>
                                ${isAd}
                            </strong>
                            <span id="daily-seen-${item.semanticId}" class="float-right text-muted"
                                  title="Seen at ${moment(item.impressionTime).format()}">
                                ${seenCount}
                            </span>
                            <div class="clearfix"></div>
                            <div class="mt-2 mb-3">${textList}</div>
                            <a href="${permaLink}" class="${permaLink.length == 1 ? 'd-none' : ''}">
                                Original Post
                            </a>
                            on <span class="date">
                                ${moment(item.impressionTime).format('LLL')}
                            </span>
                        </div>
                    </li>`;

                    $('#daily-timeline').append(htmlItem); 
                }
            }
        });

        $('.show-topics').on('click', function(e) {
            e.preventDefault();
            $('#topics-' + $(this).data('semid')).find('.list-item').removeClass('d-none');
            $(this).remove();
        }); 

        initIsotope();
    });
}

function initIsotope() {
  var $timeline = $('.table-like').isotope({
    itemSelector: '.table-item',
    layoutMode: 'vertical',
    sortAscending: false,
    getSortData: {
      author: '.username',
      date: '.date'
    }
  });

  $('.filter-by').on('click', function() {
    var filter = $(this).data('filter');
    console.log('filterBy: ' + filter);
    $timeline.isotope({ filter: filter });
    $('.filter-by').removeClass('active');
    $(this).addClass('active');
  });

  $('.sort-by').on('click', function() {
    var sort = $(this).data('sort');
    console.log('sortBy: ' + sort);
    $timeline.isotope({ sortBy: sort });
    $('.sort-by').removeClass('active');
    $(this).addClass('active');
  });
}

function downloadCSV() {
  const token = getToken();
  const url = buildApiUrl(`/personal/${token}/csv`, null, 2);
  window.open(url);
}

function initializeStats() {
  const token = getToken();
  const url = buildApiUrl(`/personal/${token}/stats`, '25-0', 2);
  $.getJSON(url, (data) => {
      // TODO do candlesticks
    console.log(`Retrived ${_.size(data.content)} impressions, from ${_.size(data.timelines)} timelines, ${JSON.stringify(data.served)}, total stored: ${data.storedTimelines}`);
    console.log(data);
  });
};

