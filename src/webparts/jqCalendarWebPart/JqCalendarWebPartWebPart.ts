import { Version } from '@microsoft/sp-core-library';

import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import styles from './JqCalendarWebPartWebPart.module.scss';
import * as strings from 'JqCalendarWebPartWebPartStrings';
import 'jquery';
import * as bootstrap from 'bootstrap';

import 'moment';
import 'fullcalendar';
import { SPComponentLoader } from '@microsoft/sp-loader'

export interface IJqCalendarWebPartWebPartProps {
  description: string;
}

export default class JqCalendarWebPartWebPart extends BaseClientSideWebPart<IJqCalendarWebPartWebPartProps> {

  
  public constructor() {
    super();
    SPComponentLoader.loadCss('http://win-a7da8n3j4co/SiteAssets/bootstrap.css');

  }

  public render(): void {
    
    this.domElement.innerHTML = `
      <div class="${ styles.jqCalendarWebPart}">
      <link type="text/css" rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.9.0/fullcalendar.min.css" />
      <div id="popInfo" class="hide">
      <table class="table" border="0">
        <tr>
          <td>Start Date</td>
          <td>:</td>
          <td>
          <label for="pop_start_date" />
          </td>
        </tr>
        <tr>
          <td>End Date</td>
          <td>:</td>
          <td>
          <label for="pop_end_date" />
          </td>
        </tr>
        <tr>
          <td>Event Status</td>
          <td>:</td>
          <td>
          <label for="pop_status" />
          </td>
        </tr>
        
        
      </table>
      </div>
      <div id="calendar"></div>
      <div id="AddEvt" class="hide" >
      <table class="table" border="0">
        <tr>
          <td>Start Date</td>
          <td>:</td>
          <td>
          <label for="start_date" />
          </td>
        </tr>
        <tr>
          <td>End Date</td>
          <td>:</td>
          <td>
          <label for="end_date" />
          </td>
        </tr>
        <tr>
          <td>Event</td>
          <td>:</td>
          <td>
          <input type="text" id="tbEvent" />
          </td>
        </tr>
        <tr>
          <td>Status</td>
          <td>:</td>
          <td>
          <select id="selType" class="form-control" >
          <option value="booked">Booked</option>
          <option value="In Progress">In Progress</option>
          <option value="Reservation">Reservation</option>
          </select>
          </td>
        </tr>
       
        <tr>
          <td colspan="3">
            <button id="btnAddEvt" onClick="AddNewEvent()" Text="Add Event" class="btn btn-xs">Add Event</button>
          </td>
        </tr>
      </table>
      </div>
      </div>`;
      
    (window as any).webAbsoluteUrl = this.context.pageContext.web.absoluteUrl;
    (window as any).CurrUser = this.context.pageContext.user.loginName;
    require('./scriptcalendar');
   
    
  }


  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }



  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
