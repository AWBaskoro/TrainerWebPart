
import {SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions} from '@microsoft/sp-http'; 
import * as pnp from 'sp-pnp-js';
import { get } from 'https';

var moment = require('moment');
require('./tooltip');
var popover = require('./popover');

var popoverElement;
var PATH_TO_DISPFORM = window.webAbsoluteUrl + "/Lists/Schedule/DispForm.aspx";
var varList = "TrainerCalendar";

//Blue 0 => reservation
//Orange 1 => In Progress
//Gray 2 => Booked
var COLORS = ['#4682B4', '#FFA500', '#D3D3D3'];

// var arr_tasks = [
//   {
//     id: '1',
//     title: 'event1',
//     start: '2018-09-11',
//     end: '2018-09-13',
//     status: 'Uncompleted'
//   },
//   {
//     id: '2',
//     title: 'event2',
//     start: '2018-10-05',
//     end: '2018-10-07',
//     status: 'completed'
//   },
//   {
//     id: '3',
//     title: 'event3',
//     start: '2018-10-09',
//     end: '2018-10-12',
//     status: 'OnProgress'
//   }
// ]

var popTemplate = [
  '<div class="popover" style="max-width:600px;" >',
  '<div class="arrow"></div>',
  '<div class="popover-header">',
  '<button id="closepopover" type="button" class="close" aria-hidden="true">&times;</button>',
  '<h3 class="popover-title"></h3>',
  '</div>',
  '<div class="popover-content"></div>',
  '</div>'].join('');


$(document).ready(function () {

  displayTasks();
});



$('body').on('click', function (e) {
  // close the popover if: click outside of the popover || click on the close button of the popover
  if (popoverElement && ((!popoverElement.is(e.target) && popoverElement.has(e.target).length === 0 && $('.popover').has(e.target).length === 0) || (popoverElement.has(e.target) && e.target.id === 'closepopover'))) {

    ///$('.popover').popover('hide'); --> works
    closePopovers();
  }
});

window.AddNewEvent = function () {
  var evt_name = $('.popover-content').find('#tbEvent').val();
  //var trnr_name = $('.popover-content').find('#tbTrainer').val();
  var trnr_name = window.CurrUser;
  var status_evt = $('.popover-content').find('#selType').val();
  var sDate = $('.popover-content').find('label[for = start_date]').text();
  var eDate = $('.popover-content').find('label[for = end_date]').text();
  // alert('selected ' + sDate + ' to ' + eDate + ' ' + evt_name + ' - ' + trnr_name+' - '+status_evt);
  //return false;
  AddListItem(evt_name, trnr_name, status_evt, sDate, eDate, varList);

}

// module.exports = {
//   AddNewEvent: AddNewEvent
// };

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + (d.getDate() - 1),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}


function closePopovers() {
  $('.popover').not(this).popover('hide');
}


function displayTasks() {
  $('#calendar').fullCalendar('destroy');
  $('#calendar').fullCalendar({
    //weekends: false,
    selectable: true,
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,basicWeek,basicDay'
    },
    eventRender: function (eventObj, $el) {
      $el.popover({
        title: eventObj.title,
        content: function () {
          $('label[for = pop_start_date]').text(eventObj.start.format('YYYY-MM-DD'));
          $('label[for = pop_end_date]').text(formatDate(eventObj.end));
          $('label[for = pop_status]').text(eventObj.event_type);

          return $("#popInfo").html();
        },
        html: true,
        trigger: 'hover',
        placement: 'top',
        container: 'body'
      });
    },
    displayEventTime: false,
    // open up the display form when a user clicks on an event
    eventClick: function (calEvent, jsEvent, view) {
    },
    // dayClick: function(date) {
    //   alert('clicked ' + date.format());
    // },
    select: function (startDate, endDate, jsEvent) {
      //alert('selected ' + startDate.format() + ' to ' + formatDate(endDate));
      closePopovers();
      popoverElement = $(jsEvent.target);
      $(jsEvent.target).popover({
        title: 'Add Event',
        content: function () {
          $('label[for = start_date]').text(startDate.format());
          $('label[for = end_date]').text(formatDate(endDate));

          return $("#AddEvt").html();
        },
        template: popTemplate,
        placement: 'bottom',
        html: true,
        trigger: 'click',
        container: 'body'

      }).popover('show');
    },
    editable: true,
    eventResize: function (event, delta, revertFunc) {

      //alert(event.title + " end is now " + event.end.add(-1).format());
      updateTask(event.id, event.start, event.end, event.title);
    },
    timezone: "UTC",
    droppable: true, // this allows things to be dropped onto the calendar
    // update the end date when a user drags and drops an event 
    eventDrop: function (event, delta, revertFunc) {
      updateTask(event.id, event.start, event.end, event.title);
    },
    // put the events on the calendar 
    events: function (start, end, timezone, callback) {
      var _uri = window.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('" + varList + "')/items?$filter=Trainer eq '"+window.CurrUser+"'";
      $.ajax({
        url: _uri,
        type: "GET",
        dataType: "json",
        headers: {
          Accept: "application/json;odata=nometadata"
        }
      })
        .done(function (data, textStatus, jqXHR) {

          var events = data.value.map(function (task) {
            var _clr = ''
            var _type = task.EventType0;
            if (_type.toLowerCase() == 'reservation') {
              _clr = COLORS[0];
            }
            else if (_type.toLowerCase() == 'in progress') {
              _clr = COLORS[1];
            }
            else if (_type.toLowerCase() == 'booked') {
              _clr = COLORS[2];
            }
            return {
              title: task.Title,
              id: task.ID,
              trainer: task.Trainer.Name,
              event_type: task.EventType0,
              color: _clr,
              start: moment.utc(task.EventDate),
              end: moment.utc(task.EndDate).add('1', 'days'),
              allDay: true
            };
          });

          callback(events);
        })


    }
  })
}

function updateTask(id, startDate, dueDate) {
  // subtract the previously added day to the date to store correct date
  var sDate = moment.utc(startDate).format('YYYY-MM-DD') + "T" +
    startDate.format("hh:mm") + ":00Z";
  if (!dueDate) {
    dueDate = startDate;
  }
  var dDate = moment.utc(dueDate).add(-1).format('YYYY-MM-DD') + "T" +
    dueDate.format("hh:mm") + ":00Z";

  $.ajax({
    url: window.webAbsoluteUrl + '/_api/contextinfo',
    type: 'POST',
    headers: {
      'Accept': 'application/json;odata=nometadata'
    }
  })
    .then(function (data, textStatus, jqXHR) {
      return $.ajax({
        url: window.webAbsoluteUrl +
          "/_api/Web/Lists/getByTitle('" + varList + "')/Items(" + id + ")",
        type: 'POST',
        data: JSON.stringify({
          EventDate: sDate,
          EndDate: dDate,
        }),
        headers: {
          Accept: "application/json;odata=nometadata",
          "Content-Type": "application/json;odata=nometadata",
          "X-RequestDigest": data.FormDigestValue,
          "IF-MATCH": "*",
          "X-Http-Method": "PATCH"
        }
      });
    })
    .done(function (data, textStatus, jqXHR) {
      alert("Update Successful");
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      alert("Update Failed");
    })
    .always(function () {
      displayTasks();
    });
}

function AddListItem(_title, _trainer, _status, _evtDate, _endDate, _listName) {
   
   var _sDate = moment.utc(_evtDate).format('YYYY-MM-DD') + "T" +
     new Date( _evtDate).format("hh:mm") + ":00Z";
   if (!_endDate) {
     _endDate = _evtDate;
   }
   var _dDate = moment.utc(_endDate).format('YYYY-MM-DD') + "T" +
    new Date(_endDate).format("hh:mm") + ":00Z";
  //  $pnp.sp.web.lists.getByTitle(_listName).then(console.log);
  pnp.sp.web.lists.getByTitle(_listName).items.add({
    Title:_title,
    EventDate:_sDate,
    EndDate:_dDate,
    EventType0: _status,
    Trainer: _trainer
  })
  .then(i => {
    displayTasks();
    alert('success');
});
  
  // .fail(function(){
  //   alert("Adding New Data Failed");
  // })
  // .always(function(){
  //   displayTasks();
  // });
  
  

 // alert(_trainer);

 
}



// function AddListItem(_title, _trainer, _status, _evtDate, _endDate) {
//   var digest = $("#__REQUESTDIGEST").val();
//   var _sDate = moment.utc(_evtDate).format('YYYY-MM-DD') + "T" +
//     new Date( _evtDate).format("hh:mm") + ":00Z";
//   if (!_endDate) {
//     _endDate = _evtDate;
//   }
//   var _dDate = moment.utc(_endDate).add(-1).format('YYYY-MM-DD') + "T" +
//    new Date(_endDate).format("hh:mm") + ":00Z";

//   $.ajax
//     ({
//       url: window.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + varList + "')/items",
//       type: "POST",
//       data: JSON.stringify
//         ({
//           __metadata:
//           {
//             type: "SP.Data.TrainerCalendarListItem"
//           },
//           Title: _title,
//           EventDate: _sDate,
//           EndDate: _dDate,
//           EventType0: _status,
//           Trainer: _trainer
//         }),
//       headers:
//       {

//         "Accept": "application/json;odata=verbose",
//         "Content-Type": "application/json;odata=verbose",
//         "X-RequestDigest": digest,
//         "X-HTTP-Method": "POST"
//       },
//       success: function (data, status, xhr) {
//         displayTasks();
//       },
//       error: function (xhr, status, error) {
//         alert("Failed Insert Data ");
//       }
//     });
// }

